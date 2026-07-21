import 'server-only';

import { cache } from 'react';
import { fetchPublicRootCategoriesForNav } from '@/lib/catalogPublic';
import { fetchPublicBrandsMenuForNav } from '@/lib/brandsPublic';
import type { BrandsNavItem } from '@/components/BrandsNavContext';
import type { CatalogNavRoot } from '@/components/CatalogNavContext';

export type SiteNavData = {
  catalogRoots: CatalogNavRoot[];
  brandMenuItems: BrandsNavItem[];
};

async function loadSiteNavDataUncached(): Promise<SiteNavData> {
  const [catalogRoots, brandMenuItems] = await Promise.all([
    fetchPublicRootCategoriesForNav(),
    fetchPublicBrandsMenuForNav(),
  ]);
  return { catalogRoots, brandMenuItems };
}

/** Один fetch nav-данных на request (header / mega menu). */
export const loadSiteNavData = cache(loadSiteNavDataUncached);
