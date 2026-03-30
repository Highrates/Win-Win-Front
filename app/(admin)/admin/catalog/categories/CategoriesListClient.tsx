'use client';

import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import styles from '../catalogAdmin.module.css';
import { AdminCategorySearchTable } from './AdminCategorySearchTable';
import { AdminCategorySortableTable } from './AdminCategorySortableTable';
import type { AdminCategoryRow } from './adminCategoryTypes';

export type { AdminCategoryRow } from './adminCategoryTypes';

function parentKey(parentId: string | null): string {
  return parentId ?? 'root';
}

export function CategoriesListClient() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [rows, setRows] = useState<AdminCategoryRow[]>([]);
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
      const data = await adminBackendJson<AdminCategoryRow[]>(
        `catalog/admin/categories${params}`
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
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось сохранить порядок');
        await load();
      }
    },
    [load, router]
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
    [sortedRoots, runReorder]
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
    [sortedChildren, runReorder]
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
    const ok = window.confirm(
      `Удалить выбранные категории (${selected.size})? Сначала удалятся пустые листья, затем освободившиеся родители. Категории с товарами или не выбранными дочерними ветками останутся.`
    );
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await adminBackendJson<{ deleted: string[]; skipped: string[] }>(
        'catalog/admin/categories/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({ ids: Array.from(selected) }),
        }
      );
      if (res.skipped.length) {
        setError(
          `Не удалено ${res.skipped.length} категорий (есть товары или дочерние категории вне выбора). Удалено: ${res.deleted.length}.`
        );
      } else {
        setError(null);
      }
      if (res.deleted.length > 0) {
        await revalidatePublicCatalogCache();
        router.refresh();
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления');
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
    <>
      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.search}
          placeholder="Поиск по названию…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Поиск категорий"
        />
        <Link href="/admin/catalog/categories/new" className={`${styles.btn} ${styles.btnPrimary}`}>
          Создать категорию
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

      {debouncedQ ? (
        <p className={styles.muted} style={{ marginBottom: 12 }}>
          При активном поиске порядок перетаскиванием отключён.
        </p>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      {loading ? (
        <p className={styles.muted}>Загрузка…</p>
      ) : rows.length === 0 ? (
        <p className={styles.muted}>Категории не найдены.</p>
      ) : debouncedQ ? (
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
              Корневые категории
            </h2>
            <AdminCategorySortableTable
              rows={sortedRoots}
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAllRoots}
              allSectionSelected={rootsAllSelected}
              selectAllCheckboxId="cat-select-all-roots"
              selectAllAriaLabel="Выбрать все корневые категории"
              checkboxIdPrefix="cat-select-root"
              onDragEnd={onDragEndRoots}
            />
          </section>

          {sortedChildren.length > 0 ? (
            <section aria-labelledby="grp-subcats" style={{ marginTop: 32 }}>
              <h2 id="grp-subcats" className={styles.groupHeading}>
                Подкатегории
              </h2>
              <AdminCategorySortableTable
                rows={sortedChildren}
                selected={selected}
                onToggle={toggle}
                onToggleAll={toggleAllChildren}
                allSectionSelected={childrenAllSelected}
                selectAllCheckboxId="cat-select-all-children"
                selectAllAriaLabel="Выбрать все подкатегории"
                checkboxIdPrefix="cat-select-child"
                onDragEnd={onDragEndChildren}
              />
            </section>
          ) : null}
        </>
      )}
    </>
  );
}
