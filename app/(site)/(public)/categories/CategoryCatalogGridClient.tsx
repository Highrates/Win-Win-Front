'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CATEGORY_PER_PAGE } from '@/app/(site)/(public)/categories/categoryCatalogData';
import styles from '@/app/(site)/(public)/categories/CategoryPage.module.css';
import { CatalogProductGrid } from '@/components/CatalogProductGrid/CatalogProductGrid';
import type { CatalogFacetFilters } from '@/lib/catalog/catalogProductFilters';
import { catalogFacetFiltersKey } from '@/lib/catalog/catalogProductFilters';
import { fetchCatalogProductsSearchClient } from '@/lib/catalogProductsSearchClient';
import type { CatalogProductSearchHit } from '@/lib/catalogPublic';
import { mergeCatalogSearchHits } from '@/lib/mergeCatalogSearchHits';
import { useInfiniteScrollSentinel } from '@/lib/useInfiniteScrollSentinel';

type Props = {
  categoryId: string;
  tagSlug?: string;
  /** Серверная сортировка (`GET /catalog/products/search?sort=`). */
  sort?: string;
  priceFrom?: number;
  priceTo?: number;
  facets?: CatalogFacetFilters;
  columns?: 3 | 4;
  initialHits: CatalogProductSearchHit[];
  initialTotal: number;
  /** Есть активные фильтры — показать «Сбросить фильтры» в пустом состоянии. */
  canResetFilters?: boolean;
  onResetFilters?: () => void;
};

export function CategoryCatalogGridClient({
  categoryId,
  tagSlug,
  sort,
  priceFrom,
  priceTo,
  facets,
  columns = 4,
  initialHits,
  initialTotal,
  canResetFilters = false,
  onResetFilters,
}: Props) {
  const [hits, setHits] = useState(initialHits);
  const [total, setTotal] = useState(initialTotal);
  const [loadedPage, setLoadedPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const facetsKey = facets ? catalogFacetFiltersKey(facets) : '';

  useEffect(() => {
    setHits(initialHits);
    setTotal(initialTotal);
    setLoadedPage(1);
    loadingMoreRef.current = false;
    setLoadingMore(false);
  }, [categoryId, tagSlug, sort, priceFrom, priceTo, facetsKey, initialHits, initialTotal]);

  const hasMore = hits.length < total;

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = loadedPage + 1;
      const data = await fetchCatalogProductsSearchClient({
        categoryId,
        tag: tagSlug,
        page: nextPage,
        limit: CATEGORY_PER_PAGE,
        sort,
        priceFrom,
        priceTo,
        facets,
      });
      setHits((prev) => mergeCatalogSearchHits(prev, data.hits ?? []));
      setTotal(data.total ?? total);
      setLoadedPage(nextPage);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [categoryId, hasMore, loadedPage, tagSlug, sort, priceFrom, priceTo, facets, total]);

  const sentinelRef = useInfiniteScrollSentinel(
    () => void loadMore(),
    hasMore && !loadingMore,
  );

  if (hits.length === 0) {
    return (
      <div className={styles.marketEmpty} role="status">
        <p className={styles.marketEmptyText}>Ничего не найдено</p>
        {canResetFilters && onResetFilters ? (
          <button type="button" className={styles.marketEmptyReset} onClick={onResetFilters}>
            Сбросить фильтры
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <CatalogProductGrid catalogHits={hits} columns={columns} />
      {hasMore ? (
        <div ref={sentinelRef} className={styles.infiniteScrollSentinel} aria-hidden="true" />
      ) : null}
      {loadingMore ? (
        <p className={styles.infiniteScrollStatus} aria-live="polite">
          Загрузка…
        </p>
      ) : null}
    </>
  );
}
