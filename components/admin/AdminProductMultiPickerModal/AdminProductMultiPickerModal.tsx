'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListPagination } from '@/components/admin/AdminListPagination/AdminListPagination';
import { AdminModal } from '@/components/admin/AdminModal/AdminModal';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { adminProductPickerStrings } from '@/lib/admin-i18n/adminProductPickerI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminBackendList, adminListParams } from '@/lib/adminListResponse';
import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import type { AdminCategoryRow } from '@/app/(admin)/admin/(shell)/catalog/categories/adminCategoryTypes';
import type { AdminProductRow } from '@/app/(admin)/admin/(shell)/catalog/products/adminProductTypes';
import own from './AdminProductMultiPickerModal.module.css';

const PAGE_LIMIT = 24;
const SKELETON_ROWS = 6;

type CatNode = {
  id: string;
  name: string;
  depth: number;
  recursiveProductCount: number;
};

function buildCategoryNav(rows: AdminCategoryRow[], locale: string): CatNode[] {
  const byParent = new Map<string | null, AdminCategoryRow[]>();
  for (const row of rows) {
    const key = row.parentId;
    const list = byParent.get(key) ?? [];
    list.push(row);
    byParent.set(key, list);
  }
  for (const list of Array.from(byParent.values())) {
    list.sort(
      (a: AdminCategoryRow, b: AdminCategoryRow) =>
        a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, locale),
    );
  }
  const out: CatNode[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const row of byParent.get(parentId) ?? []) {
      out.push({
        id: row.id,
        name: row.name,
        depth,
        recursiveProductCount: row.recursiveProductCount ?? 0,
      });
      walk(row.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

function formatPrice(amount: string, currency: string, numberLocale: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  const cur = currency || 'RUB';
  try {
    return new Intl.NumberFormat(numberLocale, {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: cur === 'RUB' ? 0 : 2,
    }).format(n);
  } catch {
    return `${amount} ${cur}`;
  }
}

export type AdminProductMultiPickerModalProps = {
  open: boolean;
  /** Уже добавленные — disabled. */
  excludedIds: ReadonlySet<string>;
  /** Подпись «уже в …» (коллекция / набор / тег). */
  alreadyInLabel: string;
  title?: string;
  onClose: () => void;
  onAdd: (products: AdminProductRow[]) => void;
};

export function AdminProductMultiPickerModal({
  open,
  excludedIds,
  alreadyInLabel,
  title,
  onClose,
  onAdd,
}: AdminProductMultiPickerModalProps) {
  const { locale } = useAdminLocale();
  const str = useMemo(() => adminProductPickerStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const numberLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';
  const compareLocale = locale === 'zh' ? 'zh' : 'ru';
  const alreadyInHintId = useId();

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catsError, setCatsError] = useState<string | null>(null);
  const [catsRetry, setCatsRetry] = useState(0);
  const [items, setItems] = useState<AdminProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [listRetry, setListRetry] = useState(0);
  const [selected, setSelected] = useState<Map<string, AdminProductRow>>(() => new Map());

  const catNav = useMemo(
    () => buildCategoryNav(categories, compareLocale),
    [categories, compareLocale],
  );

  const reset = useCallback(() => {
    setQ('');
    setDebouncedQ('');
    setCategoryId('');
    setPage(1);
    setItems([]);
    setTotal(0);
    setSelected(new Map());
    setLoadError(null);
    setCatsError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open, reset]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  /** Единая политика: смена фильтра/поиска сбрасывает выбор и страницу. */
  useEffect(() => {
    setPage(1);
    setSelected(new Map());
  }, [debouncedQ, categoryId]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCatsLoading(true);
    setCatsError(null);
    void (async () => {
      try {
        const rows = await adminBackendJson<AdminCategoryRow[]>('catalog/admin/categories');
        if (!cancelled) {
          setCategories(Array.isArray(rows) ? rows : []);
          setCatsError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setCategories([]);
          setCatsError(e instanceof Error ? e.message : str.catsErr);
        }
      } finally {
        if (!cancelled) setCatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, catsRetry, str.catsErr]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const params = adminListParams({ page, limit: PAGE_LIMIT, q: debouncedQ });
        if (categoryId) params.set('categoryId', categoryId);
        const res = await adminBackendList<AdminProductRow>('catalog/admin/products', params);
        if (cancelled) return;
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
          setLoadError(e instanceof Error ? e.message : c.errLoad);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, page, debouncedQ, categoryId, listRetry, c.errLoad]);

  const selectableOnPage = useMemo(
    () => items.filter((p) => !excludedIds.has(p.id)),
    [items, excludedIds],
  );

  const allPageSelected =
    selectableOnPage.length > 0 && selectableOnPage.every((p) => selected.has(p.id));

  function toggleRow(p: AdminProductRow) {
    if (excludedIds.has(p.id)) return;
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(p.id)) next.delete(p.id);
      else next.set(p.id, p);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allPageSelected) {
        for (const p of selectableOnPage) next.delete(p.id);
      } else {
        for (const p of selectableOnPage) next.set(p.id, p);
      }
      return next;
    });
  }

  function commit() {
    if (!selected.size) return;
    onAdd(Array.from(selected.values()));
    onClose();
  }

  const modalTitle = title?.trim() || str.title;

  return (
    <AdminModal
      open={open}
      wide
      title={modalTitle}
      closeLabel={str.close}
      onClose={onClose}
      footer={
        <>
          <span className={own.footerMeta}>
            {selected.size > 0 ? str.selected(selected.size) : str.hint}
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
          placeholder={str.searchPh}
          ariaLabel={str.searchAria}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {selected.size > 0 ? (
        <p className={own.selectedHint}>{str.selected(selected.size)}</p>
      ) : null}
      <p id={alreadyInHintId} className={own.srOnly}>
        {alreadyInLabel}
      </p>

      <div className={own.layout}>
        <aside className={own.cats} aria-label={str.catsAria}>
          <button
            type="button"
            className={`${own.catBtn}${!categoryId ? ` ${own.catBtnActive}` : ''}`}
            style={{ ['--cat-depth' as string]: 0 }}
            onClick={() => setCategoryId('')}
          >
            {str.allCats}
          </button>
          {catsLoading ? <p className={catalogStyles.muted}>{c.loading}</p> : null}
          {!catsLoading && catsError ? (
            <div className={own.errorRow}>
              <p className={catalogStyles.error} style={{ margin: 0 }}>
                {catsError}
              </p>
              <AdminCompactBtn
                type="button"
                variant="outline"
                onClick={() => setCatsRetry((n) => n + 1)}
              >
                {str.retry}
              </AdminCompactBtn>
            </div>
          ) : null}
          {!catsLoading && !catsError
            ? catNav.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`${own.catBtn}${categoryId === cat.id ? ` ${own.catBtnActive}` : ''}`}
                  style={{ ['--cat-depth' as string]: cat.depth }}
                  onClick={() => setCategoryId(cat.id)}
                >
                  {cat.name}
                  {cat.recursiveProductCount > 0 ? (
                    <span className={own.catCount}> · {cat.recursiveProductCount}</span>
                  ) : null}
                </button>
              ))
            : null}
        </aside>

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
                    <th style={{ width: 54 }} aria-hidden />
                    <th>{str.thName}</th>
                    <th>{str.thCategory}</th>
                    <th>{str.thPrice}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                    <tr key={`sk-${i}`} className={own.skeletonRow}>
                      <td>
                        <span className={own.skeletonBlock} style={{ width: 16, height: 16 }} />
                      </td>
                      <td>
                        <span className={`${own.skeletonBlock} ${own.skeletonThumb}`} />
                      </td>
                      <td>
                        <span className={own.skeletonBlock} style={{ width: '70%' }} />
                      </td>
                      <td>
                        <span className={own.skeletonBlock} style={{ width: '50%' }} />
                      </td>
                      <td>
                        <span className={own.skeletonBlock} style={{ width: 48 }} />
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
                        id="admin-product-multi-pick-all"
                        className={catalogStyles.adminCheckboxInTable}
                        checked={allPageSelected}
                        onChange={togglePage}
                        disabled={!selectableOnPage.length}
                        aria-label={str.selectAllPage}
                      />
                    </th>
                    <th style={{ width: 54 }} aria-hidden />
                    <th>{str.thName}</th>
                    <th>{str.thCategory}</th>
                    <th>{str.thPrice}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => {
                    const already = excludedIds.has(p.id);
                    return (
                      <tr
                        key={p.id}
                        className={`${!p.isActive ? catalogStyles.rowInactive : ''} ${
                          already ? own.rowInCollection : own.rowClickable
                        }`}
                        onClick={() => {
                          if (!already) toggleRow(p);
                        }}
                      >
                        <td
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <AccountCheckbox
                            id={`admin-product-multi-pick-${p.id}`}
                            className={catalogStyles.adminCheckboxInTable}
                            checked={selected.has(p.id)}
                            disabled={already}
                            onChange={() => toggleRow(p)}
                            aria-label={str.selectRow(p.name)}
                            aria-describedby={already ? alreadyInHintId : undefined}
                          />
                        </td>
                        <td>
                          {p.thumbUrl ? (
                            <img
                              className={catalogStyles.productListThumb}
                              src={p.thumbUrl}
                              alt=""
                              width={46}
                              height={46}
                            />
                          ) : (
                            <div className={catalogStyles.productListThumbPh} aria-hidden />
                          )}
                        </td>
                        <td>
                          <div className={own.nameCell}>
                            <span className={own.productName}>{p.name}</span>
                            {already ? (
                              <span className={own.meta}>{alreadyInLabel}</span>
                            ) : !p.isActive ? (
                              <span className={own.meta}>{str.hidden}</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <span className={own.meta}>
                            {p.categoryPath || p.category?.name || '—'}
                          </span>
                        </td>
                        <td>{formatPrice(p.price, p.currency, numberLocale)}</td>
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
      </div>
    </AdminModal>
  );
}
