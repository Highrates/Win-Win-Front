/** @vitest-environment jsdom */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchUserOrdersList = vi.fn();
const fetchUserSourcingRequestsList = vi.fn();

vi.mock('@/lib/userOrders/clientApi', () => ({
  fetchUserOrdersList: (...args: unknown[]) => fetchUserOrdersList(...args),
}));

vi.mock('@/lib/userSourcingRequests/clientApi', () => ({
  fetchUserSourcingRequestsList: (...args: unknown[]) => fetchUserSourcingRequestsList(...args),
}));

function pageResult(opts: {
  orderIds: string[];
  sourcingIds?: string[];
  ordersTotal: number;
  sourcingTotal?: number;
  page: number;
}) {
  return [
    {
      items: opts.orderIds.map((id) => ({
        id,
        status: 'RECEIVED',
        totalAmount: 0,
        currency: 'RUB',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        items: [],
      })),
      total: opts.ordersTotal,
      page: opts.page,
      limit: 50,
    },
    {
      items: (opts.sourcingIds ?? []).map((id) => ({
        id,
        title: 't',
        deliveryCity: null,
        status: 'IN_PROGRESS',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        items: [],
      })),
      total: opts.sourcingTotal ?? 0,
      page: opts.page,
      limit: 50,
    },
  ] as const;
}

describe('useScopedOrdersFeed pagination', () => {
  beforeEach(() => {
    fetchUserOrdersList.mockReset();
    fetchUserSourcingRequestsList.mockReset();
  });

  it('loadMore дописывает page 2 и уменьшает remainingCount', async () => {
    fetchUserOrdersList.mockImplementation(async (page: number) => {
      if (page === 1) return pageResult({ orderIds: ['o1'], ordersTotal: 2, page: 1 })[0];
      return pageResult({ orderIds: ['o2'], ordersTotal: 2, page: 2 })[0];
    });
    fetchUserSourcingRequestsList.mockImplementation(async (page: number) => {
      if (page === 1) return pageResult({ orderIds: [], ordersTotal: 2, sourcingTotal: 0, page: 1 })[1];
      return pageResult({ orderIds: [], ordersTotal: 2, sourcingTotal: 0, page: 2 })[1];
    });

    const { useScopedOrdersFeed } = await import('./useScopedOrdersFeed');
    const { result } = renderHook(() => useScopedOrdersFeed('work'));

    await act(async () => {
      await result.current.load();
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.orders).toHaveLength(1);
    expect(result.current.remainingCount).toBe(1);

    await act(async () => {
      await result.current.loadMore();
    });
    await waitFor(() => expect(result.current.loadingMore).toBe(false));
    expect(result.current.orders.map((o) => o.id).sort()).toEqual(['o1', 'o2']);
    expect(result.current.remainingCount).toBe(0);
  });
});
