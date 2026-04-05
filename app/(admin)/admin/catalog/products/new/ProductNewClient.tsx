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
import { RichBlock } from '@/components/RichBlock/RichBlock';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import type { AdminCuratedCollectionRow } from '../../../collections/collectionsAdminTypes';
import type { AdminProductSetRow } from '../../../product-sets/productSetsAdminTypes';
import type { AdminBrandRow } from '../../../brands/adminBrandTypes';
import type { AdminCategoryRow } from '../../categories/adminCategoryTypes';
import type { ProductAdminDetail } from '../adminProductTypes';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import {
  adminBackendJson,
  adminUploadRichMedia,
  revalidatePublicCatalogCache,
} from '@/lib/adminBackendFetch';
import catalogStyles from '../../catalogAdmin.module.css';
import pn from './productNew.module.css';

/** См → мм (округление), для отправки в API. */
function parseCmInputToMm(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 10);
}

/** м³ из трёх сторон в см (для подсказки в форме). */
function volumeCubicMetersFromCmInputs(lcm: string, wcm: string, hcm: string): number | null {
  const parse = (x: string) => {
    const t = x.trim().replace(',', '.');
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const L = parse(lcm);
  const W = parse(wcm);
  const H = parse(hcm);
  if (L == null || W == null || H == null) return null;
  return (L * W * H) / 1_000_000;
}

type GalleryItem = { id: string; url: string };
type ColorItem = { id: string; name: string; imageUrl: string };
type MaterialItem = { id: string; name: string };
type SizeItem = { id: string; value: string };

function rowId() {
  return crypto.randomUUID();
}

function parseSpecsJson(raw: unknown): {
  colors: { name: string; imageUrl: string }[];
  materials: { name: string }[];
  sizes: { value: string }[];
  labels: string[];
} {
  const out = {
    colors: [] as { name: string; imageUrl: string }[],
    materials: [] as { name: string }[],
    sizes: [] as { value: string }[],
    labels: [] as string[],
  };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.colors)) {
    for (const c of o.colors) {
      if (c && typeof c === 'object') {
        const x = c as Record<string, unknown>;
        if (typeof x.name === 'string' && typeof x.imageUrl === 'string') {
          out.colors.push({ name: x.name, imageUrl: x.imageUrl });
        }
      }
    }
  }
  if (Array.isArray(o.materials)) {
    for (const m of o.materials) {
      if (m && typeof m === 'object' && typeof (m as Record<string, unknown>).name === 'string') {
        out.materials.push({ name: String((m as Record<string, unknown>).name) });
      }
    }
  }
  if (Array.isArray(o.sizes)) {
    for (const s of o.sizes) {
      if (s && typeof s === 'object' && typeof (s as Record<string, unknown>).value === 'string') {
        out.sizes.push({ value: String((s as Record<string, unknown>).value) });
      }
    }
  }
  if (Array.isArray(o.labels)) {
    for (const l of o.labels) {
      if (typeof l === 'string' && l.trim()) out.labels.push(l.trim());
    }
  }
  return out;
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

