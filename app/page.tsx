import { fetchCuratedBrandCollectionBySlug } from '@/lib/catalogPublic';
import { fetchHomeCatalogRoots } from '@/lib/homeCatalog';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import { fetchPublicSiteSettings } from '@/lib/siteSettingsPublic';
import {
  Hero,
  ScrollCatalog,
  BestBrands,
  News,
  Recommendations,
  type BestBrandsBrandItem,
} from '@/sections/home';
import { cookies } from 'next/headers';

const HOME_BRAND_COLLECTION_SLUG = 'luchshie-brendy-mesyatsa';
const HERO_ROTATION_COOKIE = 'winwin-hero-idx';

export default async function HomePage() {
  const catalogRoots = await fetchHomeCatalogRoots();
  const brandCollection = await fetchCuratedBrandCollectionBySlug(HOME_BRAND_COLLECTION_SLUG);
  const siteSettings = await fetchPublicSiteSettings();

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

  const heroImages = Array.isArray(siteSettings?.heroImageUrls) ? siteSettings.heroImageUrls : [];
  const idxRaw = cookies().get(HERO_ROTATION_COOKIE)?.value ?? '0';
  const idx = Number.parseInt(idxRaw, 10);
  const heroImageUrl =
    heroImages.length > 0
      ? heroImages[((Number.isFinite(idx) && idx >= 0 ? idx : 0) % heroImages.length) | 0]
      : null;

  return (
    <main>
      <Hero imageUrl={heroImageUrl} />
      <ScrollCatalog roots={catalogRoots} />
      {bestBrands ? <BestBrands sectionTitle={bestBrands.sectionTitle} brands={bestBrands.brands} /> : null}
      <News />
      <Recommendations />
    </main>
  );
}
