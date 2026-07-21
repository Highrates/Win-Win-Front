import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Hero, ScrollCatalog } from '@/sections/home';
import { HomeBelowFold } from '@/sections/home/HomeBelowFold';
import { HomeBelowFoldSkeleton } from '@/sections/home/HomeBelowFoldSkeleton';
import { loadHomePageFoldData } from '@/lib/home/loadHomePageData';
import topFoldStyles from '@/sections/home/HomeTopFold.module.css';

const HOME_DESCRIPTION =
  'Качественный и стильный интерьер из Китая. Каталог мебели для дизайнеров интерьеров.';

export const metadata: Metadata = {
  title: '588est — мебель и интерьер из Китая',
  description: HOME_DESCRIPTION,
  openGraph: {
    title: '588est — мебель и интерьер из Китая',
    description: HOME_DESCRIPTION,
    type: 'website',
  },
};

export default async function HomePage() {
  const { catalogRoots, heroImageUrl } = await loadHomePageFoldData();

  return (
    <main>
      <div className={topFoldStyles.topFold}>
        <Hero imageUrl={heroImageUrl} fillFold />
        <ScrollCatalog roots={catalogRoots} fillFold />
      </div>
      <Suspense fallback={<HomeBelowFoldSkeleton />}>
        <HomeBelowFold />
      </Suspense>
    </main>
  );
}
