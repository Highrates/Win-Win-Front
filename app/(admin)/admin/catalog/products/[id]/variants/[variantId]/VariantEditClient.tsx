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
import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import type {
  AdminProductVariantSummary,
  ProductAdminDetail,
  ProductMaterialColorShell,
  ProductVariantAdminDetail,
} from '../../../adminProductTypes';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import {
  adminBackendJson,
  revalidatePublicCatalogCache,
} from '@/lib/adminBackendFetch';
import { createClientRandomId } from '@/lib/clientRandomId';
import catalogStyles from '../../../../catalogAdmin.module.css';
import pn from '../../../new/productNew.module.css';
import { parseSpecsJson } from '../../../new/ProductNewClient';
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

type GalleryItem = { id: string; url: string };
type GalleryMode = 'product' | 'legacy';
type SizeItem = { id: string; value: string };

function rowId() {
  return createClientRandomId();
}

/** Латиница для ?vs=; по смыслу близко к серверному slugify. */
const CYR_TO_LAT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

/** Согласовано по смыслу с `backend/src/modules/catalog/slug-transliteration.ts` (лимит 80 для slug варианта). */
function slugifyVariantName(name: string): string {
  const raw = name.trim().toLowerCase();
  if (!raw) return '';
  let s = '';
  for (const ch of raw) {
    const lower = ch.toLowerCase();
    if (CYR_TO_LAT[lower]) s += CYR_TO_LAT[lower];
    else if (/[a-z0-9]/.test(ch)) s += ch;
    else if (/\s/.test(ch) || ch === '-' || ch === '_') s += '-';
  }
  return s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function SortableGalleryRow({
  item,
  onPick,
  onRemove,
}: {
  item: GalleryItem;
  onPick: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
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
        title="Перетащить"
        aria-label="Перетащить"
      >
        ⋮⋮
      </button>
      {item.url ? (
        <img className={pn.galleryThumbLg} src={item.url} alt="" />
      ) : (
        <div className={pn.galleryThumbLg} aria-hidden />
      )}
      <div className={pn.rowActions}>
        <button type="button" className={catalogStyles.btn} onClick={onPick}>
          Медиатека
        </button>
        <button type="button" className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`} onClick={onRemove}>
          Удалить
        </button>
      </div>
    </div>
  );
}

function SortableProductFrameRow({
  frameId,
  url,
  onRemove,
}: {
  frameId: string;
  url: string;
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
        title="Перетащить"
        aria-label="Перетащить"
      >
        ⋮⋮
      </button>
      <img className={pn.galleryThumbLg} src={url} alt="" />
      <div className={pn.rowActions}>
        <button type="button" className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`} onClick={onRemove}>
          Убрать из варианта
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
  const gallerySensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [productName, setProductName] = useState('');

  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [sizes, setSizes] = useState<SizeItem[]>([]);
  const [labels, setLabels] = useState<string[]>(['']);

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
  const [materialColorOptions, setMaterialColorOptions] = useState<ProductMaterialColorShell[]>([]);
  const [materialOptionId, setMaterialOptionId] = useState('');
  const [colorOptionId, setColorOptionId] = useState('');
  const [productGalleryImages, setProductGalleryImages] = useState<
    { id: string; url: string; alt: string | null }[]
  >([]);
  const [selectedFrameIds, setSelectedFrameIds] = useState<string[]>([]);
  const [galleryMode, setGalleryMode] = useState<GalleryMode>('product');

  const [categoryIdsForPricing, setCategoryIdsForPricing] = useState<string[]>([]);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [siblingVariants, setSiblingVariants] = useState<AdminProductVariantSummary[]>([]);
  const [picker, setPicker] = useState<null | { filter: 'image' | 'video' | 'all'; title: string }>(null);
  const pickTarget = useRef<null | { kind: 'gallery'; id: string } | { kind: 'model3d' } | { kind: 'drawing' }>(null);
  /** После правки slug вручную не перезаписываем его из названия. */
  const variantSlugManuallyEditedRef = useRef(false);

  const applyVariant = useCallback((v: ProductVariantAdminDetail) => {
    setProductName(v.productName);
    const labelTrim = v.variantLabel?.trim() ?? '';
    const slugTrim = v.variantSlug?.trim() ?? '';
    const looksLikeDefaultSlug = /^v-\d+(?:-\d+)?$/i.test(slugTrim);
    variantSlugManuallyEditedRef.current =
      slugTrim !== '' &&
      slugifyVariantName(labelTrim) !== slugTrim &&
      !looksLikeDefaultSlug;
    setVariantLabel(labelTrim);
    setVariantSlug(slugTrim);
    setMaterialColorOptions(v.materialColorOptions ?? []);
    setMaterialOptionId(v.materialOptionId ?? '');
    setColorOptionId(v.colorOptionId ?? '');

    const frames = v.productGalleryImages ?? [];
    setProductGalleryImages(frames);
    if (frames.length > 0) {
      setGalleryMode('product');
      if (v.galleryProductImageIds?.length) {
        setSelectedFrameIds(v.galleryProductImageIds);
      } else {
        const byUrl = new Map(frames.map((x) => [x.url, x.id]));
        const matched = (v.images ?? [])
          .map((im) => byUrl.get(im.url))
          .filter((x): x is string => !!x);
        setSelectedFrameIds(matched);
      }
    } else {
      setGalleryMode('legacy');
      setSelectedFrameIds([]);
      setGallery(
        v.images.map((im) => ({
          id: rowId(),
          url: im.url,
        })),
      );
    }

    const specs = parseSpecsJson(v.specsJson);
    setSizes(specs.sizes.map((s) => ({ id: rowId(), value: s.value })));
    setLabels(specs.labels.length ? specs.labels : ['']);
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
          setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить вариант');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, variantId, applyVariant]);

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

  function openGalleryPicker(id: string) {
    pickTarget.current = { kind: 'gallery', id };
    setPicker({ filter: 'image', title: 'Изображение галереи варианта' });
  }

  function openModel3dPicker() {
    pickTarget.current = { kind: 'model3d' };
    setPicker({ filter: 'all', title: '3D-модель' });
  }

  function openDrawingPicker() {
    pickTarget.current = { kind: 'drawing' };
    setPicker({ filter: 'all', title: 'Чертёж' });
  }

  function handlePickerPick(sel: { url: string; id: string }) {
    const t = pickTarget.current;
    pickTarget.current = null;
    setPicker(null);
    if (!t) return;
    if (t.kind === 'gallery') {
      setGallery((prev) => prev.map((g) => (g.id === t.id ? { ...g, url: sel.url } : g)));
    } else if (t.kind === 'model3d') {
      setModel3dUrl(sel.url);
    } else if (t.kind === 'drawing') {
      setDrawingUrl(sel.url);
    }
  }

  function onGalleryDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = gallery.findIndex((g) => g.id === active.id);
    const newIndex = gallery.findIndex((g) => g.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setGallery((g) => arrayMove(g, oldIndex, newIndex));
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

  function addGalleryRow() {
    setGallery((g) => [...g, { id: rowId(), url: '' }]);
  }
  function addSizeRow() {
    setSizes((s) => [...s, { id: rowId(), value: '' }]);
  }
  function addLabelRow() {
    setLabels((l) => [...l, '']);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);

    const priceNum = Number(price.replace(',', '.'));
    if (priceMode === 'manual') {
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        setSaveError('Укажите корректную цену');
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

    if (materialColorOptions.length > 0) {
      if (
        (materialOptionId && !colorOptionId) ||
        (!materialOptionId && colorOptionId)
      ) {
        setSaveError('Выберите материал и цвет вместе или очистите оба поля.');
        return;
      }
    }

    if (priceMode === 'formula') {
      if (costCnyNum == null || !Number.isFinite(costCnyNum) || costCnyNum <= 0) {
        setSaveError('Укажите закупочную цену в юанях (CNY)');
        return;
      }
      if (wkg == null || !Number.isFinite(wkg) || wkg <= 0) {
        setSaveError('Для расчёта по формуле укажите вес брутто (кг)');
        return;
      }
      if (volM3 == null || volM3 <= 0) {
        setSaveError('Для расчёта по формуле укажите объём брутто (м³)');
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
      const payload: Record<string, unknown> = {
        variantLabel: variantLabel.trim() || null,
        variantSlug: variantSlug.trim() || null,
        sizes: sizes.filter((s) => s.value.trim()).map((s) => ({ value: s.value.trim() })),
        labels: labels.map((l) => l.trim()).filter(Boolean),
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
      if (materialColorOptions.length > 0) {
        if (materialOptionId && colorOptionId) {
          payload.materialOptionId = materialOptionId;
          payload.colorOptionId = colorOptionId;
        } else {
          payload.materialOptionId = null;
          payload.colorOptionId = null;
        }
      }
      if (galleryMode === 'product' && productGalleryImages.length > 0) {
        payload.galleryProductImageIds = selectedFrameIds;
      } else {
        payload.gallery = gallery
          .filter((g) => g.url.trim())
          .map((g) => ({ url: g.url.trim(), alt: null as string | null }));
      }
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
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteVariant() {
    if (
      !window.confirm(
        'Удалить этот вариант? Останется минимум один вариант у товара. Действие необратимо.',
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
      setSaveError(err instanceof Error ? err.message : 'Не удалось удалить вариант');
    } finally {
      setDeleting(false);
    }
  }

  const backHref = `/admin/catalog/products/${productId}`;


  if (!loaded && !loadError) {
    return <p className={catalogStyles.muted}>Загрузка варианта…</p>;
  }

  return (
    <>
      {loadError ? <p className={catalogStyles.error}>{loadError}</p> : null}

      <form className={`${catalogStyles.form} ${pn.formWide}`} onSubmit={submit}>
        <p className={catalogStyles.muted} style={{ marginTop: 0 }}>
          Товар: <strong>{productName}</strong>
          {isDefaultVariant ? (
            <span className={catalogStyles.muted}> — вариант по умолчанию</span>
          ) : null}
        </p>

        {siblingVariants.length > 1 ? (
          <nav className={vt.nav} aria-label="Варианты товара">
            <h2 className={vt.title}>Варианты этого товара</h2>
            <ul className={vt.tabList} role="tablist">
              {siblingVariants.map((v, index) => {
                const isCurrent = v.id === variantId;
                const priceLabel = `${Number(v.price).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ${v.currency}`;
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
                          Вариант {index + 1}
                          {v.isDefault ? (
                            <span className={vt.badge}>По умолчанию</span>
                          ) : null}
                          {!v.isActive ? <span className={vt.badgeInactive}>Скрыт</span> : null}
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
                          Вариант {index + 1}
                          {v.isDefault ? (
                            <span className={vt.badge}>По умолчанию</span>
                          ) : null}
                          {!v.isActive ? <span className={vt.badgeInactive}>Скрыт</span> : null}
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
                aria-label="Вариант доступен в каталоге"
              />
              <label htmlFor="variant-active">Вариант опубликован</label>
            </div>
          </div>
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>Галерея варианта</h2>
          {galleryMode === 'product' && productGalleryImages.length > 0 ? (
            <>
              <p className={catalogStyles.muted} style={{ marginTop: 0 }}>
                Подмножество кадров из галереи товара. Клик по превью — добавить или убрать кадр; порядок в списке
                ниже — перетаскиванием. Если ничего не выбрано, на витрине показывается полная галерея товара.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {productGalleryImages.map((pi) => {
                  const selected = selectedFrameIds.includes(pi.id);
                  return (
                    <button
                      key={pi.id}
                      type="button"
                      onClick={() => toggleProductFrame(pi.id)}
                      title={selected ? 'Убрать из варианта' : 'Добавить в вариант'}
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
                <p className={catalogStyles.muted}>Кадры не выбраны — будет показана общая галерея товара.</p>
              )}
            </>
          ) : (
            <>
              <p className={catalogStyles.muted} style={{ marginTop: 0 }}>
                У товара пока нет общей галереи — задайте кадры на карточке товара или добавьте URL ниже. Если список
                пуст, на витрине не будет своих фото варианта.
              </p>
              <DndContext sensors={gallerySensors} collisionDetection={closestCenter} onDragEnd={onGalleryDragEnd}>
                <SortableContext items={gallery.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                  <div className={pn.repeatList}>
                    {gallery.map((item) => (
                      <SortableGalleryRow
                        key={item.id}
                        item={item}
                        onPick={() => openGalleryPicker(item.id)}
                        onRemove={() => setGallery((prev) => prev.filter((g) => g.id !== item.id))}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <button type="button" className={catalogStyles.btn} onClick={addGalleryRow}>
                + Добавить кадр
              </button>
            </>
          )}
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>Название и витрина</h2>
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
              Название варианта
              <input
                type="text"
                className={catalogStyles.input}
                value={variantLabel}
                onChange={(e) => {
                  const next = e.target.value;
                  setVariantLabel(next);
                  if (!variantSlugManuallyEditedRef.current) {
                    setVariantSlug(slugifyVariantName(next));
                  }
                }}
                placeholder="Необязательно"
                autoComplete="off"
              />
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
                placeholder="латиница-цифры"
                autoComplete="off"
              />
              <span className={catalogStyles.muted} style={{ display: 'block', marginTop: 6, fontSize: 13 }}>
                Генерируется из названия варианта
              </span>
            </label>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
              marginTop: 16,
            }}
          >
            {materialColorOptions.length > 0 ? (
              <>
                <label className={catalogStyles.label}>
                  Материал (группа)
                  <select
                    className={catalogStyles.input}
                    value={materialOptionId}
                    onChange={(e) => {
                      setMaterialOptionId(e.target.value);
                      setColorOptionId('');
                    }}
                  >
                    <option value="">— не выбрано —</option>
                    {materialColorOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={catalogStyles.label}>
                  Цвет (карточка)
                  <select
                    className={catalogStyles.input}
                    value={colorOptionId}
                    disabled={!materialOptionId}
                    onChange={(e) => setColorOptionId(e.target.value)}
                  >
                    <option value="">— не выбрано —</option>
                    {(materialColorOptions.find((m) => m.id === materialOptionId)?.colors ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <p className={catalogStyles.muted} style={{ gridColumn: '1 / -1' }}>
                На товаре не заведены материалы и цвета. Добавьте их в форме редактирования товара (блок «Материалы и
                цвета»).
              </p>
            )}
          </div>
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>Габариты брутто</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 12,
            }}
          >
            <label className={catalogStyles.label}>
              Длина, см
              <input
                className={catalogStyles.input}
                inputMode="decimal"
                value={lengthCm}
                onChange={(e) => setLengthCm(e.target.value)}
                placeholder="0"
              />
            </label>
            <label className={catalogStyles.label}>
              Ширина, см
              <input
                className={catalogStyles.input}
                inputMode="decimal"
                value={widthCm}
                onChange={(e) => setWidthCm(e.target.value)}
                placeholder="0"
              />
            </label>
            <label className={catalogStyles.label}>
              Высота, см
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
            Объём брутто, м³
            <input
              className={catalogStyles.input}
              inputMode="decimal"
              value={volumeM3}
              onChange={(e) => setVolumeM3(e.target.value)}
              placeholder="Вручную"
            />
          </label>
          <label className={catalogStyles.label} style={{ maxWidth: 280 }}>
            Вес брутто, кг
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
            Заполнить габариты нетто
          </label>
          {fillNetDimensions ? (
            <>
              <h2 className={pn.sectionTitle} style={{ marginTop: 16 }}>
                Габариты нетто
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 12,
                }}
              >
                <label className={catalogStyles.label}>
                  Длина, см
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={netLengthCm}
                    onChange={(e) => setNetLengthCm(e.target.value)}
                    placeholder="0"
                  />
                </label>
                <label className={catalogStyles.label}>
                  Ширина, см
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={netWidthCm}
                    onChange={(e) => setNetWidthCm(e.target.value)}
                    placeholder="0"
                  />
                </label>
                <label className={catalogStyles.label}>
                  Высота, см
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
                Объём нетто, м³
                <input
                  className={catalogStyles.input}
                  inputMode="decimal"
                  value={netVolumeM3}
                  onChange={(e) => setNetVolumeM3(e.target.value)}
                  placeholder="Вручную"
                />
              </label>
              <label className={catalogStyles.label} style={{ maxWidth: 280 }}>
                Вес нетто, кг
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
          <div className={pn.priceModeRow} role="radiogroup" aria-label="Способ задания цены">
            <label className={pn.radioLabel}>
              <input
                type="radio"
                name="variant-price-mode"
                checked={priceMode === 'formula'}
                onChange={() => setPriceMode('formula')}
              />
              По формуле
            </label>
            <label className={pn.radioLabel}>
              <input
                type="radio"
                name="variant-price-mode"
                checked={priceMode === 'manual'}
                onChange={() => setPriceMode('manual')}
              />
              Произвольно
            </label>
          </div>
          {priceMode === 'formula' ? (
            <>
              <label className={catalogStyles.label}>
                Закупочная цена (CNY)
                <input
                  type="text"
                  inputMode="decimal"
                  className={catalogStyles.input}
                  value={costPriceCny}
                  onChange={(e) => setCostPriceCny(e.target.value)}
                  placeholder="¥ за единицу"
                />
              </label>
              <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                Категории для расчёта берутся с карточки товара (основная и дополнительные).
              </p>
              <div className={pn.pricePreviewBox} aria-live="polite">
                {pricePreview.kind === 'loading' ? (
                  <span className={catalogStyles.muted}>Расчёт…</span>
                ) : pricePreview.kind === 'ok' ? (
                  <>
                    Цена:{' '}
                    {Math.round(pricePreview.retailRub).toLocaleString('ru-RU', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    ₽
                    <span className={catalogStyles.muted} style={{ display: 'block', marginTop: 6, fontWeight: 400 }}>
                      Себестоимость на складе МСК:{' '}
                      {Math.round(pricePreview.mskRub).toLocaleString('ru-RU', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      ₽
                    </span>
                  </>
                ) : pricePreview.kind === 'err' ? (
                  <span className={catalogStyles.error}>
                    {pricePreview.code === 'NO_PROFILE'
                      ? 'Нет профиля ценообразования для выбранных категорий'
                      : pricePreview.code === 'INVALID_INPUT'
                        ? 'Проверьте вес, объём и цену в юанях'
                        : pricePreview.code === 'REQUEST_FAILED'
                          ? 'Не удалось рассчитать цену'
                          : 'Нет данных для расчёта'}
                  </span>
                ) : (
                  <span className={catalogStyles.muted}>Укажите CNY, вес и объём — цена появится здесь</span>
                )}
              </div>
            </>
          ) : (
            <label className={catalogStyles.label}>
              Цена (₽)
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
          <h2 className={pn.sectionTitle}>Размеры</h2>
          <div className={pn.repeatList}>
            {sizes.map((s) => (
              <div key={s.id} className={pn.repeatRow}>
                <input
                  type="text"
                  className={catalogStyles.input}
                  style={{ flex: 1, minWidth: 200 }}
                  value={s.value}
                  onChange={(e) =>
                    setSizes((prev) => prev.map((x) => (x.id === s.id ? { ...x, value: e.target.value } : x)))
                  }
                  placeholder="Напр. 200×90 см"
                />
                <button
                  type="button"
                  className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                  onClick={() => setSizes((prev) => prev.filter((x) => x.id !== s.id))}
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
          <button type="button" className={catalogStyles.btn} onClick={addSizeRow}>
            + Размер
          </button>
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>Лейблы</h2>
          <div className={pn.repeatList}>
            {labels.map((label, idx) => (
              <div key={idx} className={pn.repeatRow}>
                <input
                  type="text"
                  className={catalogStyles.input}
                  style={{ flex: 1, minWidth: 200 }}
                  value={label}
                  onChange={(e) =>
                    setLabels((prev) => {
                      const next = [...prev];
                      next[idx] = e.target.value;
                      return next;
                    })
                  }
                  placeholder="Напр. Новинка"
                />
                <button
                  type="button"
                  className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                  onClick={() => setLabels((prev) => prev.filter((_, i) => i !== idx))}
                  disabled={labels.length <= 1}
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
          <button type="button" className={catalogStyles.btn} onClick={addLabelRow}>
            + Лейбл
          </button>
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>3D-модель и чертёж</h2>
          <p className={catalogStyles.muted} style={{ marginTop: 0, marginBottom: 12 }}>
            Файлы из медиатеки: например GLB / GLTF для модели, PDF или изображение для чертежа.
          </p>
          <div className={pn.repeatList} style={{ marginBottom: 0 }}>
            <div className={`${pn.repeatRow} ${pn.galleryRowLayout}`}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>3D-модель</div>
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
                  <span className={catalogStyles.muted}>Файл не выбран</span>
                )}
              </div>
              <div className={pn.rowActions}>
                <button type="button" className={catalogStyles.btn} onClick={openModel3dPicker}>
                  Медиатека
                </button>
                <button
                  type="button"
                  className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                  onClick={() => setModel3dUrl('')}
                  disabled={!model3dUrl.trim()}
                >
                  Очистить
                </button>
              </div>
            </div>
            <div className={`${pn.repeatRow} ${pn.galleryRowLayout}`}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Чертёж</div>
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
                  <span className={catalogStyles.muted}>Файл не выбран</span>
                )}
              </div>
              <div className={pn.rowActions}>
                <button type="button" className={catalogStyles.btn} onClick={openDrawingPicker}>
                  Медиатека
                </button>
                <button
                  type="button"
                  className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                  onClick={() => setDrawingUrl('')}
                  disabled={!drawingUrl.trim()}
                >
                  Очистить
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>Артикул</h2>
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
            {saving ? 'Сохранение…' : 'Сохранить вариант'}
          </button>
          <Link href={backHref} className={catalogStyles.btn}>
            ← К карточке товара
          </Link>
          <button
            type="button"
            className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
            disabled={deleting || !loaded}
            onClick={() => {
              void handleDeleteVariant();
            }}
          >
            {deleting ? 'Удаление…' : 'Удалить вариант'}
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
