'use client';

import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { fetchOrderChatWsToken } from '@/lib/orderChat/orderChatWsShared';
import {
  PRODUCT_QA_POLL_INTERVAL_MS,
  PRODUCT_QA_WS_EVENTS,
} from '@/lib/productQa/constants';
import {
  fetchAdminWsToken,
  getAdminProductQaStaffSocket,
  releaseAdminProductQaStaffSocket,
  retainAdminProductQaStaffSocket,
  waitAdminProductQaStaffSocketConnect,
} from '@/lib/productQa/productQaAdminStaffWs';
import type { ProductCorrespondenceMessage } from '@/lib/productCorrespondence/types';
import {
  getUserAuthProductQaSocket,
  joinProductCorrespondenceRoom,
  leaveProductCorrespondenceRoom,
  releaseUserAuthProductQaSocket,
  waitProductQaSocketConnect,
} from '@/lib/productQa/productQaWs';

type Variant = 'account' | 'admin';

type Options = {
  enabled?: boolean;
  correspondenceId: string | null;
  variant: Variant;
  onMessageCreated?: (message: ProductCorrespondenceMessage) => void;
  onMessageUpdated?: (message: ProductCorrespondenceMessage) => void;
  onPollFallback?: () => void;
};

/**
 * Realtime private correspondence (ЛК + admin thread). Требует JWT; комната по correspondenceId.
 */
export function useProductCorrespondenceRealtime(opts: Options): void {
  const { enabled = true, correspondenceId, variant } = opts;
  const handlersRef = useRef(opts);
  handlersRef.current = opts;

  useEffect(() => {
    if (!enabled || !correspondenceId?.trim()) return undefined;

    let cancelled = false;
    let socket: Socket | null = null;
    let pollTimer: number | null = null;
    let unwireEvents: (() => void) | null = null;
    let unwireLifecycle: (() => void) | null = null;
    let joinedId: string | null = null;
    let releaseSocket: (() => void) | null = null;

    const stopFallbackPolling = () => {
      if (pollTimer != null) {
        window.clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const startFallbackPolling = () => {
      if (pollTimer != null || cancelled) return;
      handlersRef.current.onPollFallback?.();
      pollTimer = window.setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        handlersRef.current.onPollFallback?.();
      }, PRODUCT_QA_POLL_INTERVAL_MS);
    };

    const ensureJoined = async () => {
      if (cancelled || !socket?.connected) return;
      const id = handlersRef.current.correspondenceId?.trim();
      if (!id) return;
      try {
        if (joinedId && joinedId !== id) {
          leaveProductCorrespondenceRoom(socket, joinedId);
          joinedId = null;
        }
        await joinProductCorrespondenceRoom(socket, id);
        joinedId = id;
        stopFallbackPolling();
      } catch {
        joinedId = null;
        startFallbackPolling();
      }
    };

    void (async () => {
      try {
        if (variant === 'admin') {
          retainAdminProductQaStaffSocket();
          releaseSocket = () => releaseAdminProductQaStaffSocket();
          const token = await fetchAdminWsToken();
          if (cancelled) return;
          socket = getAdminProductQaStaffSocket(token);
          await waitAdminProductQaStaffSocketConnect(socket);
        } else {
          const auth = await fetchOrderChatWsToken('account');
          if (cancelled) return;
          socket = getUserAuthProductQaSocket(auth.token);
          releaseSocket = () => releaseUserAuthProductQaSocket();
          await waitProductQaSocketConnect(socket);
        }
        if (cancelled) return;

        const onCreated = (payload: ProductCorrespondenceMessage) => {
          handlersRef.current.onMessageCreated?.(payload);
        };
        const onUpdated = (payload: ProductCorrespondenceMessage) => {
          handlersRef.current.onMessageUpdated?.(payload);
        };
        socket.on(PRODUCT_QA_WS_EVENTS.correspondenceMessageCreated, onCreated);
        socket.on(PRODUCT_QA_WS_EVENTS.correspondenceMessageUpdated, onUpdated);
        unwireEvents = () => {
          socket?.off(PRODUCT_QA_WS_EVENTS.correspondenceMessageCreated, onCreated);
          socket?.off(PRODUCT_QA_WS_EVENTS.correspondenceMessageUpdated, onUpdated);
        };

        const onConnect = () => {
          void ensureJoined();
        };
        const onDisconnect = () => {
          joinedId = null;
          startFallbackPolling();
        };
        const onConnectError = () => {
          joinedId = null;
          startFallbackPolling();
        };
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);
        unwireLifecycle = () => {
          socket?.off('connect', onConnect);
          socket?.off('disconnect', onDisconnect);
          socket?.off('connect_error', onConnectError);
        };

        await ensureJoined();
      } catch {
        if (!cancelled) startFallbackPolling();
      }
    })();

    return () => {
      cancelled = true;
      stopFallbackPolling();
      unwireEvents?.();
      unwireLifecycle?.();
      if (socket && joinedId) {
        leaveProductCorrespondenceRoom(socket, joinedId);
        joinedId = null;
      }
      releaseSocket?.();
    };
  }, [correspondenceId, enabled, variant]);
}
