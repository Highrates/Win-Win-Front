'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import {
  adminBackendJson,
  adminUploadCategoryImage,
  revalidatePublicCatalogCache,
} from '@/lib/adminBackendFetch';
import styles from '../../catalogAdmin.module.css';

function NewCategoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentId = searchParams.get('parentId') ?? '';

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await adminUploadCategoryImage(f);
      setBackgroundImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить файл');
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const bg = backgroundImageUrl.trim();
    if (!bg) {
      setError('Загрузите фоновое изображение — поле обязательно.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        isActive,
        backgroundImageUrl: bg,
        ...(slug.trim() ? { slug: slug.trim() } : {}),
        ...(parentId ? { parentId } : {}),
        ...(seoTitle.trim() ? { seoTitle: seoTitle.trim() } : {}),
        ...(seoDescription.trim() ? { seoDescription: seoDescription.trim() } : {}),
      };
      const created = await adminBackendJson<{ id: string }>('catalog/admin/categories', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await revalidatePublicCatalogCache();
      router.push(`/admin/catalog/categories/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <p className={styles.backRow}>
        <Link
          className={styles.backLink}
          href={parentId ? `/admin/catalog/categories/${parentId}` : '/admin/catalog/categories'}
        >
          ← Назад
        </Link>
      </p>
      <h1 className={styles.title}>{parentId ? 'Новая подкатегория' : 'Новая категория'}</h1>

      {error ? <p className={styles.error}>{error}</p> : null}

      <form className={styles.form} onSubmit={submit}>
        <label className={styles.label}>
          Название
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={1}
          />
        </label>
        <label className={styles.label}>
          Slug (необязательно)
          <input
            className={styles.input}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="авто из названия"
          />
        </label>
        <div className={styles.label}>
          <div className={styles.labelCheckboxRow}>
            <AccountCheckbox
              id="new-category-active"
              className={styles.adminCheckboxForm}
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              aria-label="Активна на витрине"
            />
            <label htmlFor="new-category-active">Активна на витрине</label>
          </div>
        </div>
        <label className={styles.label}>
          SEO title (витрина)
          <input
            className={styles.input}
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
          />
        </label>
        <label className={styles.label}>
          SEO description (витрина)
          <textarea
            className={styles.textarea}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={4}
          />
        </label>
        <div className={styles.label}>
          Фоновое изображение <span className={styles.muted}>(обязательно)</span>
          <div className={styles.fileRow}>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onPickImage} />
            {uploading ? <span className={styles.muted}>Загрузка…</span> : null}
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
            disabled={saving || !backgroundImageUrl.trim()}
          >
            {saving ? 'Сохранение…' : 'Создать'}
          </button>
          <Link href="/admin/catalog/categories" className={styles.btn}>
            Отмена
          </Link>
        </div>
      </form>
    </main>
  );
}

export default function NewCategoryPage() {
  return (
    <Suspense fallback={<p className={styles.muted}>Загрузка…</p>}>
      <NewCategoryForm />
    </Suspense>
  );
}
