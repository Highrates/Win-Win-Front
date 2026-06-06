'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CatalogSectionsTabs } from '@/app/(public)/catalog/CatalogSectionsTabs';
import { CATEGORY_PER_PAGE } from '@/app/(public)/categories/categoryCatalogData';
import styles from '@/app/(public)/categories/CategoryPage.module.css';
import { CatalogProductGrid } from '@/components/CatalogProductGrid/CatalogProductGrid';
import { fetchCatalogProductsSearchClient } from '@/lib/catalogProductsSearchClient';
import type { CatalogProductSearchHit } from '@/lib/catalogPublic';
import type { HomeCatalogRoot } from '@/lib/homeCatalog';
import { mergeCatalogSearchHits } from '@/lib/mergeCatalogSearchHits';
import { useInfiniteScrollSentinel } from '@/lib/useInfiniteScrollSentinel';

type Props = {
  roots: HomeCatalogRoot[];
  initialCategoryId: string;
  initialHits: CatalogProductSearchHit[];
  initialTotal: number;
};

export function CatalogIndexBody({
  roots,
  initialCategoryId,
  initialHits,
  initialTotal,
}: Props) {
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [hits, setHits] = useState(initialHits);
  const [total, setTotal] = useState(initialTotal);
  const [loadedPage, setLoadedPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const requestGenRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const skipCategoryFetchRef = useRef(true);

  const hasMore = hits.length < total;

  const loadFirstPage = useCallback(async (catId: string) => {
    const gen = ++requestGenRef.current;
    setLoading(true);
    try {
      const data = await fetchCatalogProductsSearchClient({
        categoryId: catId,
        page: 1,
        limit: CATEGORY_PER_PAGE,
      });
      if (gen !== requestGenRef.current) return;
      setHits(data.hits ?? []);
      setTotal(data.total ?? 0);
      setLoadedPage(1);
    } finally {
      if (gen === requestGenRef.current) setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const gen = requestGenRef.current;
    try {
      const nextPage = loadedPage + 1;
      const data = await fetchCatalogProductsSearchClient({
        categoryId,
        page: nextPage,
        limit: CATEGORY_PER_PAGE,
      });
      if (gen !== requestGenRef.current) return;
      setHits((prev) => mergeCatalogSearchHits(prev, data.hits ?? []));
      setTotal(data.total ?? total);
      setLoadedPage(nextPage);
    } finally {
      if (gen === requestGenRef.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [categoryId, hasMore, loadedPage, loading, total]);

  useEffect(() => {
    if (skipCategoryFetchRef.current) {
      skipCategoryFetchRef.current = false;
      return;
    }
    void loadFirstPage(categoryId);
  }, [categoryId, loadFirstPage]);

  const handleCategoryChange = useCallback((id: string) => {
    setCategoryId((prev) => (prev === id ? prev : id));
  }, []);

  const sentinelRef = useInfiniteScrollSentinel(
    () => void loadMore(),
    hasMore && !loading && !loadingMore,
  );

  return (
    <>
      <CatalogSectionsTabs initialRoots={roots} onActiveCategoryChange={handleCategoryChange} />

      <section className={styles.marketSection} aria-label="Каталог товаров">
        <div className="padding-global">
          <div className={styles.marketSectionInner}>
            <div className={styles.marketSectionRow}>
              <div className={styles.marketSectionRowLeft}>
                <div className={styles.marketFilterGroup}>
                  <button type="button" aria-label="Фильтр">
                    <img src="/icons/filter.svg" alt="" width={20} height={20} />
                    <span>Фильтр</span>
                  </button>
                </div>
                <div className={styles.marketSortGroup}>
                  <button type="button" aria-label="Сортировка">
                    <img src="/icons/sort.svg" alt="" width={20} height={20} />
                    <span>Самые популярные</span>
                  </button>
                </div>
              </div>
              <div className={styles.marketSectionRowResult}>
                <span className={styles.marketSectionRowResultLabel}>Результат: </span>
                <span className={styles.marketSectionRowResultValue}>{total}</span>
              </div>
            </div>
            <div
              aria-busy={loading || loadingMore}
              style={loading ? { opacity: 0.55, transition: 'opacity 0.15s' } : undefined}
            >
              <CatalogProductGrid catalogHits={hits} />
            </div>
            {hasMore ? (
              <div ref={sentinelRef} className={styles.infiniteScrollSentinel} aria-hidden="true" />
            ) : null}
            {loadingMore ? (
              <p className={styles.infiniteScrollStatus} aria-live="polite">
                Загрузка…
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
