import { fetchHomeCatalogRoots } from '@/lib/homeCatalog';
import { Hero, ScrollCatalog, BestBrands, News, Recommendations } from '@/sections/home';

export default async function HomePage() {
  const catalogRoots = await fetchHomeCatalogRoots();
  return (
    <main>
      <Hero />
      <ScrollCatalog roots={catalogRoots} />
      <BestBrands />
      <News />
      <Recommendations />
    </main>
  );
}
