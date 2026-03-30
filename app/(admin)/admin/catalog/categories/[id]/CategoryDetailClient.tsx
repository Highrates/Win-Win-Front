'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import {
  adminBackendJson,
  adminUploadCategoryImage,
  revalidatePublicCatalogCache,
} from '@/lib/adminBackendFetch';
import styles from '../../catalogAdmin.module.css';
import { SubcategoriesDnD, type SubcatRow } from './SubcategoriesDnD';

const CATEGORY_FORM_ID = 'category-detail-form';

type ProductBrief = {
  id: string;
  name: string;
  slug: string;
  price: unknown;
  currency: string;
  isActive: boolean;
};

type CategoryDetail = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  backgroundImageUrl: string | null;
  parent: { id: string; name: string; slug: string } | null;
  children: SubcatRow[];
  products: ProductBrief[];
};

function formatPrice(p: unknown, currency: string): string {
  const n = typeof p === 'string' ? parseFloat(p) : Number(p);
  if (Number.isNaN(n)) return '—';
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: currency || 'RUB' }).format(n);
  } catch {
    return `${n} ${currency}`;
  }
}

export function CategoryDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const row = await adminBackendJson<CategoryDetail>(`catalog/admin/categories/${id}`);
      setData(row);
      setName(row.name);
      setSlug(row.slug);
      setIsActive(row.isActive);
      setSeoTitle(row.seoTitle ?? '');
      setSeoDescription(row.seoDescription ?? '');
      setBackgroundImageUrl(row.backgroundImageUrl ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не найдено');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setUploading(true);
    setSaveMsg(null);
    try {
      const { url } = await adminUploadCategoryImage(f);
      setBackgroundImageUrl(url);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Не удалось загрузить файл');
    } finally {
      setUploading(false);
    }
  }

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    const bg = backgroundImageUrl.trim();
    if (!bg) {
      setSaveMsg('Загрузите фоновое изображение — поле обязательно.');
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await adminBackendJson<CategoryDetail>(`catalog/admin/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          isActive,
          seoTitle: seoTitle.trim() || null,
          seoDescription: seoDescription.trim() || null,
          backgroundImageUrl: bg,
        }),
      });
      setData(updated);
      setSaveMsg('Сохранено');
      await revalidatePublicCatalogCache();
      router.refresh();
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className={styles.muted}>Загрузка…</p>;
  }

  if (error || !data) {
    return (
      <main>
        <p className={styles.error}>{error ?? 'Категория не найдена'}</p>
        <Link href="/admin/catalog/categories" className={styles.btn}>
          К списку
        </Link>
      </main>
    );
  }

  return (
    <main>
      <p className={styles.backRow}>
        <Link href="/admin/catalog/categories" className={styles.backLink}>
          ← Категории
        </Link>
        {data.parent ? (
          <>
            {' · '}
            <Link href={`/admin/catalog/categories/${data.parent.id}`} className={styles.backLink}>
              {data.parent.name}
            </Link>
          </>
        ) : null}
      </p>

      <div className={styles.detailHero}>
        <div className={styles.detailTitleRow}>
          <h1 className={styles.detailTitle}>{name}</h1>
          <button
            type="submit"
            form={CATEGORY_FORM_ID}
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={saving || !backgroundImageUrl.trim()}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
        {saveMsg ? (
          <p className={saveMsg.startsWith('Сохран') ? styles.muted : styles.error}>{saveMsg}</p>
        ) : null}
        <p className={styles.muted} style={{ margin: '0 0 12px' }}>
          Slug: {slug}
        </p>

        {backgroundImageUrl ? (
          <div className={styles.bgPreview}>
            <img src={backgroundImageUrl} alt="" />
          </div>
        ) : (
          <p className={styles.error}>
            Фоновое изображение не задано — загрузите файл и сохраните (поле обязательно для витрины).
          </p>
        )}
      </div>

      <form id={CATEGORY_FORM_ID} className={styles.form} onSubmit={saveMeta} style={{ maxWidth: 560 }}>
        <label className={styles.label}>
          Название категории
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={1}
          />
        </label>
        <label className={styles.label}>
          Slug
          <input className={styles.input} value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </label>
        <div className={styles.label}>
          <div className={styles.labelCheckboxRow}>
            <AccountCheckbox
              id="edit-category-active"
              className={styles.adminCheckboxForm}
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              aria-label="Активна на витрине"
            />
            <label htmlFor="edit-category-active">Активна на витрине</label>
          </div>
        </div>
        <label className={styles.label}>
          SEO title (витрина)
          <input className={styles.input} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
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
        </div>
      </form>

      <section className={styles.section} aria-labelledby="subcat-heading">
        <div className={styles.sectionHead}>
          <h2 id="subcat-heading" className={styles.sectionTitle}>
            Подкатегории
          </h2>
          <Link
            href={`/admin/catalog/categories/new?parentId=${data.id}`}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            Создать подкатегорию
          </Link>
        </div>
        {data.children.length === 0 ? (
          <p className={styles.muted}>Подкатегорий пока нет.</p>
        ) : (
          <SubcategoriesDnD parentCategoryId={data.id} items={data.children} onUpdated={load} />
        )}
      </section>

      <section className={styles.section} aria-labelledby="products-heading">
        <h2 id="products-heading" className={styles.sectionTitle}>
          Товары категории
        </h2>
        {data.products.length === 0 ? (
          <p className={styles.muted}>В этой категории пока нет товаров.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Цена</th>
                  <th>Активен</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer">
                        {p.name}
                      </a>
                    </td>
                    <td>{formatPrice(p.price, p.currency)}</td>
                    <td>{p.isActive ? 'да' : 'нет'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
