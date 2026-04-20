'use client';

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import type {
  AdminProductVariantSummary,
  ProductAdminDetail,
  ProductVariantAdminDetail,
  ProductVariantElementForPick,
} from '../../../adminProductTypes';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import {
  adminBackendJson,
  revalidatePublicCatalogCache,
} from '@/lib/adminBackendFetch';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminVariantEditStrings } from '@/lib/admin-i18n/adminVariantEditI18n';
import { slugifyVariantLabel } from '@/lib/slugifyVariantLabel';
import catalogStyles from '../../../../catalogAdmin.module.css';
import pn from '../../../new/productNew.module.css';
import vt from './variantTabs.module.css';

function parseCmInputToMm(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 10);
}

function parseOptionalM3(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function mmToCmInput(mm: number | null | undefined): string {
  if (mm == null) return '';
  return String(mm / 10);
}

function SortableProductFrameRow({
  frameId,
  url,
  strings: str,
  onRemove,
}: {
  frameId: string;
  url: string;
  strings: ReturnType<typeof adminVariantEditStrings>;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: frameId,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className={`${pn.repeatRow} ${pn.galleryRowLayout}`}>
      <button
        type="button"
        className={pn.dragHandle}
        {...attributes}
        {...listeners}
        title={str.dndTitle}
        aria-label={str.dndAria}
      >
        ⋮⋮
      </button>
      <img className={pn.galleryThumbLg} src={url} alt="" />
      <div className={pn.rowActions}>
        <button type="button" className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`} onClick={onRemove}>
          {str.removeFromVariant}
        </button>
      </div>
    </div>
  );
}

type PricePreviewState =
  | { kind: 'loading' }
  | { kind: 'incomplete' }
  | { kind: 'ok'; retailRub: number; mskRub: number }
  | { kind: 'err'; code: string };

export function VariantEditClient({
  productId,
  variantId,
}: {
  productId: string;
  variantId: string;
}) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminVariantEditStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const priceLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';
  const gallerySensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [productName, setProductName] = useState('');

  const [sku, setSku] = useState('');
  const [lengthCm, setLengthCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [volumeM3, setVolumeM3] = useState('');
  const [netLengthCm, setNetLengthCm] = useState('');
  const [netWidthCm, setNetWidthCm] = useState('');
  const [netHeightCm, setNetHeightCm] = useState('');
  const [netWeightKg, setNetWeightKg] = useState('');
  const [netVolumeM3, setNetVolumeM3] = useState('');
  const [fillNetDimensions, setFillNetDimensions] = useState(false);

  const [price, setPrice] = useState('0');
  const [priceMode, setPriceMode] = useState<'manual' | 'formula'>('formula');
  const [costPriceCny, setCostPriceCny] = useState('');
  const [pricePreview, setPricePreview] = useState<PricePreviewState>({ kind: 'incomplete' });
  const [isActive, setIsActive] = useState(true);
  const [isDefaultVariant, setIsDefaultVariant] = useState(false);
  const [model3dUrl, setModel3dUrl] = useState('');
  const [drawingUrl, setDrawingUrl] = useState('');
  const [variantLabel, setVariantLabel] = useState('');
  const [variantSlug, setVariantSlug] = useState('');

  const [modificationId, setModificationId] = useState('');
  const [modificationsForProduct, setModificationsForProduct] = useState<
    { id: string; name: string; modificationSlug: string | null; sortOrder: number }[]
  >([]);
  const [elements, setElements] = useState<ProductVariantElementForPick[]>([]);
  /** productElementId -> brandMaterialColorId. */
  const [selections, setSelections] = useState<Record<string, string>>({});

  const [productGalleryImages, setProductGalleryImages] = useState<
    { id: string; url: string; alt: string | null }[]
  >([]);
  const [selectedFrameIds, setSelectedFrameIds] = useState<string[]>([]);

  const [categoryIdsForPricing, setCategoryIdsForPricing] = useState<string[]>([]);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [siblingVariants, setSiblingVariants] = useState<AdminProductVariantSummary[]>([]);
  const [picker, setPicker] = useState<
    null | { filter: 'image' | 'video' | 'all'; title: string }
  >(null);
  const pickTarget = useRef<null | { kind: 'model3d' } | { kind: 'drawing' }>(null);
  const variantSlugManuallyEditedRef = useRef(false);

  const applyVariant = useCallback((v: ProductVariantAdminDetail) => {
    setProductName(v.productName);
    const labelTrim = v.variantLabel?.trim() ?? '';
    const slugTrim = v.variantSlug?.trim() ?? '';
    const looksLikeDefaultSlug = /^v-\d+(?:-\d+)?$/i.test(slugTrim);
    variantSlugManuallyEditedRef.current =
      slugTrim !== '' && slugifyVariantLabel(labelTrim) !== slugTrim && !looksLikeDefaultSlug;
    setVariantLabel(labelTrim);
    setVariantSlug(slugTrim);

    setModificationId(v.modificationId);
    setModificationsForProduct(v.modificationsForProduct);
    setElements(v.productElements);
    setSelections(
      Object.fromEntries(v.selections.map((s) => [s.productElementId, s.brandMaterialColorId])),
    );

    const frames = v.productGalleryImages ?? [];
    setProductGalleryImages(frames);
    setSelectedFrameIds(v.galleryProductImageIds ?? []);

    setSku(v.sku ?? '');
    setLengthCm(mmToCmInput(v.lengthMm));
    setWidthCm(mmToCmInput(v.widthMm));
    setHeightCm(mmToCmInput(v.heightMm));
    setWeightKg(v.weightKg ?? '');
    setVolumeM3(v.volumeLiters ?? '');
    setNetLengthCm(mmToCmInput(v.netLengthMm));
    setNetWidthCm(mmToCmInput(v.netWidthMm));
    setNetHeightCm(mmToCmInput(v.netHeightMm));
    setNetWeightKg(v.netWeightKg ?? '');
    setNetVolumeM3(v.netVolumeLiters ?? '');
    const hasNet =
      v.netLengthMm != null ||
      v.netWidthMm != null ||
      v.netHeightMm != null ||
      (v.netVolumeLiters != null && String(v.netVolumeLiters).trim() !== '') ||
      (v.netWeightKg != null && String(v.netWeightKg).trim() !== '');
    setFillNetDimensions(hasNet);
    setPrice(v.price);
    setPriceMode(v.priceMode);
    setCostPriceCny(v.costPriceCny ?? '');
    setIsActive(v.isActive);
    setIsDefaultVariant(v.isDefault);
    setModel3dUrl(v.model3dUrl ?? '');
    setDrawingUrl(v.drawingUrl ?? '');
    const catIds = Array.from(new Set([v.categoryIdForPricing, ...v.additionalCategoryIds]));
    setCategoryIdsForPricing(catIds);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadError(null);
      setLoaded(false);
      try {
        const v = await adminBackendJson<ProductVariantAdminDetail>(
          `catalog/admin/products/${productId}/variants/${variantId}`,
        );
        if (cancelled) return;
        applyVariant(v);
        setLoaded(true);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : s.errLoad);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, variantId, applyVariant, s]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const p = await adminBackendJson<ProductAdminDetail>(`catalog/admin/products/${productId}`);
        if (cancelled) return;
        setSiblingVariants(p.variants ?? []);
      } catch {
        if (!cancelled) setSiblingVariants([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    if (priceMode !== 'formula') {
      setPricePreview({ kind: 'incomplete' });
      return;
    }
    const catIds = categoryIdsForPricing.filter(Boolean);
    const cny = Number(costPriceCny.trim().replace(',', '.'));
    const w = Number(weightKg.trim().replace(',', '.'));
    const v = parseOptionalM3(volumeM3);
    if (
      !catIds.length ||
      !Number.isFinite(cny) ||
      cny <= 0 ||
      !Number.isFinite(w) ||
      w <= 0 ||
      v == null ||
      v <= 0
    ) {
      setPricePreview({ kind: 'incomplete' });
      return;
    }
    setPricePreview({ kind: 'loading' });
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const r = await adminBackendJson<
            { ok: true; retailRub: number; mskRub: number } | { ok: false; error: string }
          >('catalog/admin/pricing-preview', {
            method: 'POST',
            body: JSON.stringify({
              categoryIds: catIds,
              costPriceCny: cny,
              weightKg: w,
              volumeM3: v,
            }),
          });
          if (cancelled) return;
          if (r.ok) {
            setPricePreview({ kind: 'ok', retailRub: r.retailRub, mskRub: r.mskRub });
          } else {
            setPricePreview({ kind: 'err', code: r.error });
          }
        } catch {
          if (!cancelled) setPricePreview({ kind: 'err', code: 'REQUEST_FAILED' });
        }
      })();
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [priceMode, categoryIdsForPricing, costPriceCny, weightKg, volumeM3]);

  /**
   * При смене модификации элементы товара общие, поэтому пул и selections не меняются —
   * просто фиксируем новый modificationId.
   */
  const onChangeModification = useCallback(
    (nextId: string) => {
      if (!nextId || nextId === modificationId) return;
      setModificationId(nextId);
    },
    [modificationId],
  );

  function openModel3dPicker() {
    pickTarget.current = { kind: 'model3d' };
    setPicker({ filter: 'all', title: s.picker3d });
  }

  function openDrawingPicker() {
    pickTarget.current = { kind: 'drawing' };
    setPicker({ filter: 'all', title: s.pickerDrawing });
  }

  function handlePickerPick(sel: { url: string; id: string }) {
    const t = pickTarget.current;
    pickTarget.current = null;
    setPicker(null);
    if (!t) return;
    if (t.kind === 'model3d') setModel3dUrl(sel.url);
    else if (t.kind === 'drawing') setDrawingUrl(sel.url);
  }

  function onProductFrameDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = selectedFrameIds.findIndex((id) => id === active.id);
    const newIndex = selectedFrameIds.findIndex((id) => id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setSelectedFrameIds((ids) => arrayMove(ids, oldIndex, newIndex));
  }

  function toggleProductFrame(id: string) {
    setSelectedFrameIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const autoVariantLabelPreview = useMemo(() => {
    const mod = modificationsForProduct.find((m) => m.id === modificationId);
    if (!mod) return '';
    const parts = elements.map((el) => {
      const bmcId = selections[el.id];
      if (!bmcId) return null;
      const a = el.availableMaterialColors.find((x) => x.brandMaterialColorId === bmcId);
      if (!a) return null;
      return `${el.name}: ${a.materialName}/${a.colorName}`;
    });
    const tail = parts.filter((x): x is string => x !== null).join(', ');
    return tail ? `${mod.name} · ${tail}` : mod.name;
  }, [modificationsForProduct, modificationId, elements, selections]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);

    const priceNum = Number(price.replace(',', '.'));
    if (priceMode === 'manual') {
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        setSaveError(s.errPrice);
        return;
      }
    }

    const lm = parseCmInputToMm(lengthCm);
    const wm = parseCmInputToMm(widthCm);
    const hm = parseCmInputToMm(heightCm);
    const wkg = weightKg.trim() ? Number(weightKg.replace(',', '.')) : null;
    const volM3 = parseOptionalM3(volumeM3);

    let nlm: number | null = null;
    let nwm: number | null = null;
    let nhm: number | null = null;
    let nvol: number | null = null;
    let nwkg: number | null = null;
    if (fillNetDimensions) {
      nlm = parseCmInputToMm(netLengthCm);
      nwm = parseCmInputToMm(netWidthCm);
      nhm = parseCmInputToMm(netHeightCm);
      nvol = parseOptionalM3(netVolumeM3);
      nwkg = netWeightKg.trim() ? Number(netWeightKg.replace(',', '.')) : null;
    }

    const cnyTrim = costPriceCny.trim().replace(',', '.');
    const costCnyNum = cnyTrim ? Number(cnyTrim) : null;

    if (!modificationId) {
      setSaveError(s.errPickMod);
      return;
    }

    for (const el of elements) {
      if (el.availableMaterialColors.length === 0) continue;
      if (!selections[el.id]) {
        setSaveError(s.errMaterialColor(el.name));
        return;
      }
    }

    if (priceMode === 'formula') {
      if (costCnyNum == null || !Number.isFinite(costCnyNum) || costCnyNum <= 0) {
        setSaveError(s.errPurchaseCny);
        return;
      }
      if (wkg == null || !Number.isFinite(wkg) || wkg <= 0) {
        setSaveError(s.errGrossWeight);
        return;
      }
      if (volM3 == null || volM3 <= 0) {
        setSaveError(s.errGrossVol);
        return;
      }
    }

    const priceForApi =
      priceMode === 'formula'
        ? Number.isFinite(priceNum) && priceNum >= 0
          ? priceNum
          : 0
        : priceNum;

    setSaving(true);
    try {
      const selectionsPayload = elements
        .filter((el) => el.availableMaterialColors.length > 0 && selections[el.id])
        .map((el) => ({
          productElementId: el.id,
          brandMaterialColorId: selections[el.id]!,
        }));
      const payload: Record<string, unknown> = {
        variantLabel: variantLabel.trim() || null,
        variantSlug: variantSlug.trim() || null,
        modificationId,
        selections: selectionsPayload,
        galleryProductImageIds: selectedFrameIds,
        sku: sku.trim() || null,
        lengthMm: lm,
        widthMm: wm,
        heightMm: hm,
        volumeLiters: volM3,
        weightKg: wkg !== null && Number.isFinite(wkg) ? wkg : null,
        price: priceForApi,
        priceMode,
        costPriceCny:
          costCnyNum != null && Number.isFinite(costCnyNum) && costCnyNum > 0 ? costCnyNum : null,
        currency: 'RUB',
        isActive,
        model3dUrl: model3dUrl.trim() || null,
        drawingUrl: drawingUrl.trim() || null,
      };
      if (fillNetDimensions) {
        payload.netLengthMm = nlm;
        payload.netWidthMm = nwm;
        payload.netHeightMm = nhm;
        payload.netVolumeLiters = nvol;
        payload.netWeightKg =
          nwkg !== null && Number.isFinite(nwkg) ? nwkg : null;
      }
      const updated = await adminBackendJson<ProductVariantAdminDetail>(
        `catalog/admin/products/${productId}/variants/${variantId}`,
        { method: 'PATCH', body: JSON.stringify(payload) },
      );
      applyVariant(updated);
      await revalidatePublicCatalogCache();
      router.push(`/admin/catalog/products/${productId}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : s.saveErr);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteVariant() {
    if (
      !window.confirm(
        s.confirmDelete,
      )
    ) {
      return;
    }
    setSaveError(null);
    setDeleting(true);
    try {
      await adminBackendJson<{ ok: true }>(
        `catalog/admin/products/${productId}/variants/${variantId}`,
        { method: 'DELETE' },
      );
      await revalidatePublicCatalogCache();
      router.push(`/admin/catalog/products/${productId}`);
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : s.deleteErr);
    } finally {
      setDeleting(false);
    }
  }

  const backHref = `/admin/catalog/products/${productId}`;

  if (!loaded && !loadError) {
    return <p className={catalogStyles.muted}>{s.loading}</p>;
  }

  return (
    <>
      {loadError ? <p className={catalogStyles.error}>{loadError}</p> : null}

      <form className={`${catalogStyles.form} ${pn.formWide}`} onSubmit={submit}>
        <p className={catalogStyles.muted} style={{ marginTop: 0 }}>
          {s.productLabel} <strong>{productName}</strong>
          {isDefaultVariant ? (
            <span className={catalogStyles.muted}>{s.defaultSuffix}</span>
          ) : null}
        </p>

        {siblingVariants.length > 1 ? (
          <nav className={vt.nav} aria-label={s.navAria}>
            <h2 className={vt.title}>{s.navTitle}</h2>
            <ul className={vt.tabList} role="tablist">
              {siblingVariants.map((v, index) => {
                const isCurrent = v.id === variantId;
                const priceLabel = `${Number(v.price).toLocaleString(priceLocale, { maximumFractionDigits: 0 })} ${v.currency}`;
                const tabId = `variant-tab-${v.id}`;
                return (
                  <li key={v.id} className={vt.tab} role="presentation">
                    {isCurrent ? (
                      <span
                        id={tabId}
                        className={vt.tabCurrent}
                        role="tab"
                        aria-selected
                        aria-current="page"
                      >
                        <span className={vt.tabTitleRow}>
                          {s.variantN(index + 1)}
                          {v.isDefault ? <span className={vt.badge}>{s.badgeDefault}</span> : null}
                          {!v.isActive ? <span className={vt.badgeInactive}>{s.badgeHidden}</span> : null}
                        </span>
                        <span className={vt.meta}>{priceLabel}</span>
                      </span>
                    ) : (
                      <Link
                        id={tabId}
                        href={`/admin/catalog/products/${productId}/variants/${v.id}`}
                        className={vt.tabLink}
                        role="tab"
                        aria-selected={false}
                      >
                        <span className={vt.tabTitleRow}>
                          {s.variantN(index + 1)}
                          {v.isDefault ? <span className={vt.badge}>{s.badgeDefault}</span> : null}
                          {!v.isActive ? <span className={vt.badgeInactive}>{s.badgeHidden}</span> : null}
                        </span>
                        <span className={vt.meta}>{priceLabel}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        <div className={pn.section}>
          <div className={catalogStyles.label}>
            <div className={catalogStyles.labelCheckboxRow}>
              <AccountCheckbox
                id="variant-active"
                className={catalogStyles.adminCheckboxForm}
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                aria-label={s.publishedAria}
              />
              <label htmlFor="variant-active">{s.publishedLabel}</label>
            </div>
          </div>
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>{s.configTitle}</h2>
          <label className={catalogStyles.label} style={{ maxWidth: 480 }}>
            {s.modification}
            <select
              className={catalogStyles.input}
              value={modificationId}
              onChange={(e) => {
                void onChangeModification(e.target.value);
              }}
            >
              {modificationsForProduct.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          {elements.length === 0 ? (
            <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
              {s.noConfigurableElements}
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 14, marginTop: 12 }}>
              {elements.map((el) => {
                const currentId = selections[el.id] ?? '';
                return (
                  <div
                    key={el.id}
                    style={{
                      border: '1px solid #e2e6e8',
                      borderRadius: 10,
                      padding: 12,
                      background: '#fff',
                    }}
                  >
                    <h3 className={pn.sectionTitle} style={{ margin: '0 0 10px' }}>
                      {el.name}
                    </h3>
                    {el.availableMaterialColors.length === 0 ? (
                      <p className={catalogStyles.muted} style={{ margin: 0 }}>
                        {s.poolMissingPrefix}
                        {el.name}
                        {s.poolMissingSuffix}
                      </p>
                    ) : (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                          gap: 10,
                        }}
                      >
                        {el.availableMaterialColors.map((a) => {
                          const selected = a.brandMaterialColorId === currentId;
                          return (
                            <button
                              key={a.brandMaterialColorId}
                              type="button"
                              onClick={() =>
                                setSelections((prev) => ({
                                  ...prev,
                                  [el.id]: a.brandMaterialColorId,
                                }))
                              }
                              aria-pressed={selected}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                padding: 0,
                                border: `2px solid ${selected ? '#3d83f6' : '#e2e6e8'}`,
                                borderRadius: 10,
                                background: '#fff',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                textAlign: 'left',
                                boxShadow: selected ? '0 0 0 2px rgba(61,131,246,.2)' : 'none',
                              }}
                            >
                              {a.imageUrl ? (
                                <img
                                  src={a.imageUrl}
                                  alt=""
                                  style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    objectFit: 'cover',
                                    background: '#f5f7f8',
                                    display: 'block',
                                  }}
                                />
                              ) : (
                                <div
                                  aria-hidden
                                  style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    background: '#f5f7f8',
                                  }}
                                />
                              )}
                              <div style={{ padding: '6px 10px 10px' }}>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{a.colorName}</div>
                                <div style={{ color: '#9d9d9d', fontSize: 12 }}>
                                  {a.materialName}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>{s.nameSlugTitle}</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              maxWidth: 480,
              marginTop: 8,
            }}
          >
            <label className={catalogStyles.label}>
              {s.variantName}
              <input
                type="text"
                className={catalogStyles.input}
                value={variantLabel}
                onChange={(e) => {
                  const next = e.target.value;
                  setVariantLabel(next);
                  if (!variantSlugManuallyEditedRef.current) {
                    setVariantSlug(slugifyVariantLabel(next));
                  }
                }}
                placeholder={s.slugPh}
                autoComplete="off"
              />
              {!variantLabel.trim() && autoVariantLabelPreview ? (
                <span
                  className={catalogStyles.muted}
                  style={{ display: 'block', marginTop: 6, fontSize: 13 }}
                >
                  {s.willShowAs} <strong>{autoVariantLabelPreview}</strong>
                </span>
              ) : null}
            </label>
            <label className={catalogStyles.label}>
              Slug
              <input
                type="text"
                className={catalogStyles.input}
                value={variantSlug}
                onChange={(e) => {
                  variantSlugManuallyEditedRef.current = true;
                  setVariantSlug(e.target.value);
                }}
                placeholder={s.slugInputPh}
                autoComplete="off"
              />
              <span
                className={catalogStyles.muted}
                style={{ display: 'block', marginTop: 6, fontSize: 13 }}
              >
                {s.slugHint}
              </span>
            </label>
          </div>
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>{s.galleryTitle}</h2>
          {productGalleryImages.length > 0 ? (
            <>
              <p className={catalogStyles.muted} style={{ marginTop: 0 }}>
                {s.galleryHint}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {productGalleryImages.map((pi) => {
                  const selected = selectedFrameIds.includes(pi.id);
                  return (
                    <button
                      key={pi.id}
                      type="button"
                      onClick={() => toggleProductFrame(pi.id)}
                      title={selected ? s.removeFromVariantShort : s.addToVariant}
                      style={{
                        padding: 0,
                        border: selected ? '2px solid #2563eb' : '1px solid #ccc',
                        borderRadius: 4,
                        opacity: selected ? 1 : 0.55,
                        cursor: 'pointer',
                        background: 'transparent',
                      }}
                    >
                      <img
                        src={pi.url}
                        alt=""
                        style={{ width: 88, height: 88, objectFit: 'cover', display: 'block' }}
                      />
                    </button>
                  );
                })}
              </div>
              {selectedFrameIds.length > 0 ? (
                <DndContext
                  sensors={gallerySensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onProductFrameDragEnd}
                >
                  <SortableContext items={selectedFrameIds} strategy={verticalListSortingStrategy}>
                    <div className={pn.repeatList}>
                      {selectedFrameIds.map((fid) => {
                        const img = productGalleryImages.find((x) => x.id === fid);
                        if (!img) return null;
                        return (
                          <SortableProductFrameRow
                            key={fid}
                            frameId={fid}
                            url={img.url}
                            strings={s}
                            onRemove={() =>
                              setSelectedFrameIds((prev) => prev.filter((x) => x !== fid))
                            }
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <p className={catalogStyles.muted}>{s.noFramesSelected}</p>
              )}
            </>
          ) : (
            <p className={catalogStyles.muted} style={{ marginTop: 0 }}>{s.noProductGallery}</p>
          )}
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>{s.grossDimsTitle}</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 12,
            }}
          >
            <label className={catalogStyles.label}>
              {s.lenCm}
              <input
                className={catalogStyles.input}
                inputMode="decimal"
                value={lengthCm}
                onChange={(e) => setLengthCm(e.target.value)}
                placeholder="0"
              />
            </label>
            <label className={catalogStyles.label}>
              {s.widthCm}
              <input
                className={catalogStyles.input}
                inputMode="decimal"
                value={widthCm}
                onChange={(e) => setWidthCm(e.target.value)}
                placeholder="0"
              />
            </label>
            <label className={catalogStyles.label}>
              {s.heightCm}
              <input
                className={catalogStyles.input}
                inputMode="decimal"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="0"
              />
            </label>
          </div>
          <label className={catalogStyles.label} style={{ marginTop: 12 }}>
            {s.volGross}
            <input
              className={catalogStyles.input}
              inputMode="decimal"
              value={volumeM3}
              onChange={(e) => setVolumeM3(e.target.value)}
              placeholder={s.manualPh}
              />
            </label>
          <label className={catalogStyles.label} style={{ maxWidth: 280 }}>
            {s.weightGross}
            <input
              className={catalogStyles.input}
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </label>
        </div>

        <div className={pn.section}>
          <label className={catalogStyles.labelCheckboxRow}>
            <AccountCheckbox
              className={catalogStyles.adminCheckboxForm}
              checked={fillNetDimensions}
              onChange={(e) => setFillNetDimensions(e.target.checked)}
            />
            {s.fillNet}
          </label>
          {fillNetDimensions ? (
            <>
              <h2 className={pn.sectionTitle} style={{ marginTop: 16 }}>
                {s.netDimsTitle}
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 12,
                }}
              >
                <label className={catalogStyles.label}>
                  {s.lenCm}
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={netLengthCm}
                    onChange={(e) => setNetLengthCm(e.target.value)}
                    placeholder="0"
                  />
                </label>
                <label className={catalogStyles.label}>
                  {s.widthCm}
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={netWidthCm}
                    onChange={(e) => setNetWidthCm(e.target.value)}
                    placeholder="0"
                  />
                </label>
                <label className={catalogStyles.label}>
                  {s.heightCm}
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={netHeightCm}
                    onChange={(e) => setNetHeightCm(e.target.value)}
                    placeholder="0"
                  />
                </label>
              </div>
              <label className={catalogStyles.label} style={{ marginTop: 12 }}>
                {s.volNet}
                <input
                  className={catalogStyles.input}
                  inputMode="decimal"
                  value={netVolumeM3}
                  onChange={(e) => setNetVolumeM3(e.target.value)}
                  placeholder={s.manualPh}
                />
              </label>
              <label className={catalogStyles.label} style={{ maxWidth: 280 }}>
                {s.weightNet}
                <input
                  className={catalogStyles.input}
                  inputMode="decimal"
                  value={netWeightKg}
                  onChange={(e) => setNetWeightKg(e.target.value)}
                />
              </label>
            </>
          ) : null}
        </div>

        <div className={pn.section}>
          <div className={pn.priceModeRow} role="radiogroup" aria-label={s.priceModeAria}>
            <label className={pn.radioLabel}>
              <input
                type="radio"
                name="variant-price-mode"
                checked={priceMode === 'formula'}
                onChange={() => setPriceMode('formula')}
              />
              {s.byFormula}
            </label>
            <label className={pn.radioLabel}>
              <input
                type="radio"
                name="variant-price-mode"
                checked={priceMode === 'manual'}
                onChange={() => setPriceMode('manual')}
              />
              {s.custom}
            </label>
          </div>
          {priceMode === 'formula' ? (
            <>
              <label className={catalogStyles.label}>
                {s.purchaseCny}
                <input
                  type="text"
                  inputMode="decimal"
                  className={catalogStyles.input}
                  value={costPriceCny}
                  onChange={(e) => setCostPriceCny(e.target.value)}
                  placeholder={s.cnyPh}
                />
              </label>
              <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                {s.pricingCatsHint}
              </p>
              <div className={pn.pricePreviewBox} aria-live="polite">
                {pricePreview.kind === 'loading' ? (
                  <span className={catalogStyles.muted}>{s.calculating}</span>
                ) : pricePreview.kind === 'ok' ? (
                  <>
                    {s.priceLabel}{' '}
                    {Math.round(pricePreview.retailRub).toLocaleString(priceLocale, {
                      maximumFractionDigits: 0,
                    })}{' '}
                    ₽
                    <span
                      className={catalogStyles.muted}
                      style={{ display: 'block', marginTop: 6, fontWeight: 400 }}
                    >
                      {s.costMsk}{' '}
                      {Math.round(pricePreview.mskRub).toLocaleString(priceLocale, {
                        maximumFractionDigits: 0,
                      })}{' '}
                      ₽
                    </span>
                  </>
                ) : pricePreview.kind === 'err' ? (
                  <span className={catalogStyles.error}>
                    {pricePreview.code === 'NO_PROFILE'
                      ? s.noProfile
                      : pricePreview.code === 'INVALID_INPUT'
                        ? s.checkInputs
                        : pricePreview.code === 'REQUEST_FAILED'
                          ? s.calcFailed
                          : s.noCalcData}
                  </span>
                ) : (
                  <span className={catalogStyles.muted}>{s.hintCnyVolWeight}</span>
                )}
              </div>
            </>
          ) : (
            <label className={catalogStyles.label}>
              {s.priceRub}
              <input
                type="text"
                inputMode="decimal"
                className={catalogStyles.input}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>
          )}
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>{s.files3dTitle}</h2>
          <p className={catalogStyles.muted} style={{ marginTop: 0, marginBottom: 12 }}>
            {s.files3dHint}
          </p>
          <div className={pn.repeatList} style={{ marginBottom: 0 }}>
            <div className={`${pn.repeatRow} ${pn.galleryRowLayout}`}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{s.model3d}</div>
                {model3dUrl.trim() ? (
                  <a
                    href={model3dUrl.trim()}
                    target="_blank"
                    rel="noreferrer"
                    className={catalogStyles.muted}
                    style={{ wordBreak: 'break-all' }}
                  >
                    {model3dUrl.trim()}
                  </a>
                ) : (
                  <span className={catalogStyles.muted}>{s.fileNotSelected}</span>
                )}
              </div>
              <div className={pn.rowActions}>
                <button type="button" className={catalogStyles.btn} onClick={openModel3dPicker}>
                  {c.mediaLibrary}
                </button>
                <button
                  type="button"
                  className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                  onClick={() => setModel3dUrl('')}
                  disabled={!model3dUrl.trim()}
                >
                  {s.clear}
                </button>
              </div>
            </div>
            <div className={`${pn.repeatRow} ${pn.galleryRowLayout}`}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{s.drawing}</div>
                {drawingUrl.trim() ? (
                  <a
                    href={drawingUrl.trim()}
                    target="_blank"
                    rel="noreferrer"
                    className={catalogStyles.muted}
                    style={{ wordBreak: 'break-all' }}
                  >
                    {drawingUrl.trim()}
                  </a>
                ) : (
                  <span className={catalogStyles.muted}>{s.fileNotSelected}</span>
                )}
              </div>
              <div className={pn.rowActions}>
                <button type="button" className={catalogStyles.btn} onClick={openDrawingPicker}>
                  {c.mediaLibrary}
                </button>
                <button
                  type="button"
                  className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                  onClick={() => setDrawingUrl('')}
                  disabled={!drawingUrl.trim()}
                >
                  {s.clear}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>{s.skuSection}</h2>
          <label className={catalogStyles.label}>
            SKU
            <input
              className={catalogStyles.input}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              autoComplete="off"
            />
          </label>
        </div>

        {saveError ? <p className={catalogStyles.error}>{saveError}</p> : null}

        <div className={pn.actionsBar}>
          <button
            type="submit"
            className={`${catalogStyles.btn} ${catalogStyles.btnPrimary}`}
            disabled={saving || !loaded}
          >
            {saving ? s.saving : s.saveVariant}
          </button>
          <Link href={backHref} className={catalogStyles.btn}>
            {s.backProduct}
          </Link>
          <button
            type="button"
            className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
            disabled={deleting || !loaded}
            onClick={() => {
              void handleDeleteVariant();
            }}
          >
            {deleting ? s.deleting : s.deleteVariant}
          </button>
        </div>
      </form>

      {picker ? (
        <MediaLibraryPickerModal
          open
          title={picker.title}
          mediaFilter={picker.filter}
          onClose={() => {
            pickTarget.current = null;
            setPicker(null);
          }}
          onPick={handlePickerPick}
        />
      ) : null}
    </>
  );
}
