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
import { adminProductsListStrings } from '@/lib/admin-i18n/adminProductsListI18n';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import {
  adminQueryKeys,
  useAdminList,
  useAdminListSearch,
  useInvalidateAdminQueries,
} from '@/lib/adminQuery';
import styles from '../catalogAdmin.module.css';
import type { AdminProductRow } from './adminProductTypes';

function formatPrice(amount: string, currency: string, numberLocale: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  const cur = currency || 'RUB';
  try {
    return new Intl.NumberFormat(numberLocale, {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: cur === 'RUB' ? 0 : 2,
    }).format(n);
  } catch {
    return `${amount} ${cur}`;
  }
}

export function ProductsListClient() {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminProductsListStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const numberLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';
  const invalidate = useInvalidateAdminQueries();
  const { confirm } = useAdminConfirm();

  const { q, setQ, debouncedQ, page, setPage } = useAdminListSearch();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { rows, total, limit, loading, isFetching, error: listError, refetch } = useAdminList<AdminProductRow>({
    queryKey: adminQueryKeys.products.list({ q: debouncedQ, page }),
    path: 'catalog/admin/products',
    page,
    q: debouncedQ,
    errorFallback: s.errLoad,
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
      const res = await adminBackendJson<{ deleted: string[]; skipped: string[] }>(
        'catalog/admin/products/bulk-delete',
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
      await invalidate(adminQueryKeys.products.all);
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
          <AdminCompactBtnLink href="/admin/catalog/products/new">{s.add}</AdminCompactBtnLink>
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
            <th style={{ width: 54 }} aria-label={s.thPreview} />
            <th style={{ width: 44 }}>
              <AccountCheckbox
                id="products-select-all"
                className={styles.adminCheckboxInTable}
                checked={allSelected}
                onChange={toggleAll}
                aria-label={s.selectAllProducts}
              />
            </th>
            <th>{s.thName}</th>
            <th>{s.thCategory}</th>
            <th>{s.thPrice}</th>
            <th>{s.thVis}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={!r.isActive ? styles.rowInactive : undefined}>
              <td>
                {r.thumbUrl ? (
                  <img
                    className={styles.productListThumb}
                    src={r.thumbUrl}
                    alt=""
                    width={46}
                    height={46}
                  />
                ) : (
                  <div className={styles.productListThumbPh} aria-hidden />
                )}
              </td>
              <td>
                <AccountCheckbox
                  id={`product-select-${r.id}`}
                  className={styles.adminCheckboxInTable}
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                  aria-label={s.selectOne(r.name)}
                />
              </td>
              <td>
                <Link href={`/admin/catalog/products/${r.id}`}>{r.name}</Link>
              </td>
              <td>
                {r.categoryPath || r.category.name}
                {(r.additionalCategoryCount ?? 0) > 0 ? (
                  <span className={styles.muted}> +{r.additionalCategoryCount}</span>
                ) : null}
              </td>
              <td>{formatPrice(r.price, r.currency, numberLocale)}</td>
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
