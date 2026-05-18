'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { adminBackendPath } from '@/lib/adminBackendFetch';
import type { ChatWindowMessage } from '@/components/ChatWindow/ChatWindow';
import {
  CHAT_MESSAGES_PAGE_DEFAULT,
  ORDER_CHAT_ATTACHMENT_REFS_PAYLOAD_MAX_CHARS,
  ORDER_CHAT_ATTACHMENTS_MAX,
  ORDER_CHAT_POST_BODY_MAX_CHARS,
  ORDER_CHAT_SOCKET_UPDATED_EVENT,
  ORDER_CHAT_UPLOAD_MAX_FILE_BYTES,
  type OrderChatVariant,
} from '@/lib/orderChat/constants';
import { computeOrderChatMessageDeletableInUi } from '@/lib/orderChat/orderChatDeletionUi';
import { decodeJwtPayloadUnsafe } from '@/lib/orderChat/decodeJwtPayloadUnsafe';
import {
  fetchOrderChatWsToken,
  getOrCreateSharedOrderChatSocket,
  registerOrderChatWsSession,
  waitOrderChatSocketConnect,
} from '@/lib/orderChat/orderChatWsShared';
import {
  describeOrderChatUploadFailure,
  orderChatFileTooLargeUserMessage,
} from '@/lib/orderChat/orderChatUploadError';
import { readUpstreamJsonErrorMessage } from '@/lib/readUpstreamJsonError';
import type {
  OrderChatApiMessage,
  OrderChatMessagesResponse,
  OrderChatPendingUiAttachment,
  PendingAttachmentRef,
} from '@/lib/orderChat/types';

export type { OrderChatVariant } from '@/lib/orderChat/constants';

const PROFILE_AVATAR_PLACEHOLDER = '/images/placeholder.svg';
/** В ЛК сообщения сотрудника показываем с фирменным аватаром менеджера. */
const STAFF_AVATAR_ACCOUNT = '/images/Admin-avatar.jpeg';

/** iOS/macOS иногда отдаёт File.type пустым — ищем картинку по расширению для превью и kind */
function inferMimeFromFilename(name: string): string | null {
  const base = name.trim().toLowerCase().split(/[/\\]/).pop() ?? '';
  if (/\.jpe?g$/i.test(base)) return 'image/jpeg';
  if (/\.png$/i.test(base)) return 'image/png';
  if (/\.webp$/i.test(base)) return 'image/webp';
  if (/\.gif$/i.test(base)) return 'image/gif';
  if (/\.heic$/i.test(base)) return 'image/heic';
  if (/\.heif$/i.test(base)) return 'image/heif';
  return null;
}

async function parseOrderChatUploadResponse(res: Response): Promise<{
  url: string;
  filename: string;
  mimeType: string;
  kind: 'FILE' | 'IMAGE';
}> {
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    const snippet = text.trim().slice(0, 280);
    throw new Error(snippet || 'Некорректный ответ сервера при загрузке файла');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('Пустой ответ при загрузке файла');
  const o = parsed as Record<string, unknown>;
  const url = typeof o.url === 'string' ? o.url.trim() : '';
  if (!url) throw new Error('Сервер не вернул ссылку на файл — проверьте Network → chat/upload');
  const filename = typeof o.filename === 'string' ? o.filename : 'file';
  const mimeType = typeof o.mimeType === 'string' ? o.mimeType : 'application/octet-stream';
  const kind: 'FILE' | 'IMAGE' =
    o.kind === 'IMAGE' || o.kind === 'FILE' ? o.kind : mimeType.startsWith('image/') ? 'IMAGE' : 'FILE';
  return { url, filename, mimeType, kind };
}

function orderChatMessagesPath(variant: OrderChatVariant, orderId: string): string {
  return variant === 'account'
    ? `/api/user/orders/${encodeURIComponent(orderId)}/chat/messages`
    : adminBackendPath(`orders/admin/${encodeURIComponent(orderId)}/chat/messages`);
}

