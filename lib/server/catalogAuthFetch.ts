import 'server-only';

import type { CatalogFilterOptions } from '@/lib/catalog/catalogProductFilters';
import { EMPTY_CATALOG_FILTER_OPTIONS } from '@/lib/catalog/catalogProductFilters';
import type {
  CatalogProductSearchResponse,
  PublicCollectionsAndSetsPayload,
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
  tag?: string;
  page?: number;
  limit?: number;
  sort?: string;
  priceFrom?: number;
  priceTo?: number;
  brandId?: string;
  widthFrom?: number;
  widthTo?: number;
  heightFrom?: number;
  heightTo?: number;
  materialId?: string;
  hasCase?: boolean;
  has3d?: boolean;
  hasDrawing?: boolean;
}): Promise<CatalogProductSearchResponse> {
  const base = getServerApiBase();
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(Math.max(1, params.limit ?? 20), 100);
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (params.categoryId?.trim()) qs.set('categoryId', params.categoryId.trim());
  if (params.tag?.trim()) qs.set('tag', params.tag.trim());
  if (params.sort?.trim()) qs.set('sort', params.sort.trim());
  if (params.priceFrom != null && Number.isFinite(params.priceFrom)) {
    qs.set('priceFrom', String(Math.floor(params.priceFrom)));
  }
  if (params.priceTo != null && Number.isFinite(params.priceTo)) {
    qs.set('priceTo', String(Math.floor(params.priceTo)));
  }
  if (params.brandId?.trim()) qs.set('brandId', params.brandId.trim());
  if (params.widthFrom != null && Number.isFinite(params.widthFrom)) {
    qs.set('widthFrom', String(Math.floor(params.widthFrom)));
  }
  if (params.widthTo != null && Number.isFinite(params.widthTo)) {
    qs.set('widthTo', String(Math.floor(params.widthTo)));
  }
  if (params.heightFrom != null && Number.isFinite(params.heightFrom)) {
    qs.set('heightFrom', String(Math.floor(params.heightFrom)));
  }
  if (params.heightTo != null && Number.isFinite(params.heightTo)) {
    qs.set('heightTo', String(Math.floor(params.heightTo)));
  }
  if (params.materialId?.trim()) qs.set('materialId', params.materialId.trim());
  if (params.hasCase) qs.set('hasCase', '1');
  if (params.has3d) qs.set('has3d', '1');
  if (params.hasDrawing) qs.set('hasDrawing', '1');
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

export async function fetchProductFilterOptions(params: {
  categoryId?: string;
  tag?: string;
  priceFrom?: number;
  priceTo?: number;
  brandId?: string;
  materialId?: string;
  widthFrom?: number;
  widthTo?: number;
  heightFrom?: number;
  heightTo?: number;
  hasCase?: boolean;
  has3d?: boolean;
  hasDrawing?: boolean;
}): Promise<CatalogFilterOptions> {
  const base = getServerApiBase();
  const qs = new URLSearchParams();
  if (params.categoryId?.trim()) qs.set('categoryId', params.categoryId.trim());
  if (params.tag?.trim()) qs.set('tag', params.tag.trim());
  if (params.priceFrom != null && Number.isFinite(params.priceFrom)) {
    qs.set('priceFrom', String(Math.floor(params.priceFrom)));
  }
  if (params.priceTo != null && Number.isFinite(params.priceTo)) {
    qs.set('priceTo', String(Math.floor(params.priceTo)));
  }
  if (params.brandId?.trim()) qs.set('brandId', params.brandId.trim());
  if (params.materialId?.trim()) qs.set('materialId', params.materialId.trim());
  if (params.widthFrom != null && Number.isFinite(params.widthFrom)) {
    qs.set('widthFrom', String(Math.floor(params.widthFrom)));
  }
  if (params.widthTo != null && Number.isFinite(params.widthTo)) {
    qs.set('widthTo', String(Math.floor(params.widthTo)));
  }
  if (params.heightFrom != null && Number.isFinite(params.heightFrom)) {
    qs.set('heightFrom', String(Math.floor(params.heightFrom)));
  }
  if (params.heightTo != null && Number.isFinite(params.heightTo)) {
    qs.set('heightTo', String(Math.floor(params.heightTo)));
  }
  if (params.hasCase) qs.set('hasCase', '1');
  if (params.has3d) qs.set('has3d', '1');
  if (params.hasDrawing) qs.set('hasDrawing', '1');
  try {
    const res = await fetch(
      `${base}/catalog/products/filter-options?${qs}`,
      await publicFetchInitWithOptionalUserAuth(),
    );
    if (!res.ok) return { ...EMPTY_CATALOG_FILTER_OPTIONS };
    const data = await jsonFromResponse<CatalogFilterOptions>(res, EMPTY_CATALOG_FILTER_OPTIONS);
    return {
      materials: Array.isArray(data.materials) ? data.materials : [],
      brands: Array.isArray(data.brands) ? data.brands : [],
    };
  } catch {
    return { ...EMPTY_CATALOG_FILTER_OPTIONS };
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
    return {
      ...data,
      coverImageUrl: data.coverImageUrl ?? null,
      products: dedupeById(data.products),
    };
  } catch {
    return null;
  }
}

/** `GET /catalog/collections-and-sets` — все активные коллекции и наборы без лимита. */
export async function fetchPublicCollectionsAndSets(): Promise<PublicCollectionsAndSetsPayload> {
  const base = getServerApiBase();
  try {
    const res = await fetch(
      `${base}/catalog/collections-and-sets`,
      await publicFetchInitWithOptionalUserAuth(),
    );
    if (!res.ok) return { items: [] };
    const data = await jsonFromResponse<PublicCollectionsAndSetsPayload>(res, { items: [] });
    const items = Array.isArray(data.items) ? data.items : [];
    return {
      items: items
        .filter((s) => s && (s.kind === 'collection' || s.kind === 'set') && Array.isArray(s.products))
        .map((s) => ({
          kind: s.kind,
          slug: s.slug,
          name: s.name,
          products: dedupeById(s.products),
        })),
    };
  } catch {
    return { items: [] };
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
