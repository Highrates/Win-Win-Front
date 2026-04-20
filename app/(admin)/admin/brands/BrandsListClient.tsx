'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminBrandsListStrings } from '@/lib/admin-i18n/adminBrandsListI18n';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import styles from '../catalog/catalogAdmin.module.css';
import type { AdminBrandRow } from './adminBrandTypes';

export function BrandsListClient() {
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminBrandsListStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [rows, setRows] = useState<AdminBrandRow[]>([]);
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
      const data = await adminBackendJson<AdminBrandRow[]>(`catalog/admin/brands${params}`);
      setRows(data);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : c.errLoad);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, c.errLoad]);

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

  const allSelected = rows.length > 0 && selected.size === rows.length;

  async function removeSelected() {
    if (!selected.size) return;
    const ok = window.confirm(s.confirmDelete(selected.size));
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await adminBackendJson<{ deleted: string[]; skipped: string[] }>(
        'catalog/admin/brands/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({ ids: Array.from(selected) }),
        }
      );
      if (res.skipped.length) {
        setError(s.partialDelete(res.skipped.length, res.deleted.length));
      } else {
        setError(null);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : c.errDelete);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.search}
          placeholder={s.searchPlaceholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={s.searchAria}
        />
        <Link href="/admin/brands/new" className={`${styles.btn} ${styles.btnPrimary}`}>
          {s.addBrand}
        </Link>
        <div className={styles.bulkGroup} role="group" aria-label={s.bulkAria}>
          {rows.length > 0 ? (
            <>
              <button
                type="button"
                className={styles.btn}
                onClick={() => setSelected(new Set(rows.map((r) => r.id)))}
              >
                {s.selectAll}
              </button>
              <button type="button" className={styles.btn} onClick={() => setSelected(new Set())}>
                {s.clearSelection}
              </button>
            </>
          ) : null}
          <button
            type="button"
            className={`${styles.btn} ${styles.btnDanger}`}
            disabled={!selected.size || deleting}
            onClick={removeSelected}
          >
            {deleting ? s.deleteBusy : s.deleteWithCount(selected.size)}
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
                    id="brand-select-all"
                    className={styles.adminCheckboxInTable}
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label={s.selectAllBrandsAria}
                  />
                </th>
                <th>{s.colName}</th>
                <th>{s.colProducts}</th>
                <th>{s.colVisibility}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={!r.isActive ? styles.rowInactive : undefined}>
                  <td>
                    <AccountCheckbox
                      id={`brand-select-${r.id}`}
                      className={styles.adminCheckboxInTable}
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                      aria-label={s.selectBrandAria(r.name)}
                    />
                  </td>
                  <td>
                    <Link href={`/admin/brands/${r.id}`}>{r.name}</Link>
                  </td>
                  <td>{r._count.products}</td>
                  <td>
                    <span className={r.isActive ? `${styles.badge} ${styles.badgeOn}` : `${styles.badge} ${styles.badgeOff}`}>
                      {r.isActive ? s.published : s.hidden}
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
