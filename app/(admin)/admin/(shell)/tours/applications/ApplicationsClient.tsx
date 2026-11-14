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
import type { AdminChinaTourApplication } from '../toursAdminTypes';

type ListResponse = {
  items: AdminChinaTourApplication[];
  total: number;
  page: number;
  limit: number;
};

export function TourApplicationsClient() {
  const [items, setItems] = useState<AdminChinaTourApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
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
      const data = await adminBackendJson<ListResponse>(`china-tours/admin/applications?${qs}`);
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

  async function setAppStatus(id: string, next: 'PENDING' | 'ACCEPTED' | 'REJECTED') {
    setActionError(null);
    setBusyId(id);
    try {
      await adminBackendJson(`china-tours/admin/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status: next } : a)));
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
      empty="Заявок нет"
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
            <option value="">Все статусы</option>
            <option value="PENDING">Ожидают</option>
            <option value="ACCEPTED">Приняты</option>
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
            <th>Пользователь</th>
            <th>Комментарий</th>
            <th>Статус</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id}>
              <td>{new Date(a.createdAt).toLocaleString('ru-RU')}</td>
              <td>{a.tour.title}</td>
              <td>
                <div>{a.user.name || '—'}</div>
                <div className={catalogStyles.muted}>{a.user.email || a.user.phone || a.user.id}</div>
              </td>
              <td>{a.comment || '—'}</td>
              <td>
                <span
                  className={`${catalogStyles.badge} ${
                    a.status === 'ACCEPTED'
                      ? catalogStyles.badgeOn
                      : a.status === 'REJECTED'
                        ? catalogStyles.badgeOff
                        : ''
                  }`}
                >
                  {a.status === 'PENDING'
                    ? 'Ожидает'
                    : a.status === 'ACCEPTED'
                      ? 'Принята'
                      : 'Отклонена'}
                </span>
              </td>
              <td className={catalogStyles.tableCellActions}>
                <AdminCompactBtn
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() => void setAppStatus(a.id, 'ACCEPTED')}
                >
                  Принять
                </AdminCompactBtn>
                <AdminCompactBtn
                  type="button"
                  variant="danger"
                  disabled={busyId === a.id}
                  onClick={() => void setAppStatus(a.id, 'REJECTED')}
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
