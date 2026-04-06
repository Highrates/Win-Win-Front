import { fetchCuratedBrandCollectionBySlug } from '@/lib/catalogPublic';
import { fetchHomeCatalogRoots } from '@/lib/homeCatalog';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import {
  Hero,
  ScrollCatalog,
  BestBrands,
  News,
  Recommendations,
  type BestBrandsBrandItem,
} from '@/sections/home';

const HOME_BRAND_COLLECTION_SLUG = 'luchshie-brendy-mesyatsa';

export default async function HomePage() {
  const catalogRoots = await fetchHomeCatalogRoots();
  const brandCollection = await fetchCuratedBrandCollectionBySlug(HOME_BRAND_COLLECTION_SLUG);

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

  return (
    <main>
      <Hero />
      <ScrollCatalog roots={catalogRoots} />
      {bestBrands ? <BestBrands sectionTitle={bestBrands.sectionTitle} brands={bestBrands.brands} /> : null}
      <News />
      <Recommendations />
    </main>
  );
}
