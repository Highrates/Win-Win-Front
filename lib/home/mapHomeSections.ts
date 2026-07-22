import { fetchCuratedBrandCollectionBySlug } from '@/lib/catalogPublic';
import type { PublicBrandCollectionPayload } from '@/lib/catalogPublic';
import { fetchCuratedProductCollectionBySlug } from '@/lib/server/catalogAuthFetch';
import type { PublicBrandProductRow } from '@/lib/brandsPublic';
import { mapBrandProductRowsToRecommendationItems } from '@/lib/publicCollectionsPublic';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import type { BestBrandsBrandItem } from '@/sections/home/BestBrands/BestBrands';
import type { RecommendationsStaticItem } from '@/sections/home/Recommendations/recommendationsStaticItem';
import { homePageConfig } from './homePageConfig';

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

export function mapRecommendationsSection(
  collection: { name?: string | null; products?: PublicBrandProductRow[] } | null,
  fallbackTitle: string,
): HomeRecommendationsSection | null {
  if (!collection?.products?.length) return null;
  return {
    title: collection.name?.trim() || fallbackTitle,
    items: mapBrandProductRowsToRecommendationItems(collection.products),
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
  collection1: HomeProductCollectionSection | null,
  recommendations: HomeRecommendationsSection | null,
): RecommendationsStaticItem[] {
  return [...(collection1?.items ?? []), ...(recommendations?.items ?? [])];
}

export type HomePageCuratedFetches = {
  brandCollection: PublicBrandCollectionPayload | null;
  collection1Raw: Awaited<ReturnType<typeof fetchCuratedProductCollectionBySlug>>;
  recommendationsCollection: Awaited<ReturnType<typeof fetchCuratedProductCollectionBySlug>>;
};

export async function fetchHomeCuratedCollections(): Promise<HomePageCuratedFetches> {
  const [brandCollection, collection1Raw, recommendationsCollection] = await Promise.all([
    fetchCuratedBrandCollectionBySlug(homePageConfig.brandCollectionSlug),
    fetchCuratedProductCollectionBySlug(homePageConfig.collection1Slug),
    fetchCuratedProductCollectionBySlug(homePageConfig.recommendationsCollectionSlug),
  ]);
  return { brandCollection, collection1Raw, recommendationsCollection };
}

export function mapHomeCuratedSections(fetches: HomePageCuratedFetches) {
  const collection1 = mapProductCollectionSection(
    fetches.collection1Raw,
    homePageConfig.collection1FallbackTitle,
    homePageConfig.collection1Limit,
  );
  const recommendations = mapRecommendationsSection(
    fetches.recommendationsCollection,
    homePageConfig.recommendationsFallbackTitle,
  );
  const bestBrands = mapBestBrandsSection(fetches.brandCollection);

  return {
    bestBrands,
    featuredProductRail: collection1?.items.length
      ? {
          title: collection1.title,
          items: collection1.items,
          advanceGalleryOnScroll: true,
          progressiveLoad: false,
          allHref: fetches.collection1Raw?.slug
            ? `/collections/${encodeURIComponent(fetches.collection1Raw.slug)}`
            : undefined,
        }
      : null,
    recommendationsRail: recommendations?.items.length
      ? {
          title: recommendations.title,
          items: recommendations.items,
          allHref: fetches.recommendationsCollection?.slug
            ? `/collections/${encodeURIComponent(fetches.recommendationsCollection.slug)}`
            : undefined,
        }
      : null,
    allRecommendationItems: mergeHomeRecommendationItems(collection1, recommendations),
  };
}
