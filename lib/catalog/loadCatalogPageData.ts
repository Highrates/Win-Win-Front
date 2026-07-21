import { cache } from 'react';
import {
  fetchCatalogTagBySlug,
  fetchCatalogTags,
  fetchCategoryBySlug,
  fetchTagStripCategories,
} from '@/lib/catalogPublic';

export { loadHomeCatalogRoots as loadCatalogTreeRoots } from '@/lib/homeCatalog';

export const loadCatalogCategoryBySlug = cache((slug: string) =>
  fetchCategoryBySlug(slug.trim()),
);

export const loadCatalogTagBySlug = cache((slug: string) => fetchCatalogTagBySlug(slug.trim()));

export const loadCatalogTags = cache(() => fetchCatalogTags());

export const loadTagStripCategories = cache((slug: string) =>
  fetchTagStripCategories(slug.trim()),
);
