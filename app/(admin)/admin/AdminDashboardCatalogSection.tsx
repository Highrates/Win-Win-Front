'use client';

import Link from 'next/link';
import type { adminDashboardAnalyticsStrings } from '@/lib/admin-i18n/adminDashboardAnalyticsI18n';
import { kpiDisplay, type DashboardData } from '@/lib/adminDashboard/dashboardData';
import styles from './AdminDashboard.module.css';

type Strings = ReturnType<typeof adminDashboardAnalyticsStrings>;

/** Только взаимно исключающие бакеты. `active_empty` — rollup фильтра списка, не KPI. */
const HYGIENE_ROWS: Array<{
  key: string;
  href: string;
  label: (s: Strings) => string;
  hint: (s: Strings) => string;
  value: (data: DashboardData) => number | null | undefined;
}> = [
  {
    key: 'no_modifications',
    href: '/admin/catalog/products?hygiene=no_modifications',
    label: (s) => s.catalogNoMods,
    hint: (s) => s.catalogNoModsHint,
    value: (d) => d.catalog?.noModifications,
  },
  {
    key: 'no_variants',
    href: '/admin/catalog/products?hygiene=no_variants',
    label: (s) => s.catalogNoVariants,
    hint: (s) => s.catalogNoVariantsHint,
    value: (d) => d.catalog?.noVariants,
  },
  {
    key: 'element_empty_pool',
    href: '/admin/catalog/products?hygiene=element_empty_pool',
    label: (s) => s.catalogElementEmptyPool,
    hint: (s) => s.catalogElementEmptyPoolHint,
    value: (d) => d.catalog?.elementEmptyPool,
  },
  {
    key: 'composite_incomplete',
    href: '/admin/catalog/products?hygiene=composite_incomplete',
    label: (s) => s.catalogCompositeIncomplete,
    hint: (s) => s.catalogCompositeIncompleteHint,
    value: (d) => d.catalog?.compositeIncomplete,
  },
];

type Props = {
  s: Strings;
  data: DashboardData;
  snapshotBusy: boolean;
};

export function AdminDashboardCatalogSection({ s, data, snapshotBusy }: Props) {
  return (
    <section className={styles.catalogSection} aria-label={s.catalogTitle}>
      <div className={styles.catalogSectionHead}>
        <h2 className={styles.kpiTitle}>{s.catalogTitle}</h2>
        <span className={styles.kpiScopeBadge}>{s.scopeSnapshot}</span>
      </div>
      <div className={styles.catalogMetricList}>
        {HYGIENE_ROWS.map((row) => (
          <Link key={row.key} href={row.href} className={styles.catalogMetricItem}>
            <div className={styles.catalogMetricTop}>
              <span className={styles.catalogMetricLabel}>{row.label(s)}</span>
              <span className={styles.catalogMetricValue}>
                {kpiDisplay(snapshotBusy, row.value(data))}
              </span>
            </div>
            <p className={styles.catalogMetricHint}>{row.hint(s)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
