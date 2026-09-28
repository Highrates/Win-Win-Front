'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChatWindowMessage } from '@/components/ChatWindow/ChatWindow';
import { useProductQaRealtime } from '@/hooks/useProductQaRealtime';
import { useChatAttachments } from '@/hooks/useChatAttachments';
import { useProductQaPostCooldown } from '@/hooks/useProductQaPostCooldown';
import { isProductQaTurnstileRequired } from '@/components/ProductQaTurnstile/ProductQaTurnstile';
import { getCachedIsAuthenticated } from '@/lib/userSessionClient';
import {
  PRODUCT_QA_BODY_MAX_CHARS,
  PRODUCT_QA_DEFAULT_TOPIC_SLUG,
  PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
} from '@/lib/productQa/constants';
import { mapProductQaToChatWindow } from '@/lib/productQa/mapProductQaToChatWindow';
import { mergeProductQaMessages, prependProductQaMessages } from '@/lib/productQa/mergeMessages';
import {
  fetchProductQaMeta,
  fetchProductQaMessages,
  postProductQaMessage,
  revokeProductQaAttachment,
  uploadProductQaAttachment,
} from '@/lib/productQa/productQaApi';
import {
  fetchProductCorrespondenceMessages,
  postProductCorrespondenceMessage,
} from '@/lib/productCorrespondence/correspondenceApi';
import { mapCorrespondenceToChatWindow } from '@/lib/productCorrespondence/mapCorrespondenceToChatWindow';
import type { ProductCorrespondenceMessage } from '@/lib/productCorrespondence/types';
import type { ProductQaMessage, ProductQaTopic } from '@/lib/productQa/types';
import { useProductCorrespondenceRealtime } from '@/hooks/useProductCorrespondenceRealtime';
import { fetchChatViewer } from '@/lib/chatViewer';

function errorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message.trim()) return e.message;
  return fallback;
}

