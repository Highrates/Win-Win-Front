'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminSelect } from '@/components/AdminTextField/AdminTextField';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import { AdminTabs } from '@/components/AdminTabs/AdminTabs';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { adminSourcingStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { formatAdminOrderDateTime } from '@/lib/dates/formatAdminOrderDateTime';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import { sourcingStatusLabel } from '@/lib/userSourcingRequests/sourcingStatus';
import {
  fetchAdminSourcingRequestsList,
  patchAdminSourcingRequestStatus,
} from '@/lib/userSourcingRequests/adminClientApi';
import type {
  AdminSourcingBucket,
  AdminSourcingRequestListItemApi,
  SourcingRequestStatus,
} from '@/lib/userSourcingRequests/types';
import {
  adminQueryKeys,
  useAdminList,
  useAdminListSearch,
  useInvalidateAdminQueries,
} from '@/lib/adminQuery';
import styles from '../catalog/catalogAdmin.module.css';

export type { AdminSourcingBucket } from '@/lib/userSourcingRequests/types';

const BUCKETS: AdminSourcingBucket[] = ['new', 'active', 'completed'];

type ChatUnreadBuckets = { total: number; new: number; active: number; completed: number };

function bucketUnreadFor(summary: ChatUnreadBuckets | null, b: AdminSourcingBucket): number {
  if (!summary) return 0;
  if (b === 'new') return summary.new;
  if (b === 'active') return summary.active;
  return summary.completed;
}

const ACTIVE_STATUS_OPTIONS: SourcingRequestStatus[] = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

function notifyAdminSourcingPendingRefresh() {
  document.dispatchEvent(new Event('admin-sourcing-pending-refresh'));
}

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

function bucketIndexFromQuery(raw: string | null): number {
  const b = raw?.trim();
  const i = BUCKETS.indexOf((b as AdminSourcingBucket) ?? 'new');
  return i >= 0 ? i : 0;
}

export function SourcingRequestsAdminClient({ embedded = false }: { embedded?: boolean }) {
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminSourcingStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const invalidate = useInvalidateAdminQueries();
  const [bucketIndex, setBucketIndex] = useState(() => bucketIndexFromQuery(searchParams.get('bucket')));
  const { q, debouncedQ, page, setPage, setQ } = useAdminListSearch(300, [bucketIndex]);
  const [draftStatus, setDraftStatus] = useState<Record<string, SourcingRequestStatus>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [unreadSummary, setUnreadSummary] = useState<ChatUnreadBuckets | null>(null);
  const limit = 20;
  const bucket = BUCKETS[bucketIndex] ?? 'new';
  const tabLabels = [s.tabNew, s.tabActive, s.tabCompleted];

  const loadUnreadSummary = useCallback(async () => {
    try {
      const j = await adminBackendJson<ChatUnreadBuckets>('sourcing-requests/admin/chat-unread-summary');
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
    document.addEventListener('admin-sourcing-chat-unread-refresh', fn);
    return () => document.removeEventListener('admin-sourcing-chat-unread-refresh', fn);
  }, [loadUnreadSummary]);

  const listParams = useMemo(
    () => ({ page, q: debouncedQ, bucket }),
    [page, debouncedQ, bucket],
  );

  const {
    rows,
    data,
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
        bucket,
        q: debouncedQ || undefined,
      }),
  });

  const error = mutationError ?? listError;

  useEffect(() => {
    setDraftStatus({});
  }, [data]);

  useEffect(() => {
    if (embedded) return;
    setBucketIndex(bucketIndexFromQuery(searchParams.get('bucket')));
  }, [embedded, searchParams]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function statusForActiveRow(row: AdminSourcingRequestListItemApi): SourcingRequestStatus {
    const d = draftStatus[row.id];
    if (d) return d;
    if (ACTIVE_STATUS_OPTIONS.includes(row.status)) return row.status;
    return 'IN_PROGRESS';
  }

  async function updateStatus(id: string, status: SourcingRequestStatus) {
    setSavingId(id);
    setMutationError(null);
    try {
      await patchAdminSourcingRequestStatus(id, status);
      setDraftStatus((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await invalidate(adminQueryKeys.sourcingRequests.all);
      notifyAdminSourcingPendingRefresh();
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : c.errSave);
    } finally {
      setSavingId(null);
    }
  }

  function onSelectTab(index: number) {
    setBucketIndex(index);
    setPage(1);
    if (!embedded) {
      const b = BUCKETS[index] ?? 'new';
      router.replace(`/admin/orders?section=sourcing&bucket=${encodeURIComponent(b)}`, { scroll: false });
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
            label: uc > 0 ? `${label} (${uc})` : label,
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
        empty={s.emptyBucket}
        isEmpty={!loading && !error && rows.length === 0}
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
              <th>{s.thDate}</th>
              <th>{s.thRequest}</th>
              <th>{s.thClient}</th>
              <th>{s.thCity}</th>
              <th>{s.thStatus}</th>
              {bucket === 'new' || bucket === 'active' ? <th aria-label={s.save} /> : null}
              <th scope="col" aria-label={s.thChat} style={{ width: 52, textAlign: 'center' }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isNew = bucket === 'new';
              const isActive = bucket === 'active';
              const isCompleted = bucket === 'completed';
              const currentActive = statusForActiveRow(row);
              const dirtyActive = isActive && currentActive !== row.status;
              const hasChat = Boolean(row.hasChatMessages);
              const unread = row.unreadCustomerChatCount ?? 0;
              return (
                <tr key={row.id}>
                  <td>{formatAdminOrderDateTime(row.createdAt, locale)}</td>
                  <td>
                    <Link href={`/admin/orders/sourcing/${row.id}`} className={styles.backLink} title={row.id}>
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
                    {isNew || isCompleted ? (
                      <span className={styles.cardNote}>{sourcingStatusLabel(row.status, locale)}</span>
                    ) : (
                      <AdminSelect
                        className={styles.tableCellSelect}
                        value={currentActive}
                        onChange={(e) =>
                          setDraftStatus((d) => ({
                            ...d,
                            [row.id]: e.target.value as SourcingRequestStatus,
                          }))
                        }
                        aria-label={s.thStatus}
                      >
                        {ACTIVE_STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {sourcingStatusLabel(st, locale)}
                          </option>
                        ))}
                      </AdminSelect>
                    )}
                  </td>
                  {isNew ? (
                    <td>
                      <AdminCompactBtn
                        type="button"
                        variant="accent"
                        disabled={savingId === row.id}
                        onClick={() => void updateStatus(row.id, 'IN_PROGRESS')}
                      >
                        {savingId === row.id ? c.saving : s.takeInWork}
                      </AdminCompactBtn>
                    </td>
                  ) : null}
                  {isActive ? (
                    <td>
                      <AdminCompactBtn
                        type="button"
                        variant="accent"
                        disabled={!dirtyActive || savingId === row.id}
                        onClick={() => void updateStatus(row.id, currentActive)}
                      >
                        {savingId === row.id ? c.saving : c.save}
                      </AdminCompactBtn>
                    </td>
                  ) : null}
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
