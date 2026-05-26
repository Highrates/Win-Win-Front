import type { CatalogProductSearchHit } from '@/lib/catalogPublic';
import type { PublicBrandProductRow } from '@/lib/brandsPublic';
import { productPriceToNumber } from '@/lib/productPrice';
import { parseProductPriceFromApi } from '@/lib/productSpecsFromApi';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import type { RecommendationsStaticItem } from '@/sections/home/Recommendations/recommendationsStaticItem';

/** Единая модель карточки для сеток с page-level лайками. */
export type ProductGridItem = {
  key: string;
  slug: string;
  name: string;
  productId: string;
  price: number;
  priceMin?: number;
  priceMax?: number;
  variantId?: string;
  imageUrl?: string;
  imageUrls?: string[];
  collections?: number;
  likes?: number;
  likedByMe?: boolean;
};

export function productGridItemsHaveSsrLikes(items: ProductGridItem[]): boolean {
  return items.length > 0 && items.every((i) => typeof i.likedByMe === 'boolean');
}

export function catalogHitToProductGridItem(hit: CatalogProductSearchHit): ProductGridItem | null {
  if (!hit.id?.trim()) return null;
  const thumb =
    typeof hit.thumbUrl === 'string' && hit.thumbUrl.trim()
      ? resolveMediaUrlForServer(hit.thumbUrl)
      : undefined;
  const rawGallery =
    Array.isArray(hit.imageUrls) && hit.imageUrls.length > 0
      ? hit.imageUrls.filter((u): u is string => typeof u === 'string' && Boolean(u.trim()))
      : [];
  const galleryResolved = Array.from(new Set(rawGallery.map((u) => u.trim()))).map((u) =>
    resolveMediaUrlForServer(u),
  );
  const useGallery = galleryResolved.length > 1;
  return {
    key: hit.id,
    slug: hit.slug,
    name: hit.name,
    productId: hit.id,
    price: parseProductPriceFromApi(hit.price),
    priceMin: parseProductPriceFromApi(hit.priceMin ?? hit.price),
    priceMax: parseProductPriceFromApi(hit.priceMax ?? hit.price),
    imageUrl: useGallery ? galleryResolved[0] : thumb,
    imageUrls: useGallery ? galleryResolved : undefined,
    collections: hit.casesLinkedCount ?? 0,
    likes: typeof hit.likesDisplayCount === 'number' ? hit.likesDisplayCount : 0,
    likedByMe: hit.likedByMe,
  };
}

export function catalogHitsToProductGridItems(hits: CatalogProductSearchHit[]): ProductGridItem[] {
  return hits.map(catalogHitToProductGridItem).filter((x): x is ProductGridItem => x != null);
}

export function brandProductRowToProductGridItem(p: PublicBrandProductRow): ProductGridItem {
  const ordered = [...p.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const galleryUrls = ordered.map((im) => resolveMediaUrlForServer(im.url));
  const useGallery = galleryUrls.length > 1;
  const title = (p.displayName ?? p.name).trim() || p.name;
  return {
    key: p.id,
    slug: p.slug,
    name: title,
    productId: p.id,
    price: productPriceToNumber(p.price),
    variantId: p.variantId ?? undefined,
    imageUrl: galleryUrls[0] ?? '/images/placeholder.svg',
    imageUrls: useGallery ? galleryUrls : undefined,
    collections: typeof p.casesLinkedCount === 'number' ? p.casesLinkedCount : 0,
    likes: typeof p.likesDisplayCount === 'number' ? p.likesDisplayCount : 0,
    likedByMe: p.likedByMe,
  };
}

export function recommendationItemToProductGridItem(p: RecommendationsStaticItem): ProductGridItem | null {
  const productId = p.productId?.trim();
  if (!productId) return null;
  return {
    key: productId,
    slug: p.slug,
    name: p.name,
    productId,
    price: p.price,
    variantId: p.variantId,
    imageUrl: p.imageUrl,
    imageUrls: p.imageUrls,
    collections: p.collections ?? 0,
    likes: typeof p.likes === 'number' ? p.likes : 0,
    likedByMe: p.likedByMe,
  };
}

export function recommendationItemsToProductGridItems(
  items: RecommendationsStaticItem[],
): ProductGridItem[] {
  return items.map(recommendationItemToProductGridItem).filter((x): x is ProductGridItem => x != null);
}
