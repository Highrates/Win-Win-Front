import { PRODUCT_QA_MESSAGES_PAGE_DEFAULT } from '@/lib/productQa/constants';
import type {
  ProductCorrespondenceMessagesResponse,
  ProductCorrespondenceMyProductsResponse,
  ProductCorrespondencePostPayload,
  ProductCorrespondenceMessage,
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

export async function fetchMyCorrespondenceProducts(): Promise<ProductCorrespondenceMyProductsResponse> {
  const res = await fetch('/api/user/catalog/me/correspondence/products', {
    credentials: 'include',
    cache: 'no-store',
  });
  return parseJson<ProductCorrespondenceMyProductsResponse>(res);
}

export async function fetchProductCorrespondenceMessages(
  slug: string,
  opts?: { limit?: number; before?: string },
): Promise<ProductCorrespondenceMessagesResponse> {
  const sp = new URLSearchParams();
  sp.set('limit', String(opts?.limit ?? PRODUCT_QA_MESSAGES_PAGE_DEFAULT));
  if (opts?.before?.trim()) sp.set('before', opts.before.trim());
  const res = await fetch(
    `/api/user/catalog/products/${encodeURIComponent(slug)}/correspondence/messages?${sp.toString()}`,
    { cache: 'no-store', credentials: 'include' },
  );
  return parseJson<ProductCorrespondenceMessagesResponse>(res);
}

export async function postProductCorrespondenceMessage(
  slug: string,
  payload: ProductCorrespondencePostPayload,
): Promise<ProductCorrespondenceMessage> {
  const res = await fetch(
    `/api/user/catalog/products/${encodeURIComponent(slug)}/correspondence/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    },
  );
  return parseJson<ProductCorrespondenceMessage>(res);
}

export async function patchProductCorrespondenceMessage(
  slug: string,
  messageId: string,
  body: string,
): Promise<ProductCorrespondenceMessage> {
  const res = await fetch(
    `/api/user/catalog/products/${encodeURIComponent(slug)}/correspondence/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ body }),
    },
  );
  return parseJson(res);
}
