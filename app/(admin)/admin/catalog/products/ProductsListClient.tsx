'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminCompactBtn, AdminCompactBtnLink } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListPagination } from '@/components/admin/AdminListPagination/AdminListPagination';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import { AdminTabs } from '@/components/AdminTabs/AdminTabs';
import { AdminPillChip, AdminPillChipList } from '@/components/AdminPillChip/AdminPillChip';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import { ADMIN_LIST_PRODUCTS_LIMIT, adminBackendListAll } from '@/lib/adminListResponse';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminProductsListStrings } from '@/lib/admin-i18n/adminProductsListI18n';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import {
  adminQueryKeys,
  useAdminList,
  useAdminListSearch,
  useInvalidateAdminQueries,
} from '@/lib/adminQuery';
import type { AdminBrandRow } from '../../brands/adminBrandTypes';
import type { AdminCuratedCollectionRow } from '../../collections/collectionsAdminTypes';
import type { AdminProductSetRow } from '../../product-sets/productSetsAdminTypes';
import type { AdminCategoryRow } from '../categories/adminCategoryTypes';
import styles from '../catalogAdmin.module.css';
import filterStyles from './productsListFilters.module.css';
import type { AdminCatalogTagRow, AdminProductRow } from './adminProductTypes';
import { ProductsListFilterModal } from './ProductsListFilterModal';
import {
  EMPTY_PRODUCT_LIST_FILTERS,
  countActiveProductListFilters,
  productListFilterChipLabels,
  productListFiltersToParams,
  type ProductListFilterMeta,
  type ProductListFilters,
} from './productListFilters';

export type ProductVisibilityFilter = 'all' | 'catalog' | 'hidden';

const VISIBILITY_FILTERS: ProductVisibilityFilter[] = ['all', 'catalog', 'hidden'];

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

