/** Совпадает с Nest `ORDER_CHAT_SOCKET_NAMESPACE` */
export const ORDER_CHAT_SOCKET_NAMESPACE = '/order-chat';

/** Совпадает с `CHAT_MESSAGES_PAGE_DEFAULT` на бэке: размер хвоста и одной порции «раньше». */
export const CHAT_MESSAGES_PAGE_DEFAULT = 50;

export type OrderChatVariant = 'account' | 'admin';

/** Синхрон с Nest `ORDER_CHAT_ATTACHMENTS_MAX` / `ORDER_CHAT_POST_BODY_MAX_CHARS`. */
export const ORDER_CHAT_POST_BODY_MAX_CHARS = 12000;
/** Одно сообщение: лимит вложений-слов в JSON после upload. Должен совпадать с `@ArrayMaxSize` в dto. */
export const ORDER_CHAT_ATTACHMENTS_MAX = 12;
/** Суммарная длина строк fileUrl + filename + mimeType по всем вложениям (защита от раздувания JSON). */
export const ORDER_CHAT_ATTACHMENT_REFS_PAYLOAD_MAX_CHARS = 65536;
/** Файл в multipart upload чата (раньше 100 МБ). */
export const ORDER_CHAT_UPLOAD_MAX_FILE_BYTES = 35 * 1024 * 1024;

/** Синхрон с Nest `ORDER_CHAT_DELETE_WITHIN_MS`: окно, в которое доступно удаление сообщения. */
export const ORDER_CHAT_DELETE_WITHIN_MS = 24 * 60 * 60 * 1000;

/** Обновить сокет до истечения access JWT (секунды в `exp`), чтобы не «неметь» на долгой вкладке. */
export const ORDER_CHAT_WS_REFRESH_BUFFER_MS = 45_000;
/** Если в токене нет `exp`, периодически пересобираем сокет. */
export const ORDER_CHAT_WS_REFRESH_FALLBACK_MS = 20 * 60_000;

/** `CustomEvent` после пересоздания Socket.IO (detail: `{ variant, socket }`). */
export const ORDER_CHAT_SOCKET_UPDATED_EVENT = 'order-chat-ws-socket-updated';

export function isOrderChatMessageWithinDeleteWindow(
  createdAtIso: string,
  nowMs: number = Date.now(),
): boolean {
  const t = Date.parse(createdAtIso);
  if (Number.isNaN(t)) return false;
  return nowMs - t <= ORDER_CHAT_DELETE_WITHIN_MS;
}
