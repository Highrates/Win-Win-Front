import { Hero, ScrollCatalog, BestBrands, News, Recommendations } from '@/sections/home';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ScrollCatalog />
      <BestBrands />
      <News />
      <Recommendations />
    </main>
  );
}
