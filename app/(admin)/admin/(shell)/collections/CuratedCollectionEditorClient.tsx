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
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminCompactBtn, AdminCompactBtnLink } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminCatalogVisibilityBadge } from '@/components/admin/AdminCatalogVisibilityBadge';
import { AdminModalCloseButton } from '@/components/admin/AdminModalCloseButton/AdminModalCloseButton';
import { AdminTableRemoveButton } from '@/components/admin/AdminTableRemoveButton/AdminTableRemoveButton';
import { AdminTabs } from '@/components/AdminTabs/AdminTabs';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import {
  AdminSelect,
  AdminTextArea,
  AdminTextField,
} from '@/components/AdminTextField/AdminTextField';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import { adminBackendList, adminListParams } from '@/lib/adminListResponse';
import { adminCollectionEditorStrings } from '@/lib/admin-i18n/adminCollectionsI18n';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import {
  computeHomePreviewCount,
  parseAdminListPrice,
  parseRubPriceInput,
} from '@/lib/home/computeHomePreviewCount';
import type { AdminProductRow } from '../catalog/products/adminProductTypes';
import styles from '@/app/(admin)/admin/catalogAdmin.module.css';
import objStyles from '../objects/objectsLibrary.module.css';
import type {
  CuratedCollectionDetail,
  CuratedHomeGridSize,
  CuratedHomeOrderMode,
} from './collectionsAdminTypes';

const COLLECTION_FORM_ID = 'curated-collection-editor-form';

function rowKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type ProductRow = {
  key: string;
  productId: string;
  name: string;
  slug: string;
  price: number | null;
  isActive: boolean;
};
type BrandRow = { key: string; brandId: string; name: string; slug: string };

type BrandListRow = { id: string; name: string; slug: string };

function SortableItemRow({
  label,
  onRemove,
  rowId,
  dragTitle,
  removeLabel,
}: {
  rowId: string;
  label: string;
  onRemove: () => void;
  dragTitle: string;
  removeLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowId,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };
  return (
    <tr ref={setNodeRef} style={style}>
      <td className={styles.dragHandle} {...attributes} {...listeners} title={dragTitle}>
        ⋮⋮
      </td>
      <td>
        <strong>{label}</strong>
      </td>
      <td className={styles.tableCellActions}>
        <AdminTableRemoveButton label={removeLabel} onClick={onRemove} />
      </td>
    </tr>
  );
}

