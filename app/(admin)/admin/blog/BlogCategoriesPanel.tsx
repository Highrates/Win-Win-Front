'use client';

import { useCallback, useState } from 'react';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import catalogStyles from '../catalog/catalogAdmin.module.css';
import type { AdminBlogCategoryRow } from './blogAdminTypes';
import blogStyles from './blogAdmin.module.css';

type Props = {
  categories: AdminBlogCategoryRow[];
  onChanged: () => void;
};

export function BlogCategoriesPanel({ categories, onChanged }: Props) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCategory = useCallback(async () => {
    const n = name.trim();
    if (!n) return;
    setBusy(true);
    setError(null);
    try {
      await adminBackendJson('blog/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: n }),
      });
      setName('');
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать');
    } finally {
      setBusy(false);
    }
  }, [name, onChanged]);

  const remove = useCallback(
    async (row: AdminBlogCategoryRow) => {
      if (row.postCount > 0) return;
      const ok = window.confirm(`Удалить категорию «${row.name}»?`);
      if (!ok) return;
      setBusy(true);
      setError(null);
      try {
        await adminBackendJson(`blog/admin/categories/${row.id}`, { method: 'DELETE' });
        onChanged();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось удалить');
      } finally {
        setBusy(false);
      }
    },
    [onChanged],
  );

  return (
    <div className={blogStyles.categoryPanel}>
      <h2 className={blogStyles.categoryPanelTitle}>Категории материалов</h2>
      {error ? <p className={catalogStyles.error}>{error}</p> : null}
      {categories.length === 0 ? (
        <p className={catalogStyles.muted}>Категорий пока нет — добавьте первую ниже.</p>
      ) : (
        <div role="list">
          {categories.map((c) => (
            <div key={c.id} className={blogStyles.categoryRow} role="listitem">
              <span className={blogStyles.categoryName}>{c.name}</span>
              <span className={blogStyles.categoryMeta}>
                slug: {c.slug} · статей: {c.postCount}
              </span>
              <button
                type="button"
                className={catalogStyles.btn}
                disabled={busy || c.postCount > 0}
                title={c.postCount > 0 ? 'Сначала перенесите или удалите статьи' : undefined}
                onClick={() => remove(c)}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
      <div className={blogStyles.categoryAddRow}>
        <input
          type="text"
          className={blogStyles.categoryAddInput}
          placeholder="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Название новой категории"
        />
        <button
          type="button"
          className={`${catalogStyles.btn} ${catalogStyles.btnPrimary} ${blogStyles.categoryAddBtn}`}
          disabled={busy || !name.trim()}
          onClick={createCategory}
        >
          {busy ? 'Сохранение…' : 'Добавить категорию'}
        </button>
      </div>
    </div>
  );
}
