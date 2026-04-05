'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import styles from '../catalog/catalogAdmin.module.css';
import type { AdminCuratedCollectionRow } from './collectionsAdminTypes';

function kindLabel(k: AdminCuratedCollectionRow['kind']): string {
  return k === 'PRODUCT' ? 'Товары' : 'Бренды';
}

export function CollectionsListClient() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [rows, setRows] = useState<AdminCuratedCollectionRow[]>([]);
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
      const data = await adminBackendJson<AdminCuratedCollectionRow[]>(
        `catalog/admin/curated-collections${params}`,
      );
      setRows(data);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ]);

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
    const ok = window.confirm(`Удалить выбранные коллекции (${selected.size})?`);
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
      await adminBackendJson<{ deleted: string[] }>('catalog/admin/curated-collections/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      await revalidatePublicCatalogCache();
      router.refresh();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления');
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
          placeholder="Поиск по названию…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Поиск коллекций"
        />
        <Link href="/admin/collections/new" className={`${styles.btn} ${styles.btnPrimary}`}>
          Добавить коллекцию
        </Link>
        <div className={styles.bulkGroup} role="group" aria-label="Массовые операции">
          {!debouncedQ && rows.length > 0 ? (
            <>
              <button
                type="button"
                className={styles.btn}
                onClick={() => setSelected(new Set(rows.map((r) => r.id)))}
              >
                Выбрать все
              </button>
              <button type="button" className={styles.btn} onClick={() => setSelected(new Set())}>
                Снять выбор
              </button>
            </>
          ) : null}
          <button
            type="button"
            className={`${styles.btn} ${styles.btnDanger}`}
            disabled={!selected.size || deleting}
            onClick={removeSelected}
          >
            {deleting ? 'Удаление…' : `Удалить (${selected.size})`}
          </button>
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {loading ? (
        <p className={styles.muted}>Загрузка…</p>
      ) : rows.length === 0 ? (
        <p className={styles.muted}>Коллекций не найдено.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 44 }}>
                  <AccountCheckbox
                    id="collections-select-all"
                    className={styles.adminCheckboxInTable}
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Выбрать все коллекции"
                  />
                </th>
                <th>Название коллекции</th>
                <th>Тип</th>
                <th>Кол-во позиций</th>
                <th>Доступность</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <AccountCheckbox
                      id={`col-${r.id}`}
                      className={styles.adminCheckboxInTable}
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                      aria-label={`Выбрать ${r.name}`}
                    />
                  </td>
                  <td>
                    <Link href={`/admin/collections/${r.id}`}>{r.name}</Link>
                  </td>
                  <td>{kindLabel(r.kind)}</td>
                  <td>{r.itemCount}</td>
                  <td>
                    <span className={`${styles.badge} ${r.isActive ? styles.badgeOn : styles.badgeOff}`}>
                      {r.isActive ? 'В каталоге' : 'Скрыта'}
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