export function CuratedCollectionEditorClient({ collectionId }: { collectionId?: string }) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const str = useMemo(() => adminCollectionEditorStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const { confirm } = useAdminConfirm();
  const isEdit = !!collectionId;

  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!isEdit);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<'PRODUCT' | 'BRAND'>('PRODUCT');
  const [isActive, setIsActive] = useState(true);
  const [showOnHome, setShowOnHome] = useState(false);
  const [homeOrder, setHomeOrder] = useState('1');
  const [homeGridSize, setHomeGridSize] = useState<CuratedHomeGridSize>('FOUR');
  const [homeOrderMode, setHomeOrderMode] = useState<CuratedHomeOrderMode>('FIXED');
  const [homePriceMin, setHomePriceMin] = useState('');
  const [homePriceMax, setHomePriceMax] = useState('');
  const [homeOrderError, setHomeOrderError] = useState<string | null>(null);
  const [homePriceError, setHomePriceError] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [coverMediaObjectId, setCoverMediaObjectId] = useState<string | null>(null);
  const saveErrorRef = useRef<HTMLParagraphElement>(null);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  const [brandRows, setBrandRows] = useState<BrandRow[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [addQ, setAddQ] = useState('');
  const [addDebouncedQ, setAddDebouncedQ] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addProductHits, setAddProductHits] = useState<AdminProductRow[]>([]);
  const [addBrandHits, setAddBrandHits] = useState<BrandListRow[]>([]);
  const [addModalSelected, setAddModalSelected] = useState<Set<string>>(() => new Set());

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const selectableProductIds = useMemo(
    () =>
      addProductHits.filter((p) => !productRows.some((r) => r.productId === p.id)).map((p) => p.id),
    [addProductHits, productRows],
  );
  const selectableBrandIds = useMemo(
    () => addBrandHits.filter((b) => !brandRows.some((r) => r.brandId === b.id)).map((b) => b.id),
    [addBrandHits, brandRows],
  );
  const modalAllSelectableSelected =
    kind === 'PRODUCT'
      ? selectableProductIds.length > 0 && selectableProductIds.every((id) => addModalSelected.has(id))
      : selectableBrandIds.length > 0 && selectableBrandIds.every((id) => addModalSelected.has(id));

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
        const d = await adminBackendJson<CuratedCollectionDetail>(
          `catalog/admin/curated-collections/${collectionId}`,
        );
        if (cancelled) return;
        setName(d.name);
        setSlug(d.slug);
        setDescription(d.description ?? '');
        setKind(d.kind);
        setIsActive(d.isActive);
        setShowOnHome(Boolean(d.showOnHome));
        setHomeOrder(d.homeOrder != null ? String(d.homeOrder) : '1');
        setHomeGridSize(d.homeGridSize ?? 'FOUR');
        setHomeOrderMode(d.homeOrderMode ?? 'FIXED');
        setHomePriceMin(d.homePriceMin != null ? String(d.homePriceMin) : '');
        setHomePriceMax(d.homePriceMax != null ? String(d.homePriceMax) : '');
        setHomeOrderError(null);
        setHomePriceError(null);
        setCoverUrl(d.coverImageUrl ?? '');
        setCoverMediaObjectId(d.coverMediaObjectId ?? null);
        setSeoTitle(d.seoTitle ?? '');
        setSeoDescription(d.seoDescription ?? '');
        setProductRows(
          d.productItems.map((it) => ({
            key: it.id,
            productId: it.productId,
            name: it.name,
            slug: it.slug,
            price: typeof it.price === 'number' ? it.price : parseAdminListPrice(it.price),
            isActive: it.isActive !== false,
          })),
        );
        setBrandRows(
          d.brandItems.map((it) => ({
            key: it.id,
            brandId: it.brandId,
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
  }, [collectionId, isEdit, str.errLoad]);

  useEffect(() => {
    const t = setTimeout(() => setAddDebouncedQ(addQ.trim()), 300);
    return () => clearTimeout(t);
  }, [addQ]);

  const loadAddHits = useCallback(async () => {
    if (!addPickerOpen) return;
    setAddLoading(true);
    try {
      if (kind === 'PRODUCT') {
        const res = await adminBackendList<AdminProductRow>(
          'catalog/admin/products',
          adminListParams({ page: 1, limit: 100, q: addDebouncedQ }),
        );
        setAddProductHits(res.items);
        setAddBrandHits([]);
      } else {
        const res = await adminBackendList<{ id: string; name: string; slug: string }>(
          'catalog/admin/brands',
          adminListParams({ page: 1, limit: 100, q: addDebouncedQ }),
        );
        setAddBrandHits(res.items.map((b) => ({ id: b.id, name: b.name, slug: b.slug })));
        setAddProductHits([]);
      }
    } catch {
      setAddProductHits([]);
      setAddBrandHits([]);
    } finally {
      setAddLoading(false);
    }
  }, [addPickerOpen, addDebouncedQ, kind]);

  useEffect(() => {
    loadAddHits();
  }, [loadAddHits]);

  useEffect(() => {
    if (!saveError) return;
    saveErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [saveError]);

  useEffect(() => {
    if (addPickerOpen) setAddModalSelected(new Set());
  }, [addDebouncedQ, addPickerOpen]);

  function toggleModalSelectAll() {
    const ids = kind === 'PRODUCT' ? selectableProductIds : selectableBrandIds;
    if (modalAllSelectableSelected) {
      setAddModalSelected((prev) => {
        const n = new Set(prev);
        for (const id of ids) n.delete(id);
        return n;
      });
    } else {
      setAddModalSelected((prev) => {
        const n = new Set(prev);
        for (const id of ids) n.add(id);
        return n;
      });
    }
  }

  function toggleAddModalRow(id: string) {
    setAddModalSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function commitAddModalSelection() {
    if (kind === 'PRODUCT') {
      const picks = Array.from(addModalSelected)
        .map((id) => addProductHits.find((x) => x.id === id))
        .filter((p): p is AdminProductRow => !!p && !productRows.some((r) => r.productId === p.id));
      setProductRows((prev) => [
        ...prev,
        ...picks.map((p) => ({
          key: rowKey(),
          productId: p.id,
          name: p.name,
          slug: p.slug,
          price: parseAdminListPrice(p.price),
          isActive: p.isActive,
        })),
      ]);
    } else {
      const picks = Array.from(addModalSelected)
        .map((id) => addBrandHits.find((x) => x.id === id))
        .filter((b): b is BrandListRow => !!b && !brandRows.some((r) => r.brandId === b.id));
      setBrandRows((prev) => [
        ...prev,
        ...picks.map((b) => ({ key: rowKey(), brandId: b.id, name: b.name, slug: b.slug })),
      ]);
    }
    setAddModalSelected(new Set());
    setAddPickerOpen(false);
    setAddQ('');
  }

  async function changeKind(next: 'PRODUCT' | 'BRAND') {
    if (next === kind) return;
    const has = productRows.length > 0 || brandRows.length > 0;
    if (has && !(await confirm({ title: str.changeKindConfirm }))) {
      return;
    }
    setKind(next);
    setProductRows([]);
    setBrandRows([]);
    if (next === 'BRAND') {
      setShowOnHome(false);
      setHomeOrderMode('FIXED');
      setHomePriceMin('');
      setHomePriceMax('');
    }
  }

  function onProductDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = productRows.findIndex((r) => r.key === active.id);
    const newIndex = productRows.findIndex((r) => r.key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setProductRows((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  function onBrandDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = brandRows.findIndex((r) => r.key === active.id);
    const newIndex = brandRows.findIndex((r) => r.key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setBrandRows((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  const liveHomePreviewCount = useMemo(() => {
    if (kind !== 'PRODUCT') return 0;
    const min = homeOrderMode === 'RANDOM' ? parseRubPriceInput(homePriceMin) : null;
    const max = homeOrderMode === 'RANDOM' ? parseRubPriceInput(homePriceMax) : null;
    return computeHomePreviewCount({
      showOnHome,
      isActive,
      homeGridSize,
      homeOrderMode,
      homePriceMin: min,
      homePriceMax: max,
      prices: productRows.filter((r) => r.isActive).map((r) => r.price),
    });
  }, [
    kind,
    showOnHome,
    isActive,
    homeGridSize,
    homeOrderMode,
    homePriceMin,
    homePriceMax,
    productRows,
  ]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setHomeOrderError(null);
    setHomePriceError(null);
    const nameTrim = name.trim();
    if (!nameTrim) {
      setSaveError(str.nameRequired);
      return;
    }

    let orderNum: number | null = null;
    let priceMin: number | null = null;
    let priceMax: number | null = null;
    if (kind === 'PRODUCT' && showOnHome && isActive) {
      orderNum = Number.parseInt(homeOrder.trim(), 10);
      if (!Number.isInteger(orderNum) || orderNum < 1) {
        setHomeOrderError(str.homeOrderRequired);
        setSaveError(str.homeOrderRequired);
        return;
      }
      if (homeOrderMode === 'RANDOM') {
        priceMin = parseRubPriceInput(homePriceMin);
        priceMax = parseRubPriceInput(homePriceMax);
        if (priceMin != null && priceMax != null && priceMin > priceMax) {
          setHomePriceError(str.homePriceRangeInvalid);
          setSaveError(str.homePriceRangeInvalid);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: nameTrim,
        description: description.trim() || null,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        kind,
        isActive,
      };
      if (slug.trim()) body.slug = slug.trim();
      if (coverUrl.trim()) {
        body.coverImageUrl = coverUrl.trim();
        if (coverMediaObjectId) body.coverMediaObjectId = coverMediaObjectId;
      } else {
        body.coverImageUrl = null;
      }
      if (kind === 'PRODUCT') {
        body.productIds = productRows.map((r) => r.productId);
        body.showOnHome = showOnHome;
        if (showOnHome) {
          body.homeOrder = orderNum;
          body.homeGridSize = homeGridSize;
          body.homeOrderMode = homeOrderMode;
          if (homeOrderMode === 'RANDOM') {
            body.homePriceMin = priceMin;
            body.homePriceMax = priceMax;
          } else {
            body.homePriceMin = null;
            body.homePriceMax = null;
          }
        } else {
          body.homeOrder = null;
          body.homePriceMin = null;
          body.homePriceMax = null;
        }
      } else {
        body.brandIds = brandRows.map((r) => r.brandId);
        body.showOnHome = false;
        body.homeOrder = null;
        body.homePriceMin = null;
        body.homePriceMax = null;
      }

      if (isEdit) {
        await adminBackendJson(`catalog/admin/curated-collections/${collectionId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        const refreshed = await adminBackendJson<CuratedCollectionDetail>(
          `catalog/admin/curated-collections/${collectionId}`,
        );
        setShowOnHome(Boolean(refreshed.showOnHome));
        setHomeOrder(refreshed.homeOrder != null ? String(refreshed.homeOrder) : '1');
        setHomeGridSize(refreshed.homeGridSize ?? 'FOUR');
        setHomeOrderMode(refreshed.homeOrderMode ?? 'FIXED');
        setHomePriceMin(refreshed.homePriceMin != null ? String(refreshed.homePriceMin) : '');
        setHomePriceMax(refreshed.homePriceMax != null ? String(refreshed.homePriceMax) : '');
        setProductRows(
          refreshed.productItems.map((it) => ({
            key: it.id,
            productId: it.productId,
            name: it.name,
            slug: it.slug,
            price: typeof it.price === 'number' ? it.price : parseAdminListPrice(it.price),
            isActive: it.isActive !== false,
          })),
        );
        setHomeOrderError(null);
        setHomePriceError(null);
      } else {
        const created = await adminBackendJson<CuratedCollectionDetail>(
          'catalog/admin/curated-collections',
          {
            method: 'POST',
            body: JSON.stringify(body),
          },
        );
        await revalidatePublicCatalogCache();
        router.push(`/admin/collections/${created.id}`);
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

  if (isEdit && loadError) {
    return (
      <>
        <p className={styles.backRow}>
          <Link className={styles.backLink} href="/admin/collections">
            {str.backList}
          </Link>
        </p>
        <p className={styles.error} role="alert">
          {loadError}
        </p>
        <AdminCompactBtnLink href="/admin/collections" variant="outline">
          {c.backToList}
        </AdminCompactBtnLink>
      </>
    );
  }

  return (
    <>
      <p className={styles.backRow}>
        <Link className={styles.backLink} href="/admin/collections">
          {str.backList}
        </Link>
      </p>

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

      {addPickerOpen ? (
        <div
          className={objStyles.modalBackdrop}
          role="dialog"
          aria-modal
          aria-label={kind === 'PRODUCT' ? str.addProductAria : str.addBrandAria}
          onClick={() => setAddPickerOpen(false)}
        >
          <div
            className={objStyles.modal}
            onClick={(ev) => ev.stopPropagation()}
            style={{ maxWidth: 640, width: '100%' }}
          >
            <div className={styles.modalHeaderRow}>
              <h2 className={objStyles.dialogTitle} style={{ margin: 0, paddingRight: 8 }}>
                {kind === 'PRODUCT' ? str.addProduct : str.addBrand}
              </h2>
              <AdminModalCloseButton onClick={() => setAddPickerOpen(false)} label={str.close} />
            </div>
            <AdminSearchBox
              className={styles.searchBoxFull}
              placeholder={str.searchPh}
              ariaLabel={str.searchAria}
              value={addQ}
              onChange={(e) => setAddQ(e.target.value)}
            />
            <div className={`${styles.tableWrap} ${styles.tableScroll}`}>
              {addLoading ? (
                <p className={styles.muted}>{c.loading}</p>
              ) : kind === 'PRODUCT' ? (
                addProductHits.length === 0 ? (
                  <p className={styles.muted}>{str.nothing}</p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: 44 }}>
                          <AccountCheckbox
                            id="curated-add-select-all"
                            className={styles.adminCheckboxInTable}
                            checked={modalAllSelectableSelected}
                            onChange={toggleModalSelectAll}
                            disabled={!selectableProductIds.length}
                            aria-label={str.selectAllList}
                          />
                        </th>
                        <th>{str.thName}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addProductHits.map((p) => {
                        const inCol = productRows.some((r) => r.productId === p.id);
                        return (
                          <tr key={p.id} className={inCol ? styles.rowInactive : undefined}>
                            <td>
                              <AccountCheckbox
                                id={`curated-add-p-${p.id}`}
                                className={styles.adminCheckboxInTable}
                                disabled={inCol}
                                checked={!inCol && addModalSelected.has(p.id)}
                                onChange={() => toggleAddModalRow(p.id)}
                                aria-label={str.selectRow(p.name)}
                              />
                            </td>
                            <td>
                              {p.name}
                              {inCol ? (
                                <span className={styles.muted} style={{ marginLeft: 6 }}>
                                  {str.inCollection}
                                </span>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              ) : addBrandHits.length === 0 ? (
                <p className={styles.muted}>{str.nothing}</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>
                        <AccountCheckbox
                          id="curated-add-select-all-brands"
                          className={styles.adminCheckboxInTable}
                          checked={modalAllSelectableSelected}
                          onChange={toggleModalSelectAll}
                          disabled={!selectableBrandIds.length}
                          aria-label={str.selectAllList}
                        />
                      </th>
                      <th>{str.thName}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addBrandHits.map((b) => {
                      const inCol = brandRows.some((r) => r.brandId === b.id);
                      return (
                        <tr key={b.id} className={inCol ? styles.rowInactive : undefined}>
                          <td>
                            <AccountCheckbox
                              id={`curated-add-b-${b.id}`}
                              className={styles.adminCheckboxInTable}
                              disabled={inCol}
                              checked={!inCol && addModalSelected.has(b.id)}
                              onChange={() => toggleAddModalRow(b.id)}
                              aria-label={str.selectRow(b.name)}
                            />
                          </td>
                          <td>
                            {b.name}
                            {inCol ? (
                              <span className={styles.muted} style={{ marginLeft: 6 }}>
                                {str.inCollection}
                              </span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className={styles.formActions} style={{ marginTop: 14 }}>
              <AdminCompactBtn
                type="button"
                variant="outline"
                onClick={() => setAddModalSelected(new Set())}
                disabled={!addModalSelected.size}
              >
                {str.clearSel}
              </AdminCompactBtn>
              <AdminCompactBtn
                type="button"
                disabled={!addModalSelected.size}
                onClick={commitAddModalSelection}
              >
                {addModalSelected.size ? `${str.addSelected} (${addModalSelected.size})` : str.addSelected}
              </AdminCompactBtn>
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.detailTitleRow}>
        <div className={styles.detailTitleWithBadge}>
          <h1 className={styles.title}>{isEdit ? str.titleEdit : str.titleNew}</h1>
          <AdminCatalogVisibilityBadge
            isActive={isActive}
            publishedLabel={str.published}
            hiddenLabel={str.hidden}
          />
        </div>
        <AdminCompactBtn
          type="submit"
          form={COLLECTION_FORM_ID}
          variant="accent"
          disabled={saving || (isEdit && !loaded)}
        >
          {saving ? str.saveBusy : isEdit ? str.saveEdit : str.create}
        </AdminCompactBtn>
      </div>
      {saveError ? (
        <p
          ref={saveErrorRef}
          className={styles.error}
          role="alert"
          aria-live="polite"
        >
          {saveError}
        </p>
      ) : null}

      <form
        id={COLLECTION_FORM_ID}
        className={`${styles.form} ${styles.formWide}`}
        onSubmit={submit}
      >
        <AdminTextField
          label={str.nameLabel}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <AdminTextField
          label={str.slugLabel}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={str.slugPh}
        />

        <AdminTextArea
          label={str.desc}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
        />

        <div className={styles.fieldBlock}>
          <span className={styles.adminFieldLabel}>{str.contentTitle}</span>
          <AdminTabs
            variant="pill"
            ariaLabel={str.contentTitle}
            items={[
              { id: 'PRODUCT' as const, label: str.tabProducts },
              { id: 'BRAND' as const, label: str.tabBrands },
            ]}
            activeId={kind}
            onChange={changeKind}
          />
        </div>

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

        <h2 className={styles.groupHeading}>{str.seoHeading}</h2>
        <AdminTextField
          label={str.seoTitle}
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
        />
        <AdminTextArea
          label={str.seoDesc}
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
          rows={3}
        />

        <div className={styles.sectionHead} style={{ marginTop: 8 }}>
          <h2 className={styles.groupHeading}>
            {kind === 'PRODUCT' ? str.listProducts : str.listBrands}
          </h2>
          <AdminCompactBtn
            type="button"
            onClick={() => {
              setAddQ('');
              setAddModalSelected(new Set());
              setAddPickerOpen(true);
            }}
          >
            {kind === 'PRODUCT' ? str.addProductBtn : str.addBrandBtn}
          </AdminCompactBtn>
        </div>

        {kind === 'PRODUCT' ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onProductDragEnd}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 36 }} aria-label={str.thOrder} />
                    <th>{str.thName}</th>
                    <th className={styles.tableCellActions} />
                  </tr>
                </thead>
                <tbody>
                  {productRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className={styles.muted}>
                        {str.emptyPositions}
                      </td>
                    </tr>
                  ) : (
                    <SortableContext
                      items={productRows.map((r) => r.key)}
                      strategy={verticalListSortingStrategy}
                    >
                      {productRows.map((row) => (
                        <SortableItemRow
                          key={row.key}
                          rowId={row.key}
                          label={row.name}
                          dragTitle={str.drag}
                          removeLabel={str.remove}
                          onRemove={() =>
                            setProductRows((prev) => prev.filter((r) => r.key !== row.key))
                          }
                        />
                      ))}
                    </SortableContext>
                  )}
                </tbody>
              </table>
            </div>
          </DndContext>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onBrandDragEnd}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 36 }} aria-label={str.thOrder} />
                    <th>{str.thName}</th>
                    <th className={styles.tableCellActions} />
                  </tr>
                </thead>
                <tbody>
                  {brandRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className={styles.muted}>
                        {str.emptyPositions}
                      </td>
                    </tr>
                  ) : (
                    <SortableContext
                      items={brandRows.map((r) => r.key)}
                      strategy={verticalListSortingStrategy}
                    >
                      {brandRows.map((row) => (
                        <SortableItemRow
                          key={row.key}
                          rowId={row.key}
                          label={row.name}
                          dragTitle={str.drag}
                          removeLabel={str.remove}
                          onRemove={() =>
                            setBrandRows((prev) => prev.filter((r) => r.key !== row.key))
                          }
                        />
                      ))}
                    </SortableContext>
                  )}
                </tbody>
              </table>
            </div>
          </DndContext>
        )}

        <div className={styles.labelCheckboxRow}>
          <AccountCheckbox
            id="curated-collection-active"
            className={styles.adminCheckboxForm}
            checked={isActive}
            onChange={(e) => {
              const next = e.target.checked;
              setIsActive(next);
              if (!next && showOnHome) setShowOnHome(false);
            }}
            aria-label={str.activeAria}
          />
          <label htmlFor="curated-collection-active">{str.activeLabel}</label>
        </div>
        {!isActive && kind === 'PRODUCT' ? (
          <p className={styles.muted}>{str.homeNeedsActive}</p>
        ) : null}

        {kind === 'PRODUCT' ? (
          <>
            <h2 className={styles.groupHeading}>{str.homeHeading}</h2>
            <div className={styles.labelCheckboxRow}>
              <AccountCheckbox
                id="curated-collection-home"
                className={styles.adminCheckboxForm}
                checked={showOnHome}
                disabled={!isActive}
                onChange={(e) => setShowOnHome(e.target.checked)}
                aria-label={str.homeShowAria}
              />
              <label htmlFor="curated-collection-home">{str.homeShowLabel}</label>
            </div>
            {showOnHome && isActive ? (
              <>
                <AdminTextField
                  label={str.homeOrder}
                  type="number"
                  min={1}
                  max={99}
                  value={homeOrder}
                  error={homeOrderError ?? undefined}
                  onChange={(e) => {
                    setHomeOrder(e.target.value);
                    setHomeOrderError(null);
                  }}
                />
                <p className={styles.muted}>{str.homeOrderHint}</p>
                <AdminSelect
                  label={str.homeGrid}
                  value={homeGridSize}
                  onChange={(e) => setHomeGridSize(e.target.value as CuratedHomeGridSize)}
                >
                  <option value="FOUR">{str.homeGrid4}</option>
                  <option value="EIGHT">{str.homeGrid8}</option>
                  <option value="UNLIMITED">{str.homeGridUnlimited}</option>
                </AdminSelect>
                <AdminSelect
                  label={str.homeMode}
                  value={homeOrderMode}
                  onChange={(e) => {
                    setHomeOrderMode(e.target.value as CuratedHomeOrderMode);
                    setHomePriceError(null);
                  }}
                >
                  <option value="FIXED">{str.homeModeFixed}</option>
                  <option value="RANDOM">{str.homeModeRandom}</option>
                </AdminSelect>
                {homeOrderMode === 'RANDOM' ? (
                  <>
                    <AdminTextField
                      label={str.homePriceMin}
                      type="number"
                      min={0}
                      value={homePriceMin}
                      error={homePriceError ?? undefined}
                      onChange={(e) => {
                        setHomePriceMin(e.target.value);
                        setHomePriceError(null);
                      }}
                    />
                    <AdminTextField
                      label={str.homePriceMax}
                      type="number"
                      min={0}
                      value={homePriceMax}
                      error={homePriceError ?? undefined}
                      onChange={(e) => {
                        setHomePriceMax(e.target.value);
                        setHomePriceError(null);
                      }}
                    />
                    <p className={styles.muted}>{str.homePriceHint}</p>
                  </>
                ) : null}
                {liveHomePreviewCount > 0 ? (
                  <p className={styles.muted}>{str.homePreviewOk(liveHomePreviewCount)}</p>
                ) : (
                  <p className={styles.error}>{str.homePreviewEmpty}</p>
                )}
                <p className={styles.muted}>{str.homePreviewTierNote}</p>
              </>
            ) : null}
          </>
        ) : null}

        <div className={styles.formActions}>
          <AdminCompactBtnLink href="/admin/collections" variant="outline">
            {str.cancel}
          </AdminCompactBtnLink>
        </div>
      </form>
    </>
  );
}
