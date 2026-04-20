'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { RichBlock } from '@/components/RichBlock/RichBlock';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import { adminBrandEditorStrings } from '@/lib/admin-i18n/adminBrandEditorI18n';
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

function parseGallery(raw: unknown): [string, string, string] {
  const list: string[] = [];
  if (Array.isArray(raw)) {
    for (const x of raw) {
      if (typeof x === 'string' && x.trim()) list.push(x.trim());
      if (list.length >= 3) break;
    }
  }
  while (list.length < 3) list.push('');
  return [list[0] ?? '', list[1] ?? '', list[2] ?? ''];
}

export function BrandEditorClient({ brandId }: { brandId?: string }) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminBrandEditorStrings(locale), [locale]);
  const common = useMemo(() => adminCommonI18n(locale), [locale]);
  const isEdit = !!brandId;

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [gallery, setGallery] = useState<[string, string, string]>(['', '', '']);
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
    | number
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
      setGallery(parseGallery(row.galleryImageUrls));
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

  function openGalleryPicker(slot: number) {
    richPickResolver.current = null;
    brandTargetRef.current = slot;
    setSaveMsg(null);
    setPicker({ filter: 'image', title: s.pickerGallery(slot + 1) });
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
    } else if (typeof t === 'number') {
      setGallery((prev) => {
        const next: [string, string, string] = [...prev] as [string, string, string];
        next[t] = sel.url;
        return next;
      });
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

  function clearGallerySlot(slot: number) {
    setGallery((prev) => {
      const next: [string, string, string] = [...prev] as [string, string, string];
      next[slot] = '';
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    const galleryUrls = gallery.map((s) => s.trim()).filter(Boolean);
    const body = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      isActive,
      logoUrl: logoUrl.trim() || null,
      backgroundImageUrl: backgroundImageUrl.trim() || null,
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
        <Link href="/admin/brands" className={styles.btn}>
          {common.backToList}
        </Link>
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
        <button
          type="submit"
          form={FORM_ID}
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={saving || !name.trim()}
        >
          {saving ? s.saving : isEdit ? s.save : s.create}
        </button>
      </div>

      {saveMsg ? <p className={styles.error}>{saveMsg}</p> : null}

      {isEdit ? (
        <p className={styles.muted} style={{ margin: '0 0 16px' }}>
          Slug: {slug}
        </p>
      ) : null}

      <form id={FORM_ID} className={styles.form} onSubmit={submit} style={{ maxWidth: 800 }}>
        <label className={styles.label}>
          {s.brandName}
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={1}
          />
        </label>

        {!isEdit ? (
          <label className={styles.label}>
            {s.slugOptional}
            <input
              className={styles.input}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={s.slugAutoPlaceholder}
            />
          </label>
        ) : (
          <label className={styles.label}>
            {s.slugLabel}
            <input className={styles.input} value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </label>
        )}

        <label className={styles.label}>
          {s.shortDescLabel} <span className={styles.muted}>{s.shortDescHint}</span>
          <textarea
            className={styles.textarea}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value.slice(0, 400))}
            rows={3}
            maxLength={400}
            placeholder={s.shortDescPlaceholder}
          />
          <span className={styles.muted} style={{ display: 'block', marginTop: 6 }}>
            {shortDescription.length}/400
          </span>
        </label>

        <div className={styles.section} style={{ marginTop: 4 }}>
          <h2 className={styles.sectionTitle}>{s.sectionLogo}</h2>
          <div className={styles.fileRow}>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openLogoPicker}>
              {s.pickFromLibrary}
            </button>
            {logoUrl ? (
              <button type="button" className={styles.btn} onClick={clearLogo}>
                {s.removeLogo}
              </button>
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

        <div className={styles.label}>
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
        </div>

        <div className={styles.section} style={{ marginTop: 8 }}>
          <h2 className={styles.sectionTitle}>{s.sectionCover}</h2>
          <div className={styles.fileRow}>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openBackgroundPicker}>
              {s.pickFromLibrary}
            </button>
            {backgroundImageUrl ? (
              <button type="button" className={styles.btn} onClick={clearCoverImage}>
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

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{s.sectionGallery}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[0, 1, 2].map((slot) => (
              <div key={slot} className={styles.label}>
                <span>{s.imageN(slot + 1)}</span>
                <div className={styles.fileRow}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => openGalleryPicker(slot)}
                  >
                    {s.pickFromLibrary}
                  </button>
                  {gallery[slot] ? (
                    <button type="button" className={styles.btn} onClick={() => clearGallerySlot(slot)}>
                      {s.remove}
                    </button>
                  ) : null}
                </div>
                {gallery[slot] ? (
                  <div className={styles.bgPreview} style={{ marginTop: 8, maxWidth: 280 }}>
                    <img src={gallery[slot]} alt="" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{s.sectionRich}</h2>
          <RichBlock
            value={description}
            onChange={setDescription}
            placeholder={s.richPlaceholder}
            pickMediaFromLibrary={pickMediaFromLibrary}
          />
        </div>

        {isEdit ? (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{s.sectionMaterials}</h2>

            {!materialsLoaded ? (
              <p className={styles.muted}>{s.loadingMaterials}</p>
            ) : (
              <div className={pn.repeatList}>
                {materials.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      border: '1px solid #c5d4e0',
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 14,
                    }}
                  >
                    <div className={pn.repeatRow}>
                      <input
                        type="text"
                        className={styles.input}
                        style={{ flex: 1, minWidth: 200 }}
                        value={m.name}
                        placeholder={s.materialNamePh}
                        onChange={(e) => updateMaterialName(m.id, e.target.value)}
                      />
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnDanger}`}
                        onClick={() => removeMaterial(m.id)}
                      >
                        {s.deleteMaterial}
                      </button>
                    </div>
                    <div style={{ marginTop: 12, paddingLeft: 8 }}>
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
                            <img className={pn.colorPreview} src={c.imageUrl} alt="" />
                          ) : (
                            <div className={pn.colorPreview} aria-hidden />
                          )}
                          <input
                            type="text"
                            className={styles.input}
                            style={{ flex: 1, minWidth: 160 }}
                            value={c.name}
                            placeholder={s.colorNamePh}
                            onChange={(e) =>
                              updateColor(m.id, c.id, { name: e.target.value })
                            }
                          />
                          <div className={pn.rowActions}>
                            <button
                              type="button"
                              className={styles.btn}
                              onClick={() => openBrandColorImagePicker(m.id, c.id)}
                            >
                              {common.mediaLibrary}
                            </button>
                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnDanger}`}
                              onClick={() => removeColorFromMaterial(m.id, c.id)}
                            >
                              {s.delete}
                            </button>
                          </div>
                        </div>
                      ))}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button
                          type="button"
                          className={styles.btn}
                          onClick={() => openBrandColorBatchPicker(m.id)}
                        >
                          {s.addColorFromLib}
                        </button>
                        <button
                          type="button"
                          className={styles.btn}
                          onClick={() => addColorToMaterial(m.id)}
                        >
                          {s.addColorEmpty}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" className={styles.btn} onClick={addMaterial}>
                  {s.addMaterial}
                </button>
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
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => {
                  void saveMaterials();
                }}
                disabled={materialsSaving || !materialsLoaded}
              >
                {materialsSaving ? s.saving : s.saveMaterials}
              </button>
            </div>
          </div>
        ) : (
          <p className={styles.muted}>{s.materialsAfterCreate}</p>
        )}

        <label className={styles.label}>
          {s.seoTitle}
          <input className={styles.input} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
        </label>
        <label className={styles.label}>
          {s.seoDescription}
          <textarea
            className={styles.textarea}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={4}
          />
        </label>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={saving || !name.trim()}
          >
            {saving ? s.saving : isEdit ? s.save : s.create}
          </button>
          <Link href="/admin/brands" className={styles.btn}>
            {s.cancel}
          </Link>
        </div>
      </form>
    </main>
  );
}