function orderChatMessagesListUrl(
  variant: OrderChatVariant,
  orderId: string,
  opts?: { limit?: number; before?: string },
): string {
  const base = orderChatMessagesPath(variant, orderId);
  const params = new URLSearchParams();
  if (opts?.limit != null) params.set('limit', String(opts.limit));
  const beforeTrim = opts?.before?.trim();
  if (beforeTrim) params.set('before', beforeTrim);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function readUrl(variant: OrderChatVariant, orderId: string): string {
  return variant === 'account'
    ? `/api/user/orders/${encodeURIComponent(orderId)}/chat/read`
    : adminBackendPath(`orders/admin/${encodeURIComponent(orderId)}/chat/read`);
}

function uploadUrl(variant: OrderChatVariant, orderId: string): string {
  return variant === 'account'
    ? `/api/user/orders/${encodeURIComponent(orderId)}/chat/upload`
    : adminBackendPath(`orders/admin/${encodeURIComponent(orderId)}/chat/upload`);
}

function deleteUrl(variant: OrderChatVariant, orderId: string, messageId: string): string {
  return variant === 'account'
    ? `/api/user/orders/${encodeURIComponent(orderId)}/chat/messages/${encodeURIComponent(messageId)}`
    : adminBackendPath(
        `orders/admin/${encodeURIComponent(orderId)}/chat/messages/${encodeURIComponent(messageId)}`,
      );
}

function mapApiToUi(
  m: OrderChatApiMessage,
  viewerUserId: string | null,
  variant: OrderChatVariant,
  timeLocale: string,
): ChatWindowMessage {
  const deleted = !!m.deletedAt;
  const isStaff = m.authorRole === 'STAFF';
  const isMineCustomer = variant === 'account' && !isStaff && viewerUserId === m.authorUserId;
  const isMineStaff = variant === 'admin' && isStaff && viewerUserId === m.authorUserId;

  let senderName = m.authorLabel;
  if (variant === 'account') {
    if (isMineCustomer) senderName = 'Вы';
    else if (isStaff) senderName = 'Менеджер Win-Win';
  } else {
    if (isMineStaff) senderName = 'Вы';
    else if (!isStaff) senderName = m.authorLabel || 'Клиент';
  }

  const timeLabel = new Date(m.createdAt).toLocaleTimeString(timeLocale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const docs = !deleted
    ? m.attachments
        .filter((a) => a.kind === 'FILE')
        .map((a) => ({ id: a.id, filename: a.filename, url: a.fileUrl }))
    : undefined;
  const imgs = !deleted
    ? m.attachments
        .filter((a) => a.kind === 'IMAGE')
        .map((a) => ({ id: a.id, src: a.fileUrl, alt: '' }))
    : undefined;

  const deletable = computeOrderChatMessageDeletableInUi({
    variant,
    viewerUserId,
    deleted,
    authorUserId: m.authorUserId,
    authorRole: m.authorRole,
    createdAtIso: m.createdAt,
  });

  const avatarRaw = m.authorAvatarUrl?.trim();
  let senderAvatarUrl = avatarRaw && avatarRaw.length > 0 ? avatarRaw : PROFILE_AVATAR_PLACEHOLDER;
  if (variant === 'account' && isStaff) {
    senderAvatarUrl = STAFF_AVATAR_ACCOUNT;
  }

  return {
    id: m.id,
    senderName,
    senderAvatarUrl,
    timeLabel,
    content: deleted ? undefined : m.body.trim() || undefined,
    isDeleted: deleted,
    documents: docs?.length ? docs : undefined,
    images: imgs?.length ? imgs : undefined,
    deletable,
    ocAuthorUserId: m.authorUserId,
    ocAuthorRole: m.authorRole,
    ocCreatedAtIso: m.createdAt,
  };
}

export function useOrderChat(opts: {
  orderId: string | null;
  enabled: boolean;
  variant: OrderChatVariant;
  /** ru-RU | zh-CN и т.п. — время в списке сообщений */
  timeLocale?: string;
}) {
  const { orderId, enabled, variant, timeLocale = 'ru-RU' } = opts;

  const [messages, setMessages] = useState<ChatWindowMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [pendingRefs, setPendingRefs] = useState<PendingAttachmentRef[]>([]);
  const [hasOlderHistory, setHasOlderHistory] = useState(false);
  const [loadingOlderHistory, setLoadingOlderHistory] = useState(false);
  const viewerRef = useRef<string | null>(null);
  /** Диалог по заказу: отсекаем WS-события «чужого» conversation при общем сокете. */
  const conversationIdRef = useRef<string | null>(null);
  const messagesRef = useRef<ChatWindowMessage[]>([]);

  const uploadBusy = useMemo(() => pendingRefs.some((r) => r.uploading), [pendingRefs]);

  const pendingOutgoingUi = useMemo((): OrderChatPendingUiAttachment[] => {
    return pendingRefs.map((r) => ({
      clientKey: r.clientToken,
      filename: r.filename,
      kind: r.kind,
      imageSrc: r.kind === 'IMAGE' ? r.fileUrl || r.localPreviewUrl || null : null,
      uploading: r.uploading,
    }));
  }, [pendingRefs]);

  const canSendAttachmentMessage = useMemo(
    () =>
      pendingRefs.some((r) => Boolean(r.fileUrl?.trim()) && !r.uploading) &&
      !pendingRefs.some((r) => r.uploading),
    [pendingRefs],
  );

  const pendingHint = useMemo(() => {
    if (!pendingRefs.length) return undefined;
    if (pendingRefs.some((r) => r.uploading)) return 'Загружаем файл…';
    return undefined;
  }, [pendingRefs]);

  messagesRef.current = messages;

  useEffect(() => {
    if (!enabled || !orderId) return undefined;
    const tick = (): void => {
      setMessages((prev) =>
        prev.map((row) => {
          if (!row.ocCreatedAtIso || !row.ocAuthorUserId || !row.ocAuthorRole) return row;
          return {
            ...row,
            deletable: computeOrderChatMessageDeletableInUi({
              variant,
              viewerUserId: viewerRef.current,
              deleted: !!row.isDeleted,
              authorUserId: row.ocAuthorUserId,
              authorRole: row.ocAuthorRole,
              createdAtIso: row.ocCreatedAtIso,
            }),
          };
        }),
      );
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [enabled, orderId, variant]);

  const reloadMessages = useCallback(async () => {
    if (!orderId) return;
    const res = await fetch(orderChatMessagesListUrl(variant, orderId, { limit: CHAT_MESSAGES_PAGE_DEFAULT }), {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(await readUpstreamJsonErrorMessage(res));
    const data = (await res.json()) as OrderChatMessagesResponse;
    const viewer = viewerRef.current;
    conversationIdRef.current = data.conversationId ?? null;
    setMessages((data.messages ?? []).map((m) => mapApiToUi(m, viewer, variant, timeLocale)));
    setHasOlderHistory(Boolean(data.hasOlder));
  }, [orderId, variant, timeLocale]);

  const loadOlderChatMessages = useCallback(async () => {
    if (!orderId || !hasOlderHistory || loadingOlderHistory) return;
    const oldestId = messagesRef.current[0]?.id;
    if (!oldestId) return;

    setLoadingOlderHistory(true);
    setError(null);
    try {
      const res = await fetch(
        orderChatMessagesListUrl(variant, orderId, {
          limit: CHAT_MESSAGES_PAGE_DEFAULT,
          before: oldestId,
        }),
        { credentials: 'same-origin', cache: 'no-store' },
      );
      if (!res.ok) throw new Error(await readUpstreamJsonErrorMessage(res));
      const data = (await res.json()) as OrderChatMessagesResponse;
      const viewer = viewerRef.current;
      const mapped = (data.messages ?? []).map((m) => mapApiToUi(m, viewer, variant, timeLocale));
      setHasOlderHistory(Boolean(data.hasOlder));
      setMessages((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        return [...mapped.filter((x) => !seen.has(x.id)), ...prev];
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось подгрузить историю');
    } finally {
      setLoadingOlderHistory(false);
    }
  }, [hasOlderHistory, loadingOlderHistory, orderId, timeLocale, variant]);

  useEffect(() => {
    if (!enabled || !orderId) {
      setPendingRefs((prev) => {
        for (const r of prev) {
          if (r.localPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(r.localPreviewUrl);
        }
        return [];
      });
      setMessages([]);
      setError(null);
      setLoading(false);
      setHasOlderHistory(false);
      setLoadingOlderHistory(false);
      conversationIdRef.current = null;
      return undefined;
    }

    let disposed = false;
    let activeSocket: Socket | null = null;
    let unregisterSession: (() => void) | null = null;

    const onCreated = (payload: OrderChatApiMessage) => {
      if (disposed || !payload?.id) return;
      const cur = conversationIdRef.current;
      if (
        cur != null &&
        cur !== '' &&
        payload.conversationId != null &&
        payload.conversationId !== cur
      ) {
        return;
      }
      const viewer = viewerRef.current;
      const curCid = conversationIdRef.current;
      if ((!curCid || curCid === '') && payload.conversationId) {
        conversationIdRef.current = payload.conversationId;
      }
      setMessages((prev) => {
        if (prev.some((x) => x.id === payload.id)) return prev;
        return [...prev, mapApiToUi(payload, viewer, variant, timeLocale)];
      });
      if (variant === 'admin' && payload.authorRole === 'CUSTOMER' && typeof document !== 'undefined') {
        document.dispatchEvent(new Event('admin-orders-chat-unread-refresh'));
      }
    };

    const onDeleted = (payload: { id?: string }) => {
      if (disposed || !payload?.id) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.id
            ? {
                ...m,
                isDeleted: true,
                content: undefined,
                documents: undefined,
                images: undefined,
                deletable: false,
              }
            : m,
        ),
      );
    };

    const detachSocketHandlers = () => {
      if (!activeSocket) return;
      activeSocket.off('message_created', onCreated);
      activeSocket.off('message_deleted', onDeleted);
    };

    const attachSocketHandlers = (socket: Socket) => {
      detachSocketHandlers();
      activeSocket = socket;
      socket.on('message_created', onCreated);
      socket.on('message_deleted', onDeleted);
      socket.emit('join_order_chat', { orderId });
    };

    const onSocketLayerUpdated = ((ev: Event) => {
      const ce = ev as CustomEvent<{ variant: OrderChatVariant; socket: Socket }>;
      if (ce.detail?.variant !== variant || disposed) return;
      attachSocketHandlers(ce.detail.socket);
    }) as EventListener;

    if (typeof window !== 'undefined') {
      window.addEventListener(ORDER_CHAT_SOCKET_UPDATED_EVENT, onSocketLayerUpdated);
    }

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await fetchOrderChatWsToken(variant);
        const sub = decodeJwtPayloadUnsafe(token)?.sub ?? null;
        viewerRef.current = sub;

        const res = await fetch(
          orderChatMessagesListUrl(variant, orderId, { limit: CHAT_MESSAGES_PAGE_DEFAULT }),
          {
            credentials: 'same-origin',
            cache: 'no-store',
          },
        );
        if (!res.ok) throw new Error(await readUpstreamJsonErrorMessage(res));
        const data = (await res.json()) as OrderChatMessagesResponse;
        if (disposed) return;
        conversationIdRef.current = data.conversationId ?? null;
        const viewer = viewerRef.current;
        const rows = (data.messages ?? []).map((m) => mapApiToUi(m, viewer, variant, timeLocale));
        setMessages(rows);
        setHasOlderHistory(Boolean(data.hasOlder));

        await fetch(readUrl(variant, orderId), {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }).catch(() => undefined);
        if (variant === 'admin' && typeof document !== 'undefined') {
          document.dispatchEvent(new Event('admin-orders-chat-unread-refresh'));
        }

        unregisterSession = registerOrderChatWsSession(variant, token);
        const socket = getOrCreateSharedOrderChatSocket(variant, token);
        await waitOrderChatSocketConnect(socket);
        if (disposed) return;
        attachSocketHandlers(socket);
      } catch (e) {
        unregisterSession?.();
        unregisterSession = null;
        if (!disposed) {
          setError(e instanceof Error ? e.message : 'Не удалось загрузить чат');
          setMessages([]);
          setHasOlderHistory(false);
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    })();

    return () => {
      disposed = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener(ORDER_CHAT_SOCKET_UPDATED_EVENT, onSocketLayerUpdated);
      }
      detachSocketHandlers();
      activeSocket?.emit('leave_order_chat', { orderId });
      unregisterSession?.();
    };
  }, [enabled, orderId, variant, timeLocale]);

  const sendText = useCallback(
    async (text: string) => {
      if (!orderId) return;
      const body = text.trim();
      const ready = pendingRefs.filter((r) => r.fileUrl?.trim() && !r.uploading);
      if (!body && ready.length === 0) return;

      if (body.length > ORDER_CHAT_POST_BODY_MAX_CHARS) {
        setError(`Сообщение длиннее ${ORDER_CHAT_POST_BODY_MAX_CHARS.toLocaleString()} символов`);
        return;
      }
      if (ready.length > ORDER_CHAT_ATTACHMENTS_MAX) {
        setError(`Не более ${ORDER_CHAT_ATTACHMENTS_MAX} вложений в сообщении`);
        return;
      }
      let refsPayloadChars = 0;
      for (const r of ready) {
        const mt = r.mimeType?.trim() ?? '';
        refsPayloadChars += r.fileUrl.length + r.filename.length + mt.length;
      }
      if (refsPayloadChars > ORDER_CHAT_ATTACHMENT_REFS_PAYLOAD_MAX_CHARS) {
        setError('Суммарный размер полей вложений слишком большой — удалите часть файлов или напишите в поддержку');
        return;
      }

      setSending(true);
      setError(null);
      try {
        const res = await fetch(orderChatMessagesPath(variant, orderId), {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            body: body || undefined,
            attachments:
              ready.length > 0
                ? ready.map((r) => ({
                    fileUrl: r.fileUrl,
                    filename: r.filename,
                    mimeType: r.mimeType,
                    kind: r.kind,
                  }))
                : undefined,
          }),
        });
        if (!res.ok) throw new Error(await readUpstreamJsonErrorMessage(res));
        const created = (await res.json()) as OrderChatApiMessage;
        const viewer = viewerRef.current;
        setMessages((prev) => {
          if (prev.some((x) => x.id === created.id)) return prev;
          return [...prev, mapApiToUi(created, viewer, variant, timeLocale)];
        });
        setPendingRefs([]);
        void fetch(readUrl(variant, orderId), {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        })
          .then(() => {
            if (variant === 'admin' && typeof document !== 'undefined') {
              document.dispatchEvent(new Event('admin-orders-chat-unread-refresh'));
            }
          })
          .catch(() => undefined);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось отправить');
      } finally {
        setSending(false);
      }
    },
    [orderId, variant, pendingRefs, timeLocale],
  );

  const attachFiles = useCallback(
    async (files: File[]) => {
      if (!orderId || files.length === 0) return;
      setError(null);

      if (pendingRefs.length + files.length > ORDER_CHAT_ATTACHMENTS_MAX) {
        setError(`Не более ${ORDER_CHAT_ATTACHMENTS_MAX} вложений в сообщении`);
        return;
      }
      const tooLarge = files.find((f) => f.size > ORDER_CHAT_UPLOAD_MAX_FILE_BYTES);
      if (tooLarge) {
        setError(`${orderChatFileTooLargeUserMessage()} Файл: «${tooLarge.name}».`);
        return;
      }

      for (const file of files) {
        const clientToken =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        const localPreviewUrl = URL.createObjectURL(file);
        const mimeType =
          (file.type && file.type.trim()) || inferMimeFromFilename(file.name) || 'application/octet-stream';
        const kind: 'FILE' | 'IMAGE' =
          mimeType.startsWith('image/') && mimeType !== 'image/tiff' ? 'IMAGE' : 'FILE';

        setPendingRefs((p) => [
          ...p,
          {
            clientToken,
            fileUrl: '',
            filename: file.name?.trim() || 'file',
            mimeType,
            kind,
            localPreviewUrl,
            uploading: true,
          },
        ]);

        try {
          const fd = new FormData();
          fd.append('file', file);
          const res = await fetch(uploadUrl(variant, orderId), {
            method: 'POST',
            credentials: 'same-origin',
            body: fd,
          });
          if (!res.ok) {
            throw new Error(
              await describeOrderChatUploadFailure(res, ORDER_CHAT_UPLOAD_MAX_FILE_BYTES),
            );
          }
          const row = await parseOrderChatUploadResponse(res);
          setPendingRefs((p) =>
            p.map((x) =>
              x.clientToken === clientToken
                ? {
                    ...x,
                    fileUrl: row.url,
                    filename: row.filename || x.filename,
                    mimeType: row.mimeType || x.mimeType,
                    kind: row.kind,
                    localPreviewUrl: undefined,
                    uploading: false,
                  }
                : x,
            ),
          );
          requestAnimationFrame(() => URL.revokeObjectURL(localPreviewUrl));
        } catch (e) {
          URL.revokeObjectURL(localPreviewUrl);
          setPendingRefs((p) => p.filter((x) => x.clientToken !== clientToken));
          setError(e instanceof Error ? e.message : 'Не удалось загрузить файл');
        }
      }
    },
    [orderId, variant, pendingRefs],
  );

  const removePendingAttachment = useCallback((clientToken: string) => {
    setPendingRefs((p) => {
      const row = p.find((x) => x.clientToken === clientToken);
      if (row?.localPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(row.localPreviewUrl);
      return p.filter((x) => x.clientToken !== clientToken);
    });
  }, []);

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!orderId) return;
      setError(null);
      try {
        const res = await fetch(deleteUrl(variant, orderId, messageId), {
          method: 'DELETE',
          credentials: 'same-origin',
        });
        if (!res.ok) throw new Error(await readUpstreamJsonErrorMessage(res));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  isDeleted: true,
                  content: undefined,
                  documents: undefined,
                  images: undefined,
                  deletable: false,
                }
              : m,
          ),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось удалить сообщение');
      }
    },
    [orderId, variant],
  );

  const composerDisabled = loading || sending || uploadBusy;
  const attachPickerDisabled = sending || uploadBusy;

  return {
    chatMessages: messages,
    chatLoading: loading,
    chatError: error,
    chatComposerDisabled: composerDisabled,
    chatAttachPickerDisabled: attachPickerDisabled,
    chatUploading: uploadBusy,
    pendingAttachmentsHint: pendingHint,
    pendingOutgoingAttachments: pendingOutgoingUi,
    canSendAttachmentMessage,
    sendChatText: sendText,
    attachChatFiles: attachFiles,
    removePendingChatAttachment: removePendingAttachment,
    deleteChatMessage: deleteMessage,
    reloadChat: reloadMessages,
    chatHasOlderHistory: hasOlderHistory,
    chatLoadingOlderHistory: loadingOlderHistory,
    loadOlderChatMessages,
  };
}
