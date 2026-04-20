'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import { adminCategoryNewStrings } from '@/lib/admin-i18n/adminCategoriesI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import styles from '../../catalogAdmin.module.css';

function NewCategoryForm() {
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminCategoryNewStrings(locale), [locale]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentId = searchParams.get('parentId') ?? '';

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [backgroundMediaObjectId, setBackgroundMediaObjectId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function clearCover() {
    setBackgroundImageUrl('');
    setBackgroundMediaObjectId(null);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const bgTrim = backgroundImageUrl.trim();
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        isActive,
        ...(slug.trim() ? { slug: slug.trim() } : {}),
        ...(parentId ? { parentId } : {}),
        ...(seoTitle.trim() ? { seoTitle: seoTitle.trim() } : {}),
        ...(seoDescription.trim() ? { seoDescription: seoDescription.trim() } : {}),
      };
      if (bgTrim) {
        body.backgroundImageUrl = bgTrim;
        if (backgroundMediaObjectId) body.backgroundMediaObjectId = backgroundMediaObjectId;
      }
      await adminBackendJson<{ id: string }>('catalog/admin/categories', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await revalidatePublicCatalogCache();
      router.push('/admin/catalog/categories');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : s.errCreate);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <MediaLibraryPickerModal
        open={pickerOpen}
        title={s.coverTitle}
        mediaFilter="image"
        onClose={() => setPickerOpen(false)}
        onPick={(sel) => {
          setBackgroundImageUrl(sel.url);
          setBackgroundMediaObjectId(sel.id);
          setError(null);
          setPickerOpen(false);
        }}
      />
      <p className={styles.backRow}>
        <Link
          className={styles.backLink}
          href={parentId ? `/admin/catalog/categories/${parentId}` : '/admin/catalog/categories'}
        >
          {s.back}
        </Link>
      </p>
      <h1 className={styles.title}>{parentId ? s.titleSub : s.titleRoot}</h1>

      {error ? <p className={styles.error}>{error}</p> : null}

      <form className={styles.form} onSubmit={submit}>
        <label className={styles.label}>
          {s.name}
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={1}
          />
        </label>
        <label className={styles.label}>
          {s.slugOpt}
          <input
            className={styles.input}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={s.slugPh}
          />
        </label>
        <div className={styles.label}>
          <div className={styles.labelCheckboxRow}>
            <AccountCheckbox
              id="new-category-active"
              className={styles.adminCheckboxForm}
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              aria-label={s.activeAria}
            />
            <label htmlFor="new-category-active">{s.activeLabel}</label>
          </div>
        </div>
        <label className={styles.label}>
          {s.seoTitle}
          <input
            className={styles.input}
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
          />
        </label>
        <label className={styles.label}>
          {s.seoDesc}
          <textarea
            className={styles.textarea}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={4}
          />
        </label>
        <div className={styles.label}>
          {s.coverLabel} <span className={styles.muted}>{s.coverOptional}</span>
          <div className={styles.fileRow}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => {
                setError(null);
                setPickerOpen(true);
              }}
            >
              {s.pickLibrary}
            </button>
            {backgroundImageUrl.trim() ? (
              <button type="button" className={styles.btn} onClick={clearCover}>
                {s.removeCover}
              </button>
            ) : null}
          </div>
          {backgroundImageUrl ? (
            <div className={styles.bgPreview} style={{ marginTop: 10 }}>
              <img src={backgroundImageUrl} alt="" />
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={saving}
          >
            {saving ? s.saveBusy : s.create}
          </button>
          <Link href="/admin/catalog/categories" className={styles.btn}>
            {s.cancel}
          </Link>
        </div>
      </form>
    </main>
  );
}

export default function NewCategoryPage() {
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminCategoryNewStrings(locale), [locale]);
  return (
    <Suspense fallback={<p className={styles.muted}>{s.suspenseLoading}</p>}>
      <NewCategoryForm />
    </Suspense>
  );
}
