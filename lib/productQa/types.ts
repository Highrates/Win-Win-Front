export type ProductQaAuthorRole = 'USER' | 'STAFF';

export type ProductQaMessageStatus = 'PENDING' | 'VISIBLE' | 'HIDDEN' | 'REJECTED' | 'DELETED';

export type ProductQaAttachmentKind = 'IMAGE' | 'FILE';

export type ProductQaAttachment = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  kind: ProductQaAttachmentKind;
};

export type ProductQaTopic = {
  id: string;
  slug: string;
  title: string;
  messageCount: number;
  isDefault: boolean;
  sortOrder: number;
};

export type ProductQaMessage = {
  id: string;
  threadId: string;
  topicSlug: string;
  topicTitle: string;
  authorUserId: string;
  authorRole: ProductQaAuthorRole;
  authorLabel: string;
  authorAvatarUrl: string | null;
  body: string;
  productVariantId: string | null;
  variantLabel: string | null;
  status: ProductQaMessageStatus;
  replyToMessageId?: string | null;
  replyToPreview?: string | null;
  attachments: ProductQaAttachment[];
  createdAt: string;
  editedAt: string | null;
};

export type ProductQaMeta = {
  threadId: string | null;
  messageCount: number;
  topics: ProductQaTopic[];
  preModerationEnabled?: boolean;
};

export type ProductQaMessagesResponse = {
  threadId: string | null;
  topicSlug: string;
  messages: ProductQaMessage[];
  hasOlder: boolean;
};

export type ProductQaAttachmentUpload = {
  url: string;
  filename: string;
  mimeType: string;
  kind: ProductQaAttachmentKind;
};

export type ProductQaPostPayload = {
  body: string;
  productVariantId?: string | null;
  topicSlug?: string;
  attachments?: ProductQaAttachmentUpload[];
  turnstileToken?: string;
};
