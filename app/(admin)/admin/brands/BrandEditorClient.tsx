'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminCompactBtn, AdminCompactBtnLink } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminTextArea, AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { RichBlock } from '@/components/RichBlock/RichBlock';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import {
  ProductGalleryEditor,
  type ProductGalleryFrame,
} from '@/components/admin/ProductGalleryEditor/ProductGalleryEditor';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import { adminBrandEditorStrings } from '@/lib/admin-i18n/adminBrandEditorI18n';
import { adminProductGalleryEditorStrings } from '@/lib/admin-i18n/adminProductGalleryEditorI18n';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { createClientRandomId } from '@/lib/clientRandomId';
import pn from '../catalog/products/new/productNew.module.css';
import styles from '../catalog/catalogAdmin.module.css';
import type {
  AdminBrandMaterial,
  AdminBrandMaterialColor,
  BrandAdminDetail,
} from './adminBrandTypes';

type MaterialRow = {
  id: string;
  serverId?: string;
  name: string;
  colors: ColorRow[];
};

type ColorRow = {
  id: string;
  serverId?: string;
  name: string;
  imageUrl: string;
};

function rowId() {
  return createClientRandomId();
}

/**
 * Превращает исходное имя файла («beige-linen_01.JPG») в удобную подпись цвета:
 * отрезает расширение, заменяет разделители на пробелы и делает заглавную первую букву.
 */
