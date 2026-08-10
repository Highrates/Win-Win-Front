'use client';

import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import {
  PRODUCT_QA_POLL_INTERVAL_MS,
  PRODUCT_QA_WS_EVENTS,
} from '@/lib/productQa/constants';
import {
  getSharedProductQaSocket,
  releaseProductQaRoom,
  releaseSharedProductQaSocket,
  retainProductQaRoom,
} from '@/lib/productQa/productQaWs';
import type { ProductQaMessage, ProductQaMeta } from '@/lib/productQa/types';

type Target = { productSlug?: string; productId?: string };

type Options = {
  enabled?: boolean;
  onMessageCreated?: (message: ProductQaMessage) => void;
  onMessageUpdated?: (message: ProductQaMessage) => void;
  onMessageHidden?: (messageId: string) => void;
  onMetaUpdated?: (meta: ProductQaMeta) => void;
  /** Fallback: периодический REST-sync (если WS недоступен). */
  onPollFallback?: () => void;
};

/**
 * Realtime Q&A на PDP / в админке. Без JWT — публичная комната по slug или productId.
 */
export function useProductQaRealtime(target: Target, opts: Options): void {
  const { enabled = true } = opts;
  const handlersRef = useRef(opts);
  handlersRef.current = opts;
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    if (!enabled) return;
    const initialTarget = targetRef.current;
    const hasTarget = Boolean(
      initialTarget.productSlug?.trim() || initialTarget.productId?.trim(),
    );
    if (!hasTarget) return;

    let cancelled = false;
    let socket: Socket | null = null;
    let pollTimer: number | null = null;
    let unwireEvents: (() => void) | null = null;
    let unwireLifecycle: (() => void) | null = null;
    let joined = false;
    let joinedTarget: Target | null = null;

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
      try {
        await retainProductQaRoom(socket, targetRef.current);
        joined = true;
        joinedTarget = { ...targetRef.current };
        stopFallbackPolling();
      } catch {
        joined = false;
        startFallbackPolling();
      }
    };

    void (async () => {
      try {
        socket = getSharedProductQaSocket();

        const onCreated = (payload: ProductQaMessage) => {
          if (payload.status !== 'VISIBLE') return;
          handlersRef.current.onMessageCreated?.(payload);
        };
        const onHidden = (payload: { id?: string }) => {
          const id = payload?.id?.trim();
          if (id) handlersRef.current.onMessageHidden?.(id);
        };
        const onMeta = (payload: ProductQaMeta) => {
          handlersRef.current.onMetaUpdated?.(payload);
        };
        const onUpdated = (payload: ProductQaMessage) => {
          if (payload.status !== 'VISIBLE') return;
          handlersRef.current.onMessageUpdated?.(payload);
        };
        socket.on(PRODUCT_QA_WS_EVENTS.messageCreated, onCreated);
        socket.on(PRODUCT_QA_WS_EVENTS.messageUpdated, onUpdated);
        socket.on(PRODUCT_QA_WS_EVENTS.messageHidden, onHidden);
        socket.on(PRODUCT_QA_WS_EVENTS.metaUpdated, onMeta);
        unwireEvents = () => {
          socket?.off(PRODUCT_QA_WS_EVENTS.messageCreated, onCreated);
          socket?.off(PRODUCT_QA_WS_EVENTS.messageUpdated, onUpdated);
          socket?.off(PRODUCT_QA_WS_EVENTS.messageHidden, onHidden);
          socket?.off(PRODUCT_QA_WS_EVENTS.metaUpdated, onMeta);
        };

        const onConnect = () => {
          void ensureJoined();
        };
        const onDisconnect = () => {
          joined = false;
          startFallbackPolling();
        };
        const onConnectError = () => {
          joined = false;
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
        if (cancelled) return;
      } catch {
        if (!cancelled) startFallbackPolling();
      }
    })();

    return () => {
      cancelled = true;
      stopFallbackPolling();
      unwireEvents?.();
      unwireLifecycle?.();
      if (socket && joined && joinedTarget) {
        releaseProductQaRoom(socket, joinedTarget);
        joined = false;
        joinedTarget = null;
      }
      releaseSharedProductQaSocket();
    };
  }, [enabled, target.productSlug, target.productId]);
}
