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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminCompactBtn, AdminCompactBtnLink } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminModalCloseButton } from '@/components/admin/AdminModalCloseButton/AdminModalCloseButton';
import { AdminTableRemoveButton } from '@/components/admin/AdminTableRemoveButton/AdminTableRemoveButton';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import { AdminSelect, AdminTextArea, AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import { adminBackendList, adminBackendListAll, adminListParams } from '@/lib/adminListResponse';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminProductSetEditorStrings } from '@/lib/admin-i18n/adminProductSetsI18n';
import type { AdminBrandRow } from '../brands/adminBrandTypes';
import type { AdminProductRow } from '../catalog/products/adminProductTypes';
import styles from '../catalog/catalogAdmin.module.css';
import objStyles from '../objects/objectsLibrary.module.css';
import type { ProductSetDetail } from './productSetsAdminTypes';

const PRODUCT_SET_FORM_ID = 'product-set-editor-form';

function rowKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type ProductRow = { key: string; productId: string; name: string; slug: string };

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

export function ProductSetEditorClient({ setId }: { setId?: string }) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminProductSetEditorStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const isEdit = !!setId;

  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!isEdit);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [coverUrl, setCoverUrl] = useState('');
  const [coverMediaObjectId, setCoverMediaObjectId] = useState<string | null>(null);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [brandId, setBrandId] = useState('');
  const [brands, setBrands] = useState<AdminBrandRow[]>([]);
  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [addQ, setAddQ] = useState('');
  const [addDebouncedQ, setAddDebouncedQ] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addProductHits, setAddProductHits] = useState<AdminProductRow[]>([]);
  const [addModalSelected, setAddModalSelected] = useState<Set<string>>(() => new Set());

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const selectableProductIds = useMemo(
    () =>
      addProductHits.filter((p) => !productRows.some((r) => r.productId === p.id)).map((p) => p.id),
    [addProductHits, productRows],
  );
  const modalAllSelectableSelected =
    selectableProductIds.length > 0 && selectableProductIds.every((id) => addModalSelected.has(id));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const b = await adminBackendListAll<AdminBrandRow>('catalog/admin/brands');
        if (!cancelled) setBrands(b);
      } catch {
        if (!cancelled) setBrands([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        const d = await adminBackendJson<ProductSetDetail>(`catalog/admin/product-sets/${setId}`);
        if (cancelled) return;
        setName(d.name);
        setSlug(d.slug);
        setDescription(d.description ?? '');
        setBrandId(d.brandId ?? '');
        setIsActive(d.isActive);
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
          })),
        );
        setLoaded(true);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : s.errLoad);
          setLoaded(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setId, isEdit, s]);

  useEffect(() => {
    const t = setTimeout(() => setAddDebouncedQ(addQ.trim()), 300);
    return () => clearTimeout(t);
  }, [addQ]);

  const loadAddHits = useCallback(async () => {
    if (!addPickerOpen) return;
    setAddLoading(true);
    try {
      const res = await adminBackendList<AdminProductRow>(
        'catalog/admin/products',
        adminListParams({ page: 1, limit: 100, q: addDebouncedQ }),
      );
      setAddProductHits(res.items);
    } catch {
      setAddProductHits([]);
    } finally {
      setAddLoading(false);
    }
  }, [addPickerOpen, addDebouncedQ]);

  useEffect(() => {
    loadAddHits();
  }, [loadAddHits]);

  useEffect(() => {
    if (addPickerOpen) setAddModalSelected(new Set());
  }, [addDebouncedQ, addPickerOpen]);

  function toggleModalSelectAll() {
    if (modalAllSelectableSelected) {
      setAddModalSelected((prev) => {
        const n = new Set(prev);
        for (const id of selectableProductIds) n.delete(id);
        return n;
      });
    } else {
      setAddModalSelected((prev) => {
        const n = new Set(prev);
        for (const id of selectableProductIds) n.add(id);
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
    const picks = Array.from(addModalSelected)
      .map((id) => addProductHits.find((x) => x.id === id))
      .filter((p): p is AdminProductRow => !!p && !productRows.some((r) => r.productId === p.id));
    setProductRows((prev) => [
      ...prev,
      ...picks.map((p) => ({ key: rowKey(), productId: p.id, name: p.name, slug: p.slug })),
    ]);
    setAddModalSelected(new Set());
    setAddPickerOpen(false);
    setAddQ('');
  }

  function onProductDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = productRows.findIndex((r) => r.key === active.id);
    const newIndex = productRows.findIndex((r) => r.key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setProductRows((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    const nameTrim = name.trim();
    if (!nameTrim) {
      setSaveError(s.nameRequired);
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: nameTrim,
        description: description.trim() || null,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        isActive,
        productIds: productRows.map((r) => r.productId),
        brandId: brandId.trim() || null,
      };
      if (slug.trim()) body.slug = slug.trim();
      if (coverUrl.trim()) {
        body.coverImageUrl = coverUrl.trim();
        if (coverMediaObjectId) body.coverMediaObjectId = coverMediaObjectId;
      } else {
        body.coverImageUrl = null;
      }

      if (isEdit) {
        await adminBackendJson(`catalog/admin/product-sets/${setId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        const created = await adminBackendJson<ProductSetDetail>('catalog/admin/product-sets', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        await revalidatePublicCatalogCache();
        router.push(`/admin/product-sets/${created.id}`);
        router.refresh();
        return;
      }
      await revalidatePublicCatalogCache();
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : s.saveErr);
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
        <Link className={styles.backLink} href="/admin/product-sets">
          {s.backList}
        </Link>
      </p>

      {loadError ? <p className={styles.error}>{loadError}</p> : null}

      <MediaLibraryPickerModal
        open={coverPickerOpen}
        title={s.coverTitle}
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
          aria-label={s.addProductAria}
          onClick={() => setAddPickerOpen(false)}
        >
          <div
            className={objStyles.modal}
            onClick={(ev) => ev.stopPropagation()}
            style={{ maxWidth: 640, width: '100%' }}
          >
            <div className={styles.modalHeaderRow}>
              <h2 className={objStyles.dialogTitle} style={{ margin: 0, paddingRight: 8 }}>
                {s.addProduct}
              </h2>
              <AdminModalCloseButton onClick={() => setAddPickerOpen(false)} label={s.close} />
            </div>
            <AdminSearchBox
              className={styles.searchBoxFull}
              placeholder={s.searchPh}
              ariaLabel={s.searchAria}
              value={addQ}
              onChange={(e) => setAddQ(e.target.value)}
            />
            <div className={`${styles.tableWrap} ${styles.tableScroll}`}>
              {addLoading ? (
                <p className={styles.muted}>{c.loading}</p>
              ) : addProductHits.length === 0 ? (
                <p className={styles.muted}>{s.nothing}</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>
                        <AccountCheckbox
                          id="product-set-add-select-all"
                          className={styles.adminCheckboxInTable}
                          checked={modalAllSelectableSelected}
                          onChange={toggleModalSelectAll}
                          disabled={!selectableProductIds.length}
                          aria-label={s.selectAllList}
                        />
                      </th>
                      <th>{s.thName}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addProductHits.map((p) => {
                      const inSet = productRows.some((r) => r.productId === p.id);
                      return (
                        <tr key={p.id} className={inSet ? styles.rowInactive : undefined}>
                          <td>
                            <AccountCheckbox
                              id={`product-set-add-p-${p.id}`}
                              className={styles.adminCheckboxInTable}
                              disabled={inSet}
                              checked={!inSet && addModalSelected.has(p.id)}
                              onChange={() => toggleAddModalRow(p.id)}
                              aria-label={s.selectRow(p.name)}
                            />
                          </td>
                          <td>
                            {p.name}
                            {inSet ? (
                              <span className={styles.muted} style={{ marginLeft: 6 }}>
                                {s.inSet}
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
                {s.clearSel}
              </AdminCompactBtn>
              <AdminCompactBtn
                type="button"
                disabled={!addModalSelected.size}
                onClick={commitAddModalSelection}
              >
                {addModalSelected.size ? `${s.addSelected} (${addModalSelected.size})` : s.addSelected}
              </AdminCompactBtn>
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.detailTitleRow}>
        <h1 className={styles.title}>{isEdit ? s.titleEdit : s.titleNew}</h1>
        <AdminCompactBtn
          type="submit"
          form={PRODUCT_SET_FORM_ID}
          variant="accent"
          disabled={saving || !!loadError || (isEdit && !loaded)}
        >
          {saving ? s.saveBusy : isEdit ? s.saveEdit : s.create}
        </AdminCompactBtn>
      </div>

      <form
        id={PRODUCT_SET_FORM_ID}
        className={`${styles.form} ${styles.formWide}`}
        onSubmit={submit}
      >
        <AdminTextField
          label={s.nameLabel}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <AdminTextField
          label={s.slugLabel}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={s.slugPh}
        />

        <AdminTextArea
          label={s.desc}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
        />

        <div className={styles.fieldBlock}>
          <span className={styles.adminFieldLabel}>{s.coverBlock}</span>
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
              {s.pickLibrary}
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
                {s.removeCover}
              </AdminCompactBtn>
            ) : null}
          </div>
        </div>

        <AdminSelect
          label={s.brand}
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
          aria-label={s.brandAria}
        >
          <option value="">{s.brandNone}</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </AdminSelect>

        <h2 className={styles.groupHeading}>{s.seoHeading}</h2>
        <AdminTextField
          label={s.seoTitle}
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
        />
        <AdminTextArea
          label={s.seoDesc}
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
          rows={3}
        />

        <div className={styles.labelCheckboxRow}>
          <AccountCheckbox
            id="product-set-active"
            className={styles.adminCheckboxForm}
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            aria-label={s.activeAria}
          />
          <label htmlFor="product-set-active">{s.activeLabel}</label>
        </div>

        <div className={styles.sectionHead} style={{ marginTop: 8 }}>
          <h2 className={styles.groupHeading}>{s.productsTitle}</h2>
          <AdminCompactBtn
            type="button"
            onClick={() => {
              setAddQ('');
              setAddModalSelected(new Set());
              setAddPickerOpen(true);
            }}
          >
            {s.addProductBtn}
          </AdminCompactBtn>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onProductDragEnd}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 36 }} aria-label={s.thOrder} />
                  <th>{s.thName}</th>
                  <th className={styles.tableCellActions} />
                </tr>
              </thead>
              <tbody>
                {productRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={styles.muted}>
                      {s.emptyPositions}
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
                        dragTitle={s.drag}
                        removeLabel={s.remove}
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

        {saveError ? <p className={styles.error}>{saveError}</p> : null}

        <div className={styles.formActions}>
          <AdminCompactBtnLink href="/admin/product-sets" variant="outline">
            {s.cancel}
          </AdminCompactBtnLink>
        </div>
      </form>
    </>
  );
}
