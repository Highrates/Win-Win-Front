import { PRODUCT_QA_MESSAGES_PAGE_DEFAULT } from './constants';
import type {
  ProductQaAttachmentUpload,
  ProductQaMessagesResponse,
  ProductQaMeta,
  ProductQaPostPayload,
  ProductQaTopic,
} from './types';

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T;
  if (!res.ok) {
    const msg =
      typeof data === 'object' &&
      data != null &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function fetchProductQaMeta(slug: string): Promise<ProductQaMeta> {
  const res = await fetch(`/api/public/catalog/products/${encodeURIComponent(slug)}/qa/meta`, {
    cache: 'no-store',
  });
  return parseJson<ProductQaMeta>(res);
}

export async function fetchProductQaTopics(slug: string): Promise<{ topics: ProductQaTopic[] }> {
  const res = await fetch(`/api/public/catalog/products/${encodeURIComponent(slug)}/qa/topics`, {
    cache: 'no-store',
  });
  return parseJson<{ topics: ProductQaTopic[] }>(res);
}

export async function fetchProductQaMessages(
  slug: string,
  opts?: { limit?: number; before?: string; topicSlug?: string },
): Promise<ProductQaMessagesResponse> {
  const sp = new URLSearchParams();
  sp.set('limit', String(opts?.limit ?? PRODUCT_QA_MESSAGES_PAGE_DEFAULT));
  if (opts?.before?.trim()) sp.set('before', opts.before.trim());
  if (opts?.topicSlug?.trim()) sp.set('topic', opts.topicSlug.trim());
  const res = await fetch(
    `/api/public/catalog/products/${encodeURIComponent(slug)}/qa/messages?${sp.toString()}`,
    { cache: 'no-store', credentials: 'include' },
  );
  return parseJson<ProductQaMessagesResponse>(res);
}

export async function uploadProductQaAttachment(
  slug: string,
  file: File,
): Promise<ProductQaAttachmentUpload> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`/api/user/catalog/products/${encodeURIComponent(slug)}/qa/upload`, {
    method: 'POST',
    body: fd,
  });
  return parseJson<ProductQaAttachmentUpload>(res);
}

export async function revokeProductQaAttachment(slug: string, url: string): Promise<void> {
  const res = await fetch(`/api/user/catalog/products/${encodeURIComponent(slug)}/qa/upload`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ url }),
  });
  await parseJson(res);
}

export async function postProductQaMessage(
  slug: string,
  payload: ProductQaPostPayload,
): Promise<unknown> {
  const res = await fetch(`/api/user/catalog/products/${encodeURIComponent(slug)}/qa/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}
