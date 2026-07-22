'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductGridWithLikes } from '@/components/ProductGridWithLikes';
import { AdminPillChip, AdminPillChipList } from '@/components/AdminPillChip/AdminPillChip';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { MultiSelectField } from '@/components/MultiSelectField';
import { findCatalogRootForCategoryId } from '@/lib/catalog/findCatalogRoot';
import {
  formatCatalogPriceChip,
  normalizeCatalogPriceRange,
  parseCatalogPriceBound,
} from '@/lib/catalog/catalogPriceFilter';
import {
  catalogFacetFiltersToPatch,
  EMPTY_CATALOG_FACET_FILTERS,
  formatCatalogDimChip,
  hasActiveCatalogFacetFilters,
  normalizeCatalogSizeRange,
  parseCatalogFacetFiltersFromSearchParams,
  parseCatalogSizeBound,
  type CatalogFacetFilters,
  type CatalogFilterOptions,
} from '@/lib/catalog/catalogProductFilters';
import {
  CATALOG_SORT_OPTIONS,
  catalogSortLabel,
  parseCatalogSort,
  type CatalogSortId,
} from '@/lib/catalog/catalogSort';
import { formatCatalogProductCount } from '@/lib/catalog/formatCatalogProductCount';
import { catalogTagsQuery, parseCatalogTagSlugs } from '@/lib/catalog/parseCatalogTagSlugs';
import type { PublicCatalogTag } from '@/lib/catalogPublic';
import type { HomeCatalogRoot } from '@/lib/homeCatalog';
import type { ProductGridItem } from '@/lib/productGridItem';
import styles from '@/app/(site)/(public)/categories/CategoryPage.module.css';

export type CollectionProductRow = ProductGridItem & {
  categoryId: string | null;
  brandId?: string | null;
  brandName?: string | null;
  tagSlugs?: string[];
  materials?: { id: string; name: string }[];
  widthMm?: number | null;
  heightMm?: number | null;
  hasCase?: boolean;
  has3d?: boolean;
  hasDrawing?: boolean;
};

type PriceRange = { priceFrom?: number; priceTo?: number };

type Props = {
  catalogRoots: HomeCatalogRoot[];
  products: CollectionProductRow[];
  zones: PublicCatalogTag[];
  initialTagSlug?: string;
  initialFacets?: CatalogFacetFilters;
  initialSort?: CatalogSortId;
  initialPriceFrom?: number;
  initialPriceTo?: number;
};

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '');
}

