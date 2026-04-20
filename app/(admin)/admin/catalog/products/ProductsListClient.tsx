'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminProductsListStrings } from '@/lib/admin-i18n/adminProductsListI18n';
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

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [rows, setRows] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = debouncedQ ? `?q=${encodeURIComponent(debouncedQ)}` : '';
      const data = await adminBackendJson<AdminProductRow[]>(
        `catalog/admin/products${params}`,
      );
      setRows(data);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : s.errLoad);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, s]);

  useEffect(() => {
    load();
  }, [load]);

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
    const ok = window.confirm(s.confirmDelete(selected.size));
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await adminBackendJson<{ deleted: string[]; skipped: string[] }>(
        'catalog/admin/products/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({ ids: Array.from(selected) }),
        },
      );
      if (res.skipped.length) {
        setError(s.partialDelete(res.skipped.length, res.deleted.length));
      } else {
        setError(null);
      }
      if (res.deleted.length > 0) {
        await revalidatePublicCatalogCache();
        router.refresh();
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : s.errDelete);
    } finally {
      setDeleting(false);
    }
  }

  const allSelected = rows.length > 0 && selected.size === rows.length;

  return (
    <>
      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.search}
          placeholder={s.searchPh}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={s.searchAria}
        />
        <Link href="/admin/catalog/products/new" className={`${styles.btn} ${styles.btnPrimary}`}>
          {s.add}
        </Link>
        <div className={styles.bulkGroup} role="group" aria-label={s.bulkAria}>
          {!debouncedQ && rows.length > 0 ? (
            <>
              <button
                type="button"
                className={styles.btn}
                onClick={() => setSelected(new Set(rows.map((r) => r.id)))}
              >
                {s.selectAll}
              </button>
              <button type="button" className={styles.btn} onClick={() => setSelected(new Set())}>
                {s.clear}
              </button>
            </>
          ) : null}
          <button
            type="button"
            className={`${styles.btn} ${styles.btnDanger}`}
            disabled={!selected.size || deleting}
            onClick={removeSelected}
          >
            {deleting ? s.deleting : s.delete(selected.size)}
          </button>
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {loading ? (
        <p className={styles.muted}>{c.loading}</p>
      ) : rows.length === 0 ? (
        <p className={styles.muted}>{s.empty}</p>
      ) : (
        <div className={styles.tableWrap}>
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
        </div>
      )}
    </>
  );
}
