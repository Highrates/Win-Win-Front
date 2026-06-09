import 'server-only';

import type {
  CatalogProductSearchResponse,
  PublicProductCollectionPayload,
  PublicSetSiblingProduct,
} from '@/lib/catalogPublic';
import { dedupeById } from '@/lib/dedupeById';
import { jsonFromResponse } from '@/lib/jsonFromResponse';
import { getServerApiBase } from '@/lib/serverApiBase';
import { publicFetchInitWithOptionalUserAuth } from '@/lib/server/publicFetchInit';

/** PDP: `GET /catalog/products/:slug` с tier-ценами при валидной сессии. */
export async function fetchPublicProductBySlug(
  slug: string,
  options?: { vs?: string; v?: string; sz?: string },
): Promise<unknown | null> {
  const base = getServerApiBase();
  const sp = new URLSearchParams();
  if (options?.vs?.trim()) sp.set('vs', options.vs.trim());
  if (options?.v?.trim()) sp.set('v', options.v.trim());
  if (options?.sz?.trim()) sp.set('sz', options.sz.trim());
  const qs = sp.toString();
  const url = `${base}/catalog/products/${encodeURIComponent(slug)}${qs ? `?${qs}` : ''}`;
  try {
    const res = await fetch(url, await publicFetchInitWithOptionalUserAuth());
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchProductsSearch(params: {
  categoryId?: string;
  page?: number;
  limit?: number;
}): Promise<CatalogProductSearchResponse> {
  const base = getServerApiBase();
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(Math.max(1, params.limit ?? 20), 100);
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (params.categoryId?.trim()) qs.set('categoryId', params.categoryId.trim());
  try {
    const res = await fetch(
      `${base}/catalog/products/search?${qs}`,
      await publicFetchInitWithOptionalUserAuth(),
    );
    if (!res.ok) {
      return { hits: [], total: 0, page, limit };
    }
    return await jsonFromResponse<CatalogProductSearchResponse>(res, {
      hits: [],
      total: 0,
      page,
      limit,
    });
  } catch {
    return { hits: [], total: 0, page, limit };
  }
}

export async function fetchCuratedProductCollectionBySlug(
  slug: string,
): Promise<PublicProductCollectionPayload | null> {
  const base = getServerApiBase();
  try {
    const res = await fetch(
      `${base}/catalog/curated-collections/${encodeURIComponent(slug)}`,
      await publicFetchInitWithOptionalUserAuth(),
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await jsonFromResponse<PublicProductCollectionPayload | null>(res, null);
    if (!data || data.kind !== 'PRODUCT' || !Array.isArray(data.products)) return null;
    return { ...data, products: dedupeById(data.products) };
  } catch {
    return null;
  }
}

export async function fetchProductSetSiblingsBySlug(
  slug: string,
): Promise<{ items: PublicSetSiblingProduct[] }> {
  const base = getServerApiBase();
  try {
    const res = await fetch(
      `${base}/catalog/products/${encodeURIComponent(slug)}/set-siblings`,
      await publicFetchInitWithOptionalUserAuth(),
    );
    if (!res.ok) return { items: [] };
    return await jsonFromResponse<{ items: PublicSetSiblingProduct[] }>(res, { items: [] });
  } catch {
    return { items: [] };
  }
}
