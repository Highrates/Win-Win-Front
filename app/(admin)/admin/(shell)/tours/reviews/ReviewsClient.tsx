'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListPagination } from '@/components/admin/AdminListPagination/AdminListPagination';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminSelect } from '@/components/AdminTextField/AdminTextField';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { ADMIN_LIST_DEFAULT_LIMIT } from '@/lib/adminListResponse';
import { useAdminListSearch } from '@/lib/adminQuery';
import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import type {
  AdminChinaTourListItem,
  AdminChinaTourReview,
  AdminChinaToursListResponse,
} from '../toursAdminTypes';
import {
  draftFromReview,
  emptyReviewDraft,
  TourReviewEditorModal,
  type TourReviewEditorDraft,
} from './TourReviewEditorModal';

type ListResponse = {
  items: AdminChinaTourReview[];
  total: number;
  page: number;
  limit: number;
};

function statusFromSearch(raw: string | null): string {
  if (raw === 'PENDING' || raw === 'APPROVED' || raw === 'REJECTED') return raw;
  return '';
}

export function TourReviewsClient() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<AdminChinaTourReview[]>([]);
  const [total, setTotal] = useState(0);
  const [tours, setTours] = useState<AdminChinaTourListItem[]>([]);
  const [status, setStatus] = useState(() => statusFromSearch(searchParams.get('status')));
  const { page, setPage } = useAdminListSearch(300, [status]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editorInitial, setEditorInitial] = useState<TourReviewEditorDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

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

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminBackendJson<AdminChinaToursListResponse>(
          'china-tours/admin/tours?limit=100',
        );
        setTours(data.items);
      } catch {
        /* ignore — select will be empty */
      }
    })();
  }, []);

  function openCreate() {
    setEditorMode('create');
    setEditingId(null);
    setEditorInitial(emptyReviewDraft(tours[0]?.id ?? ''));
    setEditorError(null);
    setEditorOpen(true);
  }

  function openEdit(r: AdminChinaTourReview) {
    setEditorMode('edit');
    setEditingId(r.id);
    setEditorInitial(draftFromReview(r));
    setEditorError(null);
    setEditorOpen(true);
  }

  async function saveDraft(draft: TourReviewEditorDraft) {
    setSaving(true);
    setEditorError(null);
    const rating = draft.rating ? Number(draft.rating) : undefined;
    const payload = {
      authorName: draft.authorName.trim() || undefined,
      body: draft.body.trim(),
      rating: rating && rating >= 1 && rating <= 5 ? rating : null,
      photoUrls: draft.photoUrls,
      videoUrl: draft.videoUrl.trim() || null,
      status: draft.status,
    };
    try {
      if (editorMode === 'create') {
        await adminBackendJson('china-tours/admin/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tourId: draft.tourId, ...payload }),
        });
      } else if (editingId) {
        await adminBackendJson(`china-tours/admin/reviews/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setEditorOpen(false);
      document.dispatchEvent(new Event('admin-tours-pending-refresh'));
      await load();
    } catch (e) {
      setEditorError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

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

  async function removeReview(id: string) {
    if (!window.confirm('Удалить отзыв?')) return;
    setActionError(null);
    setBusyId(id);
    try {
      await adminBackendJson(`china-tours/admin/reviews/${id}`, { method: 'DELETE' });
      document.dispatchEvent(new Event('admin-tours-pending-refresh'));
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Не удалось удалить');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
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
            <AdminCompactBtn type="button" variant="accent" onClick={openCreate}>
              Добавить отзыв
            </AdminCompactBtn>
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
              <th>Медиа</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((r) => {
              const displayName =
                r.authorName?.trim() || r.user?.name || (r.isAdminAuthored ? 'Админ' : '—');
              const mediaBits = [
                r.photoUrls?.length ? `${r.photoUrls.length} фото` : null,
                r.videoUrl ? 'видео' : null,
              ].filter(Boolean);
              return (
                <tr key={r.id}>
                  <td>{new Date(r.createdAt).toLocaleString('ru-RU')}</td>
                  <td>{r.tour.title}</td>
                  <td>
                    <div>{displayName}</div>
                    {r.user?.email ? (
                      <div className={catalogStyles.muted}>{r.user.email}</div>
                    ) : r.isAdminAuthored ? (
                      <div className={catalogStyles.muted}>Создан админом</div>
                    ) : null}
                  </td>
                  <td>
                    {r.rating != null ? <div className={catalogStyles.muted}>{r.rating}/5</div> : null}
                    <div>{r.body || '—'}</div>
                  </td>
                  <td className={catalogStyles.muted}>{mediaBits.length ? mediaBits.join(' · ') : '—'}</td>
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
                      onClick={() => openEdit(r)}
                    >
                      Изменить
                    </AdminCompactBtn>
                    {r.status !== 'APPROVED' ? (
                      <AdminCompactBtn
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => void setReviewStatus(r.id, 'APPROVED')}
                      >
                        Одобрить
                      </AdminCompactBtn>
                    ) : null}
                    {r.status !== 'REJECTED' ? (
                      <AdminCompactBtn
                        type="button"
                        variant="danger"
                        disabled={busyId === r.id}
                        onClick={() => void setReviewStatus(r.id, 'REJECTED')}
                      >
                        Отклонить
                      </AdminCompactBtn>
                    ) : null}
                    <AdminCompactBtn
                      type="button"
                      variant="danger"
                      disabled={busyId === r.id}
                      onClick={() => void removeReview(r.id)}
                    >
                      Удалить
                    </AdminCompactBtn>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminListShell>

      <TourReviewEditorModal
        open={editorOpen}
        mode={editorMode}
        tours={tours}
        initial={editorInitial}
        saving={saving}
        error={editorError}
        onClose={() => setEditorOpen(false)}
        onSave={(d) => void saveDraft(d)}
      />
    </>
  );
}