export function ProductsListClient() {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminProductsListStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const numberLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';
  const invalidate = useInvalidateAdminQueries();
  const { confirm } = useAdminConfirm();

  const [visibilityIndex, setVisibilityIndex] = useState(0);
  const visibility = VISIBILITY_FILTERS[visibilityIndex] ?? 'all';
  const visibilityTabLabels = useMemo(
    () => [s.tabAll, s.tabCatalog, s.tabHidden],
    [s.tabAll, s.tabCatalog, s.tabHidden],
  );

  const [appliedFilters, setAppliedFilters] = useState<ProductListFilters>(EMPTY_PRODUCT_LIST_FILTERS);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterMeta, setFilterMeta] = useState<ProductListFilterMeta | null>(null);
  const [filterMetaLoading, setFilterMetaLoading] = useState(false);

  const activeFilterCount = countActiveProductListFilters(appliedFilters);

  const loadFilterMeta = useCallback(async () => {
    if (filterMeta || filterMetaLoading) return;
    setFilterMetaLoading(true);
    try {
      const [categories, brands, catalogTags, collections, productSets] = await Promise.allSettled([
        adminBackendJson<AdminCategoryRow[]>('catalog/admin/categories'),
        adminBackendListAll<AdminBrandRow>('catalog/admin/brands'),
        adminBackendJson<AdminCatalogTagRow[]>('catalog/admin/catalog-tags?all=1'),
        adminBackendListAll<AdminCuratedCollectionRow>('catalog/admin/curated-collections'),
        adminBackendListAll<AdminProductSetRow>('catalog/admin/product-sets'),
      ]);

      const pickArray = <T,>(result: PromiseSettledResult<unknown>): T[] => {
        if (result.status !== 'fulfilled' || !Array.isArray(result.value)) return [];
        return result.value as T[];
      };

      setFilterMeta({
        categories: pickArray<AdminCategoryRow>(categories),
        brands: pickArray<AdminBrandRow>(brands),
        catalogTags: pickArray<AdminCatalogTagRow>(catalogTags),
        collections: pickArray<AdminCuratedCollectionRow>(collections),
        productSets: pickArray<AdminProductSetRow>(productSets),
      });
    } catch {
      setFilterMeta(null);
    } finally {
      setFilterMetaLoading(false);
    }
  }, [filterMeta, filterMetaLoading]);

  useEffect(() => {
    void loadFilterMeta();
  }, [loadFilterMeta]);

  const filterChipLabels = useMemo(
    () =>
      productListFilterChipLabels(appliedFilters, filterMeta, {
        brand: s.filterChipBrand,
        category: s.filterChipCategory,
        tag: s.filterChipTag,
        collection: s.filterChipCollection,
        productSet: s.filterChipProductSet,
        noBrand: s.filterChipNoBrand,
      }),
    [appliedFilters, filterMeta, s],
  );

  const { q, setQ, debouncedQ, page, setPage } = useAdminListSearch(300, [
    visibilityIndex,
    appliedFilters,
  ]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const listParams = useMemo(
    () => ({
      q: debouncedQ,
      page,
      visibility: visibility === 'all' ? undefined : visibility,
      ...productListFiltersToParams(appliedFilters),
    }),
    [debouncedQ, page, visibility, appliedFilters],
  );

  const listExtraParams = useMemo(() => {
    const params: Record<string, string | undefined> = {};
    if (visibility !== 'all') params.visibility = visibility;
    Object.assign(params, productListFiltersToParams(appliedFilters));
    return Object.keys(params).length ? params : undefined;
  }, [visibility, appliedFilters]);

  const { rows, total, limit, loading, isFetching, error: listError, refetch } = useAdminList<AdminProductRow>({
    queryKey: adminQueryKeys.products.list(listParams),
    path: 'catalog/admin/products',
    page,
    q: debouncedQ,
    limit: ADMIN_LIST_PRODUCTS_LIMIT,
    extraParams: listExtraParams,
    errorFallback: s.errLoad,
  });

  const error = mutationError ?? listError;

  useEffect(() => {
    setSelected(new Set());
  }, [debouncedQ, visibilityIndex, appliedFilters]);

  function onSelectVisibilityTab(index: number) {
    setVisibilityIndex(index);
    setPage(1);
  }

  function openFilterModal() {
    void loadFilterMeta();
    setFilterModalOpen(true);
  }

  function removeFilter(key: keyof ProductListFilters) {
    setAppliedFilters((prev) => ({ ...prev, [key]: '' }));
    setPage(1);
  }

  function clearAllFilters() {
    setAppliedFilters(EMPTY_PRODUCT_LIST_FILTERS);
    setPage(1);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }

  async function removeSelected() {
    if (!selected.size) return;
    if (!(await confirm({ title: s.confirmDelete(selected.size) }))) return;
    setDeleting(true);
    setMutationError(null);
    try {
      const res = await adminBackendJson<{ deleted: string[]; skipped: string[] }>(
        'catalog/admin/products/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({ ids: Array.from(selected) }),
        },
      );
      if (res.skipped.length) {
        setMutationError(s.partialDelete(res.skipped.length, res.deleted.length));
      }
      if (res.deleted.length > 0) {
        await revalidatePublicCatalogCache();
        router.refresh();
      }
      setSelected(new Set());
      await invalidate(adminQueryKeys.products.all);
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : s.errDelete);
    } finally {
      setDeleting(false);
    }
  }

  const allSelected = rows.length > 0 && selected.size === rows.length;

  return (
    <>
      <AdminTabs
        variant="underline"
        ariaLabel={s.visibilityTabsAria}
        items={visibilityTabLabels.map((label, index) => ({
          id: index,
          label,
        }))}
        activeId={visibilityIndex}
        onChange={onSelectVisibilityTab}
      />

      <AdminListShell
      loading={loading}
      error={error}
      onRetry={() => void refetch()}
      loadingLabel={c.loading}
      empty={s.empty}
      isEmpty={!loading && !error && rows.length === 0}
      isFetching={isFetching}
      toolbar={
        <>
          <div className={styles.toolbar}>
            <AdminSearchBox
              className={styles.searchBoxToolbar}
              placeholder={s.searchPh}
              ariaLabel={s.searchAria}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <AdminCompactBtn type="button" variant="outline" onClick={openFilterModal}>
              {s.filterBtn}
              {activeFilterCount > 0 ? (
                <span className={filterStyles.filterBtnCount}> ({activeFilterCount})</span>
              ) : null}
            </AdminCompactBtn>
            <AdminCompactBtnLink href="/admin/catalog/products/new">{s.add}</AdminCompactBtnLink>
            <div className={styles.bulkGroup} role="group" aria-label={s.bulkAria}>
              {!debouncedQ && activeFilterCount === 0 && rows.length > 0 ? (
                <>
                  <AdminCompactBtn
                    type="button"
                    variant="outline"
                    onClick={() => setSelected(new Set(rows.map((r) => r.id)))}
                  >
                    {s.selectAll}
                  </AdminCompactBtn>
                  <AdminCompactBtn type="button" variant="outline" onClick={() => setSelected(new Set())}>
                    {s.clear}
                  </AdminCompactBtn>
                </>
              ) : null}
              <AdminCompactBtn
                type="button"
                variant="danger"
                disabled={!selected.size || deleting}
                onClick={removeSelected}
              >
                {deleting ? s.deleting : s.delete(selected.size)}
              </AdminCompactBtn>
            </div>
          </div>
          {filterChipLabels.length > 0 ? (
            <div className={filterStyles.activeFilters}>
              <AdminPillChipList aria-label={s.filterTitle}>
                {filterChipLabels.map((chip) => (
                  <AdminPillChip
                    key={chip.key}
                    onRemove={() => removeFilter(chip.key)}
                    removeAriaLabel={s.removeFilter(chip.label)}
                  >
                    {chip.label}
                  </AdminPillChip>
                ))}
              </AdminPillChipList>
              <AdminCompactBtn
                type="button"
                variant="outline"
                className={filterStyles.clearFiltersBtn}
                onClick={clearAllFilters}
              >
                {s.filterClearAll}
              </AdminCompactBtn>
            </div>
          ) : null}
        </>
      }
      pagination={
        <AdminListPagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={setPage}
          disabled={isFetching}
        />
      }
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: 54 }} aria-label={s.thPreview} />
            <th style={{ width: 44 }}>
              <AccountCheckbox
                id="products-select-all"
                className={styles.adminCheckboxInTable}
                checked={allSelected}
                onChange={toggleAll}
                aria-label={s.selectAllProducts}
              />
            </th>
            <th>{s.thName}</th>
            <th>{s.thCategory}</th>
            <th>{s.thPrice}</th>
            <th>{s.thVis}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={!r.isActive ? styles.rowInactive : undefined}>
              <td>
                {r.thumbUrl ? (
                  <img
                    className={styles.productListThumb}
                    src={r.thumbUrl}
                    alt=""
                    width={46}
                    height={46}
                  />
                ) : (
                  <div className={styles.productListThumbPh} aria-hidden />
                )}
              </td>
              <td>
                <AccountCheckbox
                  id={`product-select-${r.id}`}
                  className={styles.adminCheckboxInTable}
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                  aria-label={s.selectOne(r.name)}
                />
              </td>
              <td>
                <Link href={`/admin/catalog/products/${r.id}`}>{r.name}</Link>
              </td>
              <td>
                {r.categoryPath || r.category.name}
                {(r.additionalCategoryCount ?? 0) > 0 ? (
                  <span className={styles.muted}> +{r.additionalCategoryCount}</span>
                ) : null}
              </td>
              <td>{formatPrice(r.price, r.currency, numberLocale)}</td>
              <td>
                <span className={`${styles.badge} ${r.isActive ? styles.badgeOn : styles.badgeOff}`}>
                  {r.isActive ? s.inCatalog : s.hidden}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminListShell>

      <ProductsListFilterModal
        open={filterModalOpen}
        meta={filterMeta}
        metaLoading={filterMetaLoading}
        applied={appliedFilters}
        onClose={() => setFilterModalOpen(false)}
        onApply={(next) => {
          setAppliedFilters(next);
          setPage(1);
        }}
      />
    </>
  );
}