function formatPriceInputDigits(digits: string): string {
  if (!digits) return '';
  const normalized = digits.replace(/^0+(?=\d)/, '');
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function priceBoundToInputValue(value: number | undefined): string {
  if (value == null) return '';
  return formatPriceInputDigits(String(Math.floor(value)));
}

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

function patchSearchParams(patch: Record<string, string | null>) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(patch)) {
    if (value == null || value === '') url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  window.history.pushState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

function writeTagSlugsToHistory(slugs: string[]) {
  patchSearchParams({ tag: catalogTagsQuery(slugs) ?? null });
}

function writePriceToHistory(range: PriceRange) {
  patchSearchParams({
    priceFrom: range.priceFrom != null ? String(range.priceFrom) : null,
    priceTo: range.priceTo != null ? String(range.priceTo) : null,
  });
}

function writeFacetsToHistory(facets: CatalogFacetFilters) {
  patchSearchParams(catalogFacetFiltersToPatch(facets));
}

function writeSortToHistory(sort: CatalogSortId) {
  patchSearchParams({ sort: sort === 'popular' ? null : sort });
}

function readTagSlugsFromLocation(): string[] {
  if (typeof window === 'undefined') return [];
  return parseCatalogTagSlugs(new URL(window.location.href).searchParams.get('tag'));
}

function readPriceFromLocation(): PriceRange {
  if (typeof window === 'undefined') return {};
  const url = new URL(window.location.href);
  return normalizeCatalogPriceRange(
    parseCatalogPriceBound(url.searchParams.get('priceFrom')),
    parseCatalogPriceBound(url.searchParams.get('priceTo')),
  );
}

function readFacetsFromLocation(): CatalogFacetFilters {
  if (typeof window === 'undefined') return { ...EMPTY_CATALOG_FACET_FILTERS };
  return parseCatalogFacetFiltersFromSearchParams(new URL(window.location.href).searchParams);
}

function readSortFromLocation(): CatalogSortId {
  if (typeof window === 'undefined') return 'popular';
  return parseCatalogSort(new URL(window.location.href).searchParams.get('sort'));
}

function deriveFilterOptions(products: CollectionProductRow[]): CatalogFilterOptions {
  const brands = new Map<string, string>();
  const materials = new Map<string, string>();
  for (const p of products) {
    const brandId = p.brandId?.trim();
    const brandName = p.brandName?.trim();
    if (brandId && brandName) brands.set(brandId, brandName);
    for (const m of p.materials ?? []) {
      const id = m.id?.trim();
      const name = m.name?.trim();
      if (id && name) materials.set(id, name);
    }
  }
  return {
    brands: Array.from(brands.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    materials: Array.from(materials.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
  };
}

function productMatchesFacets(p: CollectionProductRow, facets: CatalogFacetFilters): boolean {
  if (facets.brandIds.length > 0) {
    const id = p.brandId?.trim();
    if (!id || !facets.brandIds.includes(id)) return false;
  }
  if (facets.materialIds.length > 0) {
    const ids = new Set((p.materials ?? []).map((m) => m.id));
    if (!facets.materialIds.some((id) => ids.has(id))) return false;
  }
  if (facets.widthFrom != null) {
    if (p.widthMm == null || p.widthMm < facets.widthFrom) return false;
  }
  if (facets.widthTo != null) {
    if (p.widthMm == null || p.widthMm > facets.widthTo) return false;
  }
  if (facets.heightFrom != null) {
    if (p.heightMm == null || p.heightMm < facets.heightFrom) return false;
  }
  if (facets.heightTo != null) {
    if (p.heightMm == null || p.heightMm > facets.heightTo) return false;
  }
  if (facets.hasCase && !p.hasCase) return false;
  if (facets.has3d && !p.has3d) return false;
  if (facets.hasDrawing && !p.hasDrawing) return false;
  return true;
}

function sortProducts(items: CollectionProductRow[], sortId: CatalogSortId): CollectionProductRow[] {
  const next = [...items];
  if (sortId === 'price_asc') {
    next.sort((a, b) => a.price - b.price);
  } else if (sortId === 'price_desc') {
    next.sort((a, b) => b.price - a.price);
  } else if (sortId === 'popular') {
    next.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
  }
  return next;
}

export function CollectionProductsGrid({
  catalogRoots,
  products,
  zones,
  initialTagSlug,
  initialFacets,
  initialSort = 'popular',
  initialPriceFrom,
  initialPriceTo,
}: Props) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category')?.trim() || null;

  const [sortId, setSortId] = useState<CatalogSortId>(() => initialSort);
  const [sortOpen, setSortOpen] = useState(false);
  const [zonesOpen, setZonesOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [selectedZoneSlugs, setSelectedZoneSlugs] = useState<string[]>(() =>
    parseCatalogTagSlugs(initialTagSlug),
  );
  const [priceRange, setPriceRange] = useState<PriceRange>(() =>
    normalizeCatalogPriceRange(initialPriceFrom, initialPriceTo),
  );
  const [draftFrom, setDraftFrom] = useState(() => priceBoundToInputValue(initialPriceFrom));
  const [draftTo, setDraftTo] = useState(() => priceBoundToInputValue(initialPriceTo));
  const [facets, setFacets] = useState<CatalogFacetFilters>(
    () => initialFacets ?? { ...EMPTY_CATALOG_FACET_FILTERS },
  );
  const [draftWidthFrom, setDraftWidthFrom] = useState(() =>
    priceBoundToInputValue(initialFacets?.widthFrom),
  );
  const [draftWidthTo, setDraftWidthTo] = useState(() =>
    priceBoundToInputValue(initialFacets?.widthTo),
  );
  const [draftHeightFrom, setDraftHeightFrom] = useState(() =>
    priceBoundToInputValue(initialFacets?.heightFrom),
  );
  const [draftHeightTo, setDraftHeightTo] = useState(() =>
    priceBoundToInputValue(initialFacets?.heightTo),
  );

  const stickyHeadRef = useRef<HTMLDivElement>(null);
  const sortWrapRef = useRef<HTMLDivElement>(null);
  const zonesWrapRef = useRef<HTMLDivElement>(null);
  const priceWrapRef = useRef<HTMLDivElement>(null);
  const sortMenuId = useId();
  const zonesMenuId = useId();
  const pricePanelId = useId();
  const filtersPanelId = useId();

  const sortLabel = catalogSortLabel(sortId);

  const filterOptions = useMemo(() => deriveFilterOptions(products), [products]);

  const selectedZones = useMemo(
    () => zones.filter((z) => selectedZoneSlugs.includes(z.slug)),
    [zones, selectedZoneSlugs],
  );

  const materialNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const row of filterOptions.materials) m.set(row.id, row.name);
    return m;
  }, [filterOptions.materials]);

  const brandNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const row of filterOptions.brands) m.set(row.id, row.name);
    return m;
  }, [filterOptions.brands]);

  const materialIdByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const row of filterOptions.materials) m.set(row.name, row.id);
    return m;
  }, [filterOptions.materials]);

  const brandIdByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const row of filterOptions.brands) m.set(row.name, row.id);
    return m;
  }, [filterOptions.brands]);

  const selectedMaterialNames = useMemo(
    () =>
      facets.materialIds
        .map((id) => materialNameById.get(id))
        .filter((n): n is string => Boolean(n)),
    [facets.materialIds, materialNameById],
  );

  const selectedBrandNames = useMemo(
    () =>
      facets.brandIds.map((id) => brandNameById.get(id)).filter((n): n is string => Boolean(n)),
    [facets.brandIds, brandNameById],
  );

  const categoryFiltered = useMemo(() => {
    if (!categoryParam) return products;
    return products.filter((p) => {
      if (!p.categoryId) return false;
      const root = findCatalogRootForCategoryId(catalogRoots, p.categoryId);
      return root?.id === categoryParam;
    });
  }, [categoryParam, catalogRoots, products]);

  const visibleProducts = useMemo(() => {
    let list = categoryFiltered;

    if (selectedZoneSlugs.length > 0) {
      const zoneSet = new Set(selectedZoneSlugs);
      list = list.filter((p) => (p.tagSlugs ?? []).some((slug) => zoneSet.has(slug)));
    }

    const { priceFrom, priceTo } = priceRange;
    if (priceFrom != null) list = list.filter((p) => p.price >= priceFrom);
    if (priceTo != null) list = list.filter((p) => p.price <= priceTo);

    if (hasActiveCatalogFacetFilters(facets)) {
      list = list.filter((p) => productMatchesFacets(p, facets));
    }

    return sortProducts(list, sortId);
  }, [categoryFiltered, selectedZoneSlugs, priceRange, facets, sortId]);

  const hasFilterChips =
    selectedZones.length > 0 ||
    priceRange.priceFrom != null ||
    priceRange.priceTo != null ||
    hasActiveCatalogFacetFilters(facets);

  const commitZoneSlugs = useCallback((next: string[] | ((prev: string[]) => string[])) => {
    setSelectedZoneSlugs((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      const unique = parseCatalogTagSlugs(resolved.join(','));
      writeTagSlugsToHistory(unique);
      return unique;
    });
  }, []);

  const commitPriceRange = useCallback((range: PriceRange) => {
    const next = normalizeCatalogPriceRange(range.priceFrom, range.priceTo);
    setPriceRange(next);
    setDraftFrom(priceBoundToInputValue(next.priceFrom));
    setDraftTo(priceBoundToInputValue(next.priceTo));
    writePriceToHistory(next);
  }, []);

  const commitFacets = useCallback(
    (next: CatalogFacetFilters | ((prev: CatalogFacetFilters) => CatalogFacetFilters)) => {
      setFacets((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        writeFacetsToHistory(resolved);
        return resolved;
      });
    },
    [],
  );

  const applyPrice = () => {
    commitPriceRange({
      priceFrom: parseCatalogPriceBound(draftFrom),
      priceTo: parseCatalogPriceBound(draftTo),
    });
    setPriceOpen(false);
  };

  const resetPriceDraft = () => {
    commitPriceRange({});
    setPriceOpen(false);
  };

  const openPricePanel = () => {
    setDraftFrom(priceBoundToInputValue(priceRange.priceFrom));
    setDraftTo(priceBoundToInputValue(priceRange.priceTo));
    setPriceOpen((v) => !v);
    setZonesOpen(false);
    setSortOpen(false);
  };

  const toggleFiltersPanel = () => {
    setFiltersOpen((v) => !v);
    setZonesOpen(false);
    setSortOpen(false);
    setPriceOpen(false);
    setMaterialOpen(false);
    setBrandOpen(false);
  };

  const applySize = () => {
    const width = normalizeCatalogSizeRange(
      parseCatalogSizeBound(draftWidthFrom),
      parseCatalogSizeBound(draftWidthTo),
    );
    const height = normalizeCatalogSizeRange(
      parseCatalogSizeBound(draftHeightFrom),
      parseCatalogSizeBound(draftHeightTo),
    );
    setDraftWidthFrom(priceBoundToInputValue(width.from));
    setDraftWidthTo(priceBoundToInputValue(width.to));
    setDraftHeightFrom(priceBoundToInputValue(height.from));
    setDraftHeightTo(priceBoundToInputValue(height.to));
    commitFacets((prev) => ({
      ...prev,
      widthFrom: width.from,
      widthTo: width.to,
      heightFrom: height.from,
      heightTo: height.to,
    }));
  };

  const resetSizeDraft = () => {
    setDraftWidthFrom('');
    setDraftWidthTo('');
    setDraftHeightFrom('');
    setDraftHeightTo('');
    commitFacets((prev) => ({
      ...prev,
      widthFrom: undefined,
      widthTo: undefined,
      heightFrom: undefined,
      heightTo: undefined,
    }));
  };

  const onSelectSort = (id: CatalogSortId) => {
    setSortId(id);
    writeSortToHistory(id);
    setSortOpen(false);
  };

  const toggleZone = (slug: string) => {
    commitZoneSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const removeZone = (slug: string) => {
    commitZoneSlugs((prev) => prev.filter((s) => s !== slug));
  };

  const resetAllFilters = () => {
    commitZoneSlugs([]);
    commitPriceRange({});
    setDraftWidthFrom('');
    setDraftWidthTo('');
    setDraftHeightFrom('');
    setDraftHeightTo('');
    commitFacets({ ...EMPTY_CATALOG_FACET_FILTERS });
    setSortId('popular');
    writeSortToHistory('popular');
  };

  useEffect(() => {
    const onPop = () => {
      setSelectedZoneSlugs(readTagSlugsFromLocation());
      const next = readPriceFromLocation();
      setPriceRange(next);
      setDraftFrom(priceBoundToInputValue(next.priceFrom));
      setDraftTo(priceBoundToInputValue(next.priceTo));
      const nextFacets = readFacetsFromLocation();
      setFacets(nextFacets);
      setDraftWidthFrom(priceBoundToInputValue(nextFacets.widthFrom));
      setDraftWidthTo(priceBoundToInputValue(nextFacets.widthTo));
      setDraftHeightFrom(priceBoundToInputValue(nextFacets.heightFrom));
      setDraftHeightTo(priceBoundToInputValue(nextFacets.heightTo));
      setSortId(readSortFromLocation());
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const headerEl = document.querySelector('header');
    const headEl = stickyHeadRef.current;

    const apply = () => {
      const headerH = headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 94;
      const headH = headEl ? Math.ceil(headEl.getBoundingClientRect().height) : 48;
      root.style.setProperty('--site-header-offset', `${Math.max(headerH, 0)}px`);
      root.style.setProperty('--market-sticky-head-height', `${Math.max(headH, 0)}px`);
    };

    apply();
    const ro = new ResizeObserver(apply);
    if (headerEl) ro.observe(headerEl);
    if (headEl) ro.observe(headEl);
    window.addEventListener('resize', apply);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
      root.style.removeProperty('--site-header-offset');
      root.style.removeProperty('--market-sticky-head-height');
      root.style.removeProperty('--market-sticky-offset');
    };
  }, [hasFilterChips, filtersOpen]);

  useEffect(() => {
    if (!sortOpen && !zonesOpen && !priceOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (sortOpen && !sortWrapRef.current?.contains(t)) setSortOpen(false);
      if (zonesOpen && !zonesWrapRef.current?.contains(t)) setZonesOpen(false);
      if (priceOpen && !priceWrapRef.current?.contains(t)) setPriceOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSortOpen(false);
        setZonesOpen(false);
        setPriceOpen(false);
        setMaterialOpen(false);
        setBrandOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [sortOpen, zonesOpen, priceOpen]);

  return (
    <>
      <div className={styles.marketStickyHead} ref={stickyHeadRef}>
        <div className={styles.marketToolbar}>
          <div className={styles.marketSectionRowResult}>
            <div className={styles.marketZonesGroup} ref={zonesWrapRef}>
              <button
                type="button"
                className={styles.marketToolbarBtn}
                aria-haspopup="listbox"
                aria-expanded={zonesOpen}
                aria-controls={zonesMenuId}
                onClick={() => {
                  setZonesOpen((v) => !v);
                  setSortOpen(false);
                  setPriceOpen(false);
                }}
              >
                Зоны
                <span
                  className={
                    zonesOpen
                      ? `${styles.marketToolbarChevron} ${styles.marketToolbarChevronOpen}`
                      : styles.marketToolbarChevron
                  }
                  aria-hidden
                />
              </button>
              {zonesOpen && zones.length > 0 ? (
                <ul
                  className={styles.marketZonesMenu}
                  id={zonesMenuId}
                  role="listbox"
                  aria-multiselectable
                  aria-label="Зоны"
                >
                  {zones.map((zone) => {
                    const selected = selectedZoneSlugs.includes(zone.slug);
                    return (
                      <li key={zone.slug} role="presentation">
                        <label className={styles.marketZonesMenuItem}>
                          <AccountCheckbox
                            className={styles.marketZonesMenuCheckbox}
                            checked={selected}
                            onChange={() => toggleZone(zone.slug)}
                            aria-label={zone.name}
                          />
                          <span>{zone.name}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>

            <div className={styles.marketPriceGroup} ref={priceWrapRef}>
              <button
                type="button"
                className={styles.marketToolbarBtn}
                aria-haspopup="dialog"
                aria-expanded={priceOpen}
                aria-controls={pricePanelId}
                onClick={openPricePanel}
              >
                Цена
                <span
                  className={
                    priceOpen
                      ? `${styles.marketToolbarChevron} ${styles.marketToolbarChevronOpen}`
                      : styles.marketToolbarChevron
                  }
                  aria-hidden
                />
              </button>
              {priceOpen ? (
                <div
                  className={styles.marketPricePanel}
                  id={pricePanelId}
                  role="dialog"
                  aria-label="Фильтр по цене"
                >
                  <div className={styles.marketPriceFields}>
                    <label className={styles.marketPriceField}>
                      <span className={styles.marketPriceFieldLabel}>От</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={styles.marketPriceInput}
                        placeholder="0"
                        value={draftFrom}
                        onChange={(e) =>
                          setDraftFrom(formatPriceInputDigits(digitsOnly(e.target.value)))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') applyPrice();
                        }}
                      />
                      <span className={styles.marketPriceCurrency} aria-hidden>
                        ₽
                      </span>
                    </label>
                    <label className={styles.marketPriceField}>
                      <span className={styles.marketPriceFieldLabel}>До</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={styles.marketPriceInput}
                        placeholder="∞"
                        value={draftTo}
                        onChange={(e) =>
                          setDraftTo(formatPriceInputDigits(digitsOnly(e.target.value)))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') applyPrice();
                        }}
                      />
                      <span className={styles.marketPriceCurrency} aria-hidden>
                        ₽
                      </span>
                    </label>
                  </div>
                  <div className={styles.marketPriceActions}>
                    <button type="button" className={styles.marketPriceApply} onClick={applyPrice}>
                      Применить
                    </button>
                    <button
                      type="button"
                      className={styles.marketPriceReset}
                      onClick={resetPriceDraft}
                    >
                      Сбросить
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className={styles.marketToolbarFiltersBtn}
              aria-expanded={filtersOpen}
              aria-controls={filtersPanelId}
              onClick={toggleFiltersPanel}
            >
              <span>Фильтры</span>
              <span className={styles.marketToolbarFiltersTrailing}>
                {filtersOpen ? (
                  <span className={styles.marketToolbarFiltersHint}>скрыть</span>
                ) : (
                  <span className={styles.marketToolbarPlus} aria-hidden>
                    +
                  </span>
                )}
              </span>
            </button>
          </div>

          <div className={styles.marketToolbarEnd}>
            <p className={styles.marketProductCount} aria-live="polite">
              {formatCatalogProductCount(visibleProducts.length)}
            </p>
            <div className={styles.marketSortGroup} ref={sortWrapRef}>
              <button
                type="button"
                className={styles.marketToolbarBtn}
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
                aria-controls={sortMenuId}
                onClick={() => {
                  setSortOpen((v) => !v);
                  setZonesOpen(false);
                  setPriceOpen(false);
                }}
              >
                {sortLabel}
                <span
                  className={
                    sortOpen
                      ? `${styles.marketToolbarChevron} ${styles.marketToolbarChevronOpen}`
                      : styles.marketToolbarChevron
                  }
                  aria-hidden
                />
              </button>
              {sortOpen ? (
                <ul
                  className={styles.marketSortMenu}
                  id={sortMenuId}
                  role="listbox"
                  aria-label="Сортировка"
                >
                  {CATALOG_SORT_OPTIONS.map((opt) => (
                    <li key={opt.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={opt.id === sortId}
                        className={
                          opt.id === sortId
                            ? `${styles.marketSortMenuItem} ${styles.marketSortMenuItemActive}`
                            : styles.marketSortMenuItem
                        }
                        onClick={() => onSelectSort(opt.id)}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>

        {hasFilterChips ? (
          <div className={styles.marketChipsRow}>
            <AdminPillChipList className={styles.marketZoneChips} aria-label="Активные фильтры">
              {selectedZones.map((zone) => (
                <AdminPillChip
                  key={zone.slug}
                  onRemove={() => removeZone(zone.slug)}
                  removeAriaLabel={`Убрать зону ${zone.name}`}
                >
                  {zone.name}
                </AdminPillChip>
              ))}
              {priceRange.priceFrom != null ? (
                <AdminPillChip
                  onRemove={() =>
                    commitPriceRange({ priceFrom: undefined, priceTo: priceRange.priceTo })
                  }
                  removeAriaLabel="Убрать нижнюю границу цены"
                >
                  {formatCatalogPriceChip('from', priceRange.priceFrom)}
                </AdminPillChip>
              ) : null}
              {priceRange.priceTo != null ? (
                <AdminPillChip
                  onRemove={() =>
                    commitPriceRange({ priceFrom: priceRange.priceFrom, priceTo: undefined })
                  }
                  removeAriaLabel="Убрать верхнюю границу цены"
                >
                  {formatCatalogPriceChip('to', priceRange.priceTo)}
                </AdminPillChip>
              ) : null}
              {facets.widthFrom != null ? (
                <AdminPillChip
                  onRemove={() => {
                    setDraftWidthFrom('');
                    commitFacets((prev) => ({ ...prev, widthFrom: undefined }));
                  }}
                  removeAriaLabel="Убрать нижнюю границу ширины"
                >
                  {formatCatalogDimChip('width', 'from', facets.widthFrom)}
                </AdminPillChip>
              ) : null}
              {facets.widthTo != null ? (
                <AdminPillChip
                  onRemove={() => {
                    setDraftWidthTo('');
                    commitFacets((prev) => ({ ...prev, widthTo: undefined }));
                  }}
                  removeAriaLabel="Убрать верхнюю границу ширины"
                >
                  {formatCatalogDimChip('width', 'to', facets.widthTo)}
                </AdminPillChip>
              ) : null}
              {facets.heightFrom != null ? (
                <AdminPillChip
                  onRemove={() => {
                    setDraftHeightFrom('');
                    commitFacets((prev) => ({ ...prev, heightFrom: undefined }));
                  }}
                  removeAriaLabel="Убрать нижнюю границу высоты"
                >
                  {formatCatalogDimChip('height', 'from', facets.heightFrom)}
                </AdminPillChip>
              ) : null}
              {facets.heightTo != null ? (
                <AdminPillChip
                  onRemove={() => {
                    setDraftHeightTo('');
                    commitFacets((prev) => ({ ...prev, heightTo: undefined }));
                  }}
                  removeAriaLabel="Убрать верхнюю границу высоты"
                >
                  {formatCatalogDimChip('height', 'to', facets.heightTo)}
                </AdminPillChip>
              ) : null}
              {facets.materialIds.map((id) => {
                const name = materialNameById.get(id);
                return (
                  <AdminPillChip
                    key={`mat:${id}`}
                    onRemove={() =>
                      commitFacets((prev) => ({
                        ...prev,
                        materialIds: prev.materialIds.filter((x) => x !== id),
                      }))
                    }
                    removeAriaLabel={`Убрать материал ${name ?? 'материал'}`}
                  >
                    {name ?? '…'}
                  </AdminPillChip>
                );
              })}
              {facets.brandIds.map((id) => {
                const name = brandNameById.get(id);
                return (
                  <AdminPillChip
                    key={`brand:${id}`}
                    onRemove={() =>
                      commitFacets((prev) => ({
                        ...prev,
                        brandIds: prev.brandIds.filter((x) => x !== id),
                      }))
                    }
                    removeAriaLabel={`Убрать бренд ${name ?? 'бренд'}`}
                  >
                    {name ?? '…'}
                  </AdminPillChip>
                );
              })}
              {facets.hasCase ? (
                <AdminPillChip
                  onRemove={() => commitFacets((prev) => ({ ...prev, hasCase: false }))}
                  removeAriaLabel="Убрать фильтр кейсов"
                >
                  Есть кейс
                </AdminPillChip>
              ) : null}
              {facets.has3d ? (
                <AdminPillChip
                  onRemove={() => commitFacets((prev) => ({ ...prev, has3d: false }))}
                  removeAriaLabel="Убрать фильтр 3D"
                >
                  Есть 3D
                </AdminPillChip>
              ) : null}
              {facets.hasDrawing ? (
                <AdminPillChip
                  onRemove={() => commitFacets((prev) => ({ ...prev, hasDrawing: false }))}
                  removeAriaLabel="Убрать фильтр чертежа"
                >
                  Есть чертёж
                </AdminPillChip>
              ) : null}
            </AdminPillChipList>
            <button type="button" className={styles.marketChipsReset} onClick={resetAllFilters}>
              Сбросить
            </button>
          </div>
        ) : null}
      </div>

      <div
        className={
          filtersOpen ? `${styles.marketBrowse} ${styles.marketBrowseWithFilters}` : styles.marketBrowse
        }
      >
        {filtersOpen ? (
          <aside className={styles.marketFiltersPanel} id={filtersPanelId} aria-label="Фильтры">
            <section className={styles.marketFiltersSection} aria-label="Размер">
              <h3 className={styles.marketFiltersSectionTitle}>Размер</h3>
              <div className={styles.marketFiltersSizeFields}>
                <div className={styles.marketFiltersDimBlock}>
                  <span className={styles.marketFiltersDimLabel}>Ширина</span>
                  <label className={styles.marketPriceField}>
                    <span className={styles.marketPriceFieldLabel}>От</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={styles.marketPriceInput}
                      placeholder="0"
                      value={draftWidthFrom}
                      onChange={(e) =>
                        setDraftWidthFrom(formatPriceInputDigits(digitsOnly(e.target.value)))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') applySize();
                      }}
                    />
                    <span className={styles.marketPriceCurrency} aria-hidden>
                      мм
                    </span>
                  </label>
                  <label className={styles.marketPriceField}>
                    <span className={styles.marketPriceFieldLabel}>До</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={styles.marketPriceInput}
                      placeholder="∞"
                      value={draftWidthTo}
                      onChange={(e) =>
                        setDraftWidthTo(formatPriceInputDigits(digitsOnly(e.target.value)))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') applySize();
                      }}
                    />
                    <span className={styles.marketPriceCurrency} aria-hidden>
                      мм
                    </span>
                  </label>
                </div>
                <div className={styles.marketFiltersDimBlock}>
                  <span className={styles.marketFiltersDimLabel}>Высота</span>
                  <label className={styles.marketPriceField}>
                    <span className={styles.marketPriceFieldLabel}>От</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={styles.marketPriceInput}
                      placeholder="0"
                      value={draftHeightFrom}
                      onChange={(e) =>
                        setDraftHeightFrom(formatPriceInputDigits(digitsOnly(e.target.value)))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') applySize();
                      }}
                    />
                    <span className={styles.marketPriceCurrency} aria-hidden>
                      мм
                    </span>
                  </label>
                  <label className={styles.marketPriceField}>
                    <span className={styles.marketPriceFieldLabel}>До</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={styles.marketPriceInput}
                      placeholder="∞"
                      value={draftHeightTo}
                      onChange={(e) =>
                        setDraftHeightTo(formatPriceInputDigits(digitsOnly(e.target.value)))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') applySize();
                      }}
                    />
                    <span className={styles.marketPriceCurrency} aria-hidden>
                      мм
                    </span>
                  </label>
                </div>
              </div>
              <div className={styles.marketFiltersSizeActions}>
                <button type="button" className={styles.marketPriceApply} onClick={applySize}>
                  Применить
                </button>
                <button type="button" className={styles.marketPriceReset} onClick={resetSizeDraft}>
                  Сбросить
                </button>
              </div>
            </section>

            {filterOptions.materials.length > 0 ? (
              <div className={styles.marketFiltersSection}>
                <MultiSelectField
                  label="Материал"
                  placeholder="Выберите материал"
                  options={filterOptions.materials.map((m) => m.name)}
                  selected={selectedMaterialNames}
                  open={materialOpen}
                  onToggleOpen={() => {
                    setMaterialOpen((v) => !v);
                    setBrandOpen(false);
                  }}
                  onToggleOption={(name) => {
                    const id = materialIdByName.get(name);
                    if (!id) return;
                    commitFacets((prev) => ({
                      ...prev,
                      materialIds: toggleInList(prev.materialIds, id),
                    }));
                  }}
                  onRemoveOption={(name) => {
                    const id = materialIdByName.get(name);
                    if (!id) return;
                    commitFacets((prev) => ({
                      ...prev,
                      materialIds: prev.materialIds.filter((x) => x !== id),
                    }));
                  }}
                />
              </div>
            ) : null}

            {filterOptions.brands.length > 0 ? (
              <div className={styles.marketFiltersSection}>
                <MultiSelectField
                  label="Бренд"
                  placeholder="Выберите бренд"
                  options={filterOptions.brands.map((b) => b.name)}
                  selected={selectedBrandNames}
                  open={brandOpen}
                  onToggleOpen={() => {
                    setBrandOpen((v) => !v);
                    setMaterialOpen(false);
                  }}
                  onToggleOption={(name) => {
                    const id = brandIdByName.get(name);
                    if (!id) return;
                    commitFacets((prev) => ({
                      ...prev,
                      brandIds: toggleInList(prev.brandIds, id),
                    }));
                  }}
                  onRemoveOption={(name) => {
                    const id = brandIdByName.get(name);
                    if (!id) return;
                    commitFacets((prev) => ({
                      ...prev,
                      brandIds: prev.brandIds.filter((x) => x !== id),
                    }));
                  }}
                />
              </div>
            ) : null}

            <section className={styles.marketFiltersSection} aria-label="Кейс">
              <h3 className={styles.marketFiltersSectionTitle}>Кейс</h3>
              <label className={styles.marketFiltersItem}>
                <AccountCheckbox
                  className={styles.marketZonesMenuCheckbox}
                  checked={facets.hasCase}
                  onChange={() => commitFacets((prev) => ({ ...prev, hasCase: !prev.hasCase }))}
                  aria-label="Есть кейс"
                />
                <span>Есть кейс</span>
              </label>
            </section>

            <section className={styles.marketFiltersSection} aria-label="3D и чертёж">
              <h3 className={styles.marketFiltersSectionTitle}>Есть 3D / чертёж</h3>
              <ul className={styles.marketFiltersList}>
                <li>
                  <label className={styles.marketFiltersItem}>
                    <AccountCheckbox
                      className={styles.marketZonesMenuCheckbox}
                      checked={facets.has3d}
                      onChange={() => commitFacets((prev) => ({ ...prev, has3d: !prev.has3d }))}
                      aria-label="Есть 3D"
                    />
                    <span>Есть 3D</span>
                  </label>
                </li>
                <li>
                  <label className={styles.marketFiltersItem}>
                    <AccountCheckbox
                      className={styles.marketZonesMenuCheckbox}
                      checked={facets.hasDrawing}
                      onChange={() =>
                        commitFacets((prev) => ({ ...prev, hasDrawing: !prev.hasDrawing }))
                      }
                      aria-label="Есть чертёж"
                    />
                    <span>Есть чертёж</span>
                  </label>
                </li>
              </ul>
            </section>
          </aside>
        ) : null}

        <div className={styles.marketProductsSlot}>
          {visibleProducts.length === 0 ? (
            <div className={styles.marketEmpty} role="status">
              <p className={styles.marketEmptyText}>Ничего не найдено</p>
              {hasFilterChips ? (
                <button type="button" className={styles.marketEmptyReset} onClick={resetAllFilters}>
                  Сбросить фильтры
                </button>
              ) : null}
            </div>
          ) : (
            <ProductGridWithLikes
              items={visibleProducts}
              gridClassName={
                filtersOpen
                  ? `${styles.marketGrid} ${styles.marketGridCols3}`
                  : styles.marketGrid
              }
            />
          )}
        </div>
      </div>
    </>
  );
}
