'use client';

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminCompactBtnLink } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListPagination } from '@/components/admin/AdminListPagination/AdminListPagination';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminTableRemoveButton } from '@/components/admin/AdminTableRemoveButton/AdminTableRemoveButton';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import { ADMIN_LIST_DEFAULT_LIMIT } from '@/lib/adminListResponse';
import { useAdminListSearch } from '@/lib/adminQuery';
import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import type { AdminChinaTourListItem, AdminChinaToursListResponse } from './toursAdminTypes';
import styles from './toursAdmin.module.css';

function formatRange(startsAt: string, endsAt: string) {
  try {
    const s = new Date(startsAt);
    const e = new Date(endsAt);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${s.toLocaleDateString('ru-RU', opts)} — ${e.toLocaleDateString('ru-RU', opts)}`;
  } catch {
    return '—';
  }
}

function SortableTourRow({
  tour,
  canDrag,
  onOpen,
  onDelete,
}: {
  tour: AdminChinaTourListItem;
  canDrag: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tour.id,
    disabled: !canDrag,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={styles.rowClickable}
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <td
        className={catalogStyles.dragHandle}
        {...(canDrag ? { ...attributes, ...listeners } : {})}
        title={canDrag ? 'Перетащить' : 'Порядок доступен без поиска'}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        ⋮⋮
      </td>
      <td>{tour.title}</td>
      <td>{formatRange(tour.startsAt, tour.endsAt)}</td>
      <td>
        {tour.seatsTaken}/{tour.seatsTotal}
      </td>
      <td>
        <span
          className={`${catalogStyles.badge} ${
            tour.isPublished ? catalogStyles.badgeOn : catalogStyles.badgeOff
          }`}
        >
          {tour.isPublished ? 'Опубликован' : 'Черновик'}
        </span>
      </td>
      <td>{tour.applicationsCount}</td>
      <td title="Одобренные / всего">
        {tour.reviewsCount}/{tour.reviewsTotal ?? tour.reviewsCount}
      </td>
      <td
        className={catalogStyles.tableCellActions}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <AdminTableRemoveButton label={`Удалить «${tour.title}»`} onClick={onDelete} />
      </td>
    </tr>
  );
}

export function ToursListClient() {
  const router = useRouter();
  const { confirm } = useAdminConfirm();
  const { q, setQ, debouncedQ, page, setPage } = useAdminListSearch(300);
  const [items, setItems] = useState<AdminChinaTourListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  /** DnD требует полный список id на сервере — только когда вся выборка на одной странице. */
  const canDrag = !debouncedQ.trim() && page === 1 && total > 0 && items.length === total;

  const load = useCallback(async () => {
    setError(null);
    setFetching(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(ADMIN_LIST_DEFAULT_LIMIT),
      });
      if (debouncedQ.trim()) qs.set('q', debouncedQ.trim());
      const data = await adminBackendJson<AdminChinaToursListResponse>(`china-tours/admin/tours?${qs}`);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить');
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [debouncedQ, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const ids = useMemo(() => items.map((t) => t.id), [items]);

  async function handleDelete(id: string, title: string) {
    const ok = await confirm({
      title: 'Удалить тур?',
      message: `«${title}» будет удалён без возможности восстановления.`,
      confirmLabel: 'Удалить',
    });
    if (!ok) return;
    await adminBackendJson(`china-tours/admin/tours/${id}`, { method: 'DELETE' });
    void load();
  }

  async function onDragEnd(event: DragEndEvent) {
    if (!canDrag) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((t) => t.id === active.id);
    const newIndex = items.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    try {
      await adminBackendJson('china-tours/admin/tours/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: next.map((t) => t.id) }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить порядок');
      void load();
    }
  }

  return (
    <AdminListShell
      loading={loading}
      error={error}
      onRetry={() => void load()}
      loadingLabel="Загрузка…"
      empty="Туров пока нет"
      isEmpty={!loading && !error && items.length === 0}
      isFetching={fetching}
      toolbar={
        <div className={catalogStyles.toolbar}>
          <AdminSearchBox
            className={catalogStyles.searchBoxToolbar}
            placeholder="Поиск"
            ariaLabel="Поиск туров"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <AdminCompactBtnLink href="/admin/tours/new" variant="accent">
            Новый тур
          </AdminCompactBtnLink>
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void onDragEnd(e)}>
        <table className={catalogStyles.table}>
          <thead>
            <tr>
              <th style={{ width: 36 }} aria-label="Порядок" />
              <th>Название</th>
              <th>Даты</th>
              <th>Места</th>
              <th>Статус</th>
              <th>Заявки</th>
              <th>Отзывы</th>
              <th style={{ width: 44 }} aria-label="Действия" />
            </tr>
          </thead>
          <tbody>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {items.map((t) => (
                <SortableTourRow
                  key={t.id}
                  tour={t}
                  canDrag={canDrag}
                  onOpen={() => router.push(`/admin/tours/${t.id}`)}
                  onDelete={() => void handleDelete(t.id, t.title)}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </AdminListShell>
  );
}
