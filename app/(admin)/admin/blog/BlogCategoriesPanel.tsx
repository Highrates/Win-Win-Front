'use client';

import { useCallback, useMemo, useState } from 'react';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { adminBlogCategoriesStrings } from '@/lib/admin-i18n/adminBlogI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import catalogStyles from '../catalog/catalogAdmin.module.css';
import type { AdminBlogCategoryRow } from './blogAdminTypes';
import blogStyles from './blogAdmin.module.css';

type Props = {
  categories: AdminBlogCategoryRow[];
  onChanged: () => void;
};

export function BlogCategoriesPanel({ categories, onChanged }: Props) {
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminBlogCategoriesStrings(locale), [locale]);

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
      setError(e instanceof Error ? e.message : s.errCreate);
    } finally {
      setBusy(false);
    }
  }, [name, onChanged, s]);

  const remove = useCallback(
    async (row: AdminBlogCategoryRow) => {
      if (row.postCount > 0) return;
      const ok = window.confirm(s.confirmDelete(row.name));
      if (!ok) return;
      setBusy(true);
      setError(null);
      try {
        await adminBackendJson(`blog/admin/categories/${row.id}`, { method: 'DELETE' });
        onChanged();
      } catch (e) {
        setError(e instanceof Error ? e.message : s.errDelete);
      } finally {
        setBusy(false);
      }
    },
    [onChanged, s],
  );

  return (
    <div className={blogStyles.categoryPanel}>
      <h2 className={blogStyles.categoryPanelTitle}>{s.panelTitle}</h2>
      {error ? <p className={catalogStyles.error}>{error}</p> : null}
      {categories.length === 0 ? (
        <p className={catalogStyles.muted}>{s.emptyHint}</p>
      ) : (
        <div role="list">
          {categories.map((c) => (
            <div key={c.id} className={blogStyles.categoryRow} role="listitem">
              <span className={blogStyles.categoryName}>{c.name}</span>
              <span className={blogStyles.categoryMeta}>{s.slugArticles(c.slug, c.postCount)}</span>
              <button
                type="button"
                className={catalogStyles.btn}
                disabled={busy || c.postCount > 0}
                title={c.postCount > 0 ? s.deleteBlockedTitle : undefined}
                onClick={() => remove(c)}
              >
                {s.delete}
              </button>
            </div>
          ))}
        </div>
      )}
      <div className={blogStyles.categoryAddRow}>
        <input
          type="text"
          className={blogStyles.categoryAddInput}
          placeholder={s.namePh}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label={s.nameAria}
        />
        <button
          type="button"
          className={`${catalogStyles.btn} ${catalogStyles.btnPrimary} ${blogStyles.categoryAddBtn}`}
          disabled={busy || !name.trim()}
          onClick={createCategory}
        >
          {busy ? s.addBusy : s.add}
        </button>
      </div>
    </div>
  );
}
