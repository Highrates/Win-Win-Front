'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminStatusChip } from '@/components/admin/AdminStatusChip/AdminStatusChip';
import { AdminSelect } from '@/components/AdminTextField/AdminTextField';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminOrdersStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import { useMergedAdminOrderStatusLabels } from '@/lib/admin-i18n/useMergedAdminOrderStatusLabels';
import { ORDER_STATUS_FLOW } from '@/lib/orders/orderStatus';
import { formatAdminOrderDateTime } from '@/lib/dates/formatAdminOrderDateTime';
import {
  adminQueryKeys,
  useAdminList,
  useAdminListSearch,
} from '@/lib/adminQuery';
import {
  hrefPreservingPeriod,
  periodParamsFromSearch,
} from '@/lib/adminDashboard/dashboardPeriod';
import styles from '@/app/(admin)/admin/catalogAdmin.module.css';
import listStyles from './ordersAdminList.module.css';

type AdminOrderRow = {
  id: string;
  status: string;
  totalAmount: string | number;
  currency: string;
  createdAt: string;
  hasChatMessages?: boolean;
  unreadCustomerChatCount?: number;
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    profile: null | { firstName: string | null; lastName: string | null };
  };
  items: { quantity: number; product: { name: string } }[];
};

type ListResponse = {
  items: AdminOrderRow[];
  total: number;
  page: number;
  limit: number;
};

function formatMoney(amount: string | number, currency: string, numberLocale: string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return String(amount);
  return new Intl.NumberFormat(numberLocale, {
    style: 'currency',
    currency: currency || 'RUB',
    maximumFractionDigits: 0,
  }).format(n);
}

function clientListLabel(row: AdminOrderRow): string {
  const p = row.user.profile;
  const name = [p?.firstName, p?.lastName]
    .filter((x): x is string => typeof x === 'string' && Boolean(x.trim()))
    .join(' ')
    .trim();
  if (name) return name;
  return row.user.email?.trim() || row.user.phone?.trim() || '—';
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

function rowNeedsAttention(row: AdminOrderRow): boolean {
  return (row.unreadCustomerChatCount ?? 0) > 0 || row.status === 'PENDING_APPROVAL';
}

export function OrdersAdminClient({ filterUserId, embedded }: { filterUserId?: string; embedded?: boolean } = {}) {
  const { locale } = useAdminLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const s = useMemo(() => adminOrdersStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const statusLabels = useMergedAdminOrderStatusLabels();
  const numberLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';

  const statusFromQuery = (searchParams.get('status') || '').trim();
  const [statusFilter, setStatusFilter] = useState(statusFromQuery);
  const { q, setQ, debouncedQ, page, setPage } = useAdminListSearch(300, [statusFilter, filterUserId]);

  useEffect(() => {
    if (filterUserId?.trim()) return;
    setStatusFilter(statusFromQuery);
  }, [filterUserId, statusFromQuery]);

  const period = useMemo(
    () => periodParamsFromSearch((k) => searchParams.get(k)),
    [searchParams],
  );

  const listParams = useMemo(
    () => ({
      page,
      q: debouncedQ,
      status: statusFilter || undefined,
      userId: filterUserId?.trim() || undefined,
      from: period.from,
      to: period.to,
    }),
    [page, debouncedQ, statusFilter, filterUserId, period.from, period.to],
  );

  const {
    rows,
    total,
    limit,
    loading,
    isFetching,
    error: listError,
    refetch,
  } = useAdminList<AdminOrderRow>({
    queryKey: adminQueryKeys.orders.list(listParams),
    page,
    q: debouncedQ,
    limit: 20,
    errorFallback: s.errLoad,
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: '20',
        bucket: 'all',
      });
      if (debouncedQ) qs.set('q', debouncedQ);
      if (statusFilter) qs.set('status', statusFilter);
      if (filterUserId?.trim()) qs.set('userId', filterUserId.trim());
      if (period.from && period.to) {
        qs.set('from', period.from);
        qs.set('to', period.to);
      }
      return adminBackendJson<ListResponse>(`orders/admin?${qs}`);
    },
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const onStatusFilterChange = useCallback(
    (next: string) => {
      setStatusFilter(next);
      setPage(1);
      if (!filterUserId?.trim()) {
        router.replace(
          hrefPreservingPeriod('/admin/orders', searchParams, {
            status: next || undefined,
          }),
          { scroll: false },
        );
      }
    },
    [filterUserId, router, searchParams, setPage],
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
        !filterUserId?.trim() ? (
          <div className={styles.toolbar} style={embedded ? { marginBottom: 12 } : undefined}>
            <AdminSearchBox
              className={styles.searchBoxToolbar}
              placeholder={s.searchPh}
              ariaLabel={s.searchPh}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <AdminSelect
              className={listStyles.statusFilter}
              aria-label={s.thStatus}
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              <option value="">{s.filterStatusAll}</option>
              {ORDER_STATUS_FLOW.map((st) => (
                <option key={st} value={st}>
                  {statusLabels[st] ?? st}
                </option>
              ))}
            </AdminSelect>
          </div>
        ) : undefined
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
            <th>{s.thOrder}</th>
            <th>{s.thClient}</th>
            <th>{s.thSum}</th>
            <th>{s.thStatus}</th>
            <th scope="col" aria-label={s.thChat} style={{ width: 52, textAlign: 'center' }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const hasChat = Boolean(row.hasChatMessages);
            const unread = row.unreadCustomerChatCount ?? 0;
            const href = `/admin/orders/${row.id}`;
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
                          : (statusLabels.PENDING_APPROVAL ?? 'Новый')
                      }
                      aria-label={unread > 0 ? `${s.thChat}: ${unread}` : 'Новый заказ'}
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
                  <div className={styles.cardNote} style={{ marginTop: 6 }}>
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
                <td>{formatMoney(row.totalAmount, row.currency, numberLocale)}</td>
                <td>
                  <AdminStatusChip
                    status={row.status}
                    label={statusLabels[row.status] ?? row.status}
                  />
                </td>
                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  <Link
                    href={`/admin/orders/${row.id}#order-chat`}
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
