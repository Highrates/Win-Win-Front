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
import { useQueryClient } from '@tanstack/react-query';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminCompactBtn, AdminCompactBtnLink } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminSelect } from '@/components/AdminTextField/AdminTextField';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { type AdminListResponse } from '@/lib/adminListResponse';
import { adminBlogListStrings } from '@/lib/admin-i18n/adminBlogI18n';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import {
  adminQueryKeys,
  useAdminList,
  useAdminListSearch,
  useAdminQuery,
  useInvalidateAdminQueries,
} from '@/lib/adminQuery';
import catalogStyles from '../catalog/catalogAdmin.module.css';
import type { AdminBlogCategoryRow, AdminBlogPostListItem, AdminBlogPostsListResponse } from './blogAdminTypes';
import { BlogCategoriesPanel } from './BlogCategoriesPanel';
import blogStyles from './blogAdmin.module.css';

const FULL_LIST_LIMIT = 500;
const PAGE_LIMIT = 20;

type BlogPostsQueryData = AdminListResponse<AdminBlogPostListItem> & { listOversized: boolean };

async function fetchBlogPosts(
  debouncedQ: string,
  categoryId: string,
  page: number,
  filtered: boolean,
): Promise<BlogPostsQueryData> {
  if (filtered) {
    const qs = new URLSearchParams();
    if (debouncedQ) qs.set('q', debouncedQ);
    if (categoryId) qs.set('categoryId', categoryId);
    qs.set('page', String(page));
    qs.set('limit', String(PAGE_LIMIT));
    const data = await adminBackendJson<AdminBlogPostsListResponse>(`blog/admin/posts?${qs}`);
    return {
      items: data.items,
      total: data.total,
      page: data.page,
      limit: data.limit,
      listOversized: false,
    };
  }

  const qsAll = new URLSearchParams();
  qsAll.set('page', '1');
  qsAll.set('limit', String(FULL_LIST_LIMIT));
  const dataAll = await adminBackendJson<AdminBlogPostsListResponse>(`blog/admin/posts?${qsAll}`);
  if (dataAll.total > FULL_LIST_LIMIT) {
    const qsPage = new URLSearchParams();
    qsPage.set('page', String(page));
    qsPage.set('limit', String(PAGE_LIMIT));
    const dataPage = await adminBackendJson<AdminBlogPostsListResponse>(`blog/admin/posts?${qsPage}`);
    return {
      items: dataPage.items,
      total: dataAll.total,
      page: dataPage.page,
      limit: dataPage.limit,
      listOversized: true,
    };
  }
  return {
    items: dataAll.items,
    total: dataAll.total,
    page: 1,
    limit: FULL_LIST_LIMIT,
    listOversized: false,
  };
}

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
  const queryClient = useQueryClient();
  const invalidate = useInvalidateAdminQueries();
  const { confirm } = useAdminConfirm();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminBlogListStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';

  const [categoryId, setCategoryId] = useState('');
  const { q, setQ, debouncedQ, page, setPage } = useAdminListSearch(300, [categoryId]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const filtered = !!(debouncedQ || categoryId);
  const postsQueryKey = adminQueryKeys.blog.posts({ q: debouncedQ, categoryId, page, filtered });

  const { data: categories = [] } = useAdminQuery(
    adminQueryKeys.blog.categories,
    async () => {
      try {
        return await adminBackendJson<AdminBlogCategoryRow[]>('blog/admin/categories');
      } catch {
        return [];
      }
    },
  );

  const {
    rows,
    total,
    data: postsData,
    loading,
    isFetching,
    error: listError,
    refetch,
  } = useAdminList<AdminBlogPostListItem, BlogPostsQueryData>({
    queryKey: postsQueryKey,
    page,
    errorFallback: s.errLoad,
    queryFn: () => fetchBlogPosts(debouncedQ, categoryId, page, filtered),
  });

  const listOversized = postsData?.listOversized ?? false;
  const error = mutationError ?? listError;
  const canReorder = !filtered && !listOversized && total > 0 && total <= FULL_LIST_LIMIT;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    setSelected(new Set());
  }, [postsData]);

  const refreshBlog = useCallback(async () => {
    await invalidate(adminQueryKeys.blog.all);
  }, [invalidate]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (!canReorder || !postsData) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = rows.findIndex((r) => r.id === active.id);
      const newIndex = rows.findIndex((r) => r.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(rows, oldIndex, newIndex);
      queryClient.setQueryData(postsQueryKey, { ...postsData, items: next });
      try {
        await adminBackendJson('blog/admin/posts/reorder', {
          method: 'POST',
          body: JSON.stringify({ orderedIds: next.map((r) => r.id) }),
        });
        router.refresh();
        await refreshBlog();
      } catch (e) {
        setMutationError(e instanceof Error ? e.message : s.errReorder);
        await refreshBlog();
      }
    },
    [canReorder, postsData, rows, postsQueryKey, queryClient, refreshBlog, router, s],
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
    if (!(await confirm({ title: s.confirmDelete(selected.size) }))) return;
    setBulkBusy(true);
    setMutationError(null);
    try {
      await adminBackendJson('blog/admin/posts/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      router.refresh();
      setSelected(new Set());
      await refreshBlog();
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : s.errDelete);
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
          void refreshBlog();
        }}
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
          <div className={catalogStyles.toolbar}>
            <AdminSearchBox
              className={catalogStyles.searchBoxToolbar}
              placeholder={s.searchPh}
              ariaLabel={s.searchAria}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <AdminSelect
              className={blogStyles.toolbarSelectWrap}
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
            </AdminSelect>
            <AdminCompactBtnLink href="/admin/blog/new" variant="accent">
              {s.newPost}
            </AdminCompactBtnLink>
            <div className={catalogStyles.bulkGroup} role="group" aria-label={s.bulkAria}>
              {!debouncedQ && rows.length > 0 ? (
                <>
                  <AdminCompactBtn
                    type="button"
                    variant="outline"
                    onClick={() => setSelected(new Set(rows.map((r) => r.id)))}
                  >
                    {s.selectAllPage}
                  </AdminCompactBtn>
                  <AdminCompactBtn type="button" variant="outline" onClick={() => setSelected(new Set())}>
                    {s.clearSelection}
                  </AdminCompactBtn>
                </>
              ) : null}
              <AdminCompactBtn
                type="button"
                variant="danger"
                disabled={!selected.size || bulkBusy}
                onClick={bulkDelete}
              >
                {bulkBusy ? s.bulkBusy : s.deleteBulk(selected.size)}
              </AdminCompactBtn>
            </div>
          </div>
        }
        pagination={
          showPagination && totalPages > 1 ? (
            <div className={blogStyles.paginationRow}>
              <AdminCompactBtn
                type="button"
                variant="outline"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {s.back}
              </AdminCompactBtn>
              <span>{s.pageOf(page, totalPages, total)}</span>
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
      </AdminListShell>
    </>
  );
}
