'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminStatusChip } from '@/components/admin/AdminStatusChip/AdminStatusChip';
import { AdminSelect } from '@/components/AdminTextField/AdminTextField';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { adminSourcingStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { formatAdminOrderDateTime } from '@/lib/dates/formatAdminOrderDateTime';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import { sourcingStatusLabel } from '@/lib/userSourcingRequests/sourcingStatus';
import { fetchAdminSourcingRequestsList } from '@/lib/userSourcingRequests/adminClientApi';
import type {
  AdminSourcingRequestListItemApi,
  SourcingRequestStatus,
} from '@/lib/userSourcingRequests/types';
import { adminQueryKeys, useAdminList, useAdminListSearch } from '@/lib/adminQuery';
import {
  hrefPreservingPeriod,
  periodParamsFromSearch,
} from '@/lib/adminDashboard/dashboardPeriod';
import styles from '@/app/(admin)/admin/catalogAdmin.module.css';
import listStyles from './ordersAdminList.module.css';

const SOURCING_STATUSES: SourcingRequestStatus[] = [
  'PENDING_REVIEW',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

function clientListLabel(row: AdminSourcingRequestListItemApi): string {
  const p = row.user.profile;
  const name = [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim();
  return name || row.user.email || row.user.phone || row.user.id;
}

function OrderChatGlyph({ muted, unreadCount }: { muted: boolean; unreadCount: number }) {
  const color = muted ? 'var(--color-gray, #9d9d9d)' : 'var(--color-ink-black, #051826)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ position: 'relative', display: 'inline-block', color }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={muted ? 'none' : 'color-mix(in srgb, currentColor 12%, transparent)'}
          />
          {unreadCount > 0 ? (
            <circle cx="18" cy="6" r="3.5" fill="var(--color-red, #c53029)" style={{ pointerEvents: 'none' }} />
          ) : null}
        </svg>
      </span>
      {unreadCount > 0 ? (
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-red, #c53029)', lineHeight: 1 }}>
          {unreadCount}
        </span>
      ) : null}
    </span>
  );
}

function rowNeedsAttention(row: AdminSourcingRequestListItemApi): boolean {
  return (row.unreadCustomerChatCount ?? 0) > 0 || row.status === 'PENDING_REVIEW';
}

export function SourcingRequestsAdminClient({ embedded = false }: { embedded?: boolean }) {
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminSourcingStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFromQuery = (searchParams.get('status') || '').trim();
  const [statusFilter, setStatusFilter] = useState(statusFromQuery);
  const { q, debouncedQ, page, setPage, setQ } = useAdminListSearch(300, [statusFilter]);
  const limit = 20;

  useEffect(() => {
    setStatusFilter(statusFromQuery);
  }, [statusFromQuery]);

  const period = useMemo(
    () => periodParamsFromSearch((k) => searchParams.get(k)),
    [searchParams],
  );

  const listParams = useMemo(
    () => ({
      page,
      q: debouncedQ,
      status: statusFilter || undefined,
      from: period.from,
      to: period.to,
    }),
    [page, debouncedQ, statusFilter, period.from, period.to],
  );

  const {
    rows,
    total,
    loading,
    error: listError,
    isFetching,
    refetch,
  } = useAdminList<AdminSourcingRequestListItemApi>({
    queryKey: adminQueryKeys.sourcingRequests.list(listParams),
    page,
    q: debouncedQ,
    limit,
    errorFallback: 'Не удалось загрузить заявки',
    queryFn: () =>
      fetchAdminSourcingRequestsList({
        page,
        limit,
        bucket: 'all',
        status: (statusFilter as SourcingRequestStatus) || undefined,
        q: debouncedQ || undefined,
        from: period.from,
        to: period.to,
      }),
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const onStatusFilterChange = useCallback(
    (next: string) => {
      setStatusFilter(next);
      setPage(1);
      router.replace(
        hrefPreservingPeriod('/admin/orders', searchParams, {
          section: 'sourcing',
          status: next || undefined,
        }),
        { scroll: false },
      );
    },
    [router, searchParams, setPage],
  );

  return (
    <AdminListShell
      loading={loading}
      error={listError}
      onRetry={() => void refetch()}
      loadingLabel={c.loading}
      empty={s.empty}
      isEmpty={!loading && !listError && rows.length === 0}
      isFetching={isFetching}
      toolbar={
        <div className={styles.toolbar} style={embedded ? { marginBottom: 12 } : undefined}>
          <AdminSearchBox
            className={styles.searchBoxToolbar}
            placeholder={s.searchPh}
            ariaLabel={s.searchAria}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <AdminSelect
            className={listStyles.statusFilter}
            label={s.thStatus}
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="">{s.filterStatusAll}</option>
            {SOURCING_STATUSES.map((st) => (
              <option key={st} value={st}>
                {sourcingStatusLabel(st, locale)}
              </option>
            ))}
          </AdminSelect>
        </div>
      }
      pagination={
        totalPages > 1 ? (
          <div className={styles.toolbar} style={{ marginTop: 16 }}>
            <AdminCompactBtn
              type="button"
              variant="outline"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {s.back}
            </AdminCompactBtn>
            <span className={styles.cardNote}>{s.pageOf(page, totalPages, total)}</span>
            <AdminCompactBtn
              type="button"
              variant="outline"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              {s.forward}
            </AdminCompactBtn>
          </div>
        ) : null
      }
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: 28 }} aria-hidden />
            <th>{s.thDate}</th>
            <th>{s.thRequest}</th>
            <th>{s.thClient}</th>
            <th>{s.thCity}</th>
            <th>{s.thStatus}</th>
            <th scope="col" aria-label={s.thChat} style={{ width: 52, textAlign: 'center' }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const hasChat = Boolean(row.hasChatMessages);
            const unread = row.unreadCustomerChatCount ?? 0;
            const href = `/admin/orders/sourcing/${row.id}`;
            const attention = rowNeedsAttention(row);
            return (
              <tr
                key={row.id}
                className={listStyles.rowClickable}
                tabIndex={0}
                onClick={() => router.push(href)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(href);
                  }
                }}
              >
                <td className={listStyles.dotCell}>
                  {attention ? (
                    <span
                      className={listStyles.attentionDot}
                      title={
                        unread > 0
                          ? `${s.thChat}: ${unread}`
                          : sourcingStatusLabel('PENDING_REVIEW', locale)
                      }
                      aria-label={unread > 0 ? `${s.thChat}: ${unread}` : 'Новая заявка'}
                    />
                  ) : null}
                </td>
                <td>{formatAdminOrderDateTime(row.createdAt, locale)}</td>
                <td>
                  <Link
                    href={href}
                    className={styles.backLink}
                    title={row.id}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <code style={{ fontSize: '0.8125rem' }}>{formatOrderDisplayId(row.id)}</code>
                  </Link>
                  <div className={styles.cardTitle} style={{ marginTop: 6, fontSize: '0.9375rem' }}>
                    {row.title}
                  </div>
                  <div className={styles.cardNote} style={{ marginTop: 4 }}>
                    {s.itemsCount(row.items.length)}
                  </div>
                </td>
                <td>
                  <span className={styles.cardTitle} style={{ fontSize: '0.9375rem' }}>
                    {clientListLabel(row)}
                  </span>
                  <div className={styles.cardNote} style={{ marginTop: 4 }}>
                    {row.user.email || '—'}
                    {row.user.phone ? (
                      <>
                        <br />
                        {row.user.phone}
                      </>
                    ) : null}
                  </div>
                </td>
                <td>{row.deliveryCity?.trim() || '—'}</td>
                <td>
                  <AdminStatusChip
                    kind="sourcing"
                    status={row.status}
                    label={sourcingStatusLabel(row.status, locale)}
                  />
                </td>
                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  <Link
                    href={`/admin/orders/sourcing/${row.id}#order-chat`}
                    className={styles.backLink}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    title={s.thChat}
                    aria-label={
                      unread > 0
                        ? `${s.thChat}: ${formatOrderDisplayId(row.id)}, ${unread} непрочитано`
                        : `${s.thChat}: ${formatOrderDisplayId(row.id)}`
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    <OrderChatGlyph muted={!hasChat && unread === 0} unreadCount={unread} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </AdminListShell>
  );
}
