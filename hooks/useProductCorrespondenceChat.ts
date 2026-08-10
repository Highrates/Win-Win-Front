'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatWindowMessage } from '@/components/ChatWindow/ChatWindow';
import { useProductQaPostCooldown } from '@/hooks/useProductQaPostCooldown';
import { useChatAttachments } from '@/hooks/useChatAttachments';
import { isProductQaTurnstileRequired } from '@/components/ProductQaTurnstile/ProductQaTurnstile';
import { getCachedIsAuthenticated } from '@/lib/userSessionClient';
import {
  PRODUCT_QA_BODY_MAX_CHARS,
  PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
} from '@/lib/productQa/constants';
import {
  fetchProductCorrespondenceMessages,
  postProductCorrespondenceMessage,
} from '@/lib/productCorrespondence/correspondenceApi';
import { mapCorrespondenceToChatWindow } from '@/lib/productCorrespondence/mapCorrespondenceToChatWindow';
import type { ProductCorrespondenceMessage } from '@/lib/productCorrespondence/types';
import {
  revokeProductQaAttachment,
  uploadProductQaAttachment,
} from '@/lib/productQa/productQaApi';
import { useProductCorrespondenceRealtime } from '@/hooks/useProductCorrespondenceRealtime';

function errorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message.trim()) return e.message;
  return fallback;
}

