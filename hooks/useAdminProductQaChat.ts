'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProductQaRealtime } from '@/hooks/useProductQaRealtime';
import { useChatAttachments } from '@/hooks/useChatAttachments';
import { useAdminProductQaStaffNewQuestionForProduct, useAdminProductQaStaffQaMessageForProduct, useAdminProductQaStaffQaMessageUpdatedForProduct } from '@/hooks/useAdminProductQaStaffEvents';
import { useAdminPermissionsOptional } from '@/lib/adminPermissions/AdminPermissionsProvider';
import { AdminBackendRequestError } from '@/lib/adminBackendFetch';
import {
  fetchAdminProductQaMessages,
  fetchAdminProductQaTopics,
  postAdminProductQaReply,
  revokeAdminProductQaAttachment,
  uploadAdminProductQaAttachment,
  type ProductQaMessage,
  type ProductQaTopic,
} from '@/lib/adminProductQa/adminProductQaApi';
import {
  ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT,
  PRODUCT_QA_BODY_MAX_CHARS,
  PRODUCT_QA_DEFAULT_TOPIC_SLUG,
  PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
} from '@/lib/productQa/constants';
import { mergeProductQaMessages, prependProductQaMessages } from '@/lib/productQa/mergeMessages';

export function useAdminProductQaChat(opts: {
  productId: string;
  enabled?: boolean;
  timeLocale?: string;
  loadErrorFallback?: string;
}) {
  const { productId, enabled = true, timeLocale = 'ru-RU', loadErrorFallback = 'Ошибка загрузки' } =
    opts;

  const permissions = useAdminPermissionsOptional();
  const viewerUserId = permissions?.userId ?? null;
  const viewerStaffAvatar = permissions?.staff?.staffAvatarUrl ?? null;
  const viewerUserIdRef = useRef(viewerUserId);
  viewerUserIdRef.current = viewerUserId;

  const [topics, setTopics] = useState<ProductQaTopic[]>([]);
  const [activeTopicSlug, setActiveTopicSlug] = useState(PRODUCT_QA_DEFAULT_TOPIC_SLUG);
  const [messages, setMessages] = useState<ProductQaMessage[]>([]);
  const [messageFilter, setMessageFilter] = useState<'storefront' | 'pending' | 'all'>('storefront');
  const [hasOlderHistory, setHasOlderHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlderHistory, setLoadingOlderHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const attachments = useChatAttachments({
    enabled: Boolean(productId),
    uploadFile: (file) => uploadAdminProductQaAttachment(productId, file),
    revokeFile: (url) => revokeAdminProductQaAttachment(productId, url),
    onError: setError,
    uploadErrorFallback: loadErrorFallback,
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

  const activeTopicSlugRef = useRef(activeTopicSlug);
  const messageFilterRef = useRef(messageFilter);
  const messagesRef = useRef(messages);
  activeTopicSlugRef.current = activeTopicSlug;
  messageFilterRef.current = messageFilter;
  messagesRef.current = messages;

  const loadTopics = useCallback(async () => {
    try {
      const res = await fetchAdminProductQaTopics(productId);
      setTopics(res.topics);
      if (res.topics.length && !res.topics.some((t) => t.slug === activeTopicSlugRef.current)) {
        const def = res.topics.find((t) => t.isDefault) ?? res.topics[0];
        if (def) {
          setActiveTopicSlug(def.slug);
          activeTopicSlugRef.current = def.slug;
        }
      }
    } catch {
      /* optional */
    }
  }, [productId]);

  const fetchMessages = useCallback(
    async (topicSlug: string, filter: 'storefront' | 'pending' | 'all') => {
      return fetchAdminProductQaMessages(productId, {
        limit: PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
        topicSlug,
        status: filter === 'pending' ? 'PENDING' : undefined,
      });
    },
    [productId],
  );

  const filterMessagesForView = useCallback(
    (rows: ProductQaMessage[], filter: 'storefront' | 'pending' | 'all') => {
      if (filter === 'pending') return rows.filter((m) => m.status === 'PENDING');
      if (filter === 'storefront') {
        return rows.filter((m) => m.status === 'VISIBLE' || m.status === 'PENDING');
      }
      return rows;
    },
    [],
  );

  const syncFromServer = useCallback(async () => {
    if (!enabled || document.visibilityState !== 'visible') return;
    try {
      await loadTopics();
      const res = await fetchMessages(activeTopicSlugRef.current, messageFilterRef.current);
      setMessages((prev) =>
        filterMessagesForView(
          mergeProductQaMessages(prev, res.messages, activeTopicSlugRef.current),
          messageFilterRef.current,
        ),
      );
      setHasOlderHistory(res.hasOlder);
    } catch {
      /* ignore */
    }
  }, [enabled, fetchMessages, filterMessagesForView, loadTopics]);

  const onStaffNewQuestionForProduct = useCallback(() => {
    void syncFromServer();
  }, [syncFromServer]);

  const onStaffQaMessageUpdatedForProduct = useCallback(
    (payload: { message: ProductQaMessage }) => {
      if (payload.message.topicSlug !== activeTopicSlugRef.current) return;
      setMessages((prev) => {
        const next = prev.map((m) => (m.id === payload.message.id ? payload.message : m));
        return filterMessagesForView(next, messageFilterRef.current);
      });
    },
    [filterMessagesForView],
  );

  useAdminProductQaStaffNewQuestionForProduct(productId, onStaffNewQuestionForProduct);
  useAdminProductQaStaffQaMessageForProduct(productId, onStaffNewQuestionForProduct);
  useAdminProductQaStaffQaMessageUpdatedForProduct(productId, onStaffQaMessageUpdatedForProduct);

  useEffect(() => {
    if (!enabled) return undefined;
    const onVis = () => {
      if (document.visibilityState === 'visible') void syncFromServer();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [enabled, syncFromServer]);

  useProductQaRealtime(
    { productId },
    {
      enabled,
      onMessageCreated: (m) => {
        if (m.status !== 'VISIBLE') return;
        if (m.topicSlug !== activeTopicSlugRef.current) return;
        setMessages((prev) => {
          const next = prev.some((x) => x.id === m.id) ? prev : [...prev, m];
          return filterMessagesForView(next, messageFilterRef.current);
        });
      },
      onMessageHidden: (id) => {
        setMessages((prev) => {
          const next = prev.map((m) => (m.id === id ? { ...m, status: 'HIDDEN' as const } : m));
          return filterMessagesForView(next, messageFilterRef.current);
        });
      },
      onMessageUpdated: (updated) => {
        if (updated.topicSlug !== activeTopicSlugRef.current) return;
        setMessages((prev) => {
          const next = prev.map((m) => (m.id === updated.id ? updated : m));
          return filterMessagesForView(next, messageFilterRef.current);
        });
      },
      onMetaUpdated: (meta) => {
        setTopics(meta.topics);
      },
      onPollFallback: () => {
        void syncFromServer();
      },
    },
  );

  const reloadMessages = useCallback(
    async (topicSlug: string, filter: 'storefront' | 'pending' | 'all') => {
      setLoading(true);
      setError(null);
      try {
        await loadTopics();
        const res = await fetchMessages(topicSlug, filter);
        setMessages(filterMessagesForView(res.messages, filter));
        setHasOlderHistory(res.hasOlder);
      } catch (e) {
        const msg =
          e instanceof AdminBackendRequestError
            ? e.message
            : e instanceof Error
              ? e.message
              : loadErrorFallback;
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [fetchMessages, filterMessagesForView, loadErrorFallback, loadTopics],
  );

  useEffect(() => {
    if (!enabled || !productId) {
      setMessages([]);
      setTopics([]);
      setError(null);
      setHasOlderHistory(false);
      clearPendingAttachments();
      return undefined;
    }

    void reloadMessages(activeTopicSlug, messageFilter);
    return undefined;
  }, [activeTopicSlug, clearPendingAttachments, enabled, messageFilter, productId, reloadMessages]);

  const loadOlderChatMessages = useCallback(async () => {
    if (!hasOlderHistory || loadingOlderHistory) return;
    const oldest = messagesRef.current[0];
    if (!oldest) return;
    setLoadingOlderHistory(true);
    setError(null);
    try {
      const res = await fetchAdminProductQaMessages(productId, {
        limit: PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
        before: oldest.id,
        topicSlug: activeTopicSlugRef.current,
        status: messageFilterRef.current === 'pending' ? 'PENDING' : undefined,
      });
      setMessages((prev) =>
        filterMessagesForView(
          prependProductQaMessages(prev, res.messages),
          messageFilterRef.current,
        ),
      );
      setHasOlderHistory(res.hasOlder);
    } catch (e) {
      const msg =
        e instanceof AdminBackendRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : loadErrorFallback;
      setError(msg);
    } finally {
      setLoadingOlderHistory(false);
    }
  }, [hasOlderHistory, loadingOlderHistory, loadErrorFallback, productId, filterMessagesForView]);

  const sendChatText = useCallback(
    async (text: string) => {
      if (sending) return;
      const body = text.trim();
      const readyAttachments = getReadyAttachments();
      if (!body && !readyAttachments.length) return;
      if (body.length > PRODUCT_QA_BODY_MAX_CHARS) return;

      setSending(true);
      setError(null);
      try {
        const created = await postAdminProductQaReply(productId, {
          body,
          topicSlug: activeTopicSlugRef.current,
          attachments: readyAttachments.map((r) => ({
            url: r.fileUrl!,
            filename: r.filename,
            mimeType: r.mimeType,
            kind: r.kind,
          })),
        });
        clearPendingAttachments();
        if (created.topicSlug === activeTopicSlugRef.current) {
          setMessages((prev) =>
            filterMessagesForView([...prev, created], messageFilterRef.current),
          );
        }
        void loadTopics();
        document.dispatchEvent(new Event(ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT));
      } catch (e) {
        const msg =
          e instanceof AdminBackendRequestError
            ? e.message
            : e instanceof Error
              ? e.message
              : loadErrorFallback;
        setError(msg);
      } finally {
        setSending(false);
      }
    },
    [clearPendingAttachments, filterMessagesForView, getReadyAttachments, loadErrorFallback, loadTopics, productId, sending],
  );

  const patchMessage = useCallback(
    (updated: ProductQaMessage) => {
      setMessages((prev) => {
        let next = prev;
        if (messageFilterRef.current === 'pending' && updated.status !== 'PENDING') {
          next = prev.filter((m) => m.id !== updated.id);
        } else {
          next = prev.map((m) => (m.id === updated.id ? updated : m));
        }
        return filterMessagesForView(next, messageFilterRef.current);
      });
    },
    [filterMessagesForView],
  );

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const handleTopicSelect = useCallback((slug: string) => {
    setActiveTopicSlug(slug);
    activeTopicSlugRef.current = slug;
  }, []);

  const handleFilterChange = useCallback((filter: 'storefront' | 'pending' | 'all') => {
    setMessageFilter(filter);
    messageFilterRef.current = filter;
  }, []);

  const refreshTopics = useCallback(async () => {
    await loadTopics();
  }, [loadTopics]);

  return {
    topics,
    activeTopicSlug,
    setActiveTopicSlug: handleTopicSelect,
    messageFilter,
    setMessageFilter: handleFilterChange,
    messages,
    patchMessage,
    removeMessage,
    loading,
    error,
    hasOlderHistory,
    loadingOlderHistory,
    loadOlderChatMessages,
    sendChatText,
    attachChatFiles,
    removePendingChatAttachment,
    pendingOutgoingAttachments,
    pendingAttachmentsHint,
    canSendAttachmentMessage,
    composerDisabled: sending || uploadBusy,
    attachPickerDisabled: sending || uploadBusy,
    viewerUserId,
    viewerStaffAvatar,
    timeLocale,
    refreshTopics,
    syncFromServer,
  };
}
