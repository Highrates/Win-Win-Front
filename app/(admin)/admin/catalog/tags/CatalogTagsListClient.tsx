'use client';

import Link from 'next/link';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
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
import { adminCatalogTagsListStrings } from '@/lib/admin-i18n/adminCatalogTagsI18n';
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
import { CatalogTagsSortableTable } from './CatalogTagsSortableTable';
import type { AdminCatalogTagListRow } from './catalogTagsAdminTypes';

type TagsQueryData = AdminListResponse<AdminCatalogTagListRow> & { paginated: boolean };

export function CatalogTagsListClient() {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminCatalogTagsListStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const invalidate = useInvalidateAdminQueries();
  const { confirm } = useAdminConfirm();

  const { q, setQ, debouncedQ, page, setPage } = useAdminListSearch();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { rows, data, loading, isFetching, error: listError, refetch } = useAdminList<
    AdminCatalogTagListRow,
    TagsQueryData
  >({
    queryKey: adminQueryKeys.catalogTags.list(debouncedQ ? { q: debouncedQ, page } : { q: '' }),
    page,
    q: debouncedQ,
    errorFallback: s.errLoad,
    queryFn: async () => {
      if (!debouncedQ) {
        const allRows = await adminBackendJson<AdminCatalogTagListRow[]>('catalog/admin/catalog-tags');
        const normalized = normalizeCategoriesListResponse(allRows);
        return {
          items: normalized.rows,
          total: normalized.total,
          page: normalized.page,
          limit: normalized.limit,
          paginated: normalized.paginated,
        };
      }
      const res = await adminBackendList<AdminCatalogTagListRow>(
        'catalog/admin/catalog-tags',
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

  const sortedRows = useMemo(() => {
    if (debouncedQ) return rows;
    return rows
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ru'));
  }, [rows, debouncedQ]);

  const runReorder = useCallback(
    async (orderedIds: string[]) => {
      try {
        await adminBackendJson('catalog/admin/catalog-tags/reorder', {
          method: 'POST',
          body: JSON.stringify({ orderedIds }),
        });
        await revalidatePublicCatalogCache();
        router.refresh();
        await invalidate(adminQueryKeys.catalogTags.all);
      } catch (e) {
        setMutationError(e instanceof Error ? e.message : s.errReorder);
        await invalidate(adminQueryKeys.catalogTags.all);
      }
    },
    [invalidate, router, s.errReorder],
  );

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const flat = sortedRows;
      const oldIndex = flat.findIndex((r) => r.id === active.id);
      const newIndex = flat.findIndex((r) => r.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(flat, oldIndex, newIndex);
      await runReorder(next.map((r) => r.id));
    },
    [sortedRows, runReorder],
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

  async function removeSelected() {
    if (!selected.size) return;
    if (!(await confirm({ title: s.confirmDelete(selected.size) }))) return;
    setDeleting(true);
    setMutationError(null);
    try {
      await adminBackendJson<{ deleted: string[] }>('catalog/admin/catalog-tags/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      await revalidatePublicCatalogCache();
      router.refresh();
      setSelected(new Set());
      await invalidate(adminQueryKeys.catalogTags.all);
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : s.errDelete);
    } finally {
      setDeleting(false);
    }
  }

  const allSelected = rows.length > 0 && selected.size === rows.length;

  return (
    <AdminListShell
      loading={loading}
      error={error}
      onRetry={() => void refetch()}
      loadingLabel={c.loading}
      empty={s.empty}
      isEmpty={!loading && !error && rows.length === 0}
      isFetching={isFetching}
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
            <AdminCompactBtnLink href="/admin/catalog/tags/new">{s.add}</AdminCompactBtnLink>
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
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 44 }}>
                <AccountCheckbox
                  id="catalog-tags-select-all"
                  className={styles.adminCheckboxInTable}
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label={s.selectAllAria}
                />
              </th>
              <th>{s.thName}</th>
              <th>{s.thSlug}</th>
              <th>{s.thCount}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <AccountCheckbox
                    id={`catalog-tag-select-${r.id}`}
                    className={styles.adminCheckboxInTable}
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    aria-label={s.selectOne(r.name)}
                  />
                </td>
                <td>
                  <Link href={`/admin/catalog/tags/${r.id}`}>{r.name}</Link>
                </td>
                <td>{r.slug}</td>
                <td>{r.productCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <CatalogTagsSortableTable
          rows={sortedRows}
          selected={selected}
          onToggle={toggle}
          onToggleAll={toggleAll}
          allSelected={allSelected}
          onDragEnd={onDragEnd}
        />
      )}
    </AdminListShell>
  );
}
