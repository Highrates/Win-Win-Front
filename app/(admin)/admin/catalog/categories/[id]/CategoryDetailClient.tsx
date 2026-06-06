'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminCompactBtn, AdminCompactBtnLink } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import { AdminTextArea, AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import { adminCategoryDetailStrings } from '@/lib/admin-i18n/adminCategoriesI18n';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
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
  backgroundMediaObjectId: string | null;
  parent: { id: string; name: string; slug: string } | null;
  children: SubcatRow[];
  products: ProductBrief[];
  /** 0 = корень, 1 = подкатегория, 2 = третий уровень (дальше создавать нельзя) */
  depthFromRoot?: number;
};

function formatPrice(p: unknown, currency: string, numberLocale: string): string {
  const n = typeof p === 'string' ? parseFloat(p) : Number(p);
  if (Number.isNaN(n)) return '—';
  try {
    return new Intl.NumberFormat(numberLocale, { style: 'currency', currency: currency || 'RUB' }).format(n);
  } catch {
    return `${n} ${currency}`;
  }
}

export function CategoryDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminCategoryDetailStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const { confirm } = useAdminConfirm();
  const numberLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';
  const [data, setData] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [backgroundMediaObjectId, setBackgroundMediaObjectId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      setBackgroundMediaObjectId(row.backgroundMediaObjectId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : s.errLoad);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id, s.errLoad]);

  useEffect(() => {
    load();
  }, [load]);

  function clearCover() {
    setBackgroundImageUrl('');
    setBackgroundMediaObjectId(null);
    setSaveMsg(null);
  }

  async function removeCategory() {
    if (!data) return;
    if (!(await confirm({ title: s.confirmDelete(name.trim() || data.name) }))) return;
    setDeleting(true);
    setSaveMsg(null);
    try {
      const res = await adminBackendJson<{ deleted: string[]; skipped: string[] }>(
        'catalog/admin/categories/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({ ids: [id] }),
        },
      );
      if (res.deleted.includes(id)) {
        await revalidatePublicCatalogCache();
        router.push('/admin/catalog/categories');
        router.refresh();
        return;
      }
      setSaveMsg(s.deleteBlocked);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : s.errDelete);
    } finally {
      setDeleting(false);
    }
  }

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    const bgTrim = backgroundImageUrl.trim();
    setSaving(true);
    setSaveMsg(null);
    try {
      await adminBackendJson<CategoryDetail>(`catalog/admin/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          isActive,
          seoTitle: seoTitle.trim() || null,
          seoDescription: seoDescription.trim() || null,
          backgroundImageUrl: bgTrim || null,
          backgroundMediaObjectId: bgTrim ? backgroundMediaObjectId ?? null : null,
        }),
      });
      await revalidatePublicCatalogCache();
      router.push('/admin/catalog/categories');
      router.refresh();
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : s.saveErr);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className={styles.muted}>{c.loading}</p>;
  }

  if (error || !data) {
    return (
        <main>
          <p className={styles.error}>{error ?? s.notFound}</p>
          <AdminCompactBtnLink href="/admin/catalog/categories" variant="outline">
            {c.backToList}
          </AdminCompactBtnLink>
        </main>
    );
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
          setSaveMsg(null);
          setPickerOpen(false);
        }}
      />
      <p className={styles.backRow}>
        <Link href="/admin/catalog/categories" className={styles.backLink}>
          {s.backCats}
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
          <h1 className={styles.title}>{name}</h1>
          <div className={styles.detailTitleActions}>
            <AdminCompactBtn
              type="submit"
              form={CATEGORY_FORM_ID}
              variant="accent"
              disabled={saving || deleting}
            >
              {saving ? s.saveBusy : s.save}
            </AdminCompactBtn>
            <AdminCompactBtn
              type="button"
              variant="danger"
              disabled={saving || deleting}
              onClick={() => void removeCategory()}
            >
              {deleting ? s.deleteBusy : s.delete}
            </AdminCompactBtn>
          </div>
        </div>
        {saveMsg ? <p className={styles.error}>{saveMsg}</p> : null}
        <p className={styles.muted} style={{ margin: '0 0 12px' }}>
          Slug: {slug}
        </p>

        {backgroundImageUrl ? (
          <div className={styles.bgPreview}>
            <img src={backgroundImageUrl} alt="" />
          </div>
        ) : (
          <p className={styles.muted} style={{ margin: 0 }}>
            {s.coverMissing}
          </p>
        )}
        <div className={styles.coverActions}>
          <AdminCompactBtn
            type="button"
            disabled={saving || deleting}
            onClick={() => {
              setSaveMsg(null);
              setPickerOpen(true);
            }}
          >
            {s.pickLibrary}
          </AdminCompactBtn>
          {backgroundImageUrl.trim() ? (
            <AdminCompactBtn
              type="button"
              variant="outline"
              disabled={saving || deleting}
              onClick={clearCover}
            >
              {s.removeCover}
            </AdminCompactBtn>
          ) : null}
        </div>
      </div>

      <form id={CATEGORY_FORM_ID} className={styles.form} onSubmit={saveMeta} style={{ maxWidth: 560 }}>
        <AdminTextField
          label={s.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
        />
        <AdminTextField
          label={c.slug}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
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
            id="edit-category-active"
            className={styles.adminCheckboxForm}
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            aria-label={s.activeAria}
          />
          <label htmlFor="edit-category-active">{s.activeLabel}</label>
        </div>
      </form>

      <section className={styles.section} aria-labelledby="subcat-heading">
        <div className={styles.sectionHead}>
          <h2 id="subcat-heading" className={styles.groupHeading}>
            {s.subcats}
          </h2>
          {(data.depthFromRoot ?? 0) < 2 ? (
            <AdminCompactBtnLink href={`/admin/catalog/categories/new?parentId=${data.id}`}>
              {s.createSub}
            </AdminCompactBtnLink>
          ) : (
            <span className={styles.muted} title={s.maxDepthTitle}>
              {s.maxDepth}
            </span>
          )}
        </div>
        {data.children.length === 0 ? (
          <p className={styles.muted}>{s.noSubs}</p>
        ) : (
          <SubcategoriesDnD parentCategoryId={data.id} items={data.children} onUpdated={load} />
        )}
      </section>

      <section className={styles.section} aria-labelledby="products-heading">
        <h2 id="products-heading" className={styles.groupHeading}>
          {s.products}
        </h2>
        {data.products.length === 0 ? (
          <p className={styles.muted}>{s.noProducts}</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{s.thName}</th>
                  <th>{s.thPrice}</th>
                  <th>{s.thActive}</th>
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
                    <td>{formatPrice(p.price, p.currency, numberLocale)}</td>
                    <td>{p.isActive ? s.yes : s.no}</td>
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
