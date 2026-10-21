'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminModalCloseButton } from '@/components/admin/AdminModalCloseButton/AdminModalCloseButton';
import { AdminSelect } from '@/components/AdminTextField/AdminTextField';
import modalStyles from '@/components/admin/AdminModal/AdminModal.module.css';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { adminProductsListStrings } from '@/lib/admin-i18n/adminProductsListI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import {
  EMPTY_PRODUCT_LIST_FILTERS,
  categorySelectLabel,
  sortCategoriesForAdminSelect,
  type ProductListFilterMeta,
  type ProductListFilters,
} from './productListFilters';

type Props = {
  open: boolean;
  meta: ProductListFilterMeta | null;
  metaLoading: boolean;
  applied: ProductListFilters;
  onClose: () => void;
  onApply: (filters: ProductListFilters) => void;
};

export function ProductsListFilterModal({
  open,
  meta,
  metaLoading,
  applied,
  onClose,
  onApply,
}: Props) {
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminProductsListStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<ProductListFilters>(applied);

  useModalFocusTrap(open, panelRef);

  useEffect(() => {
    if (open) setDraft(applied);
  }, [open, applied]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const html = document.documentElement;
    const body = document.body;
    const ph = html.style.overflow;
    const pb = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      html.style.overflow = ph;
      body.style.overflow = pb;
    };
  }, [open, onClose]);

  const sortedCategories = useMemo(
    () => (meta?.categories ? sortCategoriesForAdminSelect(meta.categories, locale) : []),
    [meta, locale],
  );

  const productCollections = useMemo(
    () => meta?.collections?.filter((row) => row.kind === 'PRODUCT') ?? [],
    [meta],
  );

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={modalStyles.overlay}
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        className={modalStyles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={modalStyles.panelHead}>
          <h2 id={titleId} className={modalStyles.panelTitle}>
            {s.filterTitle}
          </h2>
          <AdminModalCloseButton label={c.cancel} onClick={onClose} />
        </div>

        <div className={modalStyles.body}>
          {metaLoading && !meta ? <p>{c.loading}</p> : null}

          <AdminSelect
            label={s.filterBrand}
            value={draft.brandId}
            disabled={!meta}
            onChange={(e) => setDraft((prev) => ({ ...prev, brandId: e.target.value }))}
          >
            <option value="">{s.filterAny}</option>
            <option value="_none">{s.filterNoBrand}</option>
            {meta?.brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
                {brand._count.products > 0 ? ` (${brand._count.products})` : ''}
              </option>
            ))}
          </AdminSelect>

          <AdminSelect
            label={s.filterCategory}
            value={draft.categoryId}
            disabled={!meta}
            onChange={(e) => setDraft((prev) => ({ ...prev, categoryId: e.target.value }))}
          >
            <option value="">{s.filterAny}</option>
            {sortedCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {categorySelectLabel(category)}
              </option>
            ))}
          </AdminSelect>

          <AdminSelect
            label={s.filterTag}
            value={draft.tagId}
            disabled={!meta}
            onChange={(e) => setDraft((prev) => ({ ...prev, tagId: e.target.value }))}
          >
            <option value="">{s.filterAny}</option>
            {meta?.catalogTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </AdminSelect>

          <AdminSelect
            label={s.filterCollection}
            value={draft.collectionId}
            disabled={!meta}
            onChange={(e) => setDraft((prev) => ({ ...prev, collectionId: e.target.value }))}
          >
            <option value="">{s.filterAny}</option>
            {productCollections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </AdminSelect>

          <AdminSelect
            label={s.filterProductSet}
            value={draft.productSetId}
            disabled={!meta}
            onChange={(e) => setDraft((prev) => ({ ...prev, productSetId: e.target.value }))}
          >
            <option value="">{s.filterAny}</option>
            {meta?.productSets.map((setRow) => (
              <option key={setRow.id} value={setRow.id}>
                {setRow.name}
              </option>
            ))}
          </AdminSelect>
        </div>

        <div className={modalStyles.panelFooter}>
          <AdminCompactBtn
            type="button"
            variant="outline"
            onClick={() => setDraft(EMPTY_PRODUCT_LIST_FILTERS)}
          >
            {s.filterReset}
          </AdminCompactBtn>
          <AdminCompactBtn type="button" variant="outline" onClick={onClose}>
            {c.cancel}
          </AdminCompactBtn>
          <AdminCompactBtn
            type="button"
            variant="accent"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            {s.filterApply}
          </AdminCompactBtn>
        </div>
      </div>
    </div>,
    document.body,
  );
}
