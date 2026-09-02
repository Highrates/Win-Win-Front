'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { staffCanAssistant } from '@win-win/admin-sections';
import { adminDashboardStrings } from '@/lib/admin-i18n/adminChromeI18n';
import { adminDashboardAnalyticsStrings } from '@/lib/admin-i18n/adminDashboardAnalyticsI18n';
import {
  buildAssistantInsights,
  buildDashboardPeriodCopy,
} from '@/lib/admin-i18n/adminDashboardInsightsI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useAdminPermissions } from '@/lib/adminPermissions/AdminPermissionsProvider';
import {
  formatPeriodRange,
  rangeForPreset,
  toDateInputValue,
  type DashboardDateRange,
  type DashboardPeriodPreset,
} from '@/lib/adminDashboard/dashboardPeriod';
import { useAdminDashboardMetrics } from '@/lib/adminDashboard/useAdminDashboardMetrics';
import catalogStyles from './catalog/catalogAdmin.module.css';
import { AdminDashboardCatalogSection } from './AdminDashboardCatalogSection';
import { AdminDashboardInsightsPanel } from './AdminDashboardInsightsPanel';
import { AdminDashboardKpiColumn } from './AdminDashboardKpiColumn';
import { AdminDashboardPeriodBar } from './AdminDashboardPeriodBar';
import styles from './AdminDashboard.module.css';

export function AdminDashboardClient() {
  const { locale } = useAdminLocale();
  const { canAccessSection, loading: permissionsLoading, sections, isSuperAdmin } =
    useAdminPermissions();
  const { title, accessDenied } = adminDashboardStrings(locale);
  const s = adminDashboardAnalyticsStrings(locale);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showDeniedBanner, setShowDeniedBanner] = useState(false);
  const [preset, setPreset] = useState<DashboardPeriodPreset>('today');
  const [range, setRange] = useState<DashboardDateRange>(() => rangeForPreset('today'));
  const [appliedFrom, setAppliedFrom] = useState(() => toDateInputValue(new Date()));
  const [appliedTo, setAppliedTo] = useState(() => toDateInputValue(new Date()));
  const [insightsCollapsed, setInsightsCollapsed] = useState(false);

  const canOrders = !permissionsLoading && canAccessSection('orders');
  const canCatalog = !permissionsLoading && canAccessSection('catalog');
  const canApplications = !permissionsLoading && canAccessSection('applications');
  const canClients = !permissionsLoading && canAccessSection('clients');
  const canAssistant =
    !permissionsLoading && staffCanAssistant(sections, isSuperAdmin);
  const showMetrics = canOrders || canCatalog || canApplications || canClients;

  const { data, metricsError, periodLoading, snapshotLoading, metricsLoading, reload } =
    useAdminDashboardMetrics(
      {
        canOrders,
        canCatalog,
        canApplications,
        canClients,
        showMetrics,
        permissionsLoading,
      },
      range,
      s.loadError,
    );

  useEffect(() => {
    if (searchParams.get('denied') === '1') {
      setShowDeniedBanner(true);
      router.replace('/admin');
    }
  }, [searchParams, router]);

  const selectPreset = (next: 'today' | 'month', nextRange: DashboardDateRange) => {
    setPreset(next);
    setRange(nextRange);
    setAppliedFrom(toDateInputValue(nextRange.from));
    const lastInclusive = new Date(nextRange.to);
    lastInclusive.setDate(lastInclusive.getDate() - 1);
    setAppliedTo(toDateInputValue(lastInclusive));
  };

  const applyCustomRange = (nextRange: DashboardDateRange, fromYmd: string, toYmd: string) => {
    setAppliedFrom(fromYmd);
    setAppliedTo(toYmd);
    setPreset('custom');
    setRange(nextRange);
  };

  const periodCopy = useMemo(
    () => buildDashboardPeriodCopy(preset, locale, appliedFrom, appliedTo),
    [preset, locale, appliedFrom, appliedTo],
  );

  const insights = useMemo(
    () => buildAssistantInsights(data, metricsLoading, locale, periodCopy),
    [data, metricsLoading, locale, periodCopy],
  );

  const customChipLabel =
    preset === 'custom' ? formatPeriodRange(appliedFrom, appliedTo) : s.chipPeriod;

  const periodBusy = permissionsLoading || periodLoading;
  const snapshotBusy = permissionsLoading || snapshotLoading;
  const kpiBusy = periodBusy || snapshotBusy;

  return (
    <main>
      {showDeniedBanner ? (
        <div className={catalogStyles.errorBanner} role="alert">
          <span>{accessDenied}</span>
          <button
            type="button"
            className={catalogStyles.errorBannerDismiss}
            onClick={() => setShowDeniedBanner(false)}
            aria-label={s.dismissAria}
          >
            ×
          </button>
        </div>
      ) : null}
      <h1 className={catalogStyles.title}>{title}</h1>

      {permissionsLoading ? <p className={catalogStyles.lead}>{s.loading}</p> : null}

      {!permissionsLoading && showMetrics ? (
        <section aria-label={title}>
          <AdminDashboardPeriodBar
            s={s}
            preset={preset}
            appliedFrom={appliedFrom}
            appliedTo={appliedTo}
            customChipLabel={customChipLabel}
            metricsLoading={metricsLoading}
            onSelectPreset={selectPreset}
            onApplyCustom={applyCustomRange}
          />

          {metricsError ? (
            <div className={catalogStyles.errorBanner} role="alert">
              <span>{metricsError}</span>
              <button
                type="button"
                className={catalogStyles.errorBannerDismiss}
                onClick={() => void reload()}
              >
                {s.retry}
              </button>
            </div>
          ) : null}

          <div
            className={`${styles.summaryRow} ${
              insightsCollapsed ? styles.summaryRowCollapsed : ''
            }`}
          >
            <AdminDashboardKpiColumn
              s={s}
              data={data}
              range={range}
              periodBusy={periodBusy}
              snapshotBusy={snapshotBusy}
              kpiBusy={kpiBusy}
              canOrders={canOrders}
              canCatalog={canCatalog}
              canApplications={canApplications}
              canClients={canClients}
            />
            <AdminDashboardInsightsPanel
              s={s}
              insights={insights}
              metricsLoading={metricsLoading}
              collapsed={insightsCollapsed}
              canAssistant={canAssistant}
              onCollapsedChange={setInsightsCollapsed}
            />
          </div>

          {canCatalog ? (
            <AdminDashboardCatalogSection s={s} data={data} snapshotBusy={snapshotBusy} />
          ) : null}
        </section>
      ) : null}

      {!permissionsLoading && !showMetrics ? (
        <p className={catalogStyles.lead}>{s.noSections}</p>
      ) : null}
    </main>
  );
}