async function fetchViewerUserId(): Promise<string | null> {
  try {
    const res = await fetch('/api/user/session', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { authenticated?: boolean; user?: { id?: string } };
    if (!data.authenticated) return null;
    const id = data.user?.id?.trim();
    return id && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

function prependMessages(
  prev: ProductCorrespondenceMessage[],
  older: ProductCorrespondenceMessage[],
): ProductCorrespondenceMessage[] {
  const seen = new Set(prev.map((m) => m.id));
  return [...older.filter((m) => !seen.has(m.id)), ...prev];
}

export function useProductCorrespondenceChat(opts: {
  productSlug: string | null;
  enabled: boolean;
  productVariantId?: string | null;
  timeLocale?: string;
}) {
  const { productSlug, enabled, productVariantId, timeLocale = 'ru-RU' } = opts;

  const [rawMessages, setRawMessages] = useState<ProductCorrespondenceMessage[]>([]);
  const [messages, setMessages] = useState<ChatWindowMessage[]>([]);
  const [hasOlderHistory, setHasOlderHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlderHistory, setLoadingOlderHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [correspondenceId, setCorrespondenceId] = useState<string | null>(null);

  const viewerRef = useRef<string | null>(null);
  const rawMessagesRef = useRef(rawMessages);
  rawMessagesRef.current = rawMessages;
  const hasOlderHistoryRef = useRef(hasOlderHistory);
  hasOlderHistoryRef.current = hasOlderHistory;

  const turnstileRequired = isProductQaTurnstileRequired();
  const { isCoolingDown, triggerCooldown, handlePostError } = useProductQaPostCooldown();

  const attachments = useChatAttachments({
    enabled: Boolean(productSlug),
    uploadFile: (file) => uploadProductQaAttachment(productSlug!, file),
    revokeFile: (url) => revokeProductQaAttachment(productSlug!, url),
    onError: setError,
  });
  const {
    uploadBusy,
    pendingOutgoingAttachments,
    canSendAttachmentMessage,
    pendingAttachmentsHint,
    attachChatFiles,
    removePendingChatAttachment,
    getReadyAttachments,
    clearPendingAttachments,
  } = attachments;

  const remapMessages = useCallback(
    (rows: ProductCorrespondenceMessage[]) =>
      rows.map((m) =>
        mapCorrespondenceToChatWindow(m, viewerRef.current, timeLocale, 'account'),
      ),
    [timeLocale],
  );

  const applyRawMessages = useCallback(
    (rows: ProductCorrespondenceMessage[]) => {
      setRawMessages(rows);
      setMessages(remapMessages(rows));
    },
    [remapMessages],
  );

  const patchMessage = useCallback(
    (updated: ProductCorrespondenceMessage) => {
      setRawMessages((prev) => {
        const next = prev.map((m) => (m.id === updated.id ? updated : m));
        setMessages(remapMessages(next));
        return next;
      });
    },
    [remapMessages],
  );

  const appendMessage = useCallback(
    (created: ProductCorrespondenceMessage) => {
      setRawMessages((prev) => {
        if (prev.some((x) => x.id === created.id)) return prev;
        const next = [...prev, created];
        setMessages(remapMessages(next));
        return next;
      });
    },
    [remapMessages],
  );

  const pollSyncMessages = useCallback(async () => {
    if (!productSlug) return;
    try {
      const res = await fetchProductCorrespondenceMessages(productSlug, {
        limit: PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
      });
      setCorrespondenceId(res.correspondenceId);
      setRawMessages((prev) => {
        if (!hasOlderHistoryRef.current) {
          setMessages(remapMessages(res.messages));
          return res.messages;
        }
        const seen = new Set(prev.map((m) => m.id));
        const merged = [...prev];
        for (const m of res.messages) {
          if (!seen.has(m.id)) merged.push(m);
        }
        merged.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        setMessages(remapMessages(merged));
        return merged;
      });
    } catch {
      /* ignore poll errors */
    }
  }, [productSlug, remapMessages]);

  useProductCorrespondenceRealtime({
    enabled: enabled && Boolean(productSlug) && authenticated === true,
    correspondenceId,
    variant: 'account',
    onMessageCreated: appendMessage,
    onMessageUpdated: patchMessage,
    onPollFallback: () => {
      void pollSyncMessages();
    },
  });

  useEffect(() => {
    void getCachedIsAuthenticated().then(setAuthenticated);
    void fetchViewerUserId().then((id) => {
      viewerRef.current = id;
      setViewerUserId(id);
    });
  }, []);

  useEffect(() => {
    if (!enabled || !productSlug) {
      setRawMessages([]);
      setMessages([]);
      setError(null);
      setHasOlderHistory(false);
      setCorrespondenceId(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchViewerUserId().then((id) => {
      if (cancelled) return;
      viewerRef.current = id;
    });

    void (async () => {
      try {
        const res = await fetchProductCorrespondenceMessages(productSlug, {
          limit: PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
        });
        if (cancelled) return;
        setCorrespondenceId(res.correspondenceId);
        applyRawMessages(res.messages);
        setHasOlderHistory(res.hasOlder);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(errorMessage(e, 'Не удалось загрузить переписку'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyRawMessages, enabled, productSlug]);

  const loadOlderChatMessages = useCallback(async () => {
    if (!productSlug || !hasOlderHistory || loadingOlderHistory) return;
    const oldest = rawMessagesRef.current[0];
    if (!oldest) return;
    setLoadingOlderHistory(true);
    setError(null);
    try {
      const res = await fetchProductCorrespondenceMessages(productSlug, {
        limit: PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
        before: oldest.id,
      });
      setRawMessages((prev) => {
        const next = prependMessages(prev, res.messages);
        setMessages(remapMessages(next));
        return next;
      });
      setHasOlderHistory(res.hasOlder);
    } catch (e: unknown) {
      setError(errorMessage(e, 'Не удалось загрузить более ранние сообщения'));
    } finally {
      setLoadingOlderHistory(false);
    }
  }, [hasOlderHistory, loadingOlderHistory, productSlug, remapMessages]);

  const sendChatText = useCallback(
    async (text: string) => {
      if (!productSlug || sending || isCoolingDown || authenticated === false) return;
      const body = text.trim();
      const readyAttachments = getReadyAttachments();
      if (!body && !readyAttachments.length) return;
      if (body.length > PRODUCT_QA_BODY_MAX_CHARS) {
        setError(`Не более ${PRODUCT_QA_BODY_MAX_CHARS} символов`);
        return;
      }
      if (turnstileRequired && !turnstileToken) {
        setError('Подтвердите, что вы не робот');
        return;
      }

      setSending(true);
      setError(null);
      setPostSuccess(null);
      try {
        const created = (await postProductCorrespondenceMessage(productSlug, {
          body,
          productVariantId: productVariantId ?? undefined,
          attachments: readyAttachments.map((r) => ({
            url: r.fileUrl!,
            filename: r.filename,
            mimeType: r.mimeType,
            kind: r.kind,
          })),
          turnstileToken: turnstileToken ?? undefined,
        })) as ProductCorrespondenceMessage;

        clearPendingAttachments();

        setRawMessages((prev) => {
          if (prev.some((x) => x.id === created.id)) return prev;
          const next = [...prev, created];
          setMessages(remapMessages(next));
          return next;
        });
        setCorrespondenceId(created.correspondenceId);
        triggerCooldown();
        if (turnstileRequired) {
          setTurnstileToken(null);
          setTurnstileResetKey((k) => k + 1);
        }
      } catch (e: unknown) {
        handlePostError(e);
        setError(errorMessage(e, 'Не удалось отправить сообщение'));
        if (turnstileRequired) {
          setTurnstileToken(null);
          setTurnstileResetKey((k) => k + 1);
        }
      } finally {
        setSending(false);
      }
    },
    [
      authenticated,
      handlePostError,
      isCoolingDown,
      clearPendingAttachments,
      getReadyAttachments,
      productSlug,
      productVariantId,
      remapMessages,
      sending,
      triggerCooldown,
      turnstileRequired,
      turnstileToken,
    ],
  );

  const composerDisabled =
    authenticated === false ||
    authenticated === null ||
    sending ||
    isCoolingDown ||
    uploadBusy;

  return {
    messages,
    rawMessages,
    patchMessage,
    viewerUserId,
    loading,
    error,
    postSuccess,
    authenticated,
    hasOlderHistory,
    loadingOlderHistory,
    loadOlderChatMessages,
    sendChatText,
    attachChatFiles,
    removePendingChatAttachment,
    pendingOutgoingAttachments,
    pendingAttachmentsHint,
    canSendAttachmentMessage,
    composerDisabled,
    attachPickerDisabled: composerDisabled,
    turnstileRequired,
    turnstileToken,
    turnstileResetKey,
    onTurnstileToken: setTurnstileToken,
  };
}
