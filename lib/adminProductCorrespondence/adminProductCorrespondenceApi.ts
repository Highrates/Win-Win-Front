import { PRODUCT_QA_MESSAGES_PAGE_DEFAULT } from '@/lib/productQa/constants';
import type { ProductQaAttachmentUpload } from '@/lib/productQa/types';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import type {
  ProductCorrespondenceMessage,
  ProductCorrespondenceMessagesResponse,
  ProductCorrespondenceThread,
} from '@/lib/productCorrespondence/types';

export async function fetchAdminCorrespondenceThreads(
  productId: string,
): Promise<{ items: ProductCorrespondenceThread[] }> {
  return adminBackendJson<{ items: ProductCorrespondenceThread[] }>(
    `catalog/admin/products/${encodeURIComponent(productId)}/correspondence/threads`,
  );
}

export async function fetchAdminCorrespondenceMessages(
  productId: string,
  customerUserId: string,
  opts?: { limit?: number; before?: string },
): Promise<ProductCorrespondenceMessagesResponse> {
  const sp = new URLSearchParams();
  sp.set('customerUserId', customerUserId);
  sp.set('limit', String(opts?.limit ?? PRODUCT_QA_MESSAGES_PAGE_DEFAULT));
  if (opts?.before?.trim()) sp.set('before', opts.before.trim());
  return adminBackendJson<ProductCorrespondenceMessagesResponse>(
    `catalog/admin/products/${encodeURIComponent(productId)}/correspondence/messages?${sp.toString()}`,
  );
}

export async function postAdminCorrespondenceReply(
  productId: string,
  body: {
    customerUserId: string;
    body: string;
    productVariantId?: string;
    topicSlug?: string;
    attachments?: ProductQaAttachmentUpload[];
  },
): Promise<ProductCorrespondenceMessage> {
  return adminBackendJson<ProductCorrespondenceMessage>(
    `catalog/admin/products/${encodeURIComponent(productId)}/correspondence/messages`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export async function publishAdminCorrespondenceToQa(
  productId: string,
  messageId: string,
  body?: { topicSlug?: string },
): Promise<ProductCorrespondenceMessage> {
  return adminBackendJson<ProductCorrespondenceMessage>(
    `catalog/admin/products/${encodeURIComponent(productId)}/correspondence/messages/${encodeURIComponent(messageId)}/publish-to-qa`,
    {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    },
  );
}

export async function publishAdminCorrespondencePairToQa(
  productId: string,
  body: { questionMessageId: string; answerMessageId: string; topicSlug?: string },
): Promise<{ question: ProductCorrespondenceMessage; answer: ProductCorrespondenceMessage }> {
  return adminBackendJson(
    `catalog/admin/products/${encodeURIComponent(productId)}/correspondence/publish-pair-to-qa`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export async function patchAdminCorrespondenceMessageBody(
  productId: string,
  customerUserId: string,
  messageId: string,
  body: string,
): Promise<ProductCorrespondenceMessage> {
  return adminBackendJson<ProductCorrespondenceMessage>(
    `catalog/admin/products/${encodeURIComponent(productId)}/correspondence/messages/${encodeURIComponent(messageId)}?customerUserId=${encodeURIComponent(customerUserId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ body }),
    },
  );
}

export type ProductCorrespondenceMessageRevision = {
  id: string;
  body: string;
  editedByUserId: string;
  editedByLabel: string;
  createdAt: string;
};

export async function fetchAdminCorrespondenceMessageRevisions(
  productId: string,
  customerUserId: string,
  messageId: string,
): Promise<{ items: ProductCorrespondenceMessageRevision[] }> {
  return adminBackendJson<{ items: ProductCorrespondenceMessageRevision[] }>(
    `catalog/admin/products/${encodeURIComponent(productId)}/correspondence/messages/${encodeURIComponent(messageId)}/revisions?customerUserId=${encodeURIComponent(customerUserId)}`,
  );
}
