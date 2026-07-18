import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';
import type { AdminBrandRow } from '../../../brands/adminBrandTypes';
import type { AdminCuratedCollectionRow } from '../../../collections/collectionsAdminTypes';
import type { AdminProductSetRow } from '../../../product-sets/productSetsAdminTypes';
import type { AdminCategoryRow } from '../categories/adminCategoryTypes';
import type { AdminCatalogTagRow } from './adminProductTypes';

export type ProductListFilters = {
  brandId: string;
  categoryId: string;
  tagId: string;
  collectionId: string;
  productSetId: string;
};

export const EMPTY_PRODUCT_LIST_FILTERS: ProductListFilters = {
  brandId: '',
  categoryId: '',
  tagId: '',
  collectionId: '',
  productSetId: '',
};

export type ProductListFilterMeta = {
  categories: AdminCategoryRow[];
  brands: AdminBrandRow[];
  catalogTags: AdminCatalogTagRow[];
  collections: AdminCuratedCollectionRow[];
  productSets: AdminProductSetRow[];
};

export function countActiveProductListFilters(filters: ProductListFilters): number {
  return Object.values(filters).filter((v) => v.trim()).length;
}

export function productListFiltersToParams(
  filters: ProductListFilters,
): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {};
  if (filters.brandId.trim()) params.brandId = filters.brandId.trim();
  if (filters.categoryId.trim()) params.categoryId = filters.categoryId.trim();
  if (filters.tagId.trim()) params.tagId = filters.tagId.trim();
  if (filters.collectionId.trim()) params.collectionId = filters.collectionId.trim();
  if (filters.productSetId.trim()) params.productSetId = filters.productSetId.trim();
  return params;
}

export function sortCategoriesForAdminSelect(
  categories: AdminCategoryRow[],
  locale: AdminLocale,
): AdminCategoryRow[] {
  return [...categories].sort((a, b) => {
    const la = a.parent ? `${a.parent.name} ${a.name}` : a.name;
    const lb = b.parent ? `${b.parent.name} ${b.name}` : b.name;
    return la.localeCompare(lb, locale === 'zh' ? 'zh' : 'ru');
  });
}

export function categorySelectLabel(category: AdminCategoryRow): string {
  return category.parent ? `${category.parent.name} → ${category.name}` : category.name;
}

export function productListFilterChipLabels(
  filters: ProductListFilters,
  meta: ProductListFilterMeta | null,
  labels: {
    brand: string;
    category: string;
    tag: string;
    collection: string;
    productSet: string;
    noBrand: string;
  },
): { key: keyof ProductListFilters; label: string }[] {
  if (!meta) return [];
  const chips: { key: keyof ProductListFilters; label: string }[] = [];

  if (filters.brandId.trim()) {
    if (filters.brandId === '_none') {
      chips.push({ key: 'brandId', label: `${labels.brand}: ${labels.noBrand}` });
    } else {
      const brand = meta.brands.find((b) => b.id === filters.brandId);
      chips.push({ key: 'brandId', label: `${labels.brand}: ${brand?.name ?? filters.brandId}` });
    }
  }

  if (filters.categoryId.trim()) {
    const category = meta.categories.find((c) => c.id === filters.categoryId);
    chips.push({
      key: 'categoryId',
      label: `${labels.category}: ${category ? categorySelectLabel(category) : filters.categoryId}`,
    });
  }

  if (filters.tagId.trim()) {
    const tag = meta.catalogTags.find((t) => t.id === filters.tagId);
    chips.push({ key: 'tagId', label: `${labels.tag}: ${tag?.name ?? filters.tagId}` });
  }

  if (filters.collectionId.trim()) {
    const collection = meta.collections.find((c) => c.id === filters.collectionId);
    chips.push({
      key: 'collectionId',
      label: `${labels.collection}: ${collection?.name ?? filters.collectionId}`,
    });
  }

  if (filters.productSetId.trim()) {
    const setRow = meta.productSets.find((s) => s.id === filters.productSetId);
    chips.push({
      key: 'productSetId',
      label: `${labels.productSet}: ${setRow?.name ?? filters.productSetId}`,
    });
  }

  return chips;
}
