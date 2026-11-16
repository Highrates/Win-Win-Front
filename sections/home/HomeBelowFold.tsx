import { Suspense } from 'react';
import { fetchHomeCuratedCollections } from '@/lib/home/fetchHomeCuratedCollections';
import { mapHomeCuratedSections } from '@/lib/home/mapHomeSections';
import { BestBrands } from './BestBrands/BestBrands';
import { AboutTeaser } from './AboutTeaser/AboutTeaser';
import { News } from './News/News';
import { NewsSkeleton } from './News/NewsSkeleton';
import { HomeProjects } from './HomeProjects/HomeProjects';
import { HomeTours } from './HomeTours/HomeTours';
import { HomeToursSkeleton } from './HomeTours/HomeToursSkeleton';
import { HomeProductCollections } from './HomeProductCollections';
import { HomeProductLikesScope } from './HomeProductLikesScope';

export async function HomeBelowFold() {
  const sections = mapHomeCuratedSections(await fetchHomeCuratedCollections());

  return (
    <HomeProductLikesScope items={sections.allRecommendationItems}>
      {sections.bestBrands?.length ? <BestBrands brands={sections.bestBrands} /> : null}
      <HomeProductCollections sections={sections.afterBestBrands} />
      <AboutTeaser />
      <Suspense fallback={<NewsSkeleton />}>
        <News />
      </Suspense>
      <HomeProductCollections sections={sections.afterNews} />
      <Suspense fallback={null}>
        <HomeProjects />
      </Suspense>
      <Suspense fallback={<HomeToursSkeleton />}>
        <HomeTours />
      </Suspense>
      <HomeProductCollections sections={sections.afterTours} />
    </HomeProductLikesScope>
  );
}
