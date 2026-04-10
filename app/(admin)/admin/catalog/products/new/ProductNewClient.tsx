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
  ProductMaterialColorShell,
} from '../adminProductTypes';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import {
  adminBackendJson,
  adminUploadRichMedia,
  revalidatePublicCatalogCache,
} from '@/lib/adminBackendFetch';
import { createClientRandomId } from '@/lib/clientRandomId';
import catalogStyles from '../../catalogAdmin.module.css';
import pn from './productNew.module.css';

type GalleryItem = { id: string; url: string; serverId?: string };
type MaterialShellRow = {
  id: string;
  serverId?: string;
  name: string;
  colors: {
    id: string;
    serverId?: string;
    name: string;
    imageUrl: string;
  }[];
};
function rowId() {
  return createClientRandomId();
}

export function parseSpecsJson(raw: unknown): {
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

export function ProductFormClient({ productId }: { productId?: string } = {}) {
  const router = useRouter();
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
  const [materialColorShell, setMaterialColorShell] = useState<MaterialShellRow[]>([]);
  const [deliveryText, setDeliveryText] = useState('');
  const [technicalSpecs, setTechnicalSpecs] = useState('');
  const [additionalInfoHtml, setAdditionalInfoHtml] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [variants, setVariants] = useState<AdminProductVariantSummary[]>([]);
  const [variantActionBusy, setVariantActionBusy] = useState(false);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<
    null | { filter: 'image' | 'video' | 'all'; title: string }
  >(null);
  const pickTarget = useRef<
    null | { kind: 'gallery'; id: string } | { kind: 'mcShellColor'; materialId: string; colorId: string } | { kind: 'rich' }
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
          setIsActive(p.isActive);
          setGallery(
            p.images.map((img) => ({
              id: rowId(),
              url: img.url,
              serverId: img.id,
            })),
          );
          setMaterialColorShell(
            (p.materialColorOptions ?? []).map((m: ProductMaterialColorShell) => ({
              id: rowId(),
              serverId: m.id,
              name: m.name,
              colors: m.colors.map((c) => ({
                id: rowId(),
                serverId: c.id,
                name: c.name,
                imageUrl: c.imageUrl,
              })),
            })),
          );
          setVariants(p.variants ?? []);
          setDeliveryText(p.deliveryText ?? '');
          setTechnicalSpecs(p.technicalSpecs ?? '');
          setAdditionalInfoHtml(p.additionalInfoHtml ?? '');
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

  function openMcShellColorPicker(materialId: string, colorId: string) {
    richPickResolver.current = null;
    pickTarget.current = { kind: 'mcShellColor', materialId, colorId };
    setPicker({ filter: 'image', title: 'Изображение цвета (витрина)' });
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
    } else if (t.kind === 'mcShellColor') {
      setMaterialColorShell((prev) =>
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

  function addMaterialShellRow() {
    setMaterialColorShell((prev) => [...prev, { id: rowId(), name: '', colors: [] }]);
  }

  function removeMaterialShellRow(mid: string) {
    setMaterialColorShell((prev) => prev.filter((m) => m.id !== mid));
  }

  function addColorShellRow(materialId: string) {
    setMaterialColorShell((prev) =>
      prev.map((m) =>
        m.id !== materialId
          ? m
          : { ...m, colors: [...m.colors, { id: rowId(), name: '', imageUrl: '' }] },
      ),
    );
  }

  function removeColorShellRow(materialId: string, colorId: string) {
    setMaterialColorShell((prev) =>
      prev.map((m) =>
        m.id !== materialId
          ? m
          : { ...m, colors: m.colors.filter((c) => c.id !== colorId) },
      ),
    );
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

    if (productId) {
      setSaving(true);
      try {
        const shellPayload = {
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
          materialColorOptions: materialColorShell.map((m, mi) => ({
            ...(m.serverId ? { id: m.serverId } : {}),
            name: m.name.trim(),
            sortOrder: mi,
            colors: m.colors.map((c, ci) => ({
              ...(c.serverId ? { id: c.serverId } : {}),
              name: c.name.trim(),
              imageUrl: c.imageUrl.trim(),
              sortOrder: ci,
            })),
          })),
          deliveryText: deliveryText.trim() || null,
          technicalSpecs: technicalSpecs.trim() || null,
          additionalInfoHtml: additionalInfoHtml.trim() || null,
          seoTitle: seoTitle.trim() || null,
          seoDescription: seoDescription.trim() || null,
          isActive,
        };
        const updated = await adminBackendJson<ProductAdminDetail>(
          `catalog/admin/products/${productId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(shellPayload),
          },
        );
        setVariants(updated.variants ?? []);
        await revalidatePublicCatalogCache();
        router.refresh();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Ошибка сохранения');
      } finally {
        setSaving(false);
      }
      return;
    }

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
        materialColorOptions: materialColorShell
          .filter((m) => m.name.trim())
          .map((m, mi) => ({
            name: m.name.trim(),
            sortOrder: mi,
            colors: m.colors
              .filter((c) => c.name.trim() && c.imageUrl.trim())
              .map((c, ci) => ({
                name: c.name.trim(),
                imageUrl: c.imageUrl.trim(),
                sortOrder: ci,
              })),
          })),
        deliveryText: deliveryText.trim() || null,
        technicalSpecs: technicalSpecs.trim() || null,
        additionalInfoHtml: additionalInfoHtml.trim() || null,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        price: 0,
        priceMode: 'manual' as const,
        currency: 'RUB',
        isActive,
      };

      const created = await adminBackendJson<{ id: string }>('catalog/admin/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await revalidatePublicCatalogCache();
      router.push(`/admin/catalog/products/${created.id}`);
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

        <div className={pn.section}>
          <h2 className={pn.sectionTitle}>Галерея изображений</h2>
          <p className={catalogStyles.muted} style={{ marginTop: 0 }}>
            Крупное превью, порядок — перетаскиванием за ⋮⋮. Подписи к файлам настраиваются в объектах
            медиатеки.
            {isEdit ? ' Для варианта без своих кадров на витрине используется эта галерея.' : null}
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
            <h2 className={pn.sectionTitle}>Материалы и цвета</h2>
            <p className={catalogStyles.muted} style={{ marginTop: 0 }}>
              {isEdit
                ? 'Группы материалов и карточки цветов с превью — для витрины и привязки к вариантам SKU в карточке варианта.'
                : 'Заведите группы и цвета здесь; сочетание материал+цвет для каждого SKU задаётся в карточке варианта.'}
            </p>
            <div className={pn.repeatList}>
              {materialColorShell.map((m) => (
                <div
                  key={m.id}
                  style={{
                    border: '1px solid #e2e6e8',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <div className={pn.repeatRow}>
                    <input
                      type="text"
                      className={catalogStyles.input}
                      style={{ flex: 1, minWidth: 200 }}
                      value={m.name}
                      onChange={(e) =>
                        setMaterialColorShell((prev) =>
                          prev.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)),
                        )
                      }
                      placeholder="Название группы (материал)"
                    />
                    <button
                      type="button"
                      className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                      onClick={() => removeMaterialShellRow(m.id)}
                    >
                      Удалить группу
                    </button>
                  </div>
                  <div style={{ marginTop: 10, paddingLeft: 8 }}>
                    {m.colors.map((c) => (
                      <div key={c.id} className={`${pn.repeatRow} ${pn.galleryRowLayout}`} style={{ marginBottom: 8 }}>
                        {c.imageUrl ? (
                          <img className={pn.colorPreview} src={c.imageUrl} alt="" />
                        ) : (
                          <div className={pn.colorPreview} aria-hidden />
                        )}
                        <input
                          type="text"
                          className={catalogStyles.input}
                          style={{ flex: 1, minWidth: 160 }}
                          value={c.name}
                          onChange={(e) =>
                            setMaterialColorShell((prev) =>
                              prev.map((mat) =>
                                mat.id !== m.id
                                  ? mat
                                  : {
                                      ...mat,
                                      colors: mat.colors.map((col) =>
                                        col.id === c.id ? { ...col, name: e.target.value } : col,
                                      ),
                                    },
                              ),
                            )
                          }
                          placeholder="Название цвета"
                        />
                        <div className={pn.rowActions}>
                          <button
                            type="button"
                            className={catalogStyles.btn}
                            onClick={() => openMcShellColorPicker(m.id, c.id)}
                          >
                            Медиатека
                          </button>
                          <button
                            type="button"
                            className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                            onClick={() => removeColorShellRow(m.id, c.id)}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className={catalogStyles.btn} onClick={() => addColorShellRow(m.id)}>
                      + Цвет в группе
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className={catalogStyles.btn} onClick={addMaterialShellRow}>
              + Группа материала
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

        {isEdit ? (
          <div className={pn.section}>
            <h2 className={pn.sectionTitle}>Варианты</h2>
            <p className={catalogStyles.muted} style={{ marginTop: 0 }}>
              Цена, габариты, SKU, 3D/чертёж, цвета и галерея варианта — в карточке варианта. Если у варианта
              нет своих фото, подставляется общая галерея товара.
            </p>
            <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
              Удалить вариант можно в его карточке (кнопка «Удалить вариант»), если вариантов больше одного.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e6e8' }}>
                    <th style={{ padding: '8px 6px' }}>Название варианта</th>
                    <th style={{ padding: '8px 6px' }}>Цена</th>
                    <th style={{ padding: '8px 6px' }}>Доступность</th>
                    <th style={{ padding: '8px 6px', width: 56 }} />
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '8px 6px' }}>{v.displayName}</td>
                      <td style={{ padding: '8px 6px' }}>
                        {Number(v.price).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} {v.currency}
                      </td>
                      <td style={{ padding: '8px 6px' }}>{v.isActive ? 'Да' : 'Нет'}</td>
                      <td style={{ padding: '8px 6px' }}>
                        <Link
                          href={`/admin/catalog/products/${productId}/variants/${v.id}`}
                          aria-label="Редактировать вариант"
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
            <button
              type="button"
              className={catalogStyles.btn}
              style={{ marginTop: 12 }}
              disabled={variantActionBusy || !productId}
              onClick={() => {
                void (async () => {
                  if (!productId) return;
                  setVariantActionBusy(true);
                  try {
                    const { id } = await adminBackendJson<{ id: string }>(
                      `catalog/admin/products/${productId}/variants`,
                      { method: 'POST', body: '{}' },
                    );
                    router.push(`/admin/catalog/products/${productId}/variants/${id}`);
                  } catch (e) {
                    setSaveError(e instanceof Error ? e.message : 'Не удалось создать вариант');
                  } finally {
                    setVariantActionBusy(false);
                  }
                })();
              }}
            >
              {variantActionBusy ? '…' : '+ Добавить вариант'}
            </button>
          </div>
        ) : null}

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
