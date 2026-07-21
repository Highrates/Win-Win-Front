'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DESIGNERS_PER_PAGE } from '@/app/(site)/(public)/designers/designersListConstants';
import {
  DesignersCardsClient,
  type DesignersListItem,
} from '@/app/(site)/(public)/designers/DesignersCardsClient';
import {
  fetchDesignersPublicClient,
  mergeDesignersListItems,
} from '@/lib/designersPublicClient';
import { useInfiniteScrollSentinel } from '@/lib/useInfiniteScrollSentinel';
import styles from './DesignersPage.module.css';

type Props = {
  initialItems: DesignersListItem[];
  initialTotal: number;
  query: string;
};

export function DesignersListClient({ initialItems, initialTotal, query }: Props) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [loadedPage, setLoadedPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    setItems(initialItems);
    setTotal(initialTotal);
    setLoadedPage(1);
  }, [initialItems, initialTotal, query]);

  const hasMore = items.length < total;

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = loadedPage + 1;
      const data = await fetchDesignersPublicClient({
        page: nextPage,
        limit: DESIGNERS_PER_PAGE,
        q: query || undefined,
      });
      setItems((prev) => mergeDesignersListItems(prev, data.items));
      setTotal(data.total);
      setLoadedPage(nextPage);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, loadedPage, query]);

  const sentinelRef = useInfiniteScrollSentinel(
    () => void loadMore(),
    hasMore && !loadingMore,
  );

  return (
    <>
      <DesignersCardsClient items={items} />
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
