'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
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
  useInvalidateAdminQueries,
} from '@/lib/adminQuery';
import styles from '../catalog/catalogAdmin.module.css';
import { AdminTabs } from '@/components/AdminTabs/AdminTabs';

export type AdminOrdersBucket = 'new' | 'active' | 'completed';

const BUCKETS: AdminOrdersBucket[] = ['new', 'active', 'completed'];

type ActiveOrderStatus = (typeof ORDER_STATUS_FLOW)[number];

/** Вкладка «В работе»: можно перевести заказ в том числе в «Получено» / «Завершен». */
const ADMIN_ACTIVE_BUCKET_STATUS_OPTIONS = ORDER_STATUS_FLOW.filter(
  (s) => s !== 'PENDING_APPROVAL',
) as readonly ActiveOrderStatus[];

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

type ChatUnreadBuckets = { total: number; new: number; active: number; completed: number };

function bucketUnreadFor(summary: ChatUnreadBuckets | null, b: AdminOrdersBucket): number {
  if (!summary) return 0;
  if (b === 'new') return summary.new;
  if (b === 'active') return summary.active;
  return summary.completed;
}

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

function bucketIndexFromQuery(raw: string | null): number {
  const b = (raw || '').trim().toLowerCase();
  const i = BUCKETS.indexOf(b as AdminOrdersBucket);
  return i >= 0 ? i : 0;
}

