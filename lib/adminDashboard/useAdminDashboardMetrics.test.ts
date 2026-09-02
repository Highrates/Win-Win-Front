/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rangeForPreset } from '@/lib/adminDashboard/dashboardPeriod';
import { useAdminDashboardMetrics } from '@/lib/adminDashboard/useAdminDashboardMetrics';

const fetchOrdersDashboardSummary = vi.fn();
const fetchSourcingDashboardSummary = vi.fn();
const fetchOrdersChatUnreadSummary = vi.fn();
const fetchQaUnreadSummary = vi.fn();
const fetchCatalogDashboardSummary = vi.fn();
const fetchPartnersDashboardSummary = vi.fn();
const fetchSignupDashboardSummary = vi.fn();

vi.mock('@/lib/adminDashboard/adminDashboardApi', () => ({
  fetchOrdersDashboardSummary: (...args: unknown[]) => fetchOrdersDashboardSummary(...args),
  fetchSourcingDashboardSummary: (...args: unknown[]) => fetchSourcingDashboardSummary(...args),
  fetchOrdersChatUnreadSummary: (...args: unknown[]) => fetchOrdersChatUnreadSummary(...args),
  fetchQaUnreadSummary: (...args: unknown[]) => fetchQaUnreadSummary(...args),
  fetchCatalogDashboardSummary: (...args: unknown[]) => fetchCatalogDashboardSummary(...args),
  fetchPartnersDashboardSummary: (...args: unknown[]) => fetchPartnersDashboardSummary(...args),
  fetchSignupDashboardSummary: (...args: unknown[]) => fetchSignupDashboardSummary(...args),
}));

const accessAll = {
  canOrders: true,
  canCatalog: true,
  canApplications: true,
  canClients: true,
  showMetrics: true,
  permissionsLoading: false,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAdminDashboardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchOrdersDashboardSummary.mockResolvedValue({ new: 1, active: 2 });
    fetchSourcingDashboardSummary.mockResolvedValue({ pendingReview: 0, inProgress: 0 });
    fetchOrdersChatUnreadSummary.mockResolvedValue({
      total: 0,
      new: 0,
      active: 0,
      completed: 0,
    });
    fetchQaUnreadSummary.mockResolvedValue({ total: 0 });
    fetchCatalogDashboardSummary.mockResolvedValue({
      noModifications: 0,
      noVariants: 0,
      activeEmpty: 0,
      elementEmptyPool: 0,
      compositeIncomplete: 0,
    });
    fetchPartnersDashboardSummary.mockResolvedValue({ new: 0 });
    fetchSignupDashboardSummary.mockResolvedValue({ new: 0 });
  });

  it('loads period + snapshot metrics', async () => {
    const range = rangeForPreset('today');
    const { result } = renderHook(() =>
      useAdminDashboardMetrics(accessAll, range, 'load failed'),
    );

    await waitFor(() => {
      expect(result.current.data.orders).toEqual({ new: 1, active: 2 });
      expect(result.current.periodLoading).toBe(false);
      expect(result.current.snapshotLoading).toBe(false);
    });

    expect(result.current.metricsError).toBeNull();
    expect(fetchOrdersDashboardSummary).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(AbortSignal),
    );
  });

  it('aborts in-flight period fetch when range changes and keeps latest result', async () => {
    const first = deferred<{ new: number; active: number }>();
    const second = deferred<{ new: number; active: number }>();
    let call = 0;
    fetchOrdersDashboardSummary.mockImplementation((_range: unknown, signal?: AbortSignal) => {
      call += 1;
      const d = call === 1 ? first : second;
      return new Promise((resolve, reject) => {
        const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
        if (signal?.aborted) {
          onAbort();
          return;
        }
        signal?.addEventListener('abort', onAbort, { once: true });
        void d.promise.then(
          (v) => {
            signal?.removeEventListener('abort', onAbort);
            resolve(v);
          },
          (e) => {
            signal?.removeEventListener('abort', onAbort);
            reject(e);
          },
        );
      });
    });

    const today = rangeForPreset('today');
    const month = rangeForPreset('month');
    const { result, rerender } = renderHook(
      ({ range }) => useAdminDashboardMetrics(accessAll, range, 'load failed'),
      { initialProps: { range: today } },
    );

    await waitFor(() => {
      expect(fetchOrdersDashboardSummary).toHaveBeenCalledTimes(1);
    });

    rerender({ range: month });

    await waitFor(() => {
      expect(fetchOrdersDashboardSummary).toHaveBeenCalledTimes(2);
    });

    // Late first response must not win after abort.
    await act(async () => {
      first.resolve({ new: 99, active: 99 });
      second.resolve({ new: 7, active: 8 });
    });

    await waitFor(() => {
      expect(result.current.data.orders).toEqual({ new: 7, active: 8 });
      expect(result.current.periodLoading).toBe(false);
    });
    expect(result.current.metricsError).toBeNull();
  });

  it('does not treat abort as a metrics error', async () => {
    const first = deferred<{ new: number; active: number }>();
    let call = 0;
    fetchOrdersDashboardSummary.mockImplementation((_range: unknown, signal?: AbortSignal) => {
      call += 1;
      if (call === 1) {
        return new Promise((resolve, reject) => {
          const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
          signal?.addEventListener('abort', onAbort, { once: true });
          void first.promise.then(resolve, reject);
        });
      }
      return Promise.resolve({ new: 3, active: 4 });
    });

    const { result, rerender } = renderHook(
      ({ range }) => useAdminDashboardMetrics(accessAll, range, 'load failed'),
      { initialProps: { range: rangeForPreset('today') } },
    );

    await waitFor(() => expect(fetchOrdersDashboardSummary).toHaveBeenCalledTimes(1));
    rerender({ range: rangeForPreset('month') });

    await waitFor(() => {
      expect(result.current.data.orders).toEqual({ new: 3, active: 4 });
    });
    expect(result.current.metricsError).toBeNull();
  });

  it('aborts outstanding requests on unmount', async () => {
    const signals: AbortSignal[] = [];
    fetchOrdersDashboardSummary.mockImplementation((_range: unknown, signal?: AbortSignal) => {
      if (signal) signals.push(signal);
      return new Promise(() => {});
    });

    const { unmount } = renderHook(() =>
      useAdminDashboardMetrics(accessAll, rangeForPreset('today'), 'load failed'),
    );

    await waitFor(() => expect(signals.length).toBeGreaterThan(0));
    unmount();
    expect(signals.every((s) => s.aborted)).toBe(true);
  });
});
