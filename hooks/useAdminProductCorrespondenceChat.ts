'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChatWindowMessage } from '@/components/ChatWindow/ChatWindow';
import { useChatAttachments } from '@/hooks/useChatAttachments';
import { useAdminPermissionsOptional } from '@/lib/adminPermissions/AdminPermissionsProvider';
import {
  fetchAdminCorrespondenceMessages,
  fetchAdminCorrespondenceThreads,
  postAdminCorrespondenceReply,
} from '@/lib/adminProductCorrespondence/adminProductCorrespondenceApi';
import {
  ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT,
  PRODUCT_QA_BODY_MAX_CHARS,
  PRODUCT_QA_DEFAULT_TOPIC_SLUG,
  PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
} from '@/lib/productQa/constants';
import { mapCorrespondenceToChatWindow } from '@/lib/productCorrespondence/mapCorrespondenceToChatWindow';
import type { ProductCorrespondenceMessage, ProductCorrespondenceThread } from '@/lib/productCorrespondence/types';
import {
  revokeAdminProductQaAttachment,
  uploadAdminProductQaAttachment,
} from '@/lib/adminProductQa/adminProductQaApi';
import { useProductCorrespondenceRealtime } from '@/hooks/useProductCorrespondenceRealtime';

function prependMessages(
  prev: ProductCorrespondenceMessage[],
  older: ProductCorrespondenceMessage[],
): ProductCorrespondenceMessage[] {
  const seen = new Set(prev.map((m) => m.id));
  return [...older.filter((m) => !seen.has(m.id)), ...prev];
}

