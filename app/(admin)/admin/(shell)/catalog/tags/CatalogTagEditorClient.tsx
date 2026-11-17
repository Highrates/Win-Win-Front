'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminProductMultiPickerModal } from '@/components/admin/AdminProductMultiPickerModal/AdminProductMultiPickerModal';
import { AdminTableRemoveButton } from '@/components/admin/AdminTableRemoveButton/AdminTableRemoveButton';
import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import { adminCatalogTagEditorStrings } from '@/lib/admin-i18n/adminCatalogTagsI18n';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import type { AdminProductRow } from '../products/adminProductTypes';
import styles from '@/app/(admin)/admin/catalogAdmin.module.css';
import type { CatalogTagAdminDetail } from './catalogTagsAdminTypes';

const TAG_FORM_ID = 'catalog-tag-editor-form';

type ProductRow = { key: string; productId: string; name: string; slug: string };

function rowKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function CatalogTagEditorClient({ tagId }: { tagId?: string } = {}) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const str = useMemo(() => adminCatalogTagEditorStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const isEdit = !!tagId;

  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!isEdit);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverMediaObjectId, setCoverMediaObjectId] = useState<string | null>(null);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  const excludedProductIds = useMemo(
    () => new Set(productRows.map((r) => r.productId)),
    [productRows],
  );

  useEffect(() => {
    let cancelled = false;
    if (!isEdit) {
      setLoaded(true);
      return;
    }
    void (async () => {
      setLoadError(null);
      setLoaded(false);
      try {
        const d = await adminBackendJson<CatalogTagAdminDetail>(`catalog/admin/catalog-tags/${tagId}`);
        if (cancelled) return;
        setName(d.name);
        setSlug(d.slug);
        setCoverUrl(d.coverImageUrl ?? '');
        setCoverMediaObjectId(d.coverMediaObjectId ?? null);
        setProductRows(
          d.productItems.map((it) => ({
            key: rowKey(),
            productId: it.productId,
            name: it.name,
            slug: it.slug,
          })),
        );
        setLoaded(true);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : str.errLoad);
          setLoaded(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tagId, isEdit, str.errLoad]);

  function commitProductPicker(picks: AdminProductRow[]) {
    setProductRows((prev) => [
      ...prev,
      ...picks
        .filter((p) => !prev.some((r) => r.productId === p.id))
        .map((p) => ({ key: rowKey(), productId: p.id, name: p.name, slug: p.slug })),
    ]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    const nameTrim = name.trim();
    if (!nameTrim) {
      setSaveError(str.nameRequired);
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: nameTrim,
        productIds: productRows.map((r) => r.productId),
      };
      if (slug.trim()) body.slug = slug.trim();
      if (coverUrl.trim()) {
        body.coverImageUrl = coverUrl.trim();
        if (coverMediaObjectId) body.coverMediaObjectId = coverMediaObjectId;
      } else {
        body.coverImageUrl = null;
      }

      if (isEdit) {
        await adminBackendJson(`catalog/admin/catalog-tags/${tagId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        const created = await adminBackendJson<CatalogTagAdminDetail>('catalog/admin/catalog-tags', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        await revalidatePublicCatalogCache();
        router.push(`/admin/catalog/tags/${created.id}`);
        router.refresh();
        return;
      }
      await revalidatePublicCatalogCache();
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : str.saveErr);
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && !loaded && !loadError) {
    return <p className={styles.muted}>{c.loading}</p>;
  }

  return (
    <>
      <p className={styles.backRow}>
        <Link className={styles.backLink} href="/admin/catalog/tags">
          {str.backList}
        </Link>
      </p>

      {loadError ? <p className={styles.error}>{loadError}</p> : null}

      <MediaLibraryPickerModal
        open={coverPickerOpen}
        title={str.coverTitle}
        mediaFilter="image"
        onClose={() => setCoverPickerOpen(false)}
        onPick={(sel) => {
          setCoverUrl(sel.url);
          setCoverMediaObjectId(sel.id);
          setCoverPickerOpen(false);
          setSaveError(null);
        }}
      />

      <AdminProductMultiPickerModal
        open={productPickerOpen}
        excludedIds={excludedProductIds}
        alreadyInLabel={str.inTag}
        title={str.addProduct}
        onClose={() => setProductPickerOpen(false)}
        onAdd={commitProductPicker}
      />

      <div className={styles.detailTitleRow}>
        <h1 className={styles.title}>{isEdit ? str.titleEdit : str.titleNew}</h1>
        <AdminCompactBtn
          type="submit"
          form={TAG_FORM_ID}
          variant="accent"
          disabled={saving || !!loadError || (isEdit && !loaded)}
        >
          {saving ? str.saving : str.save}
        </AdminCompactBtn>
      </div>

      <form id={TAG_FORM_ID} onSubmit={submit}>
        {saveError ? <p className={styles.error}>{saveError}</p> : null}

        <AdminTextField label={str.nameLabel} value={name} onChange={(e) => setName(e.target.value)} />
        <AdminTextField
          label={str.slugLabel}
          placeholder={str.slugPh}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <div className={styles.fieldBlock}>
          <span className={styles.adminFieldLabel}>{str.coverBlock}</span>
          {coverUrl.trim() ? (
            <div className={styles.bgPreview} style={{ maxWidth: 360 }}>
              <img src={coverUrl.trim()} alt="" />
            </div>
          ) : null}
          <div className={styles.coverActions}>
            <AdminCompactBtn
              type="button"
              onClick={() => {
                setSaveError(null);
                setCoverPickerOpen(true);
              }}
            >
              {str.pickLibrary}
            </AdminCompactBtn>
            {coverUrl.trim() ? (
              <AdminCompactBtn
                type="button"
                variant="outline"
                onClick={() => {
                  setCoverUrl('');
                  setCoverMediaObjectId(null);
                }}
              >
                {str.removeCover}
              </AdminCompactBtn>
            ) : null}
          </div>
        </div>

        <div className={styles.fieldBlock}>
          <span className={styles.adminFieldLabel}>{str.contentTitle}</span>
          <div className={styles.formActions} style={{ marginTop: 0, marginBottom: 12 }}>
            <AdminCompactBtn type="button" variant="outline" onClick={() => setProductPickerOpen(true)}>
              {str.addProduct}
            </AdminCompactBtn>
          </div>

          {productRows.length === 0 ? (
            <p className={styles.muted}>{str.nothing}</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{str.thName}</th>
                  <th style={{ width: 80 }} aria-label={str.remove} />
                </tr>
              </thead>
              <tbody>
                {productRows.map((r) => (
                  <tr key={r.key}>
                    <td>
                      <Link href={`/admin/catalog/products/${r.productId}`}>{r.name}</Link>
                    </td>
                    <td className={styles.tableCellActions}>
                      <AdminTableRemoveButton
                        label={str.remove}
                        onClick={() =>
                          setProductRows((prev) => prev.filter((x) => x.key !== r.key))
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </form>
    </>
  );
}
