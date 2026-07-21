export type CatalogHubTabId = 'categories' | 'zones' | 'collections';

const HUB_TABS = new Set<CatalogHubTabId>(['categories', 'zones', 'collections']);

/** Парсит `?tab=` для хаба каталога (SSR + клиент). */
export function parseCatalogHubTab(raw?: string | null): CatalogHubTabId {
  const v = raw?.trim().toLowerCase();
  if (v && HUB_TABS.has(v as CatalogHubTabId) && v !== 'categories') {
    return v as CatalogHubTabId;
  }
  return 'categories';
}
