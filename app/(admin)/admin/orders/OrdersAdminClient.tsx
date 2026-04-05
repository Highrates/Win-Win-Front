'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import styles from '../catalog/catalogAdmin.module.css';

const STATUSES = ['ORDERED', 'PAID', 'RECEIVED'] as const;
type OrderStatus = (typeof STATUSES)[number];

const STATUS_LABELS: Record<OrderStatus, string> = {
  ORDERED: 'Заказано',
  PAID: 'Оплачено',
  RECEIVED: 'Получено',
};

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

function formatMoney(amount: string | number, currency: string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return String(amount);
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency || 'RUB',
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function OrdersAdminClient() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [qActive, setQActive] = useState('');
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<Record<string, OrderStatus>>({});

  const load = useCallback(async (p: number, search: string) => {
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
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
      setError(e instanceof Error ? e.message : 'Не удалось сохранить статус');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input
          type="search"
          style={{
            flex: '1 1 200px',
            maxWidth: 320,
            padding: '8px 12px',
            border: '1px solid var(--account-hairline-color, #e2e6e8)',
            fontSize: '0.9375rem',
          }}
          placeholder="ID заказа, email или телефон"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1);
              setQActive(q);
            }
          }}
        />
        <button
          type="button"
          className={styles.backLink}
          style={{
            border: '1px solid var(--account-hairline-color, #e2e6e8)',
            padding: '8px 16px',
            background: 'transparent',
            cursor: 'pointer',
          }}
          onClick={() => {
            setPage(1);
            setQActive(q);
          }}
        >
          Найти
        </button>
      </div>
      {error ? (
        <p className={styles.lead} style={{ color: '#b42318' }}>
          {error}
        </p>
      ) : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Заказ</th>
              <th>Клиент</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  Загрузка…
                </td>
              </tr>
            ) : null}
            {!loading && data?.items.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  Нет заказов
                </td>
              </tr>
            ) : null}
            {data?.items.map((row) => {
              const current = statusForRow(row);
              const dirty = current !== row.status;
              return (
                <tr key={row.id}>
                  <td>{formatDate(row.createdAt)}</td>
                  <td style={{ maxWidth: 200, wordBreak: 'break-all', fontSize: '0.85rem' }}>
                    <code>{row.id}</code>
                    <div style={{ color: 'var(--color-gray, #9d9d9d)', marginTop: 4 }}>
                      {row.items.length} поз.
                    </div>
                  </td>
                  <td style={{ fontSize: '0.9rem' }}>
                    {row.user.email || '—'}
                    {row.user.phone ? (
                      <>
                        <br />
                        {row.user.phone}
                      </>
                    ) : null}
                  </td>
                  <td>{formatMoney(row.totalAmount, row.currency)}</td>
                  <td>
                    <select
                      value={current}
                      onChange={(e) =>
                        setDraftStatus((d) => ({
                          ...d,
                          [row.id]: e.target.value as OrderStatus,
                        }))
                      }
                      style={{
                        padding: '6px 8px',
                        border: '1px solid var(--account-hairline-color, #e2e6e8)',
                        fontSize: '0.875rem',
                      }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      disabled={!dirty || savingId === row.id}
                      className={styles.backLink}
                      style={{
                        border: '1px solid var(--account-hairline-color, #e2e6e8)',
                        padding: '6px 12px',
                        background: 'transparent',
                        cursor: dirty && savingId !== row.id ? 'pointer' : 'not-allowed',
                        opacity: dirty ? 1 : 0.45,
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => void saveStatus(row.id, current)}
                    >
                      {savingId === row.id ? '…' : 'Сохранить'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data && totalPages > 1 ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
          <button
            type="button"
            className={styles.backLink}
            style={{
              border: '1px solid var(--account-hairline-color, #e2e6e8)',
              padding: '6px 12px',
              background: 'transparent',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              opacity: page <= 1 ? 0.5 : 1,
            }}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Назад
          </button>
          <span style={{ fontSize: '0.9rem' }}>
            Стр. {page} из {totalPages} ({data.total})
          </span>
          <button
            type="button"
            className={styles.backLink}
            style={{
              border: '1px solid var(--account-hairline-color, #e2e6e8)',
              padding: '6px 12px',
              background: 'transparent',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages ? 0.5 : 1,
            }}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Вперёд
          </button>
        </div>
      ) : null}
    </>
  );
}