export function useProductQaChat(opts: {
  productSlug: string | null;
  enabled: boolean;
  productVariantId?: string | null;
  initialTopicSlug?: string;
  initialMessageCount?: number;
  onMessageCountChange?: (count: number) => void;
  timeLocale?: string;
  /** Вопросы покупателя уходят в private correspondence, не в публичный тред. */
  postToCorrespondence?: boolean;
}) {
  const {
    productSlug,
    enabled,
    productVariantId,
    initialTopicSlug = PRODUCT_QA_DEFAULT_TOPIC_SLUG,
    initialMessageCount = 0,
    onMessageCountChange,
    timeLocale = 'ru-RU',
    postToCorrespondence = false,
  } = opts;

  const [topics, setTopics] = useState<ProductQaTopic[]>([]);
  const [activeTopicSlug, setActiveTopicSlug] = useState(initialTopicSlug);
  const [rawMessages, setRawMessages] = useState<ProductQaMessage[]>([]);
  const [messages, setMessages] = useState<ChatWindowMessage[]>([]);
  const [hasOlderHistory, setHasOlderHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOlderHistory, setLoadingOlderHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [preModerationEnabled, setPreModerationEnabled] = useState(false);
  const [displayCount, setDisplayCount] = useState(initialMessageCount);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [viewerIsStaff, setViewerIsStaff] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [correspondenceRaw, setCorrespondenceRaw] = useState<ProductCorrespondenceMessage[]>([]);
  const [correspondenceId, setCorrespondenceId] = useState<string | null>(null);

  const viewerRef = useRef<string | null>(null);
  const rawMessagesRef = useRef<ProductQaMessage[]>([]);
  const correspondenceRawRef = useRef<ProductCorrespondenceMessage[]>([]);
  const activeTopicSlugRef = useRef(activeTopicSlug);
  activeTopicSlugRef.current = activeTopicSlug;
  rawMessagesRef.current = rawMessages;
  correspondenceRawRef.current = correspondenceRaw;

  const syncDisplayMessages = useCallback(
    (qaRows: ProductQaMessage[], corrRows: ProductCorrespondenceMessage[]) => {
      const viewer = viewerRef.current;
      if (!postToCorrespondence) {
        setMessages(qaRows.map((m) => mapProductQaToChatWindow(m, viewer, timeLocale)));
        return;
      }
      const publishedQaIds = new Set(qaRows.map((m) => m.id));
      const qa = qaRows.map((m) => mapProductQaToChatWindow(m, viewer, timeLocale));
      const corr = corrRows
        .filter((m) => !(m.publishedQaMessageId && publishedQaIds.has(m.publishedQaMessageId)))
        .map((m) => mapCorrespondenceToChatWindow(m, viewer, timeLocale, 'account'));
      const merged = [...qa, ...corr].sort((a, b) =>
        (a.ocCreatedAtIso ?? '').localeCompare(b.ocCreatedAtIso ?? ''),
      );
      setMessages(merged);
    },
    [postToCorrespondence, timeLocale],
  );

  const appendCorrespondenceMessage = useCallback(
    (created: ProductCorrespondenceMessage) => {
      setCorrespondenceRaw((prev) => {
        if (prev.some((x) => x.id === created.id)) return prev;
        const next = [...prev, created];
        syncDisplayMessages(rawMessagesRef.current, next);
        return next;
      });
      setCorrespondenceId(created.correspondenceId);
    },
    [syncDisplayMessages],
  );

  const patchCorrespondenceMessage = useCallback(
    (updated: ProductCorrespondenceMessage) => {
      setCorrespondenceRaw((prev) => {
        const next = prev.map((m) => (m.id === updated.id ? updated : m));
        syncDisplayMessages(rawMessagesRef.current, next);
        return next;
      });
    },
    [syncDisplayMessages],
  );

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

  const bumpCount = useCallback(
    (delta: number) => {
      setDisplayCount((c) => {
        const next = Math.max(0, c + delta);
        onMessageCountChange?.(next);
        return next;
      });
    },
    [onMessageCountChange],
  );

  const applyRawMessages = useCallback(
    (rows: ProductQaMessage[]) => {
      setRawMessages(rows);
      syncDisplayMessages(rows, correspondenceRawRef.current);
    },
    [syncDisplayMessages],
  );

  useEffect(() => {
    setDisplayCount(initialMessageCount);
  }, [initialMessageCount, productSlug]);

  useEffect(() => {
    if (!enabled) return;
    void getCachedIsAuthenticated().then(setAuthenticated);
    void fetchChatViewer().then((viewer) => {
      viewerRef.current = viewer?.id ?? null;
      setViewerIsStaff(viewer?.isStaff ?? false);
      syncDisplayMessages(rawMessagesRef.current, correspondenceRawRef.current);
    });
  }, [enabled, syncDisplayMessages]);

  const syncFromServer = useCallback(async () => {
    if (!productSlug || document.visibilityState !== 'visible') return;
    try {
      const meta = await fetchProductQaMeta(productSlug);
      setTopics(meta.topics);
      setPreModerationEnabled(Boolean(meta.preModerationEnabled));
      setDisplayCount(meta.messageCount);
      onMessageCountChange?.(meta.messageCount);
      const res = await fetchProductQaMessages(productSlug, {
        limit: PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
        topicSlug: activeTopicSlugRef.current,
      });
      setRawMessages((prev) => {
        const merged = mergeProductQaMessages(prev, res.messages, activeTopicSlugRef.current);
        syncDisplayMessages(merged, correspondenceRawRef.current);
        return merged;
      });
      setHasOlderHistory(res.hasOlder);
    } catch {
      /* ignore background sync */
    }
  }, [onMessageCountChange, productSlug, syncDisplayMessages]);

  const pollCorrespondenceMessages = useCallback(async () => {
    if (!productSlug || !postToCorrespondence) return;
    try {
      const res = await fetchProductCorrespondenceMessages(productSlug, {
        limit: PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
      });
      setCorrespondenceId(res.correspondenceId);
      setCorrespondenceRaw(res.messages);
      syncDisplayMessages(rawMessagesRef.current, res.messages);
    } catch {
      /* ignore poll errors */
    }
  }, [postToCorrespondence, productSlug, syncDisplayMessages]);

  useProductCorrespondenceRealtime({
    enabled: enabled && Boolean(productSlug) && postToCorrespondence && authenticated === true,
    correspondenceId,
    variant: 'account',
    onMessageCreated: appendCorrespondenceMessage,
    onMessageUpdated: patchCorrespondenceMessage,
    onPollFallback: () => {
      void pollCorrespondenceMessages();
    },
  });

  useProductQaRealtime(
    { productSlug: productSlug ?? undefined },
    {
      enabled: enabled && Boolean(productSlug),
      onMessageCreated: (m) => {
        const topic = activeTopicSlugRef.current;
        const viewer = viewerRef.current;
        const isOwnPending =
          m.status === 'PENDING' && viewer != null && m.authorUserId === viewer;
        if (m.status !== 'VISIBLE' && !isOwnPending) return;
        if (m.topicSlug !== topic) return;
        setRawMessages((prev) => {
          if (prev.some((x) => x.id === m.id)) return prev;
          const next = [...prev, m];
          syncDisplayMessages(next, correspondenceRawRef.current);
          return next;
        });
        if (m.status === 'VISIBLE') bumpCount(1);
      },
      onMessageHidden: (id) => {
        setRawMessages((prev) => {
          const next = prev.filter((m) => m.id !== id);
          syncDisplayMessages(next, correspondenceRawRef.current);
          return next;
        });
      },
      onMessageUpdated: (updated) => {
        if (updated.topicSlug !== activeTopicSlugRef.current) return;
        setRawMessages((prev) => {
          const next = prev.map((m) => (m.id === updated.id ? updated : m));
          syncDisplayMessages(next, correspondenceRawRef.current);
          return next;
        });
      },
      onMetaUpdated: (meta) => {
        setTopics(meta.topics);
        setDisplayCount(meta.messageCount);
        onMessageCountChange?.(meta.messageCount);
      },
      onPollFallback: () => {
        void syncFromServer();
      },
    },
  );

  useEffect(() => {
    if (!enabled || !productSlug) {
      setRawMessages([]);
      setMessages([]);
      setError(null);
      setHasOlderHistory(false);
      setTopics([]);
      setCorrespondenceRaw([]);
      setCorrespondenceId(null);
      clearPendingAttachments();
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setActiveTopicSlug(initialTopicSlug);
    activeTopicSlugRef.current = initialTopicSlug;

    void fetchChatViewer().then((viewer) => {
      if (cancelled) return;
      viewerRef.current = viewer?.id ?? null;
      setViewerIsStaff(viewer?.isStaff ?? false);
    });

    void (async () => {
      try {
        const meta = await fetchProductQaMeta(productSlug);
        if (cancelled) return;
        setTopics(meta.topics);
        setPreModerationEnabled(Boolean(meta.preModerationEnabled));
        setDisplayCount(meta.messageCount);
        onMessageCountChange?.(meta.messageCount);
        const slug =
          meta.topics.find((t) => t.slug === initialTopicSlug)?.slug ??
          meta.topics.find((t) => t.isDefault)?.slug ??
          meta.topics[0]?.slug ??
          initialTopicSlug;
        setActiveTopicSlug(slug);
        activeTopicSlugRef.current = slug;

        const res = await fetchProductQaMessages(productSlug, {
          limit: PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
          topicSlug: slug,
        });
        if (cancelled) return;
        applyRawMessages(res.messages);
        setHasOlderHistory(res.hasOlder);

        if (postToCorrespondence) {
          const auth = await getCachedIsAuthenticated();
          if (auth && !cancelled) {
            try {
              const corrRes = await fetchProductCorrespondenceMessages(productSlug, {
                limit: PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
              });
              if (!cancelled) {
                setCorrespondenceId(corrRes.correspondenceId);
                setCorrespondenceRaw(corrRes.messages);
                syncDisplayMessages(res.messages, corrRes.messages);
              }
            } catch {
              /* переписки ещё нет */
            }
          }
        }
      } catch (e: unknown) {
        if (cancelled) return;
        setError(errorMessage(e, 'Не удалось загрузить сообщения'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    applyRawMessages,
    clearPendingAttachments,
    enabled,
    initialTopicSlug,
    onMessageCountChange,
    postToCorrespondence,
    productSlug,
    syncDisplayMessages,
  ]);

  const loadTopicMessages = useCallback(
    async (topicSlug: string) => {
      if (!productSlug) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchProductQaMessages(productSlug, {
          limit: PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
          topicSlug,
        });
        applyRawMessages(res.messages);
        setHasOlderHistory(res.hasOlder);
      } catch (e: unknown) {
        setError(errorMessage(e, 'Не удалось загрузить сообщения'));
      } finally {
        setLoading(false);
      }
    },
    [applyRawMessages, productSlug],
  );

  const loadOlderChatMessages = useCallback(async () => {
    if (!productSlug || !hasOlderHistory || loadingOlderHistory) return;
    const oldest = rawMessagesRef.current[0];
    if (!oldest) return;
    setLoadingOlderHistory(true);
    setError(null);
    try {
      const res = await fetchProductQaMessages(productSlug, {
        limit: PRODUCT_QA_MESSAGES_PAGE_DEFAULT,
        before: oldest.id,
        topicSlug: activeTopicSlugRef.current,
      });
      setRawMessages((prev) => {
        const next = prependProductQaMessages(prev, res.messages);
        syncDisplayMessages(next, correspondenceRawRef.current);
        return next;
      });
      setHasOlderHistory(res.hasOlder);
    } catch (e: unknown) {
      setError(errorMessage(e, 'Не удалось загрузить более ранние сообщения'));
    } finally {
      setLoadingOlderHistory(false);
    }
  }, [hasOlderHistory, loadingOlderHistory, productSlug, syncDisplayMessages]);

  const sendChatText = useCallback(
    async (text: string) => {
      if (!productSlug || sending || isCoolingDown || authenticated === false || viewerIsStaff) return;
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
      try {
        if (postToCorrespondence) {
          const created = await postProductCorrespondenceMessage(productSlug, {
            body,
            productVariantId: productVariantId ?? undefined,
            attachments: readyAttachments.map((r) => ({
              url: r.fileUrl!,
              filename: r.filename,
              mimeType: r.mimeType,
              kind: r.kind,
            })),
            turnstileToken: turnstileToken ?? undefined,
          });

          clearPendingAttachments();
          appendCorrespondenceMessage(created);
          triggerCooldown();
          if (turnstileRequired) {
            setTurnstileToken(null);
            setTurnstileResetKey((k) => k + 1);
          }
          return;
        }

        const created = (await postProductQaMessage(productSlug, {
          body,
          productVariantId: productVariantId ?? undefined,
          topicSlug: activeTopicSlugRef.current,
          attachments: readyAttachments.map((r) => ({
            url: r.fileUrl!,
            filename: r.filename,
            mimeType: r.mimeType,
            kind: r.kind,
          })),
          turnstileToken: turnstileToken ?? undefined,
        })) as ProductQaMessage;

        clearPendingAttachments();

        if (created.status === 'PENDING') {
          if (created.topicSlug === activeTopicSlugRef.current) {
            setRawMessages((prev) => {
              if (prev.some((x) => x.id === created.id)) return prev;
              const next = [...prev, created];
              syncDisplayMessages(next, correspondenceRawRef.current);
              return next;
            });
          }
        } else {
          if (created.topicSlug === activeTopicSlugRef.current) {
            setRawMessages((prev) => {
              if (prev.some((x) => x.id === created.id)) return prev;
              const next = [...prev, created];
              syncDisplayMessages(next, correspondenceRawRef.current);
              return next;
            });
          }
          bumpCount(1);
        }
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
      appendCorrespondenceMessage,
      authenticated,
      bumpCount,
      clearPendingAttachments,
      getReadyAttachments,
      handlePostError,
      isCoolingDown,
      productSlug,
      productVariantId,
      sending,
      syncDisplayMessages,
      triggerCooldown,
      turnstileRequired,
      turnstileToken,
      postToCorrespondence,
      viewerIsStaff,
    ],
  );

  const handleTopicSelect = useCallback(
    (slug: string) => {
      setActiveTopicSlug(slug);
      activeTopicSlugRef.current = slug;
      void loadTopicMessages(slug);
    },
    [loadTopicMessages],
  );

  const composerDisabled =
    authenticated === false ||
    authenticated === null ||
    viewerIsStaff ||
    sending ||
    isCoolingDown ||
    uploadBusy;

  return {
    topics,
    activeTopicSlug,
    setActiveTopicSlug: handleTopicSelect,
    messages,
    loading,
    error,
    preModerationEnabled,
    displayCount,
    authenticated,
    viewerIsStaff,
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
