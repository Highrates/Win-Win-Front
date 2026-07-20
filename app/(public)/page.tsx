import { fetchCuratedBrandCollectionBySlug } from '@/lib/catalogPublic';
import { fetchCuratedProductCollectionBySlug } from '@/lib/server/catalogAuthFetch';
import { fetchHomeCatalogRoots } from '@/lib/homeCatalog';
import { mapBrandProductRowsToRecommendationItems } from '@/lib/publicCollectionsPublic';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import { fetchPublicSiteSettings } from '@/lib/siteSettingsPublic';
import {
  Hero,
  ScrollCatalog,
  BestBrands,
  AboutTeaser,
  News,
  Recommendations,
  HomeProductLikesScope,
  type BestBrandsBrandItem,
} from '@/sections/home';
import { cookies } from 'next/headers';
import topFoldStyles from '@/sections/home/HomeTopFold.module.css';

const HOME_BRAND_COLLECTION_SLUG = 'luchshie-brendy-mesyatsa';
const HOME_COLLECTION_1_SLUG = 'kollektsiya-1';
const HOME_RECOMMENDATIONS_COLLECTION_SLUG = 'rekomendatsii';
const HERO_ROTATION_COOKIE = 'winwin-hero-idx';

function productCollectionSection(
  collection: Awaited<ReturnType<typeof fetchCuratedProductCollectionBySlug>>,
  fallbackTitle: string,
) {
  if (!collection?.products?.length) return null;
  return {
    title: collection.name?.trim() || fallbackTitle,
    items: mapBrandProductRowsToRecommendationItems(collection.products),
  };
}

export default async function HomePage() {
  const [
    catalogRoots,
    brandCollection,
    siteSettings,
    collection1Raw,
    recommendationsCollection,
  ] = await Promise.all([
    fetchHomeCatalogRoots(),
    fetchCuratedBrandCollectionBySlug(HOME_BRAND_COLLECTION_SLUG),
    fetchPublicSiteSettings(),
    fetchCuratedProductCollectionBySlug(HOME_COLLECTION_1_SLUG),
    fetchCuratedProductCollectionBySlug(HOME_RECOMMENDATIONS_COLLECTION_SLUG),
  ]);

  const collection1 = productCollectionSection(collection1Raw, 'Коллекция 1');

  let bestBrands: BestBrandsBrandItem[] | null = null;
  if (brandCollection?.brands?.length) {
    bestBrands = brandCollection.brands.map((b) => ({
      slug: b.slug,
      name: b.name,
      description: b.shortDescription?.trim() || '',
      productPreview: resolveMediaUrlForServer(b.productPreviewImageUrl),
      lifestyleImage: resolveMediaUrlForServer(
        b.lifestyleImageUrl || b.galleryMain,
      ),
    }));
  }

  const recommendationItems = recommendationsCollection?.products?.length
    ? mapBrandProductRowsToRecommendationItems(recommendationsCollection.products)
    : null;
  const recommendationsTitle =
    recommendationsCollection?.name?.trim() || 'Рекомендации';

  const heroImages = Array.isArray(siteSettings?.heroImageUrls) ? siteSettings.heroImageUrls : [];
  const idxRaw = cookies().get(HERO_ROTATION_COOKIE)?.value ?? '0';
  const idx = Number.parseInt(idxRaw, 10);
  const heroImageUrl =
    heroImages.length > 0
      ? heroImages[((Number.isFinite(idx) && idx >= 0 ? idx : 0) % heroImages.length) | 0]
      : null;

  const allHomeRecommendationItems = [
    ...(collection1?.items ?? []),
    ...(recommendationItems ?? []),
  ];

  return (
    <main>
      <HomeProductLikesScope items={allHomeRecommendationItems}>
        <div className={topFoldStyles.topFold}>
          <Hero imageUrl={heroImageUrl} fillFold />
          <ScrollCatalog roots={catalogRoots} fillFold />
        </div>
        {bestBrands?.length ? <BestBrands brands={bestBrands} /> : null}
        {collection1?.items.length ? (
          <Recommendations
            title={collection1.title}
            items={collection1.items}
            advanceGalleryOnScroll
            progressiveLoad={false}
          />
        ) : null}
        <AboutTeaser />
        <News />
        {recommendationItems?.length ? (
          <Recommendations title={recommendationsTitle} items={recommendationItems} />
        ) : null}
      </HomeProductLikesScope>
    </main>
  );
}
