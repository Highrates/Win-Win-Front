export type ProductCorrespondenceAttachment = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  kind: 'IMAGE' | 'FILE';
};

export type ProductCorrespondenceMessage = {
  id: string;
  correspondenceId: string;
  authorUserId: string;
  authorRole: 'USER' | 'STAFF';
  authorLabel: string;
  authorAvatarUrl: string | null;
  body: string;
  productVariantId: string | null;
  variantLabel: string | null;
  publishedQaMessageId: string | null;
  isPublishedToStorefront: boolean;
  attachments: ProductCorrespondenceAttachment[];
  createdAt: string;
  editedAt: string | null;
};

export type ProductCorrespondenceMessagesResponse = {
  correspondenceId: string | null;
  productId: string;
  customerUserId: string;
  messages: ProductCorrespondenceMessage[];
  hasOlder: boolean;
};

export type ProductCorrespondencePostPayload = {
  body?: string;
  productVariantId?: string;
  attachments?: Array<{
    url: string;
    filename: string;
    mimeType: string;
    kind: 'IMAGE' | 'FILE';
  }>;
  turnstileToken?: string;
  customerUserId?: string;
  topicSlug?: string;
};

export type ProductCorrespondenceMyProductItem = {
  productId: string;
  productSlug: string;
  productName: string;
  productImageUrl: string | null;
  isProductActive: boolean;
  lastMessageAt: string;
  lastMessagePreview: string;
  hasStaffReply: boolean;
  /** Последнее сообщение — от покупателя; ждём ответ staff. */
  awaitingStaffReply: boolean;
};

export type ProductCorrespondenceMyProductsResponse = {
  items: ProductCorrespondenceMyProductItem[];
};

export type ProductCorrespondenceThread = {
  correspondenceId: string;
  customerUserId: string;
  customerLabel: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unpublishedCount: number;
};
