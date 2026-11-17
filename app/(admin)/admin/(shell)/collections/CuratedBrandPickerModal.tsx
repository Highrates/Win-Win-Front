'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListPagination } from '@/components/admin/AdminListPagination/AdminListPagination';
import { AdminModal } from '@/components/admin/AdminModal/AdminModal';
import own from '@/components/admin/AdminProductMultiPickerModal/AdminProductMultiPickerModal.module.css';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import { adminCollectionEditorStrings } from '@/lib/admin-i18n/adminCollectionsI18n';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminBackendList, adminListParams } from '@/lib/adminListResponse';
import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import type { AdminBrandRow } from '../brands/adminBrandTypes';

const PAGE_LIMIT = 24;
const SKELETON_ROWS = 6;

export type CuratedBrandPick = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  open: boolean;
  excludedBrandIds: ReadonlySet<string>;
  onClose: () => void;
  onAdd: (brands: CuratedBrandPick[]) => void;
};

export function CuratedBrandPickerModal({
  open,
  excludedBrandIds,
  onClose,
  onAdd,
}: Props) {
  const { locale } = useAdminLocale();
  const str = useMemo(() => adminCollectionEditorStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const inCollectionHintId = useId();

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AdminBrandRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [listRetry, setListRetry] = useState(0);
  const [selected, setSelected] = useState<Map<string, CuratedBrandPick>>(() => new Map());

  const reset = useCallback(() => {
    setQ('');
    setDebouncedQ('');
    setPage(1);
    setItems([]);
    setTotal(0);
    setSelected(new Map());
    setLoadError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open, reset]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  /** Единая политика: смена поиска сбрасывает выбор. */
  useEffect(() => {
    setPage(1);
    setSelected(new Map());
  }, [debouncedQ]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const res = await adminBackendList<AdminBrandRow>(
          'catalog/admin/brands',
          adminListParams({ page, limit: PAGE_LIMIT, q: debouncedQ }),
        );
        if (cancelled) return;
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
          setLoadError(e instanceof Error ? e.message : str.errLoad);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, page, debouncedQ, listRetry, str.errLoad]);

  const selectableOnPage = useMemo(
    () => items.filter((b) => !excludedBrandIds.has(b.id)),
    [items, excludedBrandIds],
  );

  const allPageSelected =
    selectableOnPage.length > 0 && selectableOnPage.every((b) => selected.has(b.id));

  function toggleRow(b: AdminBrandRow) {
    if (excludedBrandIds.has(b.id)) return;
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(b.id)) next.delete(b.id);
      else next.set(b.id, { id: b.id, name: b.name, slug: b.slug });
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allPageSelected) {
        for (const b of selectableOnPage) next.delete(b.id);
      } else {
        for (const b of selectableOnPage) {
          next.set(b.id, { id: b.id, name: b.name, slug: b.slug });
        }
      }
      return next;
    });
  }

  function commit() {
    if (!selected.size) return;
    onAdd(Array.from(selected.values()));
    onClose();
  }

  return (
    <AdminModal
      open={open}
      title={str.addBrand}
      closeLabel={str.close}
      onClose={onClose}
      footer={
        <>
          <span className={own.footerMeta}>
            {selected.size > 0 ? str.pickerSelected(selected.size) : str.brandPickerHint}
          </span>
          <AdminCompactBtn type="button" variant="outline" onClick={onClose}>
            {str.close}
          </AdminCompactBtn>
          <AdminCompactBtn
            type="button"
            variant="outline"
            onClick={() => setSelected(new Map())}
            disabled={!selected.size}
          >
            {str.clearSel}
          </AdminCompactBtn>
          <AdminCompactBtn type="button" variant="accent" disabled={!selected.size} onClick={commit}>
            {selected.size ? `${str.addSelected} (${selected.size})` : str.addSelected}
          </AdminCompactBtn>
        </>
      }
    >
      <div className={own.toolbar}>
        <AdminSearchBox
          className={catalogStyles.searchBoxFull}
          placeholder={str.brandPickerSearchPh}
          ariaLabel={str.searchAria}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {selected.size > 0 ? (
        <p className={own.selectedHint}>{str.pickerSelected(selected.size)}</p>
      ) : null}
      <p id={inCollectionHintId} className={own.srOnly}>
        {str.inCollection}
      </p>

      <div className={own.results}>
        {loadError ? (
          <div className={own.errorRow}>
            <p className={catalogStyles.error} style={{ margin: 0 }}>
              {loadError}
            </p>
            <AdminCompactBtn
              type="button"
              variant="outline"
              onClick={() => setListRetry((n) => n + 1)}
            >
              {str.retry}
            </AdminCompactBtn>
          </div>
        ) : null}

        {loading ? (
          <div className={`${catalogStyles.tableWrap} ${own.tableWrap}`}>
            <table className={catalogStyles.table}>
              <thead>
                <tr>
                  <th style={{ width: 44 }} aria-hidden />
                  <th>{str.thName}</th>
                  <th>{str.brandPickerThProducts}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                  <tr key={`sk-${i}`} className={own.skeletonRow}>
                    <td>
                      <span className={own.skeletonBlock} style={{ width: 16, height: 16 }} />
                    </td>
                    <td>
                      <span className={own.skeletonBlock} style={{ width: '60%' }} />
                    </td>
                    <td>
                      <span className={own.skeletonBlock} style={{ width: 32 }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && !loadError && items.length === 0 ? (
          <p className={catalogStyles.muted}>{str.nothing}</p>
        ) : null}

        {!loading && !loadError && items.length > 0 ? (
          <div className={`${catalogStyles.tableWrap} ${own.tableWrap}`}>
            <table className={catalogStyles.table}>
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <AccountCheckbox
                      id="curated-brand-pick-all"
                      className={catalogStyles.adminCheckboxInTable}
                      checked={allPageSelected}
                      onChange={togglePage}
                      disabled={!selectableOnPage.length}
                      aria-label={str.selectAllList}
                    />
                  </th>
                  <th>{str.thName}</th>
                  <th>{str.brandPickerThProducts}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => {
                  const inCol = excludedBrandIds.has(b.id);
                  return (
                    <tr
                      key={b.id}
                      className={`${!b.isActive ? catalogStyles.rowInactive : ''} ${
                        inCol ? own.rowInCollection : own.rowClickable
                      }`}
                      onClick={() => {
                        if (!inCol) toggleRow(b);
                      }}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <AccountCheckbox
                          id={`curated-brand-pick-${b.id}`}
                          className={catalogStyles.adminCheckboxInTable}
                          checked={selected.has(b.id)}
                          disabled={inCol}
                          onChange={() => toggleRow(b)}
                          aria-label={str.selectRow(b.name)}
                          aria-describedby={inCol ? inCollectionHintId : undefined}
                        />
                      </td>
                      <td>
                        <div className={own.nameCell}>
                          <span className={own.productName}>{b.name}</span>
                          {inCol ? (
                            <span className={own.meta}>{str.inCollection}</span>
                          ) : !b.isActive ? (
                            <span className={own.meta}>{str.hidden}</span>
                          ) : (
                            <span className={own.meta}>{b.slug}</span>
                          )}
                        </div>
                      </td>
                      <td>{b._count?.products ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loadError ? (
          <AdminListPagination
            page={page}
            total={total}
            limit={PAGE_LIMIT}
            onPageChange={setPage}
            disabled={loading}
          />
        ) : null}
      </div>
    </AdminModal>
  );
}
