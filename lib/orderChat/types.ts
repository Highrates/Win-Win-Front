export type OrderChatApiAttachment = {
  id: string;
  fileUrl: string;
  filename: string;
  mimeType: string | null;
  kind: 'FILE' | 'IMAGE';
};

export type OrderChatApiMessage = {
  id: string;
  conversationId?: string;
  authorUserId: string;
  authorRole: 'CUSTOMER' | 'STAFF';
  authorLabel: string;
  /** URL из профиля автора; как в ЛК — без значения подставляем placeholder */
  authorAvatarUrl?: string | null;
  body: string;
  deletedAt: string | null;
  createdAt: string;
  attachments: OrderChatApiAttachment[];
};

export type OrderChatMessagesResponse = {
  conversationId: string | null;
  messages: OrderChatApiMessage[];
  /** Есть сообщения старее первого элемента `messages`; подгружать блоком через `before`. */
  hasOlder?: boolean;
};

export type PendingAttachmentRef = {
  /** Для сопоставления строки в UI с результатом загрузки */
  clientToken: string;
  /** URL на сторедже после POST …/chat/upload; пусто до успеха */
  fileUrl: string;
  filename: string;
  mimeType: string;
  kind: 'FILE' | 'IMAGE';
  /** Превью сразу после выбора файла (до ответа сервера) */
  localPreviewUrl?: string;
  /** Идёт POST загрузки */
  uploading?: boolean;
};

/** Для полосы превью в ChatWindow (отделено от DTO отправки сообщения). */
export type OrderChatPendingUiAttachment = {
  clientKey: string;
  filename: string;
  kind: 'FILE' | 'IMAGE';
  imageSrc?: string | null;
  uploading?: boolean;
};
