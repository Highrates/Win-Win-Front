import { fetchCuratedBrandCollectionBySlug } from '@/lib/catalogPublic';
import { fetchCuratedProductCollectionBySlug } from '@/lib/server/catalogAuthFetch';
import { fetchHomeCatalogRoots } from '@/lib/homeCatalog';
import { mapBrandProductRowsToRecommendationItems } from '@/lib/publicCollectionsPublic';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import { fetchPublicSiteSettings } from '@/lib/siteSettingsPublic';
import {
  Hero,
  ScrollCatalog,
  ProjectSourcing,
  BestBrands,
  News,
  Recommendations,
  HomeProductLikesScope,
  type BestBrandsBrandItem,
} from '@/sections/home';
import { cookies } from 'next/headers';

const HOME_BRAND_COLLECTION_SLUG = 'luchshie-brendy-mesyatsa';
const HOME_COLLECTION_1_SLUG = 'kollektsiya-1';
const HOME_COLLECTION_2_SLUG = 'kollektsiya-2';
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
    collection2Raw,
    recommendationsCollection,
  ] = await Promise.all([
    fetchHomeCatalogRoots(),
    fetchCuratedBrandCollectionBySlug(HOME_BRAND_COLLECTION_SLUG),
    fetchPublicSiteSettings(),
    fetchCuratedProductCollectionBySlug(HOME_COLLECTION_1_SLUG),
    fetchCuratedProductCollectionBySlug(HOME_COLLECTION_2_SLUG),
    fetchCuratedProductCollectionBySlug(HOME_RECOMMENDATIONS_COLLECTION_SLUG),
  ]);

  const collection1 = productCollectionSection(collection1Raw, 'Коллекция 1');
  const collection2 = productCollectionSection(collection2Raw, 'Коллекция 2');

  let bestBrands: { sectionTitle: string; brands: BestBrandsBrandItem[] } | null = null;
  if (brandCollection?.brands?.length) {
    const sectionTitle = brandCollection.name?.trim() || 'Лучшие бренды месяца';
    const brands: BestBrandsBrandItem[] = brandCollection.brands.map((b) => ({
      slug: b.slug,
      name: b.name,
      logo: resolveMediaUrlForServer(b.logoUrl),
      description: b.shortDescription?.trim() || '',
      galleryMain: resolveMediaUrlForServer(b.galleryMain),
      gallerySide1: resolveMediaUrlForServer(b.gallerySide1),
      gallerySide2: resolveMediaUrlForServer(b.gallerySide2),
    }));
    bestBrands = { sectionTitle, brands };
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
    ...(collection2?.items ?? []),
    ...(recommendationItems ?? []),
  ];

  return (
    <main>
      <HomeProductLikesScope items={allHomeRecommendationItems}>
        <Hero imageUrl={heroImageUrl} />
        <ScrollCatalog roots={catalogRoots} />
        <ProjectSourcing />
        {collection1?.items.length ? (
          <Recommendations
            title={collection1.title}
            items={collection1.items}
            advanceGalleryOnScroll
          />
        ) : null}
        {bestBrands ? <BestBrands sectionTitle={bestBrands.sectionTitle} brands={bestBrands.brands} /> : null}
        {collection2?.items.length ? (
          <Recommendations
            title={collection2.title}
            items={collection2.items}
            advanceGalleryOnScroll
          />
        ) : null}
        <News />
        {recommendationItems?.length ? (
          <Recommendations title={recommendationsTitle} items={recommendationItems} />
        ) : null}
      </HomeProductLikesScope>
    </main>
  );
}
