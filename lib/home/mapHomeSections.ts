import type { PublicBrandCollectionPayload } from '@/lib/catalogPublic';
import type { PublicBrandProductRow } from '@/lib/brandsPublic';
import { mapBrandProductRowsToRecommendationItems } from '@/lib/publicCollectionsPublic';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import type { BestBrandsBrandItem } from '@/sections/home/BestBrands/BestBrands';
import type { RecommendationsStaticItem } from '@/sections/home/Recommendations/recommendationsStaticItem';

/** Product-рельс с `GET /catalog/curated-collections/home` (без server-only). */
export type HomeCuratedProductRail = {
  slug: string;
  name: string;
  homeOrder: number;
  homeGridSize: 'FOUR' | 'EIGHT' | 'UNLIMITED';
  products: PublicBrandProductRow[];
};

export type HomeProductCollectionSection = {
  title: string;
  items: RecommendationsStaticItem[];
};

/** Секция product rail на главной → props для `<Recommendations />`. */
export type HomeProductRailSection = HomeProductCollectionSection & {
  advanceGalleryOnScroll?: boolean;
  progressiveLoad?: boolean;
  /** Ссылка «ВСЕ» рядом с заголовком (страница коллекции). */
  allHref?: string;
  homeOrder?: number;
};

export type HomeRecommendationsSection = HomeProductCollectionSection;

export function mapBestBrandsSection(
  brandCollection: PublicBrandCollectionPayload | null,
): BestBrandsBrandItem[] | null {
  if (!brandCollection?.brands?.length) return null;
  return brandCollection.brands.map((b) => ({
    slug: b.slug,
    name: b.name,
    description: b.shortDescription?.trim() || '',
    productPreview: resolveMediaUrlForServer(b.productPreviewImageUrl),
    lifestyleImage: resolveMediaUrlForServer(b.lifestyleImageUrl || b.galleryMain),
  }));
}

export function mapProductCollectionSection(
  collection: { name?: string | null; products?: PublicBrandProductRow[] } | null,
  fallbackTitle: string,
  limit?: number,
): HomeProductCollectionSection | null {
  if (!collection?.products?.length) return null;
  const products =
    typeof limit === 'number' ? collection.products.slice(0, limit) : collection.products;
  if (!products.length) return null;
  return {
    title: collection.name?.trim() || fallbackTitle,
    items: mapBrandProductRowsToRecommendationItems(products),
  };
}

export function mapHomeRail(rail: HomeCuratedProductRail): HomeProductRailSection | null {
  if (!rail.products.length) return null;
  const progressiveLoad = rail.homeGridSize === 'UNLIMITED';
  return {
    title: rail.name.trim() || 'Коллекция',
    items: mapBrandProductRowsToRecommendationItems(rail.products),
    progressiveLoad,
    advanceGalleryOnScroll: false,
    allHref: `/collections/${encodeURIComponent(rail.slug)}`,
    homeOrder: rail.homeOrder,
  };
}

export function resolveHeroImageUrl(
  heroImageUrls: string[] | null | undefined,
  rotationIndexRaw: string | undefined,
): string | null {
  const heroImages = Array.isArray(heroImageUrls) ? heroImageUrls : [];
  if (!heroImages.length) return null;
  const idx = Number.parseInt(rotationIndexRaw ?? '0', 10);
  const safeIdx = (Number.isFinite(idx) && idx >= 0 ? idx : 0) % heroImages.length;
  return heroImages[safeIdx] ?? null;
}

/** Собирает все product-items главной для bulk-лайков. */
export function mergeHomeRecommendationItems(
  ...sections: Array<HomeProductCollectionSection | null | undefined>
): RecommendationsStaticItem[] {
  return sections.flatMap((s) => s?.items ?? []);
}

export type HomePageCuratedFetches = {
  brandCollection: PublicBrandCollectionPayload | null;
  homeRails: HomeCuratedProductRail[];
};

export function mapHomeCuratedSections(fetches: HomePageCuratedFetches) {
  const bestBrands = mapBestBrandsSection(fetches.brandCollection);
  const rails = fetches.homeRails
    .map(mapHomeRail)
    .filter((r): r is HomeProductRailSection => Boolean(r?.items.length));

  const afterBestBrands = rails.filter((r) => r.homeOrder === 1);
  const afterNews = rails.filter((r) => r.homeOrder === 2);
  const afterTours = rails.filter((r) => (r.homeOrder ?? 0) >= 3);

  return {
    bestBrands,
    afterBestBrands,
    afterNews,
    afterTours,
    allRecommendationItems: mergeHomeRecommendationItems(...rails),
  };
}
