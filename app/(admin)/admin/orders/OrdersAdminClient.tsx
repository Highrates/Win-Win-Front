'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminOrderStatusLabels, adminOrdersStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import styles from '../catalog/catalogAdmin.module.css';

const STATUSES = ['PENDING_APPROVAL', 'ORDERED', 'PAID', 'RECEIVED'] as const;
type OrderStatus = (typeof STATUSES)[number];

type AdminOrderRow = {
  id: string;
  status: OrderStatus;
  totalAmount: string | number;
  currency: string;
  createdAt: string;
  user: { id: string; email: string | null; phone: string | null };
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
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string, dateLocale: string): string {
  try {
    return new Intl.DateTimeFormat(dateLocale, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function OrdersAdminClient() {
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminOrdersStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const statusLabels = useMemo(() => adminOrderStatusLabels(locale), [locale]);
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';
  const numberLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';

  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [qActive, setQActive] = useState('');
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<Record<string, OrderStatus>>({});

  const load = useCallback(
    async (p: number, search: string) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({
          page: String(p),
          limit: '20',
        });
        if (search.trim()) qs.set('q', search.trim());
        const res = await adminBackendJson<ListResponse>(`orders/admin?${qs}`);
        setData(res);
        setDraftStatus({});
      } catch (e) {
        setError(e instanceof Error ? e.message : s.errLoad);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [s],
  );

  useEffect(() => {
    void load(page, qActive);
  }, [load, page, qActive]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  function statusForRow(row: AdminOrderRow): OrderStatus {
    const d = draftStatus[row.id];
    if (d) return d;
    return STATUSES.includes(row.status as OrderStatus) ? (row.status as OrderStatus) : 'ORDERED';
  }

  async function saveStatus(orderId: string, status: OrderStatus) {
    setSavingId(orderId);
    setError(null);
    try {
      await adminBackendJson(`orders/admin/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const next = { ...draftStatus };
      delete next[orderId];
      setDraftStatus(next);
      await load(page, qActive);
    } catch (e) {
      setError(e instanceof Error ? e.message : s.errSaveStatus);
    } finally {
      setSavingId(null);
    }
  }

  function applySearch() {
    setPage(1);
    setQActive(q);
  }

  return (
    <>
      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.search}
          placeholder={s.searchPh}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applySearch();
          }}
          aria-label={s.searchPh}
        />
        <button type="button" className={styles.btn} onClick={applySearch}>
          {s.find}
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {loading && !data ? <p className={styles.muted}>{c.loading}</p> : null}

      {!loading && data?.items.length === 0 ? <p className={styles.muted}>{s.empty}</p> : null}

      {data && data.items.length > 0 ? (
        <div className={styles.tableWrap} style={loading ? { opacity: 0.65 } : undefined}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{s.thDate}</th>
                <th>{s.thOrder}</th>
                <th>{s.thClient}</th>
                <th>{s.thSum}</th>
                <th>{s.thStatus}</th>
                <th aria-label={s.save} />
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => {
                const current = statusForRow(row);
                const dirty = current !== row.status;
                return (
                  <tr key={row.id}>
                    <td>{formatDate(row.createdAt, dateLocale)}</td>
                    <td>
                      <Link
                        href={`/admin/orders/${row.id}`}
                        className={styles.backLink}
                        title={row.id}
                      >
                        <code style={{ fontSize: '0.8125rem' }}>{formatOrderDisplayId(row.id)}</code>
                      </Link>
                      <div className={styles.cardNote} style={{ marginTop: 6 }}>
                        {s.itemsCount(row.items.length)}
                      </div>
                    </td>
                    <td>
                      {row.user.email || '—'}
                      {row.user.phone ? (
                        <>
                          <br />
                          {row.user.phone}
                        </>
                      ) : null}
                    </td>
                    <td>{formatMoney(row.totalAmount, row.currency, numberLocale)}</td>
                    <td>
                      <select
                        className={styles.input}
                        value={current}
                        onChange={(e) =>
                          setDraftStatus((d) => ({
                            ...d,
                            [row.id]: e.target.value as OrderStatus,
                          }))
                        }
                        aria-label={s.thStatus}
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {statusLabels[st]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        disabled={!dirty || savingId === row.id}
                        className={styles.btn}
                        onClick={() => void saveStatus(row.id, current)}
                      >
                        {savingId === row.id ? s.saving : s.save}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {data && totalPages > 1 ? (
        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <button
            type="button"
            className={styles.btn}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {s.back}
          </button>
          <span className={styles.cardNote}>
            {s.pageOf(page, totalPages, data.total)}
          </span>
          <button
            type="button"
            className={styles.btn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {s.forward}
          </button>
        </div>
      ) : null}
    </>
  );
}
