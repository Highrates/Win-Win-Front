'use client';

import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminCompactBtn, AdminCompactBtnLink } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListPagination } from '@/components/admin/AdminListPagination/AdminListPagination';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import {
  ADMIN_LIST_DEFAULT_LIMIT,
  adminBackendList,
  adminListParams,
  normalizeCategoriesListResponse,
  type AdminListResponse,
} from '@/lib/adminListResponse';
import { adminCategoriesListStrings } from '@/lib/admin-i18n/adminCategoriesI18n';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import {
  adminQueryKeys,
  useAdminList,
  useAdminListSearch,
  useInvalidateAdminQueries,
} from '@/lib/adminQuery';
import styles from '../catalogAdmin.module.css';
import { AdminCategorySearchTable } from './AdminCategorySearchTable';
import { AdminCategorySortableTable } from './AdminCategorySortableTable';
import type { AdminCategoryRow } from './adminCategoryTypes';

export type { AdminCategoryRow } from './adminCategoryTypes';

function parentKey(parentId: string | null): string {
  return parentId ?? 'root';
}

type CategoriesQueryData = AdminListResponse<AdminCategoryRow> & { paginated: boolean };

export function CategoriesListClient() {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminCategoriesListStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const invalidate = useInvalidateAdminQueries();
  const { confirm } = useAdminConfirm();
  const { q, setQ, debouncedQ, page, setPage } = useAdminListSearch();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { rows, data, loading, isFetching, error: listError, refetch } = useAdminList<
    AdminCategoryRow,
    CategoriesQueryData
  >({
    queryKey: adminQueryKeys.categories.list(debouncedQ ? { q: debouncedQ, page } : { q: '' }),
    page,
    q: debouncedQ,
    errorFallback: s.errLoad,
    queryFn: async () => {
      if (!debouncedQ) {
        const allRows = await adminBackendJson<AdminCategoryRow[]>('catalog/admin/categories');
        const normalized = normalizeCategoriesListResponse(allRows);
        return {
          items: normalized.rows,
          total: normalized.total,
          page: normalized.page,
          limit: normalized.limit,
          paginated: normalized.paginated,
        };
      }
      const res = await adminBackendList<AdminCategoryRow>(
        'catalog/admin/categories',
        adminListParams({ page, q: debouncedQ }),
      );
      const normalized = normalizeCategoriesListResponse(res);
      return {
        items: normalized.rows,
        total: normalized.total,
        page: normalized.page,
        limit: normalized.limit,
        paginated: normalized.paginated,
      };
    },
  });

  const listPaginated = data?.paginated ?? false;
  const listTotal = data?.total ?? 0;
  const error = mutationError ?? listError;

  useEffect(() => {
    setSelected(new Set());
  }, [debouncedQ]);

  const sortedRoots = useMemo(() => {
    if (debouncedQ) return [];
    return rows
      .filter((r) => r.parentId == null)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ru'));
  }, [rows, debouncedQ]);

  const sortedChildren = useMemo(() => {
    if (debouncedQ) return [];
    return rows
      .filter((r) => r.parentId != null)
      .slice()
      .sort((a, b) => {
        const pa = a.parent?.name ?? '';
        const pb = b.parent?.name ?? '';
        const byParent = pa.localeCompare(pb, 'ru');
        if (byParent !== 0) return byParent;
        return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ru');
      });
  }, [rows, debouncedQ]);

  const runReorder = useCallback(
    async (parentId: string | null, orderedIds: string[]) => {
      try {
        await adminBackendJson('catalog/admin/categories/reorder', {
          method: 'POST',
          body: JSON.stringify({ parentId, orderedIds }),
        });
        await revalidatePublicCatalogCache();
        router.refresh();
        await invalidate(adminQueryKeys.categories.all);
      } catch (e) {
        setMutationError(e instanceof Error ? e.message : s.errReorder);
        await invalidate(adminQueryKeys.categories.all);
      }
    },
    [invalidate, router, s],
  );

  const onDragEndRoots = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const flat = sortedRoots;
      const activeRow = flat.find((r) => r.id === active.id);
      const overRow = flat.find((r) => r.id === over.id);
      if (!activeRow || !overRow || activeRow.parentId != null || overRow.parentId != null) return;
      const oldIndex = flat.findIndex((r) => r.id === active.id);
      const newIndex = flat.findIndex((r) => r.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(flat, oldIndex, newIndex);
      await runReorder(null, next.map((r) => r.id));
    },
    [sortedRoots, runReorder],
  );

  const onDragEndChildren = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const flat = sortedChildren;
      const activeRow = flat.find((r) => r.id === active.id);
      const overRow = flat.find((r) => r.id === over.id);
      if (!activeRow || !overRow) return;
      if (parentKey(activeRow.parentId) !== parentKey(overRow.parentId)) return;
      const p = activeRow.parentId;
      const siblings = flat.filter((r) => parentKey(r.parentId) === parentKey(p));
      const oldIndex = siblings.findIndex((r) => r.id === active.id);
      const newIndex = siblings.findIndex((r) => r.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(siblings, oldIndex, newIndex);
      await runReorder(p, next.map((r) => r.id));
    },
    [sortedChildren, runReorder],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }

  function toggleAllRoots() {
    const ids = sortedRoots.map((r) => r.id);
    const allOn = ids.length > 0 && ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOn) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleAllChildren() {
    const ids = sortedChildren.map((r) => r.id);
    const allOn = ids.length > 0 && ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOn) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  async function removeSelected() {
    if (!selected.size) return;
    if (!(await confirm({ title: s.confirmDelete(selected.size) }))) return;
    setDeleting(true);
    setMutationError(null);
    try {
      const res = await adminBackendJson<{ deleted: string[]; skipped: string[] }>(
        'catalog/admin/categories/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({ ids: Array.from(selected) }),
        },
      );
      if (res.skipped.length) {
        setMutationError(s.partialDelete(res.skipped.length, res.deleted.length));
      }
      if (res.deleted.length > 0) {
        await revalidatePublicCatalogCache();
        router.refresh();
      }
      setSelected(new Set());
      await invalidate(adminQueryKeys.categories.all);
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : s.errDelete);
    } finally {
      setDeleting(false);
    }
  }

  const rootsAllSelected =
    sortedRoots.length > 0 && sortedRoots.every((r) => selected.has(r.id));
  const childrenAllSelected =
    sortedChildren.length > 0 && sortedChildren.every((r) => selected.has(r.id));
  const searchAllSelected = rows.length > 0 && selected.size === rows.length;

  return (
      <AdminListShell
      loading={loading}
      error={error}
      onRetry={() => void refetch()}
      loadingLabel={c.loading}
      empty={s.empty}
      isEmpty={!loading && !error && rows.length === 0}
      isFetching={isFetching}
      wrapContent={false}
      toolbar={
        <>
          <div className={styles.toolbar}>
            <AdminSearchBox
              className={styles.searchBoxToolbar}
              placeholder={s.searchPh}
              ariaLabel={s.searchAria}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <AdminCompactBtnLink href="/admin/catalog/categories/new">{s.create}</AdminCompactBtnLink>
            <div className={styles.bulkGroup} role="group" aria-label={s.bulkAria}>
              {!debouncedQ && rows.length > 0 ? (
                <>
                  <AdminCompactBtn
                    type="button"
                    variant="outline"
                    onClick={() => setSelected(new Set(rows.map((r) => r.id)))}
                  >
                    {s.selectAll}
                  </AdminCompactBtn>
                  <AdminCompactBtn type="button" variant="outline" onClick={() => setSelected(new Set())}>
                    {s.clear}
                  </AdminCompactBtn>
                </>
              ) : null}
              <AdminCompactBtn
                type="button"
                variant="danger"
                disabled={!selected.size || deleting}
                onClick={removeSelected}
              >
                {deleting ? s.deleting : s.delete(selected.size)}
              </AdminCompactBtn>
            </div>
          </div>
          {debouncedQ ? (
            <p className={styles.muted} style={{ marginBottom: 12 }}>
              {s.searchReorderHint}
            </p>
          ) : null}
        </>
      }
      pagination={
        listPaginated ? (
          <AdminListPagination
            page={page}
            total={listTotal}
            limit={data?.limit ?? ADMIN_LIST_DEFAULT_LIMIT}
            onPageChange={setPage}
            disabled={isFetching}
          />
        ) : null
      }
    >
      {debouncedQ ? (
        <AdminCategorySearchTable
          rows={rows}
          selected={selected}
          onToggle={toggle}
          onToggleAll={toggleAll}
          allRowsSelected={searchAllSelected}
        />
      ) : (
        <>
          <section aria-labelledby="grp-root-cats">
            <h2 id="grp-root-cats" className={styles.groupHeading}>
              {s.rootHeading}
            </h2>
            <AdminCategorySortableTable
              rows={sortedRoots}
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAllRoots}
              allSectionSelected={rootsAllSelected}
              selectAllCheckboxId="cat-select-all-roots"
              selectAllAriaLabel={s.selectAllRootAria}
              checkboxIdPrefix="cat-select-root"
              onDragEnd={onDragEndRoots}
            />
          </section>

          {sortedChildren.length > 0 ? (
            <section aria-labelledby="grp-subcats" style={{ marginTop: 32 }}>
              <h2 id="grp-subcats" className={styles.groupHeading}>
                {s.subHeading}
              </h2>
              <AdminCategorySortableTable
                rows={sortedChildren}
                selected={selected}
                onToggle={toggle}
                onToggleAll={toggleAllChildren}
                allSectionSelected={childrenAllSelected}
                selectAllCheckboxId="cat-select-all-children"
                selectAllAriaLabel={s.selectAllSubAria}
                checkboxIdPrefix="cat-select-child"
                onDragEnd={onDragEndChildren}
              />
            </section>
          ) : null}
        </>
      )}
    </AdminListShell>
  );
}
