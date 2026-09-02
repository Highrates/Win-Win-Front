'use client';

import Link from 'next/link';
import type { adminDashboardAnalyticsStrings } from '@/lib/admin-i18n/adminDashboardAnalyticsI18n';
import { kpiDisplay, type DashboardData } from '@/lib/adminDashboard/dashboardData';
import {
  hrefWithDashboardPeriod,
  type DashboardDateRange,
} from '@/lib/adminDashboard/dashboardPeriod';
import styles from './AdminDashboard.module.css';

type Strings = ReturnType<typeof adminDashboardAnalyticsStrings>;

type Props = {
  s: Strings;
  data: DashboardData;
  range: DashboardDateRange;
  periodBusy: boolean;
  snapshotBusy: boolean;
  kpiBusy: boolean;
  canOrders: boolean;
  canCatalog: boolean;
  canApplications: boolean;
  canClients: boolean;
};

export function AdminDashboardKpiColumn({
  s,
  data,
  range,
  periodBusy,
  snapshotBusy,
  kpiBusy,
  canOrders,
  canCatalog,
  canApplications,
  canClients,
}: Props) {
  return (
    <div className={styles.kpiColumn} aria-busy={kpiBusy}>
      {canOrders || canApplications || canClients ? (
        <div className={styles.kpiScope}>
          <div className={styles.kpiGrid}>
            {canOrders ? (
              <article className={styles.kpi} aria-label={s.ordersTitle}>
                <div className={styles.kpiHead}>
                  <h2 className={styles.kpiTitle}>{s.ordersTitle}</h2>
                </div>
                <div className={styles.blockMeta}>
                  <Link
                    href={hrefWithDashboardPeriod('/admin/orders', range, { bucket: 'new' })}
                    className={styles.blockMetaItem}
                  >
                    <span className={styles.blockMetaValue}>
                      {kpiDisplay(periodBusy, data.orders?.new)}
                    </span>
                    <span className={styles.blockMetaLabel}>{s.ordersNew}</span>
                  </Link>
                  <Link
                    href={hrefWithDashboardPeriod('/admin/orders', range, { bucket: 'active' })}
                    className={styles.blockMetaItem}
                  >
                    <span className={styles.blockMetaValue}>
                      {kpiDisplay(periodBusy, data.orders?.active)}
                    </span>
                    <span className={styles.blockMetaLabel}>{s.ordersActive}</span>
                  </Link>
                </div>
              </article>
            ) : null}

            {canOrders ? (
              <article className={styles.kpi} aria-label={s.sourcingTitle}>
                <div className={styles.kpiHead}>
                  <h2 className={styles.kpiTitle}>{s.sourcingTitle}</h2>
                </div>
                <div className={styles.blockMeta}>
                  <Link
                    href={hrefWithDashboardPeriod('/admin/orders', range, {
                      section: 'sourcing',
                      bucket: 'new',
                    })}
                    className={styles.blockMetaItem}
                  >
                    <span className={styles.blockMetaValue}>
                      {kpiDisplay(periodBusy, data.sourcing?.pendingReview)}
                    </span>
                    <span className={styles.blockMetaLabel}>{s.sourcingPending}</span>
                  </Link>
                  <Link
                    href={hrefWithDashboardPeriod('/admin/orders', range, {
                      section: 'sourcing',
                      bucket: 'active',
                    })}
                    className={styles.blockMetaItem}
                  >
                    <span className={styles.blockMetaValue}>
                      {kpiDisplay(periodBusy, data.sourcing?.inProgress)}
                    </span>
                    <span className={styles.blockMetaLabel}>{s.sourcingInProgress}</span>
                  </Link>
                </div>
              </article>
            ) : null}

            {canApplications ? (
              <article className={styles.kpi} aria-label={s.partnersTitle}>
                <div className={styles.kpiHead}>
                  <h2 className={styles.kpiTitle}>{s.partnersTitle}</h2>
                </div>
                <div className={styles.blockMeta}>
                  <Link
                    href={hrefWithDashboardPeriod('/admin/applications', range)}
                    className={styles.blockMetaItem}
                  >
                    <span className={styles.blockMetaValue}>
                      {kpiDisplay(periodBusy, data.partners?.new)}
                    </span>
                    <span className={styles.blockMetaLabel}>{s.partnersNew}</span>
                  </Link>
                </div>
              </article>
            ) : null}

            {canClients ? (
              <article className={styles.kpi} aria-label={s.usersTitle}>
                <div className={styles.kpiHead}>
                  <h2 className={styles.kpiTitle}>{s.usersTitle}</h2>
                </div>
                <div className={styles.blockMeta}>
                  <Link
                    href={hrefWithDashboardPeriod('/admin/clients', range)}
                    className={styles.blockMetaItem}
                  >
                    <span className={styles.blockMetaValue}>
                      {kpiDisplay(periodBusy, data.signups?.new)}
                    </span>
                    <span className={styles.blockMetaLabel}>{s.usersNew}</span>
                  </Link>
                </div>
              </article>
            ) : null}
          </div>
        </div>
      ) : null}

      {canOrders || canCatalog ? (
        <div className={styles.kpiScope}>
          <p className={styles.kpiScopeLabel}>{s.scopeSnapshot}</p>
          <div className={styles.kpiGrid}>
            {canOrders ? (
              <article className={styles.kpi} aria-label={s.chatTitle}>
                <div className={styles.kpiHead}>
                  <h2 className={styles.kpiTitle}>{s.chatTitle}</h2>
                </div>
                <div className={styles.blockMeta}>
                  <Link href="/admin/orders?bucket=new" className={styles.blockMetaItem}>
                    <span className={styles.blockMetaValue}>
                      {kpiDisplay(snapshotBusy, data.ordersChat?.new)}
                    </span>
                    <span className={styles.blockMetaLabel}>{s.chatNew}</span>
                  </Link>
                  <Link href="/admin/orders?bucket=active" className={styles.blockMetaItem}>
                    <span className={styles.blockMetaValue}>
                      {kpiDisplay(snapshotBusy, data.ordersChat?.active)}
                    </span>
                    <span className={styles.blockMetaLabel}>{s.chatActive}</span>
                  </Link>
                </div>
              </article>
            ) : null}

            {canCatalog ? (
              <article className={styles.kpi} aria-label={s.qaTitle}>
                <div className={styles.kpiHead}>
                  <h2 className={styles.kpiTitle}>{s.qaTitle}</h2>
                </div>
                <div className={styles.blockMeta}>
                  <Link href="/admin/catalog/qa-queue" className={styles.blockMetaItem}>
                    <span className={styles.blockMetaValue}>
                      {kpiDisplay(snapshotBusy, data.qaUnread)}
                    </span>
                    <span className={styles.blockMetaLabel}>{s.qaUnread}</span>
                  </Link>
                </div>
              </article>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
