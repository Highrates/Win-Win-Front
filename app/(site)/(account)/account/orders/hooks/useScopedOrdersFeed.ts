'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { buildWorkFeed, mergeUniqueById, type WorkFeedItem } from '@/lib/account/workFeed';
import { fetchUserOrdersList } from '@/lib/userOrders/clientApi';
import { sortUserOrdersByUpdatedDesc } from '@/lib/userOrders/mapOrderToWorkCard';
import type { UserOrderListItemApi } from '@/lib/userOrders/types';
import { fetchUserSourcingRequestsList } from '@/lib/userSourcingRequests/clientApi';
import { sortSourcingRequestsByUpdatedDesc } from '@/lib/userSourcingRequests/mapSourcingToWorkCard';
import type { UserSourcingRequestListItemApi } from '@/lib/userSourcingRequests/types';

export const ORDERS_FEED_PAGE_SIZE = 50;

export type OrdersFeedScope = 'work' | 'completed';

export type ScopedOrdersFeed = {
  orders: UserOrderListItemApi[];
  sourcing: UserSourcingRequestListItemApi[];
  feed: WorkFeedItem[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  /** Сколько заказов + заявок ещё не загружено в список. */
  remainingCount: number;
  /**
   * `background`: без скелетона и без очистки списка при ошибке — карточки (и открытый в них чат
   * с file input) не размонтируются, когда вкладка получает focus после системного выбора файла.
   * Фоновое обновление перезагружает страницы 1..currentPage и заменяет списки.
   */
  load: (opts?: { background?: boolean }) => Promise<void>;
  loadMore: () => Promise<void>;
  /** Сбросить бейджи непрочитанного у карточки (после ack КП / прочтения чата). */
  clearEntityUnread: (kind: 'order' | 'sourcing', id: string) => void;
};

type PageResult = {
  orders: UserOrderListItemApi[];
  sourcing: UserSourcingRequestListItemApi[];
  ordersTotal: number;
  sourcingTotal: number;
};

async function fetchScopePages(scope: OrdersFeedScope, fromPage: number, toPage: number): Promise<PageResult> {
  const pages: number[] = [];
  for (let p = fromPage; p <= toPage; p += 1) pages.push(p);
  const results = await Promise.all(
    pages.map((page) =>
      Promise.all([
        fetchUserOrdersList(page, ORDERS_FEED_PAGE_SIZE, { scope }),
        fetchUserSourcingRequestsList(page, ORDERS_FEED_PAGE_SIZE, { scope }),
      ]),
    ),
  );
  let orders: UserOrderListItemApi[] = [];
  let sourcing: UserSourcingRequestListItemApi[] = [];
  let ordersTotal = 0;
  let sourcingTotal = 0;
  for (const [ordersRes, sourcingRes] of results) {
    orders = mergeUniqueById(orders, ordersRes.items);
    sourcing = mergeUniqueById(sourcing, sourcingRes.items);
    ordersTotal = ordersRes.total;
    sourcingTotal = sourcingRes.total;
  }
  return { orders, sourcing, ordersTotal, sourcingTotal };
}

export function useScopedOrdersFeed(scope: OrdersFeedScope): ScopedOrdersFeed {
  const [orders, setOrders] = useState<UserOrderListItemApi[]>([]);
  const [sourcing, setSourcing] = useState<UserSourcingRequestListItemApi[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [sourcingTotal, setSourcingTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const requestSeqRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const remainingCount =
    Math.max(0, ordersTotal - orders.length) + Math.max(0, sourcingTotal - sourcing.length);

  const remainingRef = useRef(remainingCount);
  remainingRef.current = remainingCount;

  const load = useCallback(
    async (opts?: { background?: boolean }) => {
      const background = opts?.background ?? false;
      /** Только полная (не фоновая) загрузка начинает новое «поколение» и отбрасывает устаревшие ответы. */
      if (!background) requestSeqRef.current += 1;
      const seq = requestSeqRef.current;
      if (!background) {
        pageRef.current = 1;
        setLoading(true);
        setError(null);
      }
      const upToPage = background ? pageRef.current : 1;
      try {
        const res = await fetchScopePages(scope, 1, upToPage);
        if (seq !== requestSeqRef.current) return;
        setOrders(sortUserOrdersByUpdatedDesc(res.orders));
        setSourcing(sortSourcingRequestsByUpdatedDesc(res.sourcing));
        setOrdersTotal(res.ordersTotal);
        setSourcingTotal(res.sourcingTotal);
        setError(null);
      } catch (e) {
        if (background || seq !== requestSeqRef.current) return;
        setError(e instanceof Error ? e.message : 'Не удалось загрузить заказы');
        setOrders([]);
        setSourcing([]);
        setOrdersTotal(0);
        setSourcingTotal(0);
      } finally {
        if (!background && seq === requestSeqRef.current) setLoading(false);
      }
    },
    [scope],
  );

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || remainingRef.current <= 0) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const seq = requestSeqRef.current;
    const nextPage = pageRef.current + 1;
    try {
      const res = await fetchScopePages(scope, nextPage, nextPage);
      if (seq !== requestSeqRef.current) return;
      pageRef.current = nextPage;
      setOrders((prev) => sortUserOrdersByUpdatedDesc(mergeUniqueById(prev, res.orders)));
      setSourcing((prev) => sortSourcingRequestsByUpdatedDesc(mergeUniqueById(prev, res.sourcing)));
      setOrdersTotal(res.ordersTotal);
      setSourcingTotal(res.sourcingTotal);
      setError(null);
    } catch (e) {
      if (seq !== requestSeqRef.current) return;
      setError(e instanceof Error ? e.message : 'Не удалось загрузить заказы');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [scope]);

  const clearEntityUnread = useCallback((kind: 'order' | 'sourcing', id: string) => {
    if (kind === 'sourcing') {
      setSourcing((prev) =>
        prev.map((r) => (r.id === id ? { ...r, unreadStaffChatCount: 0, hasUnseenCommercialProposal: false } : r)),
      );
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, unreadStaffChatCount: 0, hasUnseenCommercialProposal: false } : o)),
      );
    }
  }, []);

  const feed = useMemo(() => buildWorkFeed(orders, sourcing), [orders, sourcing]);

  return {
    orders,
    sourcing,
    feed,
    loading,
    loadingMore,
    error,
    remainingCount,
    load,
    loadMore,
    clearEntityUnread,
  };
}
