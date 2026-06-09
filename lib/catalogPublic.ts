import type { PublicBrandProductRow } from './brandsPublic';
import { CATALOG_PUBLIC_TAG, catalogPublicFetchNext } from './catalogCache';
import { dedupeById } from './dedupeById';
import { jsonFromResponse } from './jsonFromResponse';
import { getServerApiBase } from './serverApiBase';
/** `GET /catalog/categories/tree` */
export type PublicCategoryTreeChild = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  backgroundImageUrl: string | null;
  children?: PublicCategoryTreeChild[];
};

export type PublicCategoryTreeRoot = PublicCategoryTreeChild & {
  children: PublicCategoryTreeChild[];
};

export type CatalogCategoryBySlugApi = {
  id: string;
  slug: string;
  name: string;
  parentId?: string | null;
  sortOrder: number;
  backgroundImageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  parent: { id: string; slug: string; name: string } | null;
  children: Array<{
    id: string;
    slug: string;
    name: string;
    sortOrder: number;
    backgroundImageUrl?: string | null;
  }>;
  _count?: { products: number };
};

export async function fetchCategoryTree(): Promise<{ roots: PublicCategoryTreeRoot[] }> {
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/catalog/categories/tree`, { next: catalogPublicFetchNext() });
    if (!res.ok) return { roots: [] };
    return await jsonFromResponse(res, { roots: [] as PublicCategoryTreeRoot[] });
  } catch {
    return { roots: [] };
  }
}

/** `GET /catalog/categories/roots` — только корни для меню. */
export async function fetchPublicRootCategoriesForNav(): Promise<{ slug: string; name: string }[]> {
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/catalog/categories/roots`, { next: catalogPublicFetchNext() });
    if (!res.ok) return [];
    const data = await jsonFromResponse<{ items: { slug: string; name: string; sortOrder: number }[] }>(
      res,
      { items: [] },
    );
    return data.items.map(({ slug, name }) => ({ slug, name }));
  } catch {
    return [];
  }
}

export type CategoryChildrenPayload = {
  parent: { slug: string; name: string };
  children: PublicCategoryTreeChild[];
};

/** `GET /catalog/categories/:parentSlug/children` */
export async function fetchCategoryChildrenByParentSlug(
  parentSlug: string,
): Promise<CategoryChildrenPayload | null> {
  const base = getServerApiBase();
  try {
    const res = await fetch(
      `${base}/catalog/categories/${encodeURIComponent(parentSlug)}/children`,
      { next: catalogPublicFetchNext() },
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return await jsonFromResponse<CategoryChildrenPayload | null>(res, null);
  } catch {
    return null;
  }
}

export async function fetchCategoryBySlug(
  slug: string
): Promise<CatalogCategoryBySlugApi | null> {
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/catalog/categories/${encodeURIComponent(slug)}`, {
      next: catalogPublicFetchNext(),
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return await jsonFromResponse<CatalogCategoryBySlugApi | null>(res, null);
  } catch {
    return null;
  }
}

/** Элемент выдачи `GET /catalog/products/search` (Meilisearch или Prisma). */
export type CatalogProductSearchHit = {
  /** id товара */
  id: string;
  slug: string;
  name: string;
  price?: number;
  priceMin?: number;
  priceMax?: number;
  thumbUrl?: string | null;
  /** До 6 URL для мини-галереи в карточке (после реиндекса Meilisearch / актуального API). */
  imageUrls?: string[];
  /** Кейсы партнёров с этим товаром (Meilisearch / Prisma). */
  casesLinkedCount?: number;
  /** Публичный счётчик лайков (реальные + админ). */
  likesDisplayCount?: number;
  /** Только при SSR/запросе с Bearer: лайкнул ли текущий пользователь. */
  likedByMe?: boolean;
};

export type CatalogProductSearchResponse = {
  hits: CatalogProductSearchHit[];
  total: number;
  page: number;
  limit: number;
};

/** `GET /catalog/curated-collections/:slug` — коллекция брендов для витрины. */
export type PublicBrandCollectionBrand = {
  slug: string;
  name: string;
  logoUrl: string | null;
  shortDescription: string | null;
  galleryMain: string | null;
  gallerySide1: string | null;
  gallerySide2: string | null;
};

export type PublicBrandCollectionPayload = {
  slug: string;
  name: string;
  kind: 'BRAND';
  brands: PublicBrandCollectionBrand[];
};

export async function fetchCuratedBrandCollectionBySlug(
  slug: string,
): Promise<PublicBrandCollectionPayload | null> {
  const base = getServerApiBase();
  try {
    const res = await fetch(
      `${base}/catalog/curated-collections/${encodeURIComponent(slug)}`,
      { next: catalogPublicFetchNext() },
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await jsonFromResponse<
      (PublicBrandCollectionPayload | PublicProductCollectionPayload) | null
    >(res, null);
    if (!data || data.kind !== 'BRAND') return null;
    return data;
  } catch {
    return null;
  }
}

/** Тот же эндпоинт `GET /catalog/curated-collections/:slug`, ответ при `kind: PRODUCT`. */
export type PublicProductCollectionPayload = {
  slug: string;
  name: string;
  kind: 'PRODUCT';
  products: PublicBrandProductRow[];
};

/** `GET /catalog/products/:slug/set-siblings` — соседи по кураторским наборам. */
export type PublicSetSiblingProduct = {
  productId: string;
  /** id варианта по умолчанию (для `?v=` на карточке) */
  id: string;
  slug: string;
  name: string;
  price: unknown;
  thumbUrl: string | null;
  imageUrls: string[];
  likedByMe?: boolean;
};

