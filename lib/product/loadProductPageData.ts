import 'server-only';

import { cache } from 'react';
import { fetchPublicProductBySlug, fetchProductSetSiblingsBySlug } from '@/lib/server/catalogAuthFetch';
import { parsePublicProduct } from '@/lib/publicProductFromApi';
import type { PublicProductFromApi } from '@/lib/publicProductFromApi';
import type { PublicSetSiblingProduct } from '@/lib/catalogPublic';

export type ProductPageQuery = {
  v?: string;
  vs?: string;
  m?: string;
};

export type ProductCoreData = {
  slug: string;
  query: ProductPageQuery;
  product: PublicProductFromApi;
};

async function loadProductCoreDataUncached(
  slug: string,
  query: ProductPageQuery,
): Promise<ProductCoreData | null> {
  const raw = await fetchPublicProductBySlug(slug, { v: query.v, vs: query.vs });
  const product = parsePublicProduct(raw);
  if (!product) return null;
  return { slug, query, product };
}

/** Товар PDP — один fetch на request (page + generateMetadata). */
export const loadProductCoreData = cache(loadProductCoreDataUncached);

async function loadProductSetSiblingsUncached(slug: string): Promise<PublicSetSiblingProduct[]> {
  const siblingsRes = await fetchProductSetSiblingsBySlug(slug);
  return siblingsRes.items;
}

/** Наборы (set-siblings) — отдельный fetch для streaming ниже fold. */
export const loadProductSetSiblings = cache(loadProductSetSiblingsUncached);
