'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminProductSetsListStrings } from '@/lib/admin-i18n/adminProductSetsI18n';
import styles from '../catalog/catalogAdmin.module.css';
import type { AdminProductSetRow } from './productSetsAdminTypes';

export function ProductSetsListClient() {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminProductSetsListStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [rows, setRows] = useState<AdminProductSetRow[]>([]);
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
      const data = await adminBackendJson<AdminProductSetRow[]>(
        `catalog/admin/product-sets${params}`,
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
      await adminBackendJson<{ deleted: string[] }>('catalog/admin/product-sets/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      await revalidatePublicCatalogCache();
      router.refresh();
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
        <Link href="/admin/product-sets/new" className={`${styles.btn} ${styles.btnPrimary}`}>
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
        </div>
      )}
    </>
  );
}
