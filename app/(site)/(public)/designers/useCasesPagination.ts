'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchDesignerCasesPageClient,
  fetchPublicCasesPageClient,
  mergeProjectDataItems,
} from '@/lib/designersPublicClient';
import { useInfiniteScrollSentinel } from '@/lib/useInfiniteScrollSentinel';
import type { CasesPagination, ProductFilterTab, ProjectData } from './designerProjectsTypes';

type Args = {
  initialProjects: ProjectData[];
  /** designer | public; projects-feed обрабатывает `useProjectsFeedPagination`. */
  casesPagination?: Exclude<CasesPagination, { mode: 'projects-feed' }>;
  productFilter: ProductFilterTab;
  productFilterTabs: boolean;
};

type TabCacheKey = 'all' | 'with-products';

type TabCache = {
  items: ProjectData[];
  total: number;
  loadedPage: number;
};

function tabKey(hasProducts: boolean): TabCacheKey {
  return hasProducts ? 'with-products' : 'all';
}

/** Пагинация кейсов дизайнера и публичного списка (не unified feed). */
export function useCasesPagination({
  initialProjects,
  casesPagination,
  productFilter,
  productFilterTabs,
}: Args) {
  const [items, setItems] = useState(initialProjects);
  const [loadedPage, setLoadedPage] = useState(1);
  const [casesTotal, setCasesTotal] = useState(casesPagination?.total ?? initialProjects.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const loadingMoreRef = useRef(false);
  const filterRequestId = useRef(0);
  const cacheRef = useRef<Partial<Record<TabCacheKey, TabCache>>>({});
  const didMountFilter = useRef(false);

  const hasProducts = productFilterTabs && productFilter === 'with-products';
  const serverFilter =
    Boolean(casesPagination && casesPagination.mode === 'designer' && productFilterTabs);

  const persistTab = useCallback((key: TabCacheKey, entry: TabCache) => {
    cacheRef.current[key] = entry;
  }, []);

  useEffect(() => {
    const total = casesPagination?.total ?? initialProjects.length;
    setItems(initialProjects);
    setLoadedPage(1);
    setCasesTotal(total);
    persistTab('all', { items: initialProjects, total, loadedPage: 1 });
    delete cacheRef.current['with-products'];
    didMountFilter.current = false;
  }, [initialProjects, casesPagination?.total, casesPagination?.mode, persistTab, casesPagination]);

  const designerSlug =
    casesPagination?.mode === 'designer' ? casesPagination.designerSlug : null;
  const pageSize = casesPagination?.pageSize;

  useEffect(() => {
    if (!serverFilter || !designerSlug || pageSize == null) return;
    if (!didMountFilter.current) {
      didMountFilter.current = true;
      if (!hasProducts) return;
    }

    const key = tabKey(hasProducts);
    const cached = cacheRef.current[key];
    if (cached) {
      setItems(cached.items);
      setCasesTotal(cached.total);
      setLoadedPage(cached.loadedPage);
      setFilterLoading(false);
      return;
    }

    if (hasProducts) {
      setItems((prev) => prev.filter((p) => p.products.length > 0));
    }

    const reqId = ++filterRequestId.current;
    let cancelled = false;
    setFilterLoading(true);
    void (async () => {
      const data = await fetchDesignerCasesPageClient(designerSlug, 1, pageSize, { hasProducts });
      if (cancelled || reqId !== filterRequestId.current) return;
      if (data) {
        setItems(data.projects);
        setCasesTotal(data.total);
        setLoadedPage(1);
        persistTab(key, {
          items: data.projects,
          total: data.total,
          loadedPage: 1,
        });
      }
      setFilterLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [serverFilter, hasProducts, designerSlug, pageSize, persistTab]);

  const hasMore = Boolean(casesPagination) && items.length < casesTotal && !filterLoading;

  const loadMore = useCallback(async () => {
    if (!casesPagination || loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = loadedPage + 1;
      if (casesPagination.mode === 'designer') {
        const data = await fetchDesignerCasesPageClient(
          casesPagination.designerSlug,
          nextPage,
          casesPagination.pageSize,
          { hasProducts: serverFilter && hasProducts },
        );
        if (data) {
          setItems((prev) => {
            const next = mergeProjectDataItems(prev, data.projects);
            persistTab(tabKey(serverFilter && hasProducts), {
              items: next,
              total: data.total,
              loadedPage: nextPage,
            });
            return next;
          });
          setCasesTotal(data.total);
          setLoadedPage(nextPage);
        }
      } else {
        const data = await fetchPublicCasesPageClient({
          page: nextPage,
          limit: casesPagination.pageSize,
          productId: casesPagination.productId,
        });
        setItems((prev) => mergeProjectDataItems(prev, data.projects));
        setCasesTotal(data.total);
        setLoadedPage(nextPage);
      }
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [casesPagination, hasMore, loadedPage, hasProducts, serverFilter, persistTab]);

  const sentinelRef = useInfiniteScrollSentinel(() => void loadMore(), hasMore && !loadingMore);

  return {
    items,
    casesTotal,
    filterLoading,
    hasMore,
    sentinelRef,
    clientFilterWithProducts: !serverFilter && productFilterTabs && hasProducts,
  };
}
