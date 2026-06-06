'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminCompactBtn, AdminCompactBtnLink } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListPagination } from '@/components/admin/AdminListPagination/AdminListPagination';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminProductSetsListStrings } from '@/lib/admin-i18n/adminProductSetsI18n';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import {
  adminQueryKeys,
  useAdminList,
  useAdminListSearch,
  useInvalidateAdminQueries,
} from '@/lib/adminQuery';
import styles from '../catalog/catalogAdmin.module.css';
import type { AdminProductSetRow } from './productSetsAdminTypes';

export function ProductSetsListClient() {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminProductSetsListStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const invalidate = useInvalidateAdminQueries();
  const { confirm } = useAdminConfirm();

  const { q, setQ, debouncedQ, page, setPage } = useAdminListSearch();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { rows, total, limit, loading, isFetching, error: listError, refetch } = useAdminList<AdminProductSetRow>({
    queryKey: adminQueryKeys.productSets.list({ q: debouncedQ, page }),
    path: 'catalog/admin/product-sets',
    page,
    q: debouncedQ,
    errorFallback: c.errLoad,
  });

  const error = mutationError ?? listError;

  useEffect(() => {
    setSelected(new Set());
  }, [debouncedQ]);

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
      await adminBackendJson<{ deleted: string[] }>('catalog/admin/product-sets/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      await revalidatePublicCatalogCache();
      router.refresh();
      setSelected(new Set());
      await invalidate(adminQueryKeys.productSets.all);
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
        <div className={styles.toolbar}>
          <AdminSearchBox
            className={styles.searchBoxToolbar}
            placeholder={s.searchPh}
            ariaLabel={s.searchAria}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <AdminCompactBtnLink href="/admin/product-sets/new">{s.add}</AdminCompactBtnLink>
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
      }
      pagination={
        <AdminListPagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={setPage}
          disabled={isFetching}
        />
      }
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: 44 }}>
              <AccountCheckbox
                id="product-sets-select-all"
                className={styles.adminCheckboxInTable}
                checked={allSelected}
                onChange={toggleAll}
                aria-label={s.selectAllAria}
              />
            </th>
            <th>{s.thName}</th>
            <th>{s.thCount}</th>
            <th>{s.thVis}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <AccountCheckbox
                  id={`ps-${r.id}`}
                  className={styles.adminCheckboxInTable}
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                  aria-label={s.selectOne(r.name)}
                />
              </td>
              <td>
                <Link href={`/admin/product-sets/${r.id}`}>{r.name}</Link>
              </td>
              <td>{r.itemCount}</td>
              <td>
                <span className={`${styles.badge} ${r.isActive ? styles.badgeOn : styles.badgeOff}`}>
                  {r.isActive ? s.inCatalog : s.hidden}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminListShell>
  );
}
