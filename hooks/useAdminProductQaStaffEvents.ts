'use client';

import { useEffect, useRef } from 'react';
import {
  ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT,
  ADMIN_PRODUCT_QA_STAFF_NEW_QUESTION_EVENT,
  ADMIN_PRODUCT_QA_STAFF_QA_MESSAGE_EVENT,
  ADMIN_PRODUCT_QA_STAFF_QA_MESSAGE_UPDATED_EVENT,
  ADMIN_PRODUCT_QA_UNREAD_REFRESH_EVENT,
  PRODUCT_QA_WS_EVENTS,
} from '@/lib/productQa/constants';
import {
  fetchAdminWsToken,
  getAdminProductQaStaffSocket,
  releaseAdminProductQaStaffSocket,
  retainAdminProductQaStaffSocket,
  waitAdminProductQaStaffSocketConnect,
} from '@/lib/productQa/productQaAdminStaffWs';
import type { ProductQaMessage } from '@/lib/productQa/types';

export type ProductQaStaffNewQuestionPayload = {
  productId: string;
  productSlug: string;
  productName: string;
  messageId: string;
  topicSlug: string;
  topicTitle: string;
  preview: string;
};

export type ProductQaStaffQaMessagePayload = {
  productId: string;
  message: ProductQaMessage;
};

function dispatchStaffQaMessageUpdated(payload: ProductQaStaffQaMessagePayload): void {
  if (typeof document === 'undefined') return;
  document.dispatchEvent(
    new CustomEvent<ProductQaStaffQaMessagePayload>(ADMIN_PRODUCT_QA_STAFF_QA_MESSAGE_UPDATED_EVENT, {
      detail: payload,
    }),
  );
}

function dispatchStaffQaMessage(payload: ProductQaStaffQaMessagePayload): void {
  if (typeof document === 'undefined') return;
  document.dispatchEvent(
    new CustomEvent<ProductQaStaffQaMessagePayload>(ADMIN_PRODUCT_QA_STAFF_QA_MESSAGE_EVENT, {
      detail: payload,
    }),
  );
  document.dispatchEvent(new Event(ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT));
}

function dispatchStaffNewQuestion(payload: ProductQaStaffNewQuestionPayload): void {
  if (typeof document === 'undefined') return;
  document.dispatchEvent(
    new CustomEvent<ProductQaStaffNewQuestionPayload>(ADMIN_PRODUCT_QA_STAFF_NEW_QUESTION_EVENT, {
      detail: payload,
    }),
  );
  document.dispatchEvent(new Event(ADMIN_PRODUCT_QA_UNREAD_REFRESH_EVENT));
  document.dispatchEvent(new Event(ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT));
}

/**
 * Один WS-подписчик на staff room: DOM-события для badge + панелей Q&A.
 * Toast показывается отдельно через onVisibleStaffNewQuestion (только visible tab).
 */
export function useAdminProductQaStaffEvents(
  enabled: boolean,
  opts?: {
    onVisibleStaffNewQuestion?: (payload: ProductQaStaffNewQuestionPayload) => void;
  },
): void {
  const onVisibleRef = useRef(opts?.onVisibleStaffNewQuestion);
  onVisibleRef.current = opts?.onVisibleStaffNewQuestion;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    let cancelled = false;
    let detachHandlers: (() => void) | undefined;

    void (async () => {
      try {
        const token = await fetchAdminWsToken();
        if (cancelled) return;
        retainAdminProductQaStaffSocket();
        const socket = getAdminProductQaStaffSocket(token);
        await waitAdminProductQaStaffSocketConnect(socket).catch(() => undefined);
        if (cancelled) return;

        const onNewQuestion = (payload: ProductQaStaffNewQuestionPayload): void => {
          dispatchStaffNewQuestion(payload);
          if (document.visibilityState === 'visible') {
            onVisibleRef.current?.(payload);
          }
        };
        const onStaffQaMessage = (payload: ProductQaStaffQaMessagePayload): void => {
          dispatchStaffQaMessage(payload);
        };

        const onStaffQaMessageUpdated = (payload: ProductQaStaffQaMessagePayload): void => {
          dispatchStaffQaMessageUpdated(payload);
        };

        socket.on(PRODUCT_QA_WS_EVENTS.staffNewQuestion, onNewQuestion);
        socket.on(PRODUCT_QA_WS_EVENTS.staffQaMessageCreated, onStaffQaMessage);
        socket.on(PRODUCT_QA_WS_EVENTS.staffQaMessageUpdated, onStaffQaMessageUpdated);
        detachHandlers = () => {
          socket.off(PRODUCT_QA_WS_EVENTS.staffNewQuestion, onNewQuestion);
          socket.off(PRODUCT_QA_WS_EVENTS.staffQaMessageCreated, onStaffQaMessage);
          socket.off(PRODUCT_QA_WS_EVENTS.staffQaMessageUpdated, onStaffQaMessageUpdated);
        };
      } catch {
        /* polling badges still work */
      }
    })();

    return () => {
      cancelled = true;
      detachHandlers?.();
      releaseAdminProductQaStaffSocket();
    };
  }, [enabled]);
}

/** Подписка на staff_new_question для конкретного товара (refresh pending-очереди). */
export function useAdminProductQaStaffNewQuestionForProduct(
  productId: string,
  onMatch: (payload: ProductQaStaffNewQuestionPayload) => void,
): void {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const handler = (ev: Event): void => {
      const payload = (ev as CustomEvent<ProductQaStaffNewQuestionPayload>).detail;
      if (!payload || payload.productId !== productId) return;
      onMatch(payload);
    };

    document.addEventListener(ADMIN_PRODUCT_QA_STAFF_NEW_QUESTION_EVENT, handler);
    return () => document.removeEventListener(ADMIN_PRODUCT_QA_STAFF_NEW_QUESTION_EVENT, handler);
  }, [productId, onMatch]);
}

/** Подписка на staff Q&A message update для конкретного товара. */
export function useAdminProductQaStaffQaMessageUpdatedForProduct(
  productId: string,
  onMatch: (payload: ProductQaStaffQaMessagePayload) => void,
): void {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const handler = (ev: Event): void => {
      const payload = (ev as CustomEvent<ProductQaStaffQaMessagePayload>).detail;
      if (!payload || payload.productId !== productId) return;
      onMatch(payload);
    };

    document.addEventListener(ADMIN_PRODUCT_QA_STAFF_QA_MESSAGE_UPDATED_EVENT, handler);
    return () => document.removeEventListener(ADMIN_PRODUCT_QA_STAFF_QA_MESSAGE_UPDATED_EVENT, handler);
  }, [productId, onMatch]);
}

/** Подписка на staff Q&A message для конкретного товара. */
export function useAdminProductQaStaffQaMessageForProduct(
  productId: string,
  onMatch: (payload: ProductQaStaffQaMessagePayload) => void,
): void {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const handler = (ev: Event): void => {
      const payload = (ev as CustomEvent<ProductQaStaffQaMessagePayload>).detail;
      if (!payload || payload.productId !== productId) return;
      onMatch(payload);
    };

    document.addEventListener(ADMIN_PRODUCT_QA_STAFF_QA_MESSAGE_EVENT, handler);
    return () => document.removeEventListener(ADMIN_PRODUCT_QA_STAFF_QA_MESSAGE_EVENT, handler);
  }, [productId, onMatch]);
}