export function OrdersAdminClient({ filterUserId, embedded }: { filterUserId?: string; embedded?: boolean } = {}) {
  const { locale } = useAdminLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const s = useMemo(() => adminOrdersStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const statusLabels = useMergedAdminOrderStatusLabels();
  const numberLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';

  const tabLabels = useMemo(
    () => [s.tabNew, s.tabActive, s.tabCompleted],
    [s.tabActive, s.tabCompleted, s.tabNew],
  );

  const [bucketIndex, setBucketIndex] = useState(0);
  const { q, setQ, debouncedQ, page, setPage } = useAdminListSearch(300, [bucketIndex, filterUserId]);
  const invalidate = useInvalidateAdminQueries();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<Record<string, ActiveOrderStatus>>({});
  const [unreadSummary, setUnreadSummary] = useState<ChatUnreadBuckets | null>(null);

  const loadUnreadSummary = useCallback(async () => {
    try {
      const j = await adminBackendJson<ChatUnreadBuckets>('orders/admin/chat-unread-summary');
      if (j && typeof j.new === 'number' && typeof j.active === 'number' && typeof j.completed === 'number') {
        setUnreadSummary(j);
      } else {
        setUnreadSummary(null);
      }
    } catch {
      setUnreadSummary(null);
    }
  }, []);

  useEffect(() => {
    void loadUnreadSummary();
  }, [loadUnreadSummary]);

  useEffect(() => {
    const fn = () => void loadUnreadSummary();
    document.addEventListener('admin-orders-chat-unread-refresh', fn);
    return () => document.removeEventListener('admin-orders-chat-unread-refresh', fn);
  }, [loadUnreadSummary]);

  const bucket = BUCKETS[bucketIndex] ?? 'new';
  const listParams = useMemo(
    () => ({
      page,
      q: debouncedQ,
      bucket,
      userId: filterUserId?.trim() || undefined,
    }),
    [page, debouncedQ, bucket, filterUserId],
  );

  const {
    rows,
    data,
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
        bucket,
      });
      if (debouncedQ) qs.set('q', debouncedQ);
      if (filterUserId?.trim()) qs.set('userId', filterUserId.trim());
      return adminBackendJson<ListResponse>(`orders/admin?${qs}`);
    },
  });

  const error = mutationError ?? listError;

  useEffect(() => {
    setDraftStatus({});
  }, [data]);

  useEffect(() => {
    if (filterUserId?.trim() || embedded) return;
    const i = bucketIndexFromQuery(searchParams.get('bucket'));
    setBucketIndex(i);
  }, [embedded, filterUserId, searchParams]);

  useEffect(() => {
    void loadUnreadSummary();
  }, [loadUnreadSummary, data]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function statusForActiveRow(row: AdminOrderRow): ActiveOrderStatus {
    const d = draftStatus[row.id];
    if (d) return d;
    const opts = ADMIN_ACTIVE_BUCKET_STATUS_OPTIONS;
    if (opts.includes(row.status as ActiveOrderStatus)) return row.status as ActiveOrderStatus;
    return opts[0] ?? 'APPROVED';
  }

  async function saveActiveStatus(orderId: string, status: ActiveOrderStatus) {
    setSavingId(orderId);
    setMutationError(null);
    try {
      await adminBackendJson(`orders/admin/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setDraftStatus((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      await invalidate(adminQueryKeys.orders.all);
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new Event('admin-orders-pending-refresh'));
        document.dispatchEvent(new Event('admin-orders-chat-unread-refresh'));
      }
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : s.errSaveStatus);
    } finally {
      setSavingId(null);
    }
  }

  function onSelectTab(index: number) {
    setBucketIndex(index);
    setPage(1);
    if (!filterUserId?.trim()) {
      const b = BUCKETS[index] ?? 'new';
      router.replace(`/admin/orders?bucket=${encodeURIComponent(b)}`, { scroll: false });
    }
  }

  return (
    <>
      <AdminTabs
        variant={embedded ? 'pill' : 'underline'}
        ariaLabel={s.tabsAria}
        items={tabLabels.map((label, index) => {
          const b = BUCKETS[index] ?? 'new';
          const uc = bucketUnreadFor(unreadSummary, b);
          return {
            id: index,
            label: (
              <>
                {label}
                {uc > 0 ? ` (${uc})` : ''}
              </>
            ),
          };
        })}
        activeId={bucketIndex}
        onChange={onSelectTab}
      />

      <AdminListShell
        loading={loading}
        error={error}
        onRetry={() => void refetch()}
        loadingLabel={c.loading}
        empty={s.empty}
        isEmpty={!loading && !error && rows.length === 0}
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
              <th>{s.thDate}</th>
              <th>{s.thOrder}</th>
              <th>{s.thClient}</th>
              <th>{s.thSum}</th>
              <th>{s.thStatus}</th>
              {bucket === 'active' ? <th aria-label={s.save} /> : null}
              <th scope="col" aria-label={s.thChat} style={{ width: 52, textAlign: 'center' }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hasChat = Boolean(row.hasChatMessages);
              const unread = row.unreadCustomerChatCount ?? 0;
              const isNew = bucket === 'new';
              const isActive = bucket === 'active';
              const isCompleted = bucket === 'completed';
              const currentActive = statusForActiveRow(row);
              const dirtyActive = isActive && currentActive !== row.status;
              return (
                <tr key={row.id}>
                  <td>{formatAdminOrderDateTime(row.createdAt, locale)}</td>
                  <td>
                    <Link href={`/admin/orders/${row.id}`} className={styles.backLink} title={row.id}>
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
                    {isNew ? (
                      <span className={styles.cardNote}>{statusLabels.PENDING_APPROVAL}</span>
                    ) : isCompleted ? (
                      <span className={styles.cardNote}>{statusLabels[row.status] ?? row.status}</span>
                    ) : (
                      <AdminSelect
                        className={styles.tableCellSelect}
                        value={currentActive}
                        onChange={(e) =>
                          setDraftStatus((d) => ({
                            ...d,
                            [row.id]: e.target.value as ActiveOrderStatus,
                          }))
                        }
                        aria-label={s.thStatus}
                      >
                        {ADMIN_ACTIVE_BUCKET_STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {statusLabels[st]}
                          </option>
                        ))}
                      </AdminSelect>
                    )}
                  </td>
                  {isActive ? (
                    <td>
                      <AdminCompactBtn
                        type="button"
                        variant="accent"
                        disabled={!dirtyActive || savingId === row.id}
                        onClick={() => void saveActiveStatus(row.id, currentActive)}
                      >
                        {savingId === row.id ? s.saving : s.save}
                      </AdminCompactBtn>
                    </td>
                  ) : null}
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
    </>
  );
}
