import 'server-only';

import { fetchCuratedBrandCollectionBySlug } from '@/lib/catalogPublic';
import { fetchHomeCuratedProductRails } from '@/lib/server/catalogAuthFetch';
import { homePageConfig } from './homePageConfig';
import type { HomePageCuratedFetches } from './mapHomeSections';

export async function fetchHomeCuratedCollections(): Promise<HomePageCuratedFetches> {
  const [brandCollection, homeRails] = await Promise.all([
    fetchCuratedBrandCollectionBySlug(homePageConfig.brandCollectionSlug),
    fetchHomeCuratedProductRails(),
  ]);
  return { brandCollection, homeRails };
}
