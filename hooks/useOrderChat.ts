'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { adminBackendPath } from '@/lib/adminBackendFetch';
import type { ChatWindowMessage } from '@/components/ChatWindow/ChatWindow';
import { ORDER_CHAT_SOCKET_NAMESPACE } from '@/lib/orderChat/constants';
import { decodeJwtPayloadUnsafe } from '@/lib/orderChat/decodeJwtPayloadUnsafe';
import { getWsOrigin } from '@/lib/orderChat/wsOrigin';
import { readUpstreamJsonErrorMessage } from '@/lib/readUpstreamJsonError';
import type {
  OrderChatApiMessage,
  OrderChatMessagesResponse,
  OrderChatPendingUiAttachment,
  PendingAttachmentRef,
} from '@/lib/orderChat/types';

const PROFILE_AVATAR_PLACEHOLDER = '/images/placeholder.svg';

export type OrderChatVariant = 'account' | 'admin';

let shared: { socket: Socket; token: string } | null = null;

function disposeSharedSocket(): void {
  shared?.socket.disconnect();
  shared = null;
}

function getSharedSocket(token: string): Socket {
  const origin = getWsOrigin();
  const url = `${origin}${ORDER_CHAT_SOCKET_NAMESPACE}`;
  if (shared?.socket && shared.token === token) {
    return shared.socket;
  }
  disposeSharedSocket();
  const socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
    path: '/socket.io',
  });
  shared = { socket, token };
  return socket;
}

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

async function fetchWsToken(variant: OrderChatVariant): Promise<string> {
  const path = variant === 'account' ? '/api/user/ws-token' : '/api/admin/ws-token';
  const res = await fetch(path, { credentials: 'same-origin', cache: 'no-store' });
  if (!res.ok) throw new Error(await readUpstreamJsonErrorMessage(res));
  const j = (await res.json()) as { token?: string };
  if (!j.token?.trim()) throw new Error('Нет токена для чата');
  return j.token.trim();
}

function messagesUrl(variant: OrderChatVariant, orderId: string): string {
  return variant === 'account'
    ? `/api/user/orders/${encodeURIComponent(orderId)}/chat/messages`
    : adminBackendPath(`orders/admin/${encodeURIComponent(orderId)}/chat/messages`);
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

function waitSocketConnect(socket: Socket, ms = 12000): Promise<void> {
  if (socket.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Нет соединения с чатом')), ms);
    socket.once('connect', () => {
      clearTimeout(t);
      resolve();
    });
    socket.once('connect_error', (err: Error) => {
      clearTimeout(t);
      reject(err);
    });
  });
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

  const deletable =
    !deleted && (variant === 'admin' || (variant === 'account' && isMineCustomer));

  const avatarRaw = m.authorAvatarUrl?.trim();
  const senderAvatarUrl = avatarRaw && avatarRaw.length > 0 ? avatarRaw : PROFILE_AVATAR_PLACEHOLDER;

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
  const viewerRef = useRef<string | null>(null);

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

  const reloadMessages = useCallback(async () => {
    if (!orderId) return;
    const res = await fetch(messagesUrl(variant, orderId), {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(await readUpstreamJsonErrorMessage(res));
    const data = (await res.json()) as OrderChatMessagesResponse;
    const viewer = viewerRef.current;
    setMessages((data.messages ?? []).map((m) => mapApiToUi(m, viewer, variant, timeLocale)));
  }, [orderId, variant, timeLocale]);

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
      return undefined;
    }

    let disposed = false;
    let socketRef: Socket | null = null;

    const onCreated = (payload: OrderChatApiMessage) => {
      if (disposed || !payload?.id) return;
      const viewer = viewerRef.current;
      setMessages((prev) => {
        if (prev.some((x) => x.id === payload.id)) return prev;
        return [...prev, mapApiToUi(payload, viewer, variant, timeLocale)];
      });
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

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await fetchWsToken(variant);
        const sub = decodeJwtPayloadUnsafe(token)?.sub ?? null;
        viewerRef.current = sub;

        const res = await fetch(messagesUrl(variant, orderId), {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(await readUpstreamJsonErrorMessage(res));
        const data = (await res.json()) as OrderChatMessagesResponse;
        if (disposed) return;
        const viewer = viewerRef.current;
        setMessages((data.messages ?? []).map((m) => mapApiToUi(m, viewer, variant, timeLocale)));

        await fetch(readUrl(variant, orderId), {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }).catch(() => undefined);

        socketRef = getSharedSocket(token);
        await waitSocketConnect(socketRef);
        if (disposed) return;
        socketRef.emit('join_order_chat', { orderId });
        socketRef.on('message_created', onCreated);
        socketRef.on('message_deleted', onDeleted);
      } catch (e) {
        if (!disposed) {
          setError(e instanceof Error ? e.message : 'Не удалось загрузить чат');
          setMessages([]);
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    })();

    return () => {
      disposed = true;
      if (socketRef) {
        socketRef.off('message_created', onCreated);
        socketRef.off('message_deleted', onDeleted);
        socketRef.emit('leave_order_chat', { orderId });
      }
    };
  }, [enabled, orderId, variant, timeLocale]);

  const sendText = useCallback(
    async (text: string) => {
      if (!orderId) return;
      const body = text.trim();
      const ready = pendingRefs.filter((r) => r.fileUrl?.trim() && !r.uploading);
      if (!body && ready.length === 0) return;

      setSending(true);
      setError(null);
      try {
        const res = await fetch(messagesUrl(variant, orderId), {
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
        }).catch(() => undefined);
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
          if (!res.ok) throw new Error(await readUpstreamJsonErrorMessage(res));
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
    [orderId, variant],
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
  };
}
