'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListPagination } from '@/components/admin/AdminListPagination/AdminListPagination';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminSelect } from '@/components/AdminTextField/AdminTextField';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { ADMIN_LIST_DEFAULT_LIMIT } from '@/lib/adminListResponse';
import { useAdminListSearch } from '@/lib/adminQuery';
import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import type { AdminChinaTourReview } from '../toursAdminTypes';

type ListResponse = {
  items: AdminChinaTourReview[];
  total: number;
  page: number;
  limit: number;
};

export function TourReviewsClient() {
  const [items, setItems] = useState<AdminChinaTourReview[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('PENDING');
  const { page, setPage } = useAdminListSearch(300, [status]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setFetching(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(ADMIN_LIST_DEFAULT_LIMIT),
      });
      if (status) qs.set('status', status);
      const data = await adminBackendJson<ListResponse>(`china-tours/admin/reviews?${qs}`);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setReviewStatus(id: string, next: 'PENDING' | 'APPROVED' | 'REJECTED') {
    setActionError(null);
    setBusyId(id);
    try {
      await adminBackendJson(`china-tours/admin/reviews/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
      document.dispatchEvent(new Event('admin-tours-pending-refresh'));
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Не удалось обновить статус');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminListShell
      loading={loading}
      error={error}
      onRetry={() => void load()}
      loadingLabel="Загрузка…"
      empty="Отзывов нет"
      isEmpty={!loading && !error && items.length === 0}
      isFetching={fetching}
      toolbar={
        <div className={catalogStyles.toolbar}>
          <AdminSelect
            label="Статус"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Статус"
          >
            <option value="">Все</option>
            <option value="PENDING">На модерации</option>
            <option value="APPROVED">Одобрены</option>
            <option value="REJECTED">Отклонены</option>
          </AdminSelect>
        </div>
      }
      pagination={
        !loading && !error ? (
          <AdminListPagination
            page={page}
            total={total}
            limit={ADMIN_LIST_DEFAULT_LIMIT}
            onPageChange={setPage}
            disabled={fetching}
          />
        ) : null
      }
    >
      {actionError ? <p className={catalogStyles.error}>{actionError}</p> : null}
      <table className={catalogStyles.table}>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Тур</th>
            <th>Автор</th>
            <th>Отзыв</th>
            <th>Статус</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <td>{new Date(r.createdAt).toLocaleString('ru-RU')}</td>
              <td>{r.tour.title}</td>
              <td>
                <div>{r.user.name || '—'}</div>
                <div className={catalogStyles.muted}>{r.user.email || r.user.id}</div>
              </td>
              <td>
                {r.rating != null ? <div className={catalogStyles.muted}>{r.rating}/5</div> : null}
                <div>{r.body}</div>
              </td>
              <td>
                <span
                  className={`${catalogStyles.badge} ${
                    r.status === 'APPROVED'
                      ? catalogStyles.badgeOn
                      : r.status === 'REJECTED'
                        ? catalogStyles.badgeOff
                        : ''
                  }`}
                >
                  {r.status === 'PENDING'
                    ? 'На модерации'
                    : r.status === 'APPROVED'
                      ? 'Одобрен'
                      : 'Отклонён'}
                </span>
              </td>
              <td className={catalogStyles.tableCellActions}>
                <AdminCompactBtn
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => void setReviewStatus(r.id, 'APPROVED')}
                >
                  Одобрить
                </AdminCompactBtn>
                <AdminCompactBtn
                  type="button"
                  variant="danger"
                  disabled={busyId === r.id}
                  onClick={() => void setReviewStatus(r.id, 'REJECTED')}
                >
                  Отклонить
                </AdminCompactBtn>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminListShell>
  );
}
