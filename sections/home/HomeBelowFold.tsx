import { Suspense } from 'react';
import {
  fetchHomeCuratedCollections,
  mapHomeCuratedSections,
} from '@/lib/home/mapHomeSections';
import { BestBrands } from './BestBrands/BestBrands';
import { AboutTeaser } from './AboutTeaser/AboutTeaser';
import { News } from './News/News';
import { NewsSkeleton } from './News/NewsSkeleton';
import { HomeProductCollections } from './HomeProductCollections';
import { HomeProductLikesScope } from './HomeProductLikesScope';

export async function HomeBelowFold() {
  const sections = mapHomeCuratedSections(await fetchHomeCuratedCollections());

  return (
    <HomeProductLikesScope items={sections.allRecommendationItems}>
      {sections.bestBrands?.length ? <BestBrands brands={sections.bestBrands} /> : null}
      <HomeProductCollections
        sections={sections.featuredProductRail ? [sections.featuredProductRail] : []}
      />
      <AboutTeaser />
      <Suspense fallback={<NewsSkeleton />}>
        <News />
      </Suspense>
      <HomeProductCollections
        sections={sections.recommendationsRail ? [sections.recommendationsRail] : []}
      />
    </HomeProductLikesScope>
  );
}