function SortableColorRow({
  item,
  onNameChange,
  onPick,
  onRemove,
}: {
  item: ColorItem;
  onNameChange: (name: string) => void;
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
      {item.imageUrl ? (
        <img className={pn.colorPreview} src={item.imageUrl} alt="" />
      ) : (
        <div className={pn.colorPreview} aria-hidden />
      )}
      <input
        type="text"
        className={catalogStyles.input}
        style={{ flex: 1, minWidth: 160 }}
        value={item.name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Название цвета"
      />
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

export function ProductFormClient({ productId }: { productId?: string } = {}) {
  const router = useRouter();
  const isEdit = !!productId;
  const gallerySensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const colorSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [loadError, setLoadError] = useState<string | null>(null);
  const [productLoaded, setProductLoaded] = useState(!productId);
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [brands, setBrands] = useState<AdminBrandRow[]>([]);
  const [curatedCollections, setCuratedCollections] = useState<AdminCuratedCollectionRow[]>([]);
  const [productSets, setProductSets] = useState<AdminProductSetRow[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [additionalCatSelectKey, setAdditionalCatSelectKey] = useState(0);
  const [curatedCollectionIds, setCuratedCollectionIds] = useState<Set<string>>(() => new Set());
  const [collectionSelectKey, setCollectionSelectKey] = useState(0);
  const [curatedProductSetIds, setCuratedProductSetIds] = useState<Set<string>>(() => new Set());
  const [productSetSelectKey, setProductSetSelectKey] = useState(0);
  const [brandId, setBrandId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [currency, setCurrency] = useState('RUB');
  const [isActive, setIsActive] = useState(true);

  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [colors, setColors] = useState<ColorItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [sizes, setSizes] = useState<SizeItem[]>([]);
  const [labels, setLabels] = useState<string[]>(['']);
  const [deliveryText, setDeliveryText] = useState('');
  const [technicalSpecs, setTechnicalSpecs] = useState('');
  const [additionalInfoHtml, setAdditionalInfoHtml] = useState('');
  const [model3dUrl, setModel3dUrl] = useState('');
  const [drawingUrl, setDrawingUrl] = useState('');
  const [sku, setSku] = useState('');
  const [lengthCm, setLengthCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [netLengthCm, setNetLengthCm] = useState('');
  const [netWidthCm, setNetWidthCm] = useState('');
  const [netHeightCm, setNetHeightCm] = useState('');
  const [netWeightKg, setNetWeightKg] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<
    null | { filter: 'image' | 'video' | 'all'; title: string }
  >(null);
  const pickTarget = useRef<
    | null
    | { kind: 'gallery'; id: string }
    | { kind: 'color'; id: string }
    | { kind: 'rich' }
    | { kind: 'model3d' }
    | { kind: 'drawing' }
  >(null);
  const richPickResolver = useRef<((url: string | null) => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadError(null);
      if (productId) setProductLoaded(false);
      try {
        const [cats, brs, cols, sets] = await Promise.all([
          adminBackendJson<AdminCategoryRow[]>('catalog/admin/categories'),
          adminBackendJson<AdminBrandRow[]>('catalog/admin/brands'),
          adminBackendJson<AdminCuratedCollectionRow[]>('catalog/admin/curated-collections'),
          adminBackendJson<AdminProductSetRow[]>('catalog/admin/product-sets'),
        ]);
        if (cancelled) return;
        setCategories(cats);
        setBrands(brs);
        setCuratedCollections(cols);
        setProductSets(sets);

        if (productId) {
          const p = await adminBackendJson<ProductAdminDetail>(`catalog/admin/products/${productId}`);
          if (cancelled) return;
          setName(p.name);
          setSlug(p.slug);
          setCategoryId(p.categoryId);
          setAdditionalCategoryIds(new Set(p.additionalCategoryIds ?? []));
          setCuratedCollectionIds(new Set(p.curatedCollectionIds ?? []));
          setCuratedProductSetIds(new Set(p.curatedProductSetIds ?? []));
          setBrandId(p.brandId ?? '');
          setShortDescription(p.shortDescription ?? '');
          setPrice(p.price);
          setCurrency(p.currency || 'RUB');
          setIsActive(p.isActive);
          setGallery(p.images.map((img) => ({ id: rowId(), url: img.url })));
          const specs = parseSpecsJson(p.specsJson);
          setColors(specs.colors.map((c) => ({ id: rowId(), name: c.name, imageUrl: c.imageUrl })));
          setMaterials(specs.materials.map((m) => ({ id: rowId(), name: m.name })));
          setSizes(specs.sizes.map((s) => ({ id: rowId(), value: s.value })));
          setLabels(specs.labels.length ? specs.labels : ['']);
          setDeliveryText(p.deliveryText ?? '');
          setTechnicalSpecs(p.technicalSpecs ?? '');
          setAdditionalInfoHtml(p.additionalInfoHtml ?? '');
          setModel3dUrl(p.model3dUrl ?? '');
          setDrawingUrl(p.drawingUrl ?? '');
          setSku(p.sku ?? '');
          setLengthCm(p.lengthMm != null ? String(p.lengthMm / 10) : '');
          setWidthCm(p.widthMm != null ? String(p.widthMm / 10) : '');
          setHeightCm(p.heightMm != null ? String(p.heightMm / 10) : '');
          setWeightKg(p.weightKg ?? '');
          setNetLengthCm(p.netLengthMm != null ? String(p.netLengthMm / 10) : '');
          setNetWidthCm(p.netWidthMm != null ? String(p.netWidthMm / 10) : '');
          setNetHeightCm(p.netHeightMm != null ? String(p.netHeightMm / 10) : '');
          setNetWeightKg(p.netWeightKg ?? '');
          setSeoTitle(p.seoTitle ?? '');
          setSeoDescription(p.seoDescription ?? '');
        }
        if (!cancelled) setProductLoaded(true);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить данные');
          if (productId) setProductLoaded(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    if (!categoryId) return;
    setAdditionalCategoryIds((prev) => {
      if (!prev.has(categoryId)) return prev;
      const next = new Set(prev);
      next.delete(categoryId);
      return next;
    });
  }, [categoryId]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const la = a.parent ? `${a.parent.name} ${a.name}` : a.name;
      const lb = b.parent ? `${b.parent.name} ${b.name}` : b.name;
      return la.localeCompare(lb, 'ru');
    });
  }, [categories]);

  const categoriesAvailableForAdditional = useMemo(() => {
    if (!categoryId) return [];
    return sortedCategories.filter(
      (c) => c.id !== categoryId && !additionalCategoryIds.has(c.id),
    );
  }, [sortedCategories, categoryId, additionalCategoryIds]);

  const productCollections = useMemo(
    () => curatedCollections.filter((c) => c.kind === 'PRODUCT'),
    [curatedCollections],
  );

  const collectionsAvailableForPick = useMemo(
    () => productCollections.filter((c) => !curatedCollectionIds.has(c.id)),
    [productCollections, curatedCollectionIds],
  );

  const setsAvailableForPick = useMemo(
    () => productSets.filter((s) => !curatedProductSetIds.has(s.id)),
    [productSets, curatedProductSetIds],
  );

  const previewVolumeM3 = useMemo(
    () => volumeCubicMetersFromCmInputs(lengthCm, widthCm, heightCm),
    [lengthCm, widthCm, heightCm],
  );

  const previewNetVolumeM3 = useMemo(
    () => volumeCubicMetersFromCmInputs(netLengthCm, netWidthCm, netHeightCm),
    [netLengthCm, netWidthCm, netHeightCm],
  );

  const pickMediaFromLibrary = useCallback(
    (kind: 'image' | 'video') =>
      new Promise<string | null>((resolve) => {
        richPickResolver.current = resolve;
        pickTarget.current = { kind: 'rich' };
        setPicker({
          filter: kind === 'video' ? 'video' : 'image',
          title: kind === 'video' ? 'Видео' : 'Изображение',
        });
      }),
    [],
  );

  function openGalleryPicker(id: string) {
    richPickResolver.current = null;
    pickTarget.current = { kind: 'gallery', id };
    setPicker({ filter: 'image', title: 'Изображение галереи' });
  }

  function openColorPicker(id: string) {
    richPickResolver.current = null;
    pickTarget.current = { kind: 'color', id };
    setPicker({ filter: 'image', title: 'Изображение цвета' });
  }

  function openModel3dPicker() {
    richPickResolver.current = null;
    pickTarget.current = { kind: 'model3d' };
    setPicker({ filter: 'all', title: '3D-модель' });
  }

  function openDrawingPicker() {
    richPickResolver.current = null;
    pickTarget.current = { kind: 'drawing' };
    setPicker({ filter: 'all', title: 'Чертёж' });
  }

  function handlePickerPick(sel: { url: string; id: string }) {
    const rich = richPickResolver.current;
    if (rich) {
      richPickResolver.current = null;
      pickTarget.current = null;
      rich(sel.url);
      setPicker(null);
      return;
    }
    const t = pickTarget.current;
    pickTarget.current = null;
    setPicker(null);
    if (!t) return;
    if (t.kind === 'gallery') {
      setGallery((prev) => prev.map((g) => (g.id === t.id ? { ...g, url: sel.url } : g)));
    } else if (t.kind === 'color') {
      setColors((prev) => prev.map((c) => (c.id === t.id ? { ...c, imageUrl: sel.url } : c)));
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

  function onColorsDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = colors.findIndex((c) => c.id === active.id);
    const newIndex = colors.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setColors((c) => arrayMove(c, oldIndex, newIndex));
  }

  function addGalleryRow() {
    setGallery((g) => [...g, { id: rowId(), url: '' }]);
  }

  function addColorRow() {
    setColors((c) => [...c, { id: rowId(), name: '', imageUrl: '' }]);
  }

  function addMaterialRow() {
    setMaterials((m) => [...m, { id: rowId(), name: '' }]);
  }

  function addSizeRow() {
    setSizes((s) => [...s, { id: rowId(), value: '' }]);
  }

  function addLabelRow() {
    setLabels((l) => [...l, '']);
  }

  function addAdditionalCategoryFromDropdown(catId: string) {
    if (!catId || catId === categoryId || additionalCategoryIds.has(catId)) return;
    setAdditionalCategoryIds((prev) => new Set(prev).add(catId));
    setAdditionalCatSelectKey((k) => k + 1);
  }

  function removeAdditionalCategory(catId: string) {
    setAdditionalCategoryIds((prev) => {
      const next = new Set(prev);
      next.delete(catId);
      return next;
    });
  }

  function addCuratedCollectionFromDropdown(colId: string) {
    if (!colId || curatedCollectionIds.has(colId)) return;
    setCuratedCollectionIds((prev) => new Set(prev).add(colId));
    setCollectionSelectKey((k) => k + 1);
  }

  function removeCuratedCollection(colId: string) {
    setCuratedCollectionIds((prev) => {
      const next = new Set(prev);
      next.delete(colId);
      return next;
    });
  }

  function addProductSetFromDropdown(setId: string) {
    if (!setId || curatedProductSetIds.has(setId)) return;
    setCuratedProductSetIds((prev) => new Set(prev).add(setId));
    setProductSetSelectKey((k) => k + 1);
  }

  function removeProductSet(setId: string) {
    setCuratedProductSetIds((prev) => {
      const next = new Set(prev);
      next.delete(setId);
      return next;
    });
  }

  function categoryLabel(c: AdminCategoryRow): string {
    return c.parent ? `${c.parent.name} → ${c.name}` : c.name;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    if (!categoryId) {
      setSaveError('Выберите категорию');
      return;
    }
    const nameTrim = name.trim();
    if (!nameTrim) {
      setSaveError('Укажите название');
      return;
    }
    const priceNum = Number(price.replace(',', '.'));
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setSaveError('Укажите корректную цену');
      return;
    }

    const lm = parseCmInputToMm(lengthCm);
    const wm = parseCmInputToMm(widthCm);
    const hm = parseCmInputToMm(heightCm);
    const wkg = weightKg.trim() ? Number(weightKg.replace(',', '.')) : null;
    const nlm = parseCmInputToMm(netLengthCm);
    const nwm = parseCmInputToMm(netWidthCm);
    const nhm = parseCmInputToMm(netHeightCm);
    const nwkg = netWeightKg.trim() ? Number(netWeightKg.replace(',', '.')) : null;

    setSaving(true);
    try {
      const payload = {
        categoryId,
        additionalCategoryIds: Array.from(additionalCategoryIds),
        curatedCollectionIds: Array.from(curatedCollectionIds),
        curatedProductSetIds: Array.from(curatedProductSetIds),
        brandId: brandId || null,
        name: nameTrim,
        slug: slug.trim() || undefined,
        shortDescription: shortDescription.trim() || null,
        gallery: gallery
          .filter((g) => g.url.trim())
          .map((g) => ({ url: g.url.trim(), alt: null })),
        colors: colors
          .filter((c) => c.name.trim() && c.imageUrl.trim())
          .map((c) => ({ name: c.name.trim(), imageUrl: c.imageUrl.trim() })),
        materials: materials.filter((m) => m.name.trim()).map((m) => ({ name: m.name.trim() })),
        sizes: sizes.filter((s) => s.value.trim()).map((s) => ({ value: s.value.trim() })),
        labels: labels.map((l) => l.trim()).filter(Boolean),
        deliveryText: deliveryText.trim() || null,
        technicalSpecs: technicalSpecs.trim() || null,
        additionalInfoHtml: additionalInfoHtml.trim() || null,
        model3dUrl: model3dUrl.trim() || null,
        drawingUrl: drawingUrl.trim() || null,
        sku: sku.trim() || null,
        lengthMm: lm,
        widthMm: wm,
        heightMm: hm,
        weightKg: wkg !== null && Number.isFinite(wkg) ? wkg : null,
        netLengthMm: nlm,
        netWidthMm: nwm,
        netHeightMm: nhm,
        netWeightKg: nwkg !== null && Number.isFinite(nwkg) ? nwkg : null,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        price: priceNum,
        currency,
        isActive,
      };

      if (productId) {
        await adminBackendJson(`catalog/admin/products/${productId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        const created = await adminBackendJson<{ id: string }>('catalog/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        router.push(`/admin/catalog/products/${created.id}`);
      }
      await revalidatePublicCatalogCache();
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  if (productId && !productLoaded && !loadError) {
    return <p className={catalogStyles.muted}>Загрузка товара…</p>;
  }

  return (
    <>
      {loadError ? <p className={catalogStyles.error}>{loadError}</p> : null}

      <form className={`${catalogStyles.form} ${pn.formWide}`} onSubmit={submit}>
        <div className={pn.productFormGrid}>
          <div className={pn.productFormMain}>
        <label className={catalogStyles.label}>
          Название товара
          <input
            className={catalogStyles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="off"
          />
        </label>

        <label className={catalogStyles.label}>
          Slug (необязательно, иначе из названия)
          <input
            className={catalogStyles.input}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="latin-slug"
            autoComplete="off"
          />
        </label>

        <label className={catalogStyles.label}>
          Короткое описание
          <textarea
            className={catalogStyles.textarea}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            rows={4}
          />
        </label>

        <label className={catalogStyles.label}>
          Бренд
          <select className={catalogStyles.input} value={brandId} onChange={(e) => setBrandId(e.target.value)}>
            <option value="">— Нет —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <label className={catalogStyles.label}>
          Валюта
          <input
            className={catalogStyles.input}
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 8))}
            placeholder="RUB"
            maxLength={8}
          />
        </label>

        <label className={catalogStyles.label}>
          Цена ({currency})
          <input
            type="text"
            inputMode="decimal"
            className={catalogStyles.input}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>Галерея изображений</h2>
          <p className={catalogStyles.muted} style={{ marginTop: 0 }}>
            Крупное превью, порядок — перетаскиванием за ⋮⋮. Подписи к файлам настраиваются в объектах
            медиатеки.
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
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>Атрибуты: цвета</h2>
          <p className={catalogStyles.muted} style={{ marginTop: 0 }}>
            Сначала изображение, затем название. Порядок вариантов — перетаскиванием за ⋮⋮.
          </p>
          <DndContext sensors={colorSensors} collisionDetection={closestCenter} onDragEnd={onColorsDragEnd}>
            <SortableContext items={colors.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className={pn.repeatList}>
                {colors.map((c) => (
                  <SortableColorRow
                    key={c.id}
                    item={c}
                    onNameChange={(name) =>
                      setColors((prev) => prev.map((x) => (x.id === c.id ? { ...x, name } : x)))
                    }
                    onPick={() => openColorPicker(c.id)}
                    onRemove={() => setColors((prev) => prev.filter((x) => x.id !== c.id))}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <button type="button" className={catalogStyles.btn} onClick={addColorRow}>
            + Цвет
          </button>
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>Материалы</h2>
          <div className={pn.repeatList}>
            {materials.map((m) => (
              <div key={m.id} className={pn.repeatRow}>
                <input
                  type="text"
                  className={catalogStyles.input}
                  style={{ flex: 1, minWidth: 200 }}
                  value={m.name}
                  onChange={(e) =>
                    setMaterials((prev) =>
                      prev.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)),
                    )
                  }
                  placeholder="Название материала"
                />
                <button
                  type="button"
                  className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                  onClick={() => setMaterials((prev) => prev.filter((x) => x.id !== m.id))}
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
          <button type="button" className={catalogStyles.btn} onClick={addMaterialRow}>
            + Материал
          </button>
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
          <h2 className={pn.sectionTitle}>Доставка</h2>
          <textarea
            className={`${catalogStyles.textarea} ${pn.wideTextarea}`}
            value={deliveryText}
            onChange={(e) => setDeliveryText(e.target.value)}
            rows={6}
            placeholder="Текст о доставке"
          />
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>Технические параметры</h2>
          <textarea
            className={`${catalogStyles.textarea} ${pn.wideTextarea}`}
            value={technicalSpecs}
            onChange={(e) => setTechnicalSpecs(e.target.value)}
            rows={6}
            placeholder="Технические характеристики"
          />
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
          <h2 className={pn.sectionTitle}>Дополнительная информация</h2>
          <RichBlock
            value={additionalInfoHtml}
            onChange={setAdditionalInfoHtml}
            placeholder="Текст, изображения, видео…"
            uploadMedia={(file, type) => adminUploadRichMedia(file, type)}
            pickMediaFromLibrary={pickMediaFromLibrary}
            onUploadError={(msg) => setSaveError(msg)}
          />
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>3D-модель и чертёж</h2>
          <p className={catalogStyles.muted} style={{ marginTop: 0, marginBottom: 12 }}>
            Файлы из медиатеки: например GLB / GLTF для модели, PDF или изображение для чертежа.
          </p>
          <div className={pn.repeatList} style={{ marginBottom: 0 }}>
            <div className={`${pn.repeatRow} ${pn.galleryRowLayout}`}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Загрузить 3D модель</div>
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
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Загрузить чертёж</div>
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
          <p className={catalogStyles.muted} style={{ marginBottom: 12 }}>
            Объём:{' '}
            {previewVolumeM3 != null
              ? `${previewVolumeM3.toLocaleString('ru-RU', { maximumFractionDigits: 6 })} м³`
              : '— (нужны все три размера)'}
          </p>
          <label className={catalogStyles.label} style={{ maxWidth: 280 }}>
            Вес, кг
            <input
              className={catalogStyles.input}
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </label>
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>Габариты нетто</h2>
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
          <p className={catalogStyles.muted} style={{ marginBottom: 12 }}>
            Объём:{' '}
            {previewNetVolumeM3 != null
              ? `${previewNetVolumeM3.toLocaleString('ru-RU', { maximumFractionDigits: 6 })} м³`
              : '— (нужны все три размера)'}
          </p>
          <label className={catalogStyles.label} style={{ maxWidth: 280 }}>
            Вес, кг
            <input
              className={catalogStyles.input}
              inputMode="decimal"
              value={netWeightKg}
              onChange={(e) => setNetWeightKg(e.target.value)}
            />
          </label>
        </div>

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>SEO</h2>
          <label className={catalogStyles.label}>
            Meta title
            <input
              className={catalogStyles.input}
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </label>
          <label className={catalogStyles.label}>
            Meta description
            <textarea
              className={catalogStyles.textarea}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={3}
            />
          </label>
        </div>

          </div>

          <aside className={pn.productFormPlacement} aria-label="Расположение товара в каталоге">
            <p className={pn.placementHeading}>Расположение в каталоге</p>

            <div className={pn.placementBlock}>
              <label className={catalogStyles.label}>
                Основная категория
                <select
                  className={catalogStyles.input}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">— Выберите —</option>
                  {sortedCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parent ? `${c.parent.name} → ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={pn.placementBlock}>
              <div className={catalogStyles.label}>
                <div className={catalogStyles.labelCheckboxRow}>
                  <AccountCheckbox
                    id="product-new-active"
                    className={catalogStyles.adminCheckboxForm}
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    aria-label="Товар опубликован в каталоге"
                  />
                  <label htmlFor="product-new-active">Товар опубликован (в каталоге)</label>
                </div>
              </div>
            </div>

            <div className={pn.placementBlock}>
              <h3 className={pn.placementBlockTitle}>Дополнительные категории</h3>
              <p className={pn.placementHint}>
                Товар будет показан и в этих разделах. Для карточки и сортировки по умолчанию используется
                основная категория.
              </p>
              {!categoryId ? (
                <p className={catalogStyles.muted}>Сначала выберите основную категорию.</p>
              ) : (
                <div className={pn.additionalCatsWrap}>
                  <label className={catalogStyles.label}>
                    Добавить категорию
                    <select
                      key={additionalCatSelectKey}
                      className={catalogStyles.input}
                      defaultValue=""
                      aria-label="Добавить дополнительную категорию"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) addAdditionalCategoryFromDropdown(v);
                      }}
                    >
                      <option value="">— Выберите категорию —</option>
                      {categoriesAvailableForAdditional.map((c) => (
                        <option key={c.id} value={c.id}>
                          {categoryLabel(c)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {categoriesAvailableForAdditional.length === 0 &&
                  additionalCategoryIds.size === 0 ? (
                    <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                      Нет других категорий для добавления.
                    </p>
                  ) : null}
                  {additionalCategoryIds.size > 0 ? (
                    <ul
                      className={pn.additionalCatChips}
                      aria-label="Выбранные дополнительные категории"
                    >
                      {Array.from(additionalCategoryIds).map((id) => {
                        const c = categories.find((x) => x.id === id);
                        if (!c) return null;
                        const label = categoryLabel(c);
                        return (
                          <li key={id} className={pn.additionalCatChip}>
                            <span className={pn.additionalCatChipLabel}>{label}</span>
                            <button
                              type="button"
                              className={pn.additionalCatChipRemove}
                              onClick={() => removeAdditionalCategory(id)}
                              aria-label={`Убрать категорию: ${label}`}
                            >
                              ×
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                      Категории не выбраны — выберите из списка выше.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className={pn.placementBlock}>
              <h3 className={pn.placementBlockTitle}>Коллекции</h3>
              <p className={pn.placementHint}>
                Только коллекции с типом «товары». Порядок в коллекции — в карточке коллекции.
              </p>
              <div className={pn.additionalCatsWrap}>
                <label className={catalogStyles.label}>
                  Добавить коллекцию
                  <select
                    key={collectionSelectKey}
                    className={catalogStyles.input}
                    defaultValue=""
                    aria-label="Добавить коллекцию"
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) addCuratedCollectionFromDropdown(v);
                    }}
                  >
                    <option value="">— Выберите коллекцию —</option>
                    {collectionsAvailableForPick.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                {collectionsAvailableForPick.length === 0 && curatedCollectionIds.size === 0 ? (
                  <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                    Нет коллекций с типом «товары» или все уже выбраны.
                  </p>
                ) : null}
                {curatedCollectionIds.size > 0 ? (
                  <ul className={pn.additionalCatChips} aria-label="Выбранные коллекции">
                    {Array.from(curatedCollectionIds).map((id) => {
                      const c = productCollections.find((x) => x.id === id);
                      if (!c) return null;
                      return (
                        <li key={id} className={pn.additionalCatChip}>
                          <span className={pn.additionalCatChipLabel}>{c.name}</span>
                          <button
                            type="button"
                            className={pn.additionalCatChipRemove}
                            onClick={() => removeCuratedCollection(id)}
                            aria-label={`Убрать коллекцию: ${c.name}`}
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                    Коллекции не выбраны.
                  </p>
                )}
              </div>
            </div>

            <div className={pn.placementBlock}>
              <h3 className={pn.placementBlockTitle}>Наборы</h3>
              <p className={pn.placementHint}>Порядок в наборе задаётся в карточке набора.</p>
              <div className={pn.additionalCatsWrap}>
                <label className={catalogStyles.label}>
                  Добавить набор
                  <select
                    key={productSetSelectKey}
                    className={catalogStyles.input}
                    defaultValue=""
                    aria-label="Добавить набор"
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) addProductSetFromDropdown(v);
                    }}
                  >
                    <option value="">— Выберите набор —</option>
                    {setsAvailableForPick.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                {setsAvailableForPick.length === 0 && curatedProductSetIds.size === 0 ? (
                  <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                    Нет наборов или все уже выбраны.
                  </p>
                ) : null}
                {curatedProductSetIds.size > 0 ? (
                  <ul className={pn.additionalCatChips} aria-label="Выбранные наборы">
                    {Array.from(curatedProductSetIds).map((id) => {
                      const s = productSets.find((x) => x.id === id);
                      if (!s) return null;
                      return (
                        <li key={id} className={pn.additionalCatChip}>
                          <span className={pn.additionalCatChipLabel}>{s.name}</span>
                          <button
                            type="button"
                            className={pn.additionalCatChipRemove}
                            onClick={() => removeProductSet(id)}
                            aria-label={`Убрать набор: ${s.name}`}
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                    Наборы не выбраны.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>

        {saveError ? <p className={catalogStyles.error}>{saveError}</p> : null}

        <div className={pn.actionsBar}>
          <button
            type="submit"
            className={`${catalogStyles.btn} ${catalogStyles.btnPrimary}`}
            disabled={saving || !!loadError || (!!productId && !productLoaded)}
          >
            {saving
              ? isEdit
                ? 'Сохранение…'
                : 'Создание…'
              : isEdit
                ? 'Сохранить'
                : 'Создать товар'}
          </button>
          <Link href="/admin/catalog/products" className={catalogStyles.btn}>
            Отмена
          </Link>
        </div>
      </form>

      {picker ? (
        <MediaLibraryPickerModal
          open
          title={picker.title}
          mediaFilter={picker.filter}
          onClose={() => {
            const r = richPickResolver.current;
            if (r) {
              richPickResolver.current = null;
              r(null);
            }
            pickTarget.current = null;
            setPicker(null);
          }}
          onPick={handlePickerPick}
        />
      ) : null}
    </>
  );
}

export function ProductNewClient() {
  return <ProductFormClient />;
}
