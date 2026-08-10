import type {
  ProductQaAttachmentUpload,
  ProductQaMessage,
  ProductQaMessagesResponse,
  ProductQaTopic,
} from '@/lib/productQa/types';
import {
  ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT,
  ADMIN_PRODUCT_QA_UNREAD_REFRESH_EVENT,
} from '@/lib/productQa/constants';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { PRODUCT_QA_MESSAGES_PAGE_DEFAULT } from '@/lib/productQa/constants';

export type { ProductQaMessage, ProductQaTopic };

export async function fetchAdminProductQaTopics(
  productId: string,
): Promise<{ topics: ProductQaTopic[] }> {
  return adminBackendJson<{ topics: ProductQaTopic[] }>(
    `catalog/admin/products/${encodeURIComponent(productId)}/qa/topics`,
  );
}

export async function createAdminProductQaTopic(
  productId: string,
  body: { title: string; slug?: string },
): Promise<ProductQaTopic> {
  return adminBackendJson<ProductQaTopic>(
    `catalog/admin/products/${encodeURIComponent(productId)}/qa/topics`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export async function patchAdminProductQaTopic(
  productId: string,
  topicId: string,
  body: { title?: string; sortOrder?: number },
): Promise<ProductQaTopic> {
  return adminBackendJson<ProductQaTopic>(
    `catalog/admin/products/${encodeURIComponent(productId)}/qa/topics/${encodeURIComponent(topicId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
}

export async function fetchAdminProductQaMessages(
  productId: string,
  opts?: { limit?: number; before?: string; topicSlug?: string; status?: ProductQaMessage['status'] },
): Promise<ProductQaMessagesResponse> {
  const sp = new URLSearchParams();
  sp.set('limit', String(opts?.limit ?? PRODUCT_QA_MESSAGES_PAGE_DEFAULT));
  if (opts?.before?.trim()) sp.set('before', opts.before.trim());
  if (opts?.topicSlug?.trim()) sp.set('topic', opts.topicSlug.trim());
  if (opts?.status) sp.set('status', opts.status);
  const qs = sp.toString();
  return adminBackendJson<ProductQaMessagesResponse>(
    `catalog/admin/products/${encodeURIComponent(productId)}/qa/messages?${qs}`,
  );
}

export async function uploadAdminProductQaAttachment(
  productId: string,
  file: File,
): Promise<ProductQaAttachmentUpload> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`/api/admin/backend/catalog/admin/products/${encodeURIComponent(productId)}/qa/upload`, {
    method: 'POST',
    body: fd,
  });
  const data = (await res.json()) as ProductQaAttachmentUpload & { message?: string };
  if (!res.ok) {
    throw new Error(typeof data.message === 'string' ? data.message : `HTTP ${res.status}`);
  }
  return data;
}

export async function revokeAdminProductQaAttachment(
  productId: string,
  url: string,
): Promise<void> {
  await adminBackendJson(
    `catalog/admin/products/${encodeURIComponent(productId)}/qa/upload`,
    {
      method: 'DELETE',
      body: JSON.stringify({ url }),
    },
  );
}

export async function postAdminProductQaReply(
  productId: string,
  body: { body: string; productVariantId?: string; topicSlug?: string; attachments?: ProductQaAttachmentUpload[] },
): Promise<ProductQaMessage> {
  return adminBackendJson<ProductQaMessage>(
    `catalog/admin/products/${encodeURIComponent(productId)}/qa/messages`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export async function patchAdminProductQaMessageStatus(
  productId: string,
  messageId: string,
  status: 'VISIBLE' | 'HIDDEN',
): Promise<ProductQaMessage> {
  return adminBackendJson<ProductQaMessage>(
    `catalog/admin/products/${encodeURIComponent(productId)}/qa/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  );
}

export async function patchAdminProductQaMessageBody(
  productId: string,
  messageId: string,
  body: string,
): Promise<ProductQaMessage> {
  return adminBackendJson<ProductQaMessage>(
    `catalog/admin/products/${encodeURIComponent(productId)}/qa/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ body }),
    },
  );
}

export type ProductQaMessageRevision = {
  id: string;
  body: string;
  editedByUserId: string;
  editedByLabel: string;
  createdAt: string;
};

export async function fetchAdminProductQaMessageRevisions(
  productId: string,
  messageId: string,
): Promise<{ items: ProductQaMessageRevision[] }> {
  return adminBackendJson<{ items: ProductQaMessageRevision[] }>(
    `catalog/admin/products/${encodeURIComponent(productId)}/qa/messages/${encodeURIComponent(messageId)}/revisions`,
  );
}

export async function approveAdminProductQaMessage(
  productId: string,
  messageId: string,
): Promise<ProductQaMessage> {
  return adminBackendJson<ProductQaMessage>(
    `catalog/admin/products/${encodeURIComponent(productId)}/qa/messages/${encodeURIComponent(messageId)}/approve`,
    { method: 'POST' },
  );
}

export async function rejectAdminProductQaMessage(
  productId: string,
  messageId: string,
): Promise<ProductQaMessage> {
  return adminBackendJson<ProductQaMessage>(
    `catalog/admin/products/${encodeURIComponent(productId)}/qa/messages/${encodeURIComponent(messageId)}/reject`,
    { method: 'POST' },
  );
}

export async function deleteAdminProductQaMessage(
  productId: string,
  messageId: string,
): Promise<ProductQaMessage> {
  return adminBackendJson<ProductQaMessage>(
    `catalog/admin/products/${encodeURIComponent(productId)}/qa/messages/${encodeURIComponent(messageId)}/delete`,
    { method: 'POST' },
  );
}

export async function markAdminProductQaSeen(productId: string): Promise<void> {
  await adminBackendJson<{ ok: true }>(
    `catalog/admin/products/${encodeURIComponent(productId)}/qa/mark-seen`,
    { method: 'POST' },
  );
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new Event(ADMIN_PRODUCT_QA_UNREAD_REFRESH_EVENT));
    document.dispatchEvent(new Event(ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT));
  }
}

export type ProductQaChatProductItem = {
  productId: string;
  productSlug: string;
  productName: string;
  productImageUrl: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
  publicQaPending: number;
  correspondenceAwaitingPublish: number;
  awaitingStaffReply: boolean;
};

export type ProductQaChatProductsList = {
  items: ProductQaChatProductItem[];
  hasMore: boolean;
  nextCursor: string | null;
};

export async function fetchAdminProductQaChatProducts(opts?: {
  limit?: number;
  cursor?: string;
}): Promise<ProductQaChatProductsList> {
  const params = new URLSearchParams();
  if (opts?.limit != null) params.set('limit', String(opts.limit));
  if (opts?.cursor?.trim()) params.set('cursor', opts.cursor.trim());
  const qs = params.toString();
  return adminBackendJson<ProductQaChatProductsList>(
    `catalog/admin/qa/chat-products${qs ? `?${qs}` : ''}`,
  );
}

export type ProductQaPendingSummary = {
  total: number;
  publicQaPending: number;
  correspondenceAwaitingPublish: number;
  byProduct: Array<{
    productId: string;
    productSlug: string;
    productName: string;
    publicQaPending: number;
    correspondenceAwaitingPublish: number;
  }>;
};

export async function fetchAdminProductQaPendingSummary(): Promise<ProductQaPendingSummary> {
  return adminBackendJson<ProductQaPendingSummary>('catalog/admin/qa/pending-summary');
}
