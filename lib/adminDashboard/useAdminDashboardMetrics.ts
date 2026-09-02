'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchCatalogDashboardSummary,
  fetchOrdersChatUnreadSummary,
  fetchOrdersDashboardSummary,
  fetchPartnersDashboardSummary,
  fetchQaUnreadSummary,
  fetchSignupDashboardSummary,
  fetchSourcingDashboardSummary,
} from '@/lib/adminDashboard/adminDashboardApi';
import {
  EMPTY_DASHBOARD_DATA,
  type DashboardData,
} from '@/lib/adminDashboard/dashboardData';
import type { DashboardDateRange } from '@/lib/adminDashboard/dashboardPeriod';

type Access = {
  canOrders: boolean;
  canCatalog: boolean;
  canApplications: boolean;
  canClients: boolean;
  showMetrics: boolean;
  permissionsLoading: boolean;
};

function isAbortError(err: unknown): boolean {
  return (
    (typeof DOMException !== 'undefined' &&
      err instanceof DOMException &&
      err.name === 'AbortError') ||
    (err instanceof Error && err.name === 'AbortError')
  );
}

function trackTask(
  tasks: Array<Promise<void>>,
  signal: AbortSignal,
  run: () => Promise<void>,
  onFail: () => void,
) {
  tasks.push(
    run().catch((err) => {
      if (signal.aborted || isAbortError(err)) return;
      onFail();
    }),
  );
}

export function useAdminDashboardMetrics(
  access: Access,
  range: DashboardDateRange,
  loadErrorMessage: string,
) {
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD_DATA);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const periodLoadGen = useRef(0);
  const snapshotLoadGen = useRef(0);
  const periodAbortRef = useRef<AbortController | null>(null);
  const snapshotAbortRef = useRef<AbortController | null>(null);

  const { canOrders, canCatalog, canApplications, canClients, showMetrics, permissionsLoading } =
    access;

  const loadSnapshotMetrics = useCallback(async () => {
    if (permissionsLoading || !showMetrics) {
      snapshotAbortRef.current?.abort();
      snapshotAbortRef.current = null;
      setData(EMPTY_DASHBOARD_DATA);
      setSnapshotLoading(false);
      setMetricsError(null);
      return;
    }

    snapshotAbortRef.current?.abort();
    const ac = new AbortController();
    snapshotAbortRef.current = ac;
    const gen = ++snapshotLoadGen.current;
    setSnapshotLoading(true);
    setMetricsError(null);

    try {
      const patch: Partial<DashboardData> = {};
      const tasks: Array<Promise<void>> = [];
      let failed = 0;
      const onFail = () => {
        failed += 1;
      };

      if (canOrders) {
        patch.ordersChat = null;
        trackTask(
          tasks,
          ac.signal,
          async () => {
            patch.ordersChat = await fetchOrdersChatUnreadSummary(ac.signal);
          },
          onFail,
        );
      }
      if (canCatalog) {
        patch.qaUnread = null;
        patch.catalog = null;
        trackTask(
          tasks,
          ac.signal,
          async () => {
            const j = await fetchQaUnreadSummary(ac.signal);
            patch.qaUnread = typeof j.total === 'number' ? j.total : 0;
          },
          onFail,
        );
        trackTask(
          tasks,
          ac.signal,
          async () => {
            patch.catalog = await fetchCatalogDashboardSummary(ac.signal);
          },
          onFail,
        );
      }

      await Promise.all(tasks);
      if (ac.signal.aborted || gen !== snapshotLoadGen.current) return;
      setData((prev) => ({ ...prev, ...patch }));
      if (failed > 0) setMetricsError(loadErrorMessage);
    } catch (err) {
      if (ac.signal.aborted || isAbortError(err) || gen !== snapshotLoadGen.current) return;
      setMetricsError(loadErrorMessage);
    } finally {
      if (gen === snapshotLoadGen.current) setSnapshotLoading(false);
    }
  }, [canCatalog, canOrders, loadErrorMessage, permissionsLoading, showMetrics]);

  const loadPeriodMetrics = useCallback(async () => {
    if (permissionsLoading || !showMetrics) {
      periodAbortRef.current?.abort();
      periodAbortRef.current = null;
      setPeriodLoading(false);
      return;
    }

    periodAbortRef.current?.abort();
    const ac = new AbortController();
    periodAbortRef.current = ac;
    const gen = ++periodLoadGen.current;
    setPeriodLoading(true);
    setMetricsError(null);

    try {
      const patch: Partial<DashboardData> = {};
      const tasks: Array<Promise<void>> = [];
      let failed = 0;
      const onFail = () => {
        failed += 1;
      };

      if (canOrders) {
        patch.orders = null;
        patch.sourcing = null;
        trackTask(
          tasks,
          ac.signal,
          async () => {
            patch.orders = await fetchOrdersDashboardSummary(range, ac.signal);
          },
          onFail,
        );
        trackTask(
          tasks,
          ac.signal,
          async () => {
            patch.sourcing = await fetchSourcingDashboardSummary(range, ac.signal);
          },
          onFail,
        );
      }
      if (canApplications) {
        patch.partners = null;
        trackTask(
          tasks,
          ac.signal,
          async () => {
            patch.partners = await fetchPartnersDashboardSummary(range, ac.signal);
          },
          onFail,
        );
      }
      if (canClients) {
        patch.signups = null;
        trackTask(
          tasks,
          ac.signal,
          async () => {
            patch.signups = await fetchSignupDashboardSummary(range, ac.signal);
          },
          onFail,
        );
      }

      await Promise.all(tasks);
      if (ac.signal.aborted || gen !== periodLoadGen.current) return;
      setData((prev) => ({ ...prev, ...patch }));
      if (failed > 0) setMetricsError(loadErrorMessage);
    } catch (err) {
      if (ac.signal.aborted || isAbortError(err) || gen !== periodLoadGen.current) return;
      setMetricsError(loadErrorMessage);
    } finally {
      if (gen === periodLoadGen.current) setPeriodLoading(false);
    }
  }, [
    canApplications,
    canClients,
    canOrders,
    loadErrorMessage,
    permissionsLoading,
    range,
    showMetrics,
  ]);

  const reload = useCallback(async () => {
    await Promise.all([loadSnapshotMetrics(), loadPeriodMetrics()]);
  }, [loadPeriodMetrics, loadSnapshotMetrics]);

  useEffect(() => {
    void loadSnapshotMetrics();
  }, [loadSnapshotMetrics]);

  useEffect(() => {
    void loadPeriodMetrics();
  }, [loadPeriodMetrics]);

  useEffect(
    () => () => {
      periodAbortRef.current?.abort();
      snapshotAbortRef.current?.abort();
    },
    [],
  );

  return {
    data,
    metricsError,
    periodLoading,
    snapshotLoading,
    metricsLoading: periodLoading || snapshotLoading,
    reload,
  };
}
