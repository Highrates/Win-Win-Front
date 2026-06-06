'use client';

import { useCallback, useMemo, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { adminBlogCategoriesStrings } from '@/lib/admin-i18n/adminBlogI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
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
  const { confirm } = useAdminConfirm();

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
      if (!(await confirm({ title: s.confirmDelete(row.name) }))) return;
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
    [confirm, onChanged, s],
  );

  return (
      <div className={blogStyles.categoryPanel}>
      <h2 className={`${catalogStyles.groupHeading} ${blogStyles.categoryPanelHeading}`}>{s.panelTitle}</h2>
      {error ? <p className={catalogStyles.error}>{error}</p> : null}
      {categories.length === 0 ? (
        <p className={catalogStyles.muted}>{s.emptyHint}</p>
      ) : (
        <div role="list">
          {categories.map((c) => (
            <div key={c.id} className={blogStyles.categoryRow} role="listitem">
              <span className={blogStyles.categoryName}>{c.name}</span>
              <span className={blogStyles.categoryMeta}>{s.slugArticles(c.slug, c.postCount)}</span>
              <AdminCompactBtn
                type="button"
                variant="danger"
                disabled={busy || c.postCount > 0}
                title={c.postCount > 0 ? s.deleteBlockedTitle : undefined}
                onClick={() => remove(c)}
              >
                {s.delete}
              </AdminCompactBtn>
            </div>
          ))}
        </div>
      )}
      <div className={blogStyles.categoryAddRow}>
        <AdminTextField
          className={blogStyles.categoryAddField}
          placeholder={s.namePh}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label={s.nameAria}
        />
        <AdminCompactBtn
          type="button"
          disabled={busy || !name.trim()}
          onClick={createCategory}
        >
          {busy ? s.addBusy : s.add}
        </AdminCompactBtn>
      </div>
    </div>
  );
}
