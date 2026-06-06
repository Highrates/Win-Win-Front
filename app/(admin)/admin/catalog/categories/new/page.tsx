'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminCompactBtn, AdminCompactBtnLink } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import { AdminTextArea, AdminTextField } from '@/components/AdminTextField/AdminTextField';
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

      <form className={styles.form} onSubmit={submit} style={{ maxWidth: 560 }}>
        <AdminTextField
          label={s.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
        />
        <AdminTextField
          label={s.slugOpt}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={s.slugPh}
        />
        <AdminTextField
          label={s.seoTitle}
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
        />
        <AdminTextArea
          label={s.seoDesc}
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
          rows={4}
        />
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

        <div className={styles.fieldBlock}>
          <span className={styles.adminFieldLabel}>
            {s.coverLabel}{' '}
            <span className={styles.mutedInline}>{s.coverOptional}</span>
          </span>
          {backgroundImageUrl ? (
            <div className={styles.bgPreview}>
              <img src={backgroundImageUrl} alt="" />
            </div>
          ) : null}
          <div className={styles.coverActions} style={{ marginTop: backgroundImageUrl ? 0 : undefined }}>
            <AdminCompactBtn
              type="button"
              disabled={saving}
              onClick={() => {
                setError(null);
                setPickerOpen(true);
              }}
            >
              {s.pickLibrary}
            </AdminCompactBtn>
            {backgroundImageUrl.trim() ? (
              <AdminCompactBtn type="button" variant="outline" disabled={saving} onClick={clearCover}>
                {s.removeCover}
              </AdminCompactBtn>
            ) : null}
          </div>
        </div>

        <div className={styles.formActions}>
          <AdminCompactBtn type="submit" disabled={saving}>
            {saving ? s.saveBusy : s.create}
          </AdminCompactBtn>
          <AdminCompactBtnLink href="/admin/catalog/categories" variant="outline">
            {s.cancel}
          </AdminCompactBtnLink>
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
