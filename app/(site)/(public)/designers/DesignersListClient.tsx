'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  selectedServices?: string[];
  onTotalChange?: (total: number) => void;
};

function designerMatchesServices(item: DesignersListItem, services: string[]): boolean {
  if (!services.length) return true;
  const line = (item.servicesLine ?? '').toLowerCase();
  if (!line.trim()) return false;
  return services.some((s) => line.includes(s.trim().toLowerCase()));
}

export function DesignersListClient({
  initialItems,
  initialTotal,
  query,
  selectedServices = [],
  onTotalChange,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [apiTotal, setApiTotal] = useState(initialTotal);
  const [loadedPage, setLoadedPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const visibleItems = useMemo(
    () => items.filter((item) => designerMatchesServices(item, selectedServices)),
    [items, selectedServices],
  );

  const displayTotal = selectedServices.length ? visibleItems.length : apiTotal;

  useEffect(() => {
    setItems(initialItems);
    setApiTotal(initialTotal);
    setLoadedPage(1);
  }, [initialItems, initialTotal, query]);

  useEffect(() => {
    onTotalChange?.(displayTotal);
  }, [displayTotal, onTotalChange]);

  const hasMore = items.length < apiTotal;

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
      setApiTotal(data.total);
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
      <DesignersCardsClient items={visibleItems} />
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
