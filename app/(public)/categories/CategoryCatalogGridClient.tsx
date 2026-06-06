'use client';

import { useCallback, useRef, useState } from 'react';
import { CATEGORY_PER_PAGE } from '@/app/(public)/categories/categoryCatalogData';
import styles from '@/app/(public)/categories/CategoryPage.module.css';
import { CatalogProductGrid } from '@/components/CatalogProductGrid/CatalogProductGrid';
import { fetchCatalogProductsSearchClient } from '@/lib/catalogProductsSearchClient';
import type { CatalogProductSearchHit } from '@/lib/catalogPublic';
import { mergeCatalogSearchHits } from '@/lib/mergeCatalogSearchHits';
import { useInfiniteScrollSentinel } from '@/lib/useInfiniteScrollSentinel';

type Props = {
  categoryId: string;
  initialHits: CatalogProductSearchHit[];
  initialTotal: number;
};

export function CategoryCatalogGridClient({
  categoryId,
  initialHits,
  initialTotal,
}: Props) {
  const [hits, setHits] = useState(initialHits);
  const [total, setTotal] = useState(initialTotal);
  const [loadedPage, setLoadedPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const hasMore = hits.length < total;

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = loadedPage + 1;
      const data = await fetchCatalogProductsSearchClient({
        categoryId,
        page: nextPage,
        limit: CATEGORY_PER_PAGE,
      });
      setHits((prev) => mergeCatalogSearchHits(prev, data.hits ?? []));
      setTotal(data.total ?? total);
      setLoadedPage(nextPage);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [categoryId, hasMore, loadedPage, total]);

  const sentinelRef = useInfiniteScrollSentinel(
    () => void loadMore(),
    hasMore && !loadingMore,
  );

  return (
    <>
      <CatalogProductGrid catalogHits={hits} />
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
