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
import type {
  AdminProductVariantSummary,
  ProductAdminDetail,
} from '../adminProductTypes';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import {
  adminBackendJson,
  adminUploadRichMedia,
  revalidatePublicCatalogCache,
} from '@/lib/adminBackendFetch';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminProductNewStrings } from '@/lib/admin-i18n/adminProductNewI18n';
import { createClientRandomId } from '@/lib/clientRandomId';
import catalogStyles from '../../catalogAdmin.module.css';
import pn from './productNew.module.css';
import { ProductElementsSection } from './ProductElementsSection';
import { ProductModificationsSection } from './ProductModificationsSection';

type GalleryItem = { id: string; url: string; serverId?: string };

function rowId() {
  return createClientRandomId();
}

function SortableGalleryRow({
  item,
  onPick,
  onRemove,
  pStr,
}: {
  item: GalleryItem;
  onPick: () => void;
  onRemove: () => void;
  pStr: ReturnType<typeof adminProductNewStrings>;
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
        title={pStr.dndTitle}
        aria-label={pStr.dndAria}
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
          {pStr.mediaLibrary}
        </button>
        <button type="button" className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`} onClick={onRemove}>
          {pStr.delete}
        </button>
      </div>
    </div>
  );
}

export function ProductFormClient({ productId }: { productId?: string } = {}) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminProductNewStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const isEdit = !!productId;
  const gallerySensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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
  const [isActive, setIsActive] = useState(true);

  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [deliveryText, setDeliveryText] = useState('');
  const [technicalSpecs, setTechnicalSpecs] = useState('');
  const [additionalInfoHtml, setAdditionalInfoHtml] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [product, setProduct] = useState<ProductAdminDetail | null>(null);
  const [variants, setVariants] = useState<AdminProductVariantSummary[]>([]);
  const [variantCreateOpen, setVariantCreateOpen] = useState(false);
  const [variantCreateModificationId, setVariantCreateModificationId] = useState('');
  const [variantCreateBusy, setVariantCreateBusy] = useState(false);
  const [variantCreateError, setVariantCreateError] = useState<string | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<
    null | { filter: 'image' | 'video' | 'all'; title: string; multi?: boolean }
  >(null);
  const pickTarget = useRef<null | { kind: 'gallery'; id: string } | { kind: 'rich' }>(null);
  const richPickResolver = useRef<((url: string | null) => void) | null>(null);

  const applyProduct = useCallback((p: ProductAdminDetail) => {
    setProduct(p);
    setName(p.name);
    setSlug(p.slug);
    setCategoryId(p.categoryId);
    setAdditionalCategoryIds(new Set(p.additionalCategoryIds ?? []));
    setCuratedCollectionIds(new Set(p.curatedCollectionIds ?? []));
    setCuratedProductSetIds(new Set(p.curatedProductSetIds ?? []));
    setBrandId(p.brandId ?? '');
    setShortDescription(p.shortDescription ?? '');
    setIsActive(p.isActive);
    setGallery(
      p.images.map((img) => ({
        id: rowId(),
        url: img.url,
        serverId: img.id,
      })),
    );
    setVariants(p.variants ?? []);
    setDeliveryText(p.deliveryText ?? '');
    setTechnicalSpecs(p.technicalSpecs ?? '');
    setAdditionalInfoHtml(p.additionalInfoHtml ?? '');
    setSeoTitle(p.seoTitle ?? '');
    setSeoDescription(p.seoDescription ?? '');
  }, []);

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
          applyProduct(p);
        }
        if (!cancelled) setProductLoaded(true);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : s.errLoadData);
          if (productId) setProductLoaded(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, applyProduct, s]);

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
      return la.localeCompare(lb, locale === 'zh' ? 'zh' : 'ru');
    });
  }, [categories, locale]);

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
    () => productSets.filter((setRow) => !curatedProductSetIds.has(setRow.id)),
    [productSets, curatedProductSetIds],
  );

  const pickMediaFromLibrary = useCallback(
    (kind: 'image' | 'video') =>
      new Promise<string | null>((resolve) => {
        richPickResolver.current = resolve;
        pickTarget.current = { kind: 'rich' };
        setPicker({
          filter: kind === 'video' ? 'video' : 'image',
          title: kind === 'video' ? s.pickerVideo : s.pickerImage,
        });
      }),
    [s],
  );

  function openGalleryPicker(id: string) {
    richPickResolver.current = null;
    pickTarget.current = { kind: 'gallery', id };
    setPicker({ filter: 'image', title: s.pickerGallery });
  }

  function openGalleryPickerMulti() {
    richPickResolver.current = null;
    pickTarget.current = null;
    setPicker({ filter: 'image', title: s.pickerGalleryMulti, multi: true });
  }

  function handlePickerPickBatch(items: { url: string; id: string }[]) {
    if (!items.length) return;
    setGallery((prev) => [...prev, ...items.map((s) => ({ id: rowId(), url: s.url }))]);
    setPicker(null);
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

  function addGalleryRow() {
    setGallery((g) => [...g, { id: rowId(), url: '' }]);
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

  function openVariantCreateModal() {
    setVariantCreateError(null);
    const firstModId = product?.modifications[0]?.id ?? '';
    setVariantCreateModificationId(firstModId);
    setVariantCreateOpen(true);
  }

  async function createVariant() {
    if (!productId) return;
    if (!variantCreateModificationId) {
      setVariantCreateError(s.variantModsFirst);
      return;
    }
    setVariantCreateBusy(true);
    setVariantCreateError(null);
    try {
      const { id } = await adminBackendJson<{ id: string }>(
        `catalog/admin/products/${productId}/variants`,
        {
          method: 'POST',
          body: JSON.stringify({ modificationId: variantCreateModificationId }),
        },
      );
      setVariantCreateOpen(false);
      router.push(`/admin/catalog/products/${productId}/variants/${id}`);
    } catch (e) {
      setVariantCreateError(e instanceof Error ? e.message : s.variantCreateErr);
    } finally {
      setVariantCreateBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    if (!categoryId) {
      setSaveError(s.errPickCategory);
      return;
    }
    const nameTrim = name.trim();
    if (!nameTrim) {
      setSaveError(s.errName);
      return;
    }

    const basePayload = {
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
        .map((g) => ({
          ...(g.serverId ? { id: g.serverId } : {}),
          url: g.url.trim(),
          alt: null,
        })),
      deliveryText: deliveryText.trim() || null,
      technicalSpecs: technicalSpecs.trim() || null,
      additionalInfoHtml: additionalInfoHtml.trim() || null,
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
      isActive,
    };

    if (productId) {
      setSaving(true);
      try {
        const updated = await adminBackendJson<ProductAdminDetail>(
          `catalog/admin/products/${productId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(basePayload),
          },
        );
        applyProduct(updated);
        await revalidatePublicCatalogCache();
        router.refresh();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : s.saveErr);
      } finally {
        setSaving(false);
      }
      return;
    }

    setSaving(true);
    try {
      const created = await adminBackendJson<{ id: string }>('catalog/admin/products', {
        method: 'POST',
        body: JSON.stringify(basePayload),
      });
      await revalidatePublicCatalogCache();
      router.push(`/admin/catalog/products/${created.id}`);
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : s.saveErr);
    } finally {
      setSaving(false);
    }
  }

  if (productId && !productLoaded && !loadError) {
    return <p className={catalogStyles.muted}>{s.loadingProduct}</p>;
  }

  const normalizedBrandId = brandId || null;
  const canCreateVariant = !!product && product.modifications.length > 0;

  return (
    <>
      {loadError ? <p className={catalogStyles.error}>{loadError}</p> : null}

      <form className={`${catalogStyles.form} ${pn.formWide}`} onSubmit={submit}>
        <div className={pn.productFormGrid}>
          <div className={pn.productFormMain}>
            <label className={catalogStyles.label}>
              {s.productName}
              <input
                className={catalogStyles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="off"
              />
            </label>

            <label className={catalogStyles.label}>
              {s.slugOptional}
              <input
                className={catalogStyles.input}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="latin-slug"
                autoComplete="off"
              />
            </label>

            <label className={catalogStyles.label}>
              {s.shortDesc}
              <textarea
                className={catalogStyles.textarea}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={4}
              />
            </label>

            <label className={catalogStyles.label}>
              {s.brand}
              <select
                className={catalogStyles.input}
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
              >
                <option value="">{s.brandNone}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <span className={catalogStyles.muted} style={{ display: 'block', marginTop: 6 }}>
                {s.brandHint}
              </span>
            </label>

            <div className={pn.section}>
              <h2 className={pn.sectionTitle}>{s.galleryTitle}</h2>
              <p className={catalogStyles.muted} style={{ marginTop: 0 }}>
                {s.galleryHint}
                {isEdit ? s.galleryHintEdit : null}
              </p>
              <DndContext sensors={gallerySensors} collisionDetection={closestCenter} onDragEnd={onGalleryDragEnd}>
                <SortableContext items={gallery.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                  <div className={pn.repeatList}>
                    {gallery.map((item) => (
                      <SortableGalleryRow
                        key={item.id}
                        item={item}
                        pStr={s}
                        onPick={() => openGalleryPicker(item.id)}
                        onRemove={() => setGallery((prev) => prev.filter((g) => g.id !== item.id))}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <button type="button" className={catalogStyles.btn} onClick={addGalleryRow}>
                  {s.addFrame}
                </button>
                <button type="button" className={catalogStyles.btn} onClick={openGalleryPickerMulti}>
                  {s.addMultiLib}
                </button>
              </div>
            </div>

            <div className={pn.section}>
              <h2 className={pn.sectionTitle}>{s.delivery}</h2>
              <textarea
                className={`${catalogStyles.textarea} ${pn.wideTextarea}`}
                value={deliveryText}
                onChange={(e) => setDeliveryText(e.target.value)}
                rows={6}
                placeholder={s.deliveryPh}
              />
            </div>

            <div className={pn.section}>
              <h2 className={pn.sectionTitle}>{s.techTitle}</h2>
              <textarea
                className={`${catalogStyles.textarea} ${pn.wideTextarea}`}
                value={technicalSpecs}
                onChange={(e) => setTechnicalSpecs(e.target.value)}
                rows={6}
                placeholder={s.techPh}
              />
            </div>

            <div className={pn.section}>
              <h2 className={pn.sectionTitle}>{s.extraTitle}</h2>
              <RichBlock
                value={additionalInfoHtml}
                onChange={setAdditionalInfoHtml}
                placeholder={s.extraPh}
                uploadMedia={(file, type) => adminUploadRichMedia(file, type)}
                pickMediaFromLibrary={pickMediaFromLibrary}
                onUploadError={(msg) => setSaveError(msg)}
              />
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

          <aside className={pn.productFormPlacement} aria-label={s.placementAria}>
            <p className={pn.placementHeading}>{s.placementHeading}</p>

            <div className={pn.placementBlock}>
              <label className={catalogStyles.label}>
                {s.mainCategory}
                <select
                  className={catalogStyles.input}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">{s.choosePlaceholder}</option>
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
                    aria-label={s.publishedAria}
                  />
                  <label htmlFor="product-new-active">{s.publishedLabel}</label>
                </div>
              </div>
            </div>

            <div className={pn.placementBlock}>
              <h3 className={pn.placementBlockTitle}>{s.extraCatsTitle}</h3>
              <p className={pn.placementHint}>{s.extraCatsHint}</p>
              {!categoryId ? (
                <p className={catalogStyles.muted}>{s.selectMainFirst}</p>
              ) : (
                <div className={pn.additionalCatsWrap}>
                  <label className={catalogStyles.label}>
                    {s.addCategory}
                    <select
                      key={additionalCatSelectKey}
                      className={catalogStyles.input}
                      defaultValue=""
                      aria-label={s.addCategoryAria}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) addAdditionalCategoryFromDropdown(v);
                      }}
                    >
                      <option value="">{s.chooseCategory}</option>
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
                      {s.noOtherCats}
                    </p>
                  ) : null}
                  {additionalCategoryIds.size > 0 ? (
                    <ul
                      className={pn.additionalCatChips}
                      aria-label={s.selectedCatsAria}
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
                              aria-label={s.removeCatAria(label)}
                            >
                              ×
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                      {s.noExtraSelected}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className={pn.placementBlock}>
              <h3 className={pn.placementBlockTitle}>{s.collectionsTitle}</h3>
              <p className={pn.placementHint}>{s.collectionsHint}</p>
              <div className={pn.additionalCatsWrap}>
                <label className={catalogStyles.label}>
                  {s.addCollection}
                  <select
                    key={collectionSelectKey}
                    className={catalogStyles.input}
                    defaultValue=""
                    aria-label={s.addCollectionAria}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) addCuratedCollectionFromDropdown(v);
                    }}
                  >
                    <option value="">{s.chooseCollection}</option>
                    {collectionsAvailableForPick.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                {collectionsAvailableForPick.length === 0 && curatedCollectionIds.size === 0 ? (
                  <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                    {s.noCollectionsLeft}
                  </p>
                ) : null}
                {curatedCollectionIds.size > 0 ? (
                  <ul className={pn.additionalCatChips} aria-label={s.selectedCollectionsAria}>
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
                            aria-label={s.removeColAria(c.name)}
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                    {s.noCollectionsSelected}
                  </p>
                )}
              </div>
            </div>

            <div className={pn.placementBlock}>
              <h3 className={pn.placementBlockTitle}>{s.setsTitle}</h3>
              <p className={pn.placementHint}>{s.setsHint}</p>
              <div className={pn.additionalCatsWrap}>
                <label className={catalogStyles.label}>
                  {s.addSet}
                  <select
                    key={productSetSelectKey}
                    className={catalogStyles.input}
                    defaultValue=""
                    aria-label={s.addSetAria}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) addProductSetFromDropdown(v);
                    }}
                  >
                    <option value="">{s.chooseSet}</option>
                    {setsAvailableForPick.map((ps) => (
                      <option key={ps.id} value={ps.id}>
                        {ps.name}
                      </option>
                    ))}
                  </select>
                </label>
                {setsAvailableForPick.length === 0 && curatedProductSetIds.size === 0 ? (
                  <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                    {s.noSetsLeft}
                  </p>
                ) : null}
                {curatedProductSetIds.size > 0 ? (
                  <ul className={pn.additionalCatChips} aria-label={s.selectedSetsAria}>
                    {Array.from(curatedProductSetIds).map((id) => {
                      const setRow = productSets.find((x) => x.id === id);
                      if (!setRow) return null;
                      return (
                        <li key={id} className={pn.additionalCatChip}>
                          <span className={pn.additionalCatChipLabel}>{setRow.name}</span>
                          <button
                            type="button"
                            className={pn.additionalCatChipRemove}
                            onClick={() => removeProductSet(id)}
                            aria-label={s.removeSetAria(setRow.name)}
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                    {s.noSetsSelected}
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
                ? s.saveBusyEdit
                : s.saveBusyCreate
              : isEdit
                ? s.save
                : s.createProduct}
          </button>
          <Link href="/admin/catalog/products" className={catalogStyles.btn}>
            {s.cancel}
          </Link>
        </div>
      </form>

      {isEdit && productId && product ? (
        <>
          <ProductModificationsSection
            productId={productId}
            initialModifications={product.modifications}
            onProductMutated={applyProduct}
          />

          <ProductElementsSection
            productId={productId}
            brandId={normalizedBrandId}
            initialElements={product.elements}
            onProductMutated={applyProduct}
          />

          <div className={pn.section}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <h2 className={pn.sectionTitle} style={{ margin: 0 }}>
                {s.variantsTitle}
              </h2>
              <button
                type="button"
                className={`${catalogStyles.btn} ${catalogStyles.btnPrimary}`}
                onClick={openVariantCreateModal}
                disabled={!canCreateVariant}
                title={
                  canCreateVariant
                    ? undefined
                    : s.addVariantDisabled
                }
              >
                {s.addVariant}
              </button>
            </div>
            <p className={catalogStyles.muted} style={{ marginTop: 0 }}>
              {s.variantsHint}
            </p>
            {variants.length === 0 ? (
              <p className={catalogStyles.muted}>
                {s.noVariants}
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e6e8' }}>
                      <th style={{ padding: '8px 6px' }}>{s.thVarName}</th>
                      <th style={{ padding: '8px 6px' }}>{s.thMod}</th>
                      <th style={{ padding: '8px 6px' }}>{s.thElements}</th>
                      <th style={{ padding: '8px 6px' }}>{s.thPrice}</th>
                      <th style={{ padding: '8px 6px' }}>{s.thVis}</th>
                      <th style={{ padding: '8px 6px', width: 56 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => (
                      <tr key={v.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '8px 6px' }}>
                          {v.displayName}
                          {v.isDefault ? (
                            <span
                              className={catalogStyles.badge}
                              style={{ marginLeft: 8 }}
                              aria-label={s.defaultAria}
                            >
                              {s.defaultBadge}
                            </span>
                          ) : null}
                        </td>
                        <td style={{ padding: '8px 6px' }}>{v.modificationLabel || '—'}</td>
                        <td style={{ padding: '8px 6px' }}>{v.selectionsLabel ?? '—'}</td>
                        <td style={{ padding: '8px 6px' }}>
                          {Number(v.price).toLocaleString(locale === 'zh' ? 'zh-CN' : 'ru-RU', {
                            maximumFractionDigits: 0,
                          })}{' '}
                          {v.currency}
                        </td>
                        <td style={{ padding: '8px 6px' }}>{v.isActive ? c.yes : c.no}</td>
                        <td style={{ padding: '8px 6px' }}>
                          <Link
                            href={`/admin/catalog/products/${productId}/variants/${v.id}`}
                            aria-label={s.editVariantAria}
                            style={{ display: 'inline-flex', padding: 4 }}
                          >
                            <img src="/icons/edit.svg" alt="" width={20} height={20} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      {variantCreateOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 260,
            background: 'rgba(5, 24, 38, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setVariantCreateOpen(false);
          }}
        >
          <div
            style={{
              width: 'min(480px, 96vw)',
              background: '#fff',
              borderRadius: 14,
              padding: 20,
              boxShadow: '0 24px 64px rgba(5, 24, 38, 0.22)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h2 style={{ margin: 0 }}>{s.modalNewVariant}</h2>
            <p className={catalogStyles.muted} style={{ margin: 0 }}>
              {s.modalNewVariantLead}
            </p>
            <label className={catalogStyles.label} style={{ margin: 0 }}>
              {s.modification}
              <select
                className={catalogStyles.input}
                value={variantCreateModificationId}
                onChange={(e) => setVariantCreateModificationId(e.target.value)}
              >
                {product?.modifications.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            {variantCreateError ? (
              <p className={catalogStyles.error} style={{ margin: 0 }}>
                {variantCreateError}
              </p>
            ) : null}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className={catalogStyles.btn}
                onClick={() => setVariantCreateOpen(false)}
                disabled={variantCreateBusy}
              >
                {s.modalCancel}
              </button>
              <button
                type="button"
                className={`${catalogStyles.btn} ${catalogStyles.btnPrimary}`}
                onClick={() => {
                  void createVariant();
                }}
                disabled={variantCreateBusy || !variantCreateModificationId}
              >
                {variantCreateBusy ? s.modalCreateBusy : s.modalCreate}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
          onPick={picker.multi ? undefined : handlePickerPick}
          onPickBatch={picker.multi ? handlePickerPickBatch : undefined}
        />
      ) : null}
    </>
  );
}

export function ProductNewClient() {
  return <ProductFormClient />;
}
