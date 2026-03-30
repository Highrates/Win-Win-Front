/**
 * Единый тег и TTL для публичного каталога (дерево, корни, страница категории).
 * `revalidateTag(CATALOG_PUBLIC_TAG)` сбрасывает кэш после правок в админке.
 */
export const CATALOG_PUBLIC_TAG = 'catalog-public';

/** Сколько секунд Next держит ответ API каталога без повторного запроса к Nest. */
export const CATALOG_PUBLIC_REVALIDATE_SECONDS = 120;

export function catalogPublicFetchNext(): { revalidate: number; tags: string[] } {
  return {
    revalidate: CATALOG_PUBLIC_REVALIDATE_SECONDS,
    tags: [CATALOG_PUBLIC_TAG],
  };
}
