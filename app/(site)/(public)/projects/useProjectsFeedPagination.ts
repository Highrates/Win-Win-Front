'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchProjectsFeedPageClient, mergeProjectDataItems } from '@/lib/designersPublicClient';
import { projectsFeedFilterKey } from '@/lib/brandCaseForm';
import { useInfiniteScrollSentinel } from '@/lib/useInfiniteScrollSentinel';
import type { CasesPagination, ProjectData } from '../designers/designerProjectsTypes';

export type ProjectsFeedPagination = Extract<CasesPagination, { mode: 'projects-feed' }>;

type Args = {
  enabled: boolean;
  initialProjects: ProjectData[];
  pagination?: ProjectsFeedPagination;
  onFeedRooms?: (rooms: string[]) => void;
};

/**
 * Пагинация и рефетч единой ленты `GET /projects/cases` (mode: projects-feed).
 * Отдельно от designer/public в `useCasesPagination`.
 */
export function useProjectsFeedPagination({
  enabled,
  initialProjects,
  pagination,
  onFeedRooms,
}: Args) {
  const [items, setItems] = useState(initialProjects);
  const [loadedPage, setLoadedPage] = useState(1);
  const [casesTotal, setCasesTotal] = useState(pagination?.total ?? initialProjects.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const loadingMoreRef = useRef(false);
  const filterRequestId = useRef(0);
  const feedKeyRef = useRef<string>('');
  const feedWasClearedRef = useRef(false);
  const onFeedRoomsRef = useRef(onFeedRooms);
  onFeedRoomsRef.current = onFeedRooms;

  useEffect(() => {
    if (!enabled || !pagination) {
      if (feedKeyRef.current) feedWasClearedRef.current = true;
      feedKeyRef.current = '';
      return;
    }
    const key = projectsFeedFilterKey(pagination);
    if (key === feedKeyRef.current) return;

    const hydrateFromSsr = feedKeyRef.current === '' && !feedWasClearedRef.current;
    feedKeyRef.current = key;
    feedWasClearedRef.current = false;

    if (hydrateFromSsr) {
      setItems(initialProjects);
      setLoadedPage(1);
      setCasesTotal(pagination.total);
      return;
    }

    const reqId = ++filterRequestId.current;
    let cancelled = false;
    setFilterLoading(true);
    void (async () => {
      const data = await fetchProjectsFeedPageClient({
        page: 1,
        limit: pagination.pageSize,
        productId: pagination.productId,
        brandSlug: pagination.brandSlug,
        productBrandSlug: pagination.productBrandSlug,
        source: pagination.source,
        room: pagination.room,
        hasProducts: pagination.hasProducts,
      });
      if (cancelled || reqId !== filterRequestId.current) return;
      setItems(data.projects);
      setCasesTotal(data.total);
      setLoadedPage(1);
      onFeedRoomsRef.current?.(data.rooms);
      setFilterLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, pagination, initialProjects]);

  const hasMore = Boolean(enabled && pagination) && items.length < casesTotal && !filterLoading;

  const loadMore = useCallback(async () => {
    if (!enabled || !pagination || loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = loadedPage + 1;
      const data = await fetchProjectsFeedPageClient({
        page: nextPage,
        limit: pagination.pageSize,
        productId: pagination.productId,
        brandSlug: pagination.brandSlug,
        productBrandSlug: pagination.productBrandSlug,
        source: pagination.source,
        room: pagination.room,
        hasProducts: pagination.hasProducts,
      });
      setItems((prev) => mergeProjectDataItems(prev, data.projects));
      setCasesTotal(data.total);
      setLoadedPage(nextPage);
      if (data.rooms.length) onFeedRoomsRef.current?.(data.rooms);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [enabled, pagination, hasMore, loadedPage]);

  const sentinelRef = useInfiniteScrollSentinel(() => void loadMore(), hasMore && !loadingMore);

  return {
    items: enabled ? items : initialProjects,
    filterLoading: enabled ? filterLoading : false,
    hasMore: enabled ? hasMore : false,
    sentinelRef: enabled ? sentinelRef : undefined,
  };
}
