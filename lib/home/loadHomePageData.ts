import { fetchHomeCatalogRoots, type HomeCatalogRoot } from '@/lib/homeCatalog';
import { fetchPublicSiteSettings } from '@/lib/siteSettingsPublic';
import type { BestBrandsBrandItem } from '@/sections/home/BestBrands/BestBrands';
import type { RecommendationsStaticItem } from '@/sections/home/Recommendations/recommendationsStaticItem';
import { cookies } from 'next/headers';
import { homePageConfig } from './homePageConfig';
import {
  fetchHomeCuratedCollections,
  mapHomeCuratedSections,
  resolveHeroImageUrl,
  type HomeProductRailSection,
} from './mapHomeSections';

export type HomePageData = {
  catalogRoots: HomeCatalogRoot[];
  heroImageUrl: string | null;
  bestBrands: BestBrandsBrandItem[] | null;
  featuredProductRail: HomeProductRailSection | null;
  recommendationsRail: HomeProductRailSection | null;
  allRecommendationItems: RecommendationsStaticItem[];
};

export type HomePageFoldData = Pick<HomePageData, 'catalogRoots' | 'heroImageUrl'>;

export async function loadHomePageFoldData(): Promise<HomePageFoldData> {
  const [catalogRoots, siteSettings] = await Promise.all([
    fetchHomeCatalogRoots(),
    fetchPublicSiteSettings(),
  ]);

  const heroRotationRaw = cookies().get(homePageConfig.heroRotationCookie)?.value;
  const heroImageUrl = resolveHeroImageUrl(siteSettings?.heroImageUrls, heroRotationRaw);

  return { catalogRoots, heroImageUrl };
}

export async function loadHomePageData(): Promise<HomePageData> {
  const [fold, curatedFetches] = await Promise.all([
    loadHomePageFoldData(),
    fetchHomeCuratedCollections(),
  ]);

  const sections = mapHomeCuratedSections(curatedFetches);

  return {
    ...fold,
    ...sections,
  };
}
