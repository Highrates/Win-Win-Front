'use client';

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { adminBlogListStrings } from '@/lib/admin-i18n/adminBlogI18n';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import catalogStyles from '../catalog/catalogAdmin.module.css';
import type { AdminBlogCategoryRow, AdminBlogPostListItem, AdminBlogPostsListResponse } from './blogAdminTypes';
import { BlogCategoriesPanel } from './BlogCategoriesPanel';
import blogStyles from './blogAdmin.module.css';

const FULL_LIST_LIMIT = 500;
const PAGE_LIMIT = 20;

function formatDate(iso: string | null, dateLocale: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(dateLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

type BlogListStr = ReturnType<typeof adminBlogListStrings>;

function SortableBlogRow({
  row,
  selected,
  onToggle,
  reorderable,
  str,
  dateLocale,
}: {
  row: AdminBlogPostListItem;
  selected: boolean;
  onToggle: () => void;
  reorderable: boolean;
  str: BlogListStr;
  dateLocale: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: !reorderable,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      {reorderable ? (
        <td className={catalogStyles.dragHandle} {...attributes} {...listeners} title={str.dragTitle}>
          ⋮⋮
        </td>
      ) : null}
      <td>
        <AccountCheckbox
          id={`blog-${row.id}`}
          className={catalogStyles.adminCheckboxInTable}
          checked={selected}
          onChange={onToggle}
          aria-label={str.selectRow(row.title)}
        />
      </td>
      <td>
        <Link href={`/admin/blog/${row.id}`}>{row.title}</Link>
      </td>
      <td>{row.category?.name ?? '—'}</td>
      <td>
        <span
          className={`${catalogStyles.badge} ${row.isPublished ? catalogStyles.badgeOn : catalogStyles.badgeOff}`}
        >
          {row.isPublished ? str.published : str.draft}
        </span>
      </td>
      <td>{formatDate(row.publishedAt, dateLocale)}</td>
    </tr>
  );
}

export function BlogListClient() {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminBlogListStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<AdminBlogCategoryRow[]>([]);
  const [rows, setRows] = useState<AdminBlogPostListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [listOversized, setListOversized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const filtered = !!(debouncedQ.trim() || categoryId);
  const canReorder = !filtered && !listOversized && total > 0 && total <= FULL_LIST_LIMIT;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await adminBackendJson<AdminBlogCategoryRow[]>('blog/admin/categories');
      setCategories(data);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (filtered) {
        const qs = new URLSearchParams();
        if (debouncedQ) qs.set('q', debouncedQ);
        if (categoryId) qs.set('categoryId', categoryId);
        qs.set('page', String(page));
        qs.set('limit', String(PAGE_LIMIT));
        const data = await adminBackendJson<AdminBlogPostsListResponse>(`blog/admin/posts?${qs}`);
        setRows(data.items);
        setTotal(data.total);
        setListOversized(false);
      } else {
        const qsAll = new URLSearchParams();
        qsAll.set('page', '1');
        qsAll.set('limit', String(FULL_LIST_LIMIT));
        const dataAll = await adminBackendJson<AdminBlogPostsListResponse>(`blog/admin/posts?${qsAll}`);
        setTotal(dataAll.total);
        if (dataAll.total > FULL_LIST_LIMIT) {
          setListOversized(true);
          const qsPage = new URLSearchParams();
          qsPage.set('page', String(page));
          qsPage.set('limit', String(PAGE_LIMIT));
          const dataPage = await adminBackendJson<AdminBlogPostsListResponse>(`blog/admin/posts?${qsPage}`);
          setRows(dataPage.items);
        } else {
          setListOversized(false);
          setRows(dataAll.items);
        }
      }
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : s.errLoad);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, categoryId, page, filtered, s]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, categoryId]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (!canReorder) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = rows.findIndex((r) => r.id === active.id);
      const newIndex = rows.findIndex((r) => r.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(rows, oldIndex, newIndex);
      setRows(next);
      try {
        await adminBackendJson('blog/admin/posts/reorder', {
          method: 'POST',
          body: JSON.stringify({ orderedIds: next.map((r) => r.id) }),
        });
        router.refresh();
        await loadPosts();
      } catch (e) {
        setError(e instanceof Error ? e.message : s.errReorder);
        await loadPosts();
      }
    },
    [canReorder, rows, loadPosts, router, s],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const showPagination = filtered || listOversized;

  async function bulkDelete() {
    if (!selected.size) return;
    const ok = window.confirm(s.confirmDelete(selected.size));
    if (!ok) return;
    setBulkBusy(true);
    setError(null);
    try {
      await adminBackendJson('blog/admin/posts/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      router.refresh();
      await loadPosts();
      await loadCategories();
    } catch (e) {
      setError(e instanceof Error ? e.message : s.errDelete);
    } finally {
      setBulkBusy(false);
    }
  }

  const tableHead = useMemo(
    () => (
      <thead>
        <tr>
          {canReorder ? <th style={{ width: 36 }} aria-label={s.thOrder} /> : null}
          <th style={{ width: 44 }}>
            <AccountCheckbox
              id="blog-select-all"
              className={catalogStyles.adminCheckboxInTable}
              checked={allSelected}
              onChange={() => {
                if (allSelected) setSelected(new Set());
                else setSelected(new Set(rows.map((r) => r.id)));
              }}
              aria-label={s.selectAllOnPage}
            />
          </th>
          <th>{s.thTitle}</th>
          <th>{s.thCategory}</th>
          <th>{s.thVisibility}</th>
          <th>{s.thDate}</th>
        </tr>
      </thead>
    ),
    [allSelected, canReorder, rows, s],
  );

  const ids = rows.map((r) => r.id);

  return (
    <>
      <BlogCategoriesPanel
        categories={categories}
        onChanged={() => {
          void loadCategories();
          void loadPosts();
        }}
      />

      <div className={catalogStyles.toolbar}>
        <input
          type="search"
          className={catalogStyles.search}
          placeholder={s.searchPh}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={s.searchAria}
        />
        <select
          className={catalogStyles.search}
          style={{ maxWidth: 220, flex: '0 1 220px' }}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-label={s.filterCatAria}
        >
          <option value="">{s.allCategories}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <Link href="/admin/blog/new" className={`${catalogStyles.btn} ${catalogStyles.btnPrimary}`}>
          {s.newPost}
        </Link>
        <div className={catalogStyles.bulkGroup} role="group" aria-label={s.bulkAria}>
          {!debouncedQ && rows.length > 0 ? (
            <>
              <button
                type="button"
                className={catalogStyles.btn}
                onClick={() => setSelected(new Set(rows.map((r) => r.id)))}
              >
                {s.selectAllPage}
              </button>
              <button type="button" className={catalogStyles.btn} onClick={() => setSelected(new Set())}>
                {s.clearSelection}
              </button>
            </>
          ) : null}
          <button
            type="button"
            className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
            disabled={!selected.size || bulkBusy}
            onClick={bulkDelete}
          >
            {bulkBusy ? s.bulkBusy : s.deleteBulk(selected.size)}
          </button>
        </div>
      </div>

      {listOversized ? (
        <p className={blogStyles.reorderHint}>{s.reorderLimit(FULL_LIST_LIMIT)}</p>
      ) : canReorder ? (
        <p className={blogStyles.reorderHint}>{s.reorderHint}</p>
      ) : null}

      {error ? <p className={catalogStyles.error}>{error}</p> : null}

      {loading ? (
        <p className={catalogStyles.muted}>{c.loading}</p>
      ) : rows.length === 0 ? (
        <p className={catalogStyles.muted}>{s.empty}</p>
      ) : (
        <>
          <div className={catalogStyles.tableWrap}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <table className={catalogStyles.table}>
                {tableHead}
                <tbody>
                  <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                    {rows.map((r) => (
                      <SortableBlogRow
                        key={r.id}
                        row={r}
                        selected={selected.has(r.id)}
                        onToggle={() => toggle(r.id)}
                        reorderable={canReorder}
                        str={s}
                        dateLocale={dateLocale}
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </DndContext>
          </div>
          {showPagination && totalPages > 1 ? (
            <div className={blogStyles.paginationRow}>
              <button
                type="button"
                className={catalogStyles.btn}
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {s.back}
              </button>
              <span>{s.pageOf(page, totalPages, total)}</span>
              <button
                type="button"
                className={catalogStyles.btn}
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                {s.forward}
              </button>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