export function useAdminProductCorrespondenceChat(opts: {
  productId: string;
  enabled?: boolean;
  timeLocale?: string;
}) {
  const { productId, enabled = true, timeLocale = 'ru-RU' } = opts;

  const permissions = useAdminPermissionsOptional();
  const viewerUserId = permissions?.userId ?? null;
  const viewerStaffAvatar = permissions?.staff?.staffAvatarUrl ?? null;

  const [threads, setThreads] = useState<ProductCorrespondenceThread[]>([]);
  const [activeCustomerUserId, setActiveCustomerUserId] = useState<string | null>(null);
  const [rawMessages, setRawMessages] = useState<ProductCorrespondenceMessage[]>([]);
  const [messages, setMessages] = useState<ChatWindowMessage[]>([]);
  const [hasOlderHistory, setHasOlderHistory] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingOlderHistory, setLoadingOlderHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const attachments = useChatAttachments({
    enabled: Boolean(productId),
    uploadFile: (file) => uploadAdminProductQaAttachment(productId, file),
    revokeFile: (url) => revokeAdminProductQaAttachment(productId, url),
    onError: setError,
  });
  const {
    uploadBusy,
    pendingOutgoingAttachments,
    canSendAttachmentMessage,
    attachChatFiles,
    removePendingChatAttachment,
    getReadyAttachments,
    clearPendingAttachments,
  } = attachments;

  const rawMessagesRef = useRef(rawMessages);
  rawMessagesRef.current = rawMessages;
  const hasOlderHistoryRef = useRef(hasOlderHistory);
  hasOlderHistoryRef.current = hasOlderHistory;

  const remapMessages = useCallback(
    (rows: ProductCorrespondenceMessage[]) =>
      rows.map((m) =>
        mapCorrespondenceToChatWindow(m, viewerUserId, timeLocale, 'admin', viewerStaffAvatar),
      ),
    [timeLocale, viewerStaffAvatar, viewerUserId],
  );

  const activeCorrespondenceId = useMemo(
    () => threads.find((t) => t.customerUserId === activeCustomerUserId)?.correspondenceId ?? null,
    [activeCustomerUserId, threads],
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
    if (!activeCustomerUserId) return;
    try {
      const res = await fetchAdminCorrespondenceMessages(productId, activeCustomerUserId, {
        limit: PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
      });
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
  }, [activeCustomerUserId, productId, remapMessages]);

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

  useProductCorrespondenceRealtime({
    enabled: enabled && Boolean(activeCorrespondenceId),
    correspondenceId: activeCorrespondenceId,
    variant: 'admin',
    onMessageCreated: appendMessage,
    onMessageUpdated: patchMessage,
    onPollFallback: () => {
      void pollSyncMessages();
    },
  });

  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const res = await fetchAdminCorrespondenceThreads(productId);
      const items = res.items ?? [];
      setThreads(items);
      setActiveCustomerUserId((prev) => prev ?? items[0]?.customerUserId ?? null);
    } catch {
      setThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!enabled) return;
    void loadThreads();
  }, [enabled, loadThreads]);

  useEffect(() => {
    if (!enabled || !activeCustomerUserId) {
      setRawMessages([]);
      setMessages([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const res = await fetchAdminCorrespondenceMessages(productId, activeCustomerUserId, {
          limit: PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
        });
        if (cancelled) return;
        setRawMessages(res.messages);
        setMessages(remapMessages(res.messages));
        setHasOlderHistory(res.hasOlder);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCustomerUserId, enabled, productId, remapMessages]);

  const loadOlderChatMessages = useCallback(async () => {
    if (!activeCustomerUserId || !hasOlderHistory || loadingOlderHistory) return;
    const oldest = rawMessagesRef.current[0];
    if (!oldest) return;
    setLoadingOlderHistory(true);
    try {
      const res = await fetchAdminCorrespondenceMessages(productId, activeCustomerUserId, {
        limit: PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
        before: oldest.id,
      });
      setRawMessages((prev) => {
        const next = prependMessages(prev, res.messages);
        setMessages(remapMessages(next));
        return next;
      });
      setHasOlderHistory(res.hasOlder);
    } finally {
      setLoadingOlderHistory(false);
    }
  }, [activeCustomerUserId, hasOlderHistory, loadingOlderHistory, productId, remapMessages]);

  const sendChatText = useCallback(
    async (text: string) => {
      if (!activeCustomerUserId || sending) return;
      const body = text.trim();
      const readyAttachments = getReadyAttachments();
      if (!body && !readyAttachments.length) return;
      if (body.length > PRODUCT_QA_BODY_MAX_CHARS) return;

      setSending(true);
      setError(null);
      try {
        const created = await postAdminCorrespondenceReply(productId, {
          customerUserId: activeCustomerUserId,
          body,
          topicSlug: PRODUCT_QA_DEFAULT_TOPIC_SLUG,
          attachments: readyAttachments.map((r) => ({
            url: r.fileUrl!,
            filename: r.filename,
            mimeType: r.mimeType,
            kind: r.kind,
          })),
        });
        clearPendingAttachments();
        setRawMessages((prev) => {
          const next = prev.some((m) => m.id === created.id) ? prev : [...prev, created];
          setMessages(remapMessages(next));
          return next;
        });
        void loadThreads();
        document.dispatchEvent(new Event(ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Не удалось отправить');
      } finally {
        setSending(false);
      }
    },
    [activeCustomerUserId, clearPendingAttachments, getReadyAttachments, loadThreads, productId, remapMessages, sending],
  );

  return {
    threads,
    activeCustomerUserId,
    setActiveCustomerUserId,
    rawMessages,
    messages,
    patchMessage,
    loadingThreads,
    loading,
    error,
    hasOlderHistory,
    loadingOlderHistory,
    loadOlderChatMessages,
    sendChatText,
    attachChatFiles,
    removePendingChatAttachment,
    pendingOutgoingAttachments,
    canSendAttachmentMessage,
    composerDisabled: sending || uploadBusy || !activeCustomerUserId,
    attachPickerDisabled: sending || uploadBusy || !activeCustomerUserId,
    reloadThreads: loadThreads,
  };
}