function colorNameFromFile(originalName: string): string {
  const base = originalName
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[._\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!base) return '';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function brandMaterialToRow(m: AdminBrandMaterial): MaterialRow {
  return {
    id: rowId(),
    serverId: m.id,
    name: m.name,
    colors: m.colors.map(brandColorToRow),
  };
}

function brandColorToRow(c: AdminBrandMaterialColor): ColorRow {
  return {
    id: rowId(),
    serverId: c.id,
    name: c.name,
    imageUrl: c.imageUrl ?? '',
  };
}

const FORM_ID = 'brand-editor-form';
const BRAND_GALLERY_MAX = 3;

function galleryUrlsToFrames(raw: unknown): ProductGalleryFrame[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .slice(0, BRAND_GALLERY_MAX)
    .map((url) => ({ id: rowId(), url: url.trim() }));
}

export function BrandEditorClient({ brandId }: { brandId?: string }) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminBrandEditorStrings(locale), [locale]);
  const galleryStr = useMemo(() => adminProductGalleryEditorStrings(locale), [locale]);
  const common = useMemo(() => adminCommonI18n(locale), [locale]);
  const isEdit = !!brandId;

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [productPreviewImageUrl, setProductPreviewImageUrl] = useState('');
  const [galleryFrames, setGalleryFrames] = useState<ProductGalleryFrame[]>([]);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [picker, setPicker] = useState<
    null | { filter: 'image' | 'video' | 'all'; title?: string; multi?: boolean }
  >(null);
  const richPickResolver = useRef<((url: string | null) => void) | null>(null);
  const brandTargetRef = useRef<
    | 'logo'
    | 'background'
    | 'productPreview'
    | { kind: 'brandColor'; materialId: string; colorId: string }
    | { kind: 'brandColorBatch'; materialId: string }
    | null
  >(null);
  const [saving, setSaving] = useState(false);

  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [materialsLoaded, setMaterialsLoaded] = useState(false);
  const [materialsSaving, setMaterialsSaving] = useState(false);
  const [materialsMsg, setMaterialsMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const row = await adminBackendJson<BrandAdminDetail>(`catalog/admin/brands/${brandId}`);
      setName(row.name);
      setSlug(row.slug);
      setIsActive(row.isActive);
      setLogoUrl(row.logoUrl ?? '');
      setBackgroundImageUrl(row.backgroundImageUrl ?? '');
      setProductPreviewImageUrl(row.productPreviewImageUrl ?? '');
      setGalleryFrames(galleryUrlsToFrames(row.galleryImageUrls));
      setShortDescription(row.shortDescription ?? '');
      setDescription(row.description ?? '');
      setSeoTitle(row.seoTitle ?? '');
      setSeoDescription(row.seoDescription ?? '');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : s.loadErrorNotFound);
    } finally {
      setLoading(false);
    }
  }, [brandId, s]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMaterials = useCallback(async () => {
    if (!brandId) return;
    try {
      const rows = await adminBackendJson<AdminBrandMaterial[]>(
        `catalog/admin/brands/${brandId}/materials`,
      );
      setMaterials(rows.map(brandMaterialToRow));
      setMaterialsLoaded(true);
    } catch (e) {
      setMaterialsMsg(e instanceof Error ? e.message : s.materialsLoadErr);
      setMaterialsLoaded(true);
    }
  }, [brandId, s]);

  useEffect(() => {
    if (isEdit) void loadMaterials();
  }, [isEdit, loadMaterials]);

  const pickMediaFromLibrary = useCallback(
    (kind: 'image' | 'video') =>
      new Promise<string | null>((resolve) => {
        richPickResolver.current = resolve;
        brandTargetRef.current = null;
        setPicker({
          filter: kind === 'video' ? 'video' : 'image',
          title: kind === 'video' ? s.pickerVideoDesc : s.pickerImageDesc,
        });
      }),
    [s],
  );

  function openLogoPicker() {
    richPickResolver.current = null;
    brandTargetRef.current = 'logo';
    setSaveMsg(null);
    setPicker({ filter: 'image', title: s.pickerLogo });
  }

  function openBackgroundPicker() {
    richPickResolver.current = null;
    brandTargetRef.current = 'background';
    setSaveMsg(null);
    setPicker({ filter: 'image', title: s.pickerCover });
  }

  function openProductPreviewPicker() {
    richPickResolver.current = null;
    brandTargetRef.current = 'productPreview';
    setSaveMsg(null);
    setPicker({ filter: 'image', title: s.pickerProductPreview });
  }

  function clearProductPreview() {
    setProductPreviewImageUrl('');
  }

  function handlePickerPick(sel: { url: string; id: string; originalName?: string }) {
    const resolveRich = richPickResolver.current;
    if (resolveRich) {
      richPickResolver.current = null;
      resolveRich(sel.url);
      setPicker(null);
      return;
    }
    const t = brandTargetRef.current;
    brandTargetRef.current = null;
    if (t === 'logo') {
      setLogoUrl(sel.url);
    } else if (t === 'background') {
      setBackgroundImageUrl(sel.url);
    } else if (t === 'productPreview') {
      setProductPreviewImageUrl(sel.url);
    } else if (t && typeof t === 'object' && t.kind === 'brandColor') {
      setMaterials((prev) =>
        prev.map((m) =>
          m.id !== t.materialId
            ? m
            : {
                ...m,
                colors: m.colors.map((c) =>
                  c.id === t.colorId ? { ...c, imageUrl: sel.url } : c,
                ),
              },
        ),
      );
    }
    setPicker(null);
  }

  function handlePickerPickBatch(
    items: { url: string; id: string; originalName?: string }[],
  ) {
    const t = brandTargetRef.current;
    brandTargetRef.current = null;
    if (t && typeof t === 'object' && t.kind === 'brandColorBatch') {
      const materialId = t.materialId;
      const newRows: ColorRow[] = items.map((it) => ({
        id: rowId(),
        name: colorNameFromFile(it.originalName ?? ''),
        imageUrl: it.url,
      }));
      setMaterials((prev) =>
        prev.map((m) =>
          m.id !== materialId ? m : { ...m, colors: [...m.colors, ...newRows] },
        ),
      );
    }
    setPicker(null);
  }

  function openBrandColorImagePicker(materialId: string, colorId: string) {
    richPickResolver.current = null;
    brandTargetRef.current = { kind: 'brandColor', materialId, colorId };
    setMaterialsMsg(null);
    setPicker({ filter: 'image', title: s.pickerColorImage });
  }

  function openBrandColorBatchPicker(materialId: string) {
    richPickResolver.current = null;
    brandTargetRef.current = { kind: 'brandColorBatch', materialId };
    setMaterialsMsg(null);
    setPicker({
      filter: 'image',
      title: s.pickerColorBatch,
      multi: true,
    });
  }

  function addMaterial() {
    setMaterials((prev) => [...prev, { id: rowId(), name: '', colors: [] }]);
  }

  function removeMaterial(mid: string) {
    setMaterials((prev) => prev.filter((m) => m.id !== mid));
  }

  function updateMaterialName(mid: string, name: string) {
    setMaterials((prev) => prev.map((m) => (m.id !== mid ? m : { ...m, name })));
  }

  function addColorToMaterial(mid: string) {
    setMaterials((prev) =>
      prev.map((m) =>
        m.id !== mid
          ? m
          : { ...m, colors: [...m.colors, { id: rowId(), name: '', imageUrl: '' }] },
      ),
    );
  }

  function removeColorFromMaterial(mid: string, cid: string) {
    setMaterials((prev) =>
      prev.map((m) =>
        m.id !== mid ? m : { ...m, colors: m.colors.filter((c) => c.id !== cid) },
      ),
    );
  }

  function updateColor(mid: string, cid: string, patch: Partial<ColorRow>) {
    setMaterials((prev) =>
      prev.map((m) =>
        m.id !== mid
          ? m
          : {
              ...m,
              colors: m.colors.map((c) => (c.id === cid ? { ...c, ...patch } : c)),
            },
      ),
    );
  }

  async function saveMaterials() {
    if (!brandId) return;
    const cleaned = materials
      .map((m) => ({
        ...(m.serverId ? { id: m.serverId } : {}),
        name: m.name.trim(),
        sortOrder: 0,
        colors: m.colors
          .map((c, ci) => ({
            ...(c.serverId ? { id: c.serverId } : {}),
            name: c.name.trim(),
            imageUrl: c.imageUrl.trim() || null,
            sortOrder: ci,
          }))
          .filter((c) => c.name),
      }))
      .filter((m) => m.name)
      .map((m, mi) => ({ ...m, sortOrder: mi }));

    setMaterialsSaving(true);
    setMaterialsMsg(null);
    try {
      const updated = await adminBackendJson<AdminBrandMaterial[]>(
        `catalog/admin/brands/${brandId}/materials`,
        {
          method: 'PATCH',
          body: JSON.stringify({ materials: cleaned }),
        },
      );
      setMaterials(updated.map(brandMaterialToRow));
      await revalidatePublicCatalogCache();
      setMaterialsMsg(s.materialsSaved);
    } catch (err) {
      setMaterialsMsg(err instanceof Error ? err.message : s.materialsSaveErr);
    } finally {
      setMaterialsSaving(false);
    }
  }

  function handlePickerClose() {
    const resolveRich = richPickResolver.current;
    if (resolveRich) {
      richPickResolver.current = null;
      resolveRich(null);
    }
    brandTargetRef.current = null;
    setPicker(null);
  }

  function clearLogo() {
    setLogoUrl('');
  }

  function clearCoverImage() {
    setBackgroundImageUrl('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    const galleryUrls = galleryFrames.map((f) => f.url.trim()).filter(Boolean);
    const body = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      isActive,
      logoUrl: logoUrl.trim() || null,
      backgroundImageUrl: backgroundImageUrl.trim() || null,
      productPreviewImageUrl: productPreviewImageUrl.trim() || null,
      galleryImageUrls: galleryUrls,
      shortDescription: shortDescription.trim().slice(0, 400) || null,
      description: description.trim() || null,
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
    };
    try {
      if (isEdit && brandId) {
        await adminBackendJson<BrandAdminDetail>(`catalog/admin/brands/${brandId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        await revalidatePublicCatalogCache();
        router.push('/admin/brands');
        router.refresh();
      } else {
        await adminBackendJson<{ id: string }>('catalog/admin/brands', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        await revalidatePublicCatalogCache();
        router.push('/admin/brands');
        router.refresh();
      }
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : s.saveErr);
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && loading) {
    return <p className={styles.muted}>{common.loading}</p>;
  }

  if (isEdit && loadError) {
    return (
      <main>
        <p className={styles.error}>{loadError}</p>
        <AdminCompactBtnLink href="/admin/brands" variant="outline">
          {common.backToList}
        </AdminCompactBtnLink>
      </main>
    );
  }

  return (
    <main>
      <MediaLibraryPickerModal
        open={picker !== null}
        title={picker?.title}
        mediaFilter={picker?.filter ?? 'image'}
        onClose={handlePickerClose}
        onPick={picker?.multi ? undefined : handlePickerPick}
        onPickBatch={picker?.multi ? handlePickerPickBatch : undefined}
      />
      <p className={styles.backRow}>
        <Link href="/admin/brands" className={styles.backLink}>
          {s.backBrands}
        </Link>
      </p>

      <div className={styles.detailTitleRow}>
        <h1 className={styles.detailTitle}>{isEdit ? name || s.titleFallback : s.titleNew}</h1>
        <AdminCompactBtn
          type="submit"
          form={FORM_ID}
          variant="accent"
          disabled={saving || !name.trim()}
        >
          {saving ? s.saving : isEdit ? s.save : s.create}
        </AdminCompactBtn>
      </div>

      {saveMsg ? <p className={styles.error}>{saveMsg}</p> : null}

      {isEdit ? (
        <p className={styles.muted} style={{ margin: '0 0 16px' }}>
          Slug: {slug}
        </p>
      ) : null}

      <form id={FORM_ID} className={`${styles.form} ${pn.formWide}`} onSubmit={submit}>
        <AdminTextField
          label={s.brandName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
        />

        {!isEdit ? (
          <AdminTextField
            label={s.slugOptional}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={s.slugAutoPlaceholder}
          />
        ) : (
          <AdminTextField
            label={s.slugLabel}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        )}

        <AdminTextArea
          label={`${s.shortDescLabel} ${s.shortDescHint}`}
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value.slice(0, 400))}
          rows={3}
          maxLength={400}
          placeholder={s.shortDescPlaceholder}
        />
        <p className={styles.muted} style={{ margin: '0 0 4px' }}>
          {shortDescription.length}/400
        </p>

        <div>
          <h2 className={styles.groupHeading}>{s.sectionLogo}</h2>
          <div className={styles.coverActions}>
            <AdminCompactBtn type="button" onClick={openLogoPicker}>
              {common.mediaLibrary}
            </AdminCompactBtn>
            {logoUrl ? (
              <AdminCompactBtn type="button" variant="danger" onClick={clearLogo}>
                {s.removeLogo}
              </AdminCompactBtn>
            ) : null}
          </div>
          {logoUrl ? (
            <div
              className={styles.bgPreview}
              style={{
                marginTop: 10,
                maxWidth: 200,
                aspectRatio: '1',
                borderRadius: 8,
                overflow: 'hidden',
                background: 'var(--color-bright-snow, #f5f5f5)',
              }}
            >
              <img src={logoUrl} alt="" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
            </div>
          ) : null}
        </div>

        <div className={styles.labelCheckboxRow}>
          <AccountCheckbox
            id="brand-active"
            className={styles.adminCheckboxForm}
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            aria-label={s.publishedAria}
          />
          <label htmlFor="brand-active">{s.publishedLabel}</label>
        </div>

        <div>
          <h2 className={styles.groupHeading}>{s.sectionCover}</h2>
          <div className={styles.coverActions}>
            <AdminCompactBtn type="button" onClick={openBackgroundPicker}>
              {common.mediaLibrary}
            </AdminCompactBtn>
            {backgroundImageUrl ? (
              <AdminCompactBtn type="button" variant="danger" onClick={clearCoverImage}>
                {s.removeCover}
              </AdminCompactBtn>
            ) : null}
          </div>
          {backgroundImageUrl ? (
            <div className={styles.bgPreview} style={{ marginTop: 10 }}>
              <img src={backgroundImageUrl} alt="" />
            </div>
          ) : null}
        </div>

        <div>
          <h2 className={styles.groupHeading}>{s.sectionProductPreview}</h2>
          <p className={styles.muted} style={{ margin: '0 0 8px' }}>
            {s.productPreviewHint}
          </p>
          <div className={styles.coverActions}>
            <AdminCompactBtn type="button" onClick={openProductPreviewPicker}>
              {common.mediaLibrary}
            </AdminCompactBtn>
            {productPreviewImageUrl ? (
              <AdminCompactBtn type="button" variant="danger" onClick={clearProductPreview}>
                {s.removeProductPreview}
              </AdminCompactBtn>
            ) : null}
          </div>
          {productPreviewImageUrl ? (
            <div
              className={styles.bgPreview}
              style={{
                marginTop: 10,
                maxWidth: 280,
                aspectRatio: '4 / 3',
                borderRadius: 8,
                overflow: 'hidden',
                background: 'var(--color-bright-snow, #f5f5f5)',
              }}
            >
              <img
                src={productPreviewImageUrl}
                alt=""
                style={{ objectFit: 'contain', width: '100%', height: '100%' }}
              />
            </div>
          ) : null}
        </div>

        <div>
          <h2 className={styles.groupHeading}>{s.sectionGallery}</h2>
          <ProductGalleryEditor
            mode="full"
            items={galleryFrames}
            onChange={setGalleryFrames}
            strings={galleryStr}
            maxItems={BRAND_GALLERY_MAX}
          />
        </div>

        <div>
          <h2 className={styles.groupHeading}>{s.sectionRich}</h2>
          <RichBlock
            value={description}
            onChange={setDescription}
            placeholder={s.richPlaceholder}
            pickMediaFromLibrary={pickMediaFromLibrary}
          />
        </div>

        {isEdit ? (
          <div className={pn.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.groupHeading}>{s.sectionMaterials}</h2>
              <AdminCompactBtn
                type="button"
                variant="accent"
                onClick={() => {
                  void saveMaterials();
                }}
                disabled={materialsSaving || !materialsLoaded}
              >
                {materialsSaving ? s.saving : s.saveMaterials}
              </AdminCompactBtn>
            </div>

            {!materialsLoaded ? (
              <p className={styles.muted}>{s.loadingMaterials}</p>
            ) : (
              <div className={pn.repeatList}>
                {materials.map((m) => (
                  <div key={m.id} className={pn.elementCard}>
                    <div className={pn.repeatRow}>
                      <AdminTextField
                        className={pn.modFieldGrow}
                        placeholder={s.materialNamePh}
                        value={m.name}
                        onChange={(e) => updateMaterialName(m.id, e.target.value)}
                        aria-label={s.materialNamePh}
                      />
                      <AdminCompactBtn type="button" variant="danger" onClick={() => removeMaterial(m.id)}>
                        {s.deleteMaterial}
                      </AdminCompactBtn>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <p className={styles.muted} style={{ margin: '0 0 8px' }}>
                        {s.colorsHeading}
                      </p>
                      {m.colors.map((c) => (
                        <div
                          key={c.id}
                          className={`${pn.repeatRow} ${pn.galleryRowLayout}`}
                          style={{ marginBottom: 8 }}
                        >
                          {c.imageUrl ? (
                            <img className={pn.galleryThumb} src={c.imageUrl} alt="" />
                          ) : (
                            <div className={pn.galleryThumb} aria-hidden />
                          )}
                          <AdminTextField
                            className={pn.modFieldGrow}
                            placeholder={s.colorNamePh}
                            value={c.name}
                            onChange={(e) => updateColor(m.id, c.id, { name: e.target.value })}
                            aria-label={s.colorNamePh}
                          />
                          <div className={pn.rowActions}>
                            <AdminCompactBtn
                              type="button"
                              onClick={() => openBrandColorImagePicker(m.id, c.id)}
                            >
                              {common.mediaLibrary}
                            </AdminCompactBtn>
                            <AdminCompactBtn
                              type="button"
                              variant="danger"
                              onClick={() => removeColorFromMaterial(m.id, c.id)}
                            >
                              {s.delete}
                            </AdminCompactBtn>
                          </div>
                        </div>
                      ))}
                      <div className={styles.formActions}>
                        <AdminCompactBtn type="button" onClick={() => openBrandColorBatchPicker(m.id)}>
                          {s.addColorFromLib}
                        </AdminCompactBtn>
                        <AdminCompactBtn type="button" onClick={() => addColorToMaterial(m.id)}>
                          {s.addColorEmpty}
                        </AdminCompactBtn>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {materialsMsg ? (
              <p
                className={materialsMsg === s.materialsSaved ? styles.muted : styles.error}
                style={{ marginTop: 8 }}
              >
                {materialsMsg}
              </p>
            ) : null}

            <div className={styles.formActions}>
              <AdminCompactBtn type="button" onClick={addMaterial}>
                {s.addMaterial}
              </AdminCompactBtn>
            </div>
          </div>
        ) : (
          <p className={styles.muted}>{s.materialsAfterCreate}</p>
        )}

        <div className={pn.section}>
          <h2 className={styles.groupHeading}>SEO</h2>
          <div className={pn.sectionStack}>
            <AdminTextField
              label={s.seoTitle}
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
            <AdminTextArea
              label={s.seoDescription}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <AdminCompactBtn type="submit" variant="accent" disabled={saving || !name.trim()}>
            {saving ? s.saving : isEdit ? s.save : s.create}
          </AdminCompactBtn>
          <AdminCompactBtnLink href="/admin/brands" variant="outline">
            {s.cancel}
          </AdminCompactBtnLink>
        </div>
      </form>
    </main>
  );
}
