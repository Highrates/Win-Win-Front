'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminCompactBtn, AdminCompactBtnLink } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminPillBadge } from '@/components/AdminPillChip/AdminPillChip';
import { ProductGalleryEditor } from '@/components/admin/ProductGalleryEditor/ProductGalleryEditor';
import { AdminSelect, AdminTextField } from '@/components/AdminTextField/AdminTextField';
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
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminProductGalleryEditorStrings } from '@/lib/admin-i18n/adminProductGalleryEditorI18n';
import { adminVariantEditStrings } from '@/lib/admin-i18n/adminVariantEditI18n';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import { slugifyVariantLabel } from '@/lib/slugifyVariantLabel';
import catalogStyles from '../../../../catalogAdmin.module.css';
import pn from '../../../new/productNew.module.css';
import ve from './variantEdit.module.css';
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
  const galleryStr = useMemo(() => adminProductGalleryEditorStrings(locale), [locale]);
  const { confirm } = useAdminConfirm();
  const priceLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';

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
    if (!(await confirm({ title: s.confirmDelete }))) {
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
            <AdminPillBadge className={ve.badgeGap}>{s.badgeDefault}</AdminPillBadge>
          ) : null}
        </p>

        <div className={ve.formIntro}>
          {siblingVariants.length > 1 ? (
            <nav className={vt.nav} aria-label={s.navAria}>
              <h2 className={`${catalogStyles.groupHeading} ${vt.navHeading}`}>{s.navTitle}</h2>
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
                            {v.isDefault ? (
                              <AdminPillBadge className={ve.badgeGap}>{s.badgeDefault}</AdminPillBadge>
                            ) : null}
                            {!v.isActive ? (
                              <AdminPillBadge variant="conflict" className={ve.badgeGap}>
                                {s.badgeHidden}
                              </AdminPillBadge>
                            ) : null}
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
                            {v.isDefault ? (
                              <AdminPillBadge className={ve.badgeGap}>{s.badgeDefault}</AdminPillBadge>
                            ) : null}
                            {!v.isActive ? (
                              <AdminPillBadge variant="conflict" className={ve.badgeGap}>
                                {s.badgeHidden}
                              </AdminPillBadge>
                            ) : null}
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

          <div className={`${catalogStyles.labelCheckboxRow} ${ve.publishedRow}`}>
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

        <div className={pn.section}>
          <h2 className={`${catalogStyles.groupHeading} ${ve.sectionHeading}`}>{s.configTitle}</h2>
          <AdminSelect
            label={s.modification}
            className={ve.fieldNarrow}
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
          </AdminSelect>
          {elements.length === 0 ? (
            <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
              {s.noConfigurableElements}
            </p>
          ) : (
            <div className={ve.elementsStack}>
              {elements.map((el) => {
                const currentId = selections[el.id] ?? '';
                return (
                  <div key={el.id} className={ve.elementCard}>
                    <h3 className={`${catalogStyles.groupHeading} ${ve.elementTitle}`}>{el.name}</h3>
                    {el.availableMaterialColors.length === 0 ? (
                      <p className={catalogStyles.muted} style={{ margin: 0 }}>
                        {s.poolMissingPrefix}
                        {el.name}
                        {s.poolMissingSuffix}
                      </p>
                    ) : (
                      <div className={ve.colorsGrid}>
                        {el.availableMaterialColors.map((a) => {
                          const selected = a.brandMaterialColorId === currentId;
                          return (
                            <button
                              key={a.brandMaterialColorId}
                              type="button"
                              className={`${ve.colorTile} ${selected ? ve.colorTileSelected : ''}`}
                              onClick={() =>
                                setSelections((prev) => ({
                                  ...prev,
                                  [el.id]: a.brandMaterialColorId,
                                }))
                              }
                              aria-pressed={selected}
                            >
                              {selected ? <span className={ve.selectedBadge} aria-hidden>✓</span> : null}
                              {a.imageUrl ? (
                                <img className={ve.colorTileThumb} src={a.imageUrl} alt="" loading="lazy" />
                              ) : (
                                <div className={ve.colorTileThumbPh} aria-hidden />
                              )}
                              <div className={ve.colorTileLabel}>
                                <span className={ve.colorTileName}>{a.colorName}</span>
                                <span className={ve.colorTileSub}>{a.materialName}</span>
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
          <h2 className={`${catalogStyles.groupHeading} ${ve.sectionHeading}`}>{s.nameSlugTitle}</h2>
          <div className={ve.stackFields}>
            <AdminTextField
              label={s.variantName}
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
              <p className={`${catalogStyles.muted} ${ve.hintBlock}`} style={{ margin: 0 }}>
                {s.willShowAs} <strong>{autoVariantLabelPreview}</strong>
              </p>
            ) : null}
            <AdminTextField
              label="Slug"
              value={variantSlug}
              onChange={(e) => {
                variantSlugManuallyEditedRef.current = true;
                setVariantSlug(e.target.value);
              }}
              placeholder={s.slugInputPh}
              autoComplete="off"
            />
            <p className={`${catalogStyles.muted} ${ve.hintBlock}`} style={{ margin: 0 }}>
              {s.slugHint}
            </p>
          </div>
        </div>

        <div className={pn.section}>
          <h2 className={`${catalogStyles.groupHeading} ${ve.sectionHeading}`}>{s.galleryTitle}</h2>
          <ProductGalleryEditor
            mode="subset"
            pool={productGalleryImages.map((pi) => ({ id: pi.id, url: pi.url }))}
            selectedIds={selectedFrameIds}
            onSelectedIdsChange={setSelectedFrameIds}
            strings={galleryStr}
          />
        </div>

        <div className={pn.section}>
          <h2 className={`${catalogStyles.groupHeading} ${ve.sectionHeading}`}>{s.grossDimsTitle}</h2>
          <div className={ve.dimsGrid}>
            <AdminTextField
              label={s.lenCm}
              inputMode="decimal"
              value={lengthCm}
              onChange={(e) => setLengthCm(e.target.value)}
              placeholder="0"
            />
            <AdminTextField
              label={s.widthCm}
              inputMode="decimal"
              value={widthCm}
              onChange={(e) => setWidthCm(e.target.value)}
              placeholder="0"
            />
            <AdminTextField
              label={s.heightCm}
              inputMode="decimal"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="0"
            />
          </div>
          <AdminTextField
            className={`${ve.fieldMedium} ${ve.fieldSpaced}`}
            label={s.volGross}
            inputMode="decimal"
            value={volumeM3}
            onChange={(e) => setVolumeM3(e.target.value)}
            placeholder={s.manualPh}
          />
          <AdminTextField
            className={`${ve.fieldMedium} ${ve.fieldSpaced}`}
            label={s.weightGross}
            inputMode="decimal"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
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
              <h2 className={`${catalogStyles.groupHeading} ${ve.sectionHeading}`} style={{ marginTop: 16 }}>
                {s.netDimsTitle}
              </h2>
              <div className={ve.dimsGrid}>
                <AdminTextField
                  label={s.lenCm}
                  inputMode="decimal"
                  value={netLengthCm}
                  onChange={(e) => setNetLengthCm(e.target.value)}
                  placeholder="0"
                />
                <AdminTextField
                  label={s.widthCm}
                  inputMode="decimal"
                  value={netWidthCm}
                  onChange={(e) => setNetWidthCm(e.target.value)}
                  placeholder="0"
                />
                <AdminTextField
                  label={s.heightCm}
                  inputMode="decimal"
                  value={netHeightCm}
                  onChange={(e) => setNetHeightCm(e.target.value)}
                  placeholder="0"
                />
              </div>
              <AdminTextField
                className={`${ve.fieldMedium} ${ve.fieldSpaced}`}
                label={s.volNet}
                inputMode="decimal"
                value={netVolumeM3}
                onChange={(e) => setNetVolumeM3(e.target.value)}
                placeholder={s.manualPh}
              />
              <AdminTextField
                className={`${ve.fieldMedium} ${ve.fieldSpaced}`}
                label={s.weightNet}
                inputMode="decimal"
                value={netWeightKg}
                onChange={(e) => setNetWeightKg(e.target.value)}
              />
            </>
          ) : null}
        </div>

        <div className={pn.section}>
          <h2 className={`${catalogStyles.groupHeading} ${ve.sectionHeading}`}>{s.priceModeAria}</h2>
          <div className={ve.radioRow} role="radiogroup" aria-label={s.priceModeAria}>
            <label className={ve.radioOption}>
              <input
                type="radio"
                name="variant-price-mode"
                className={ve.adminRadio}
                checked={priceMode === 'formula'}
                onChange={() => setPriceMode('formula')}
              />
              {s.byFormula}
            </label>
            <label className={ve.radioOption}>
              <input
                type="radio"
                name="variant-price-mode"
                className={ve.adminRadio}
                checked={priceMode === 'manual'}
                onChange={() => setPriceMode('manual')}
              />
              {s.custom}
            </label>
          </div>
          {priceMode === 'formula' ? (
            <>
              <AdminTextField
                label={s.purchaseCny}
                type="text"
                inputMode="decimal"
                value={costPriceCny}
                onChange={(e) => setCostPriceCny(e.target.value)}
                placeholder={s.cnyPh}
              />
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
            <AdminTextField
              label={s.priceRub}
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          )}
        </div>

        <div className={pn.section}>
          <h2 className={`${catalogStyles.groupHeading} ${ve.sectionHeading}`}>{s.files3dTitle}</h2>
          <div className={ve.fileFields}>
            <AdminTextField
              label={s.model3d}
              type="url"
              value={model3dUrl}
              onChange={(e) => setModel3dUrl(e.target.value)}
              placeholder="https://"
              autoComplete="off"
            />
            <AdminTextField
              label={s.drawing}
              type="url"
              value={drawingUrl}
              onChange={(e) => setDrawingUrl(e.target.value)}
              placeholder="https://"
              autoComplete="off"
            />
          </div>
        </div>

        <div className={pn.section}>
          <h2 className={`${catalogStyles.groupHeading} ${ve.sectionHeading}`}>{s.skuSection}</h2>
          <AdminTextField
            label="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            autoComplete="off"
            className={ve.fieldMedium}
          />
        </div>

        {saveError ? <p className={catalogStyles.error}>{saveError}</p> : null}

        <div className={catalogStyles.formActions}>
          <AdminCompactBtn type="submit" variant="accent" disabled={saving || !loaded}>
            {saving ? s.saving : s.saveVariant}
          </AdminCompactBtn>
          <AdminCompactBtnLink href={backHref} variant="outline">
            {s.backProduct}
          </AdminCompactBtnLink>
          <AdminCompactBtn
            type="button"
            variant="danger"
            disabled={deleting || !loaded}
            onClick={() => {
              void handleDeleteVariant();
            }}
          >
            {deleting ? s.deleting : s.deleteVariant}
          </AdminCompactBtn>
        </div>
      </form>

    </>
  );
}
