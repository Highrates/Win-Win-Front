/** Сортировка витрины каталога (`?sort=` + search API). */

export const CATALOG_SORT_OPTIONS = [
  { id: 'popular', label: 'По популярности' },
  { id: 'price_asc', label: 'Сначала дешевле' },
  { id: 'price_desc', label: 'Сначала дороже' },
  { id: 'newest', label: 'Сначала новые' },
] as const;

export type CatalogSortId = (typeof CATALOG_SORT_OPTIONS)[number]['id'];

const SORT_IDS = new Set<string>(CATALOG_SORT_OPTIONS.map((o) => o.id));

export function parseCatalogSort(raw?: string | null): CatalogSortId {
  const v = raw?.trim().toLowerCase();
  if (v && SORT_IDS.has(v)) return v as CatalogSortId;
  return 'popular';
}

export function catalogSortLabel(id: CatalogSortId): string {
  return CATALOG_SORT_OPTIONS.find((o) => o.id === id)?.label ?? CATALOG_SORT_OPTIONS[0].label;
}
