'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  findCatalogNodeById,
  findCatalogPathToSlugUnder,
} from '@/lib/catalog/findCatalogRoot';
import type { HomeCatalogChild, HomeCatalogRoot } from '@/lib/homeCatalog';

/** Таб «Все» — товары страницы категории (scope slug), без фильтра по подкатегории. */
export const CATALOG_ALL_TAB_ID = 'all';

type CatalogBrowseContextValue = {
  pageCategoryId: string;
  pageSlug: string;
  /** `all` или id прямой подкатегории (верхний ряд табов). */
  activeSubcategoryId: string;
  /** Id категории для search — может быть внуком при `?sub=`. */
  productCategoryId: string;
  setActiveSubcategoryId: (id: string) => void;
  /** Второй ряд табов: «Все» внутри подкатегории или id внука. */
  setNestedSubcategoryId: (id: string) => void;
  subcategories: HomeCatalogChild[];
  /** Дети активной подкатегории для второго ряда табов. */
  nestedSubcategories: HomeCatalogChild[];
};

const CatalogBrowseContext = createContext<CatalogBrowseContextValue | null>(null);

export function useCatalogBrowse(): CatalogBrowseContextValue {
  const ctx = useContext(CatalogBrowseContext);
  if (!ctx) {
    throw new Error('useCatalogBrowse must be used within CatalogBrowseProvider');
  }
  return ctx;
}

function readSubSlugFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  const v = new URL(window.location.href).searchParams.get('sub')?.trim();
  return v || null;
}

function writeSubSlugToHistory(subSlug: string | null, replace: boolean) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (subSlug) url.searchParams.set('sub', subSlug);
  else url.searchParams.delete('sub');
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (replace) window.history.replaceState(window.history.state, '', next);
  else window.history.pushState(window.history.state, '', next);
}

type BrowseScope = {
  topTabId: string;
  productCategoryId: string;
};

function resolveBrowseScope(
  pageCategoryId: string,
  subcategories: HomeCatalogChild[],
  subSlug: string | null | undefined,
): BrowseScope {
  if (!subSlug?.trim() || !subcategories.length) {
    return { topTabId: CATALOG_ALL_TAB_ID, productCategoryId: pageCategoryId };
  }

  const path = findCatalogPathToSlugUnder({ children: subcategories }, subSlug);
  if (!path.length) {
    return { topTabId: CATALOG_ALL_TAB_ID, productCategoryId: pageCategoryId };
  }

  return {
    topTabId: path[0]!.id,
    productCategoryId: path[path.length - 1]!.id,
  };
}

type ProviderProps = {
  children: ReactNode;
  initialRoots: HomeCatalogRoot[];
  pageCategoryId: string;
  pageSlug: string;
  /** Начальный `?sub=` (slug подкатегории или внука) с сервера. */
  initialSubSlug?: string;
};

export function CatalogBrowseProvider({
  children,
  initialRoots,
  pageCategoryId,
  pageSlug,
  initialSubSlug,
}: ProviderProps) {
  const subcategories = useMemo(() => {
    const node = findCatalogNodeById(initialRoots, pageCategoryId);
    return node?.children ?? [];
  }, [initialRoots, pageCategoryId]);

  const [subSlug, setSubSlug] = useState<string | null>(() => initialSubSlug?.trim() || null);

  useEffect(() => {
    setSubSlug(initialSubSlug?.trim() || null);
  }, [pageCategoryId, initialSubSlug]);

  useEffect(() => {
    const onPop = () => {
      setSubSlug(readSubSlugFromLocation());
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const { topTabId, productCategoryId } = useMemo(
    () => resolveBrowseScope(pageCategoryId, subcategories, subSlug),
    [pageCategoryId, subcategories, subSlug],
  );

  /** Невалидный `?sub=` — сбрасываем в «Все» и чистим URL. */
  useEffect(() => {
    if (!subSlug?.trim()) return;
    const scope = resolveBrowseScope(pageCategoryId, subcategories, subSlug);
    const invalid =
      scope.topTabId === CATALOG_ALL_TAB_ID && scope.productCategoryId === pageCategoryId;
    if (!invalid) return;
    setSubSlug(null);
    writeSubSlugToHistory(null, true);
  }, [subSlug, pageCategoryId, subcategories]);

  const activeDirectSub = useMemo(
    () =>
      topTabId === CATALOG_ALL_TAB_ID
        ? undefined
        : subcategories.find((s) => s.id === topTabId),
    [subcategories, topTabId],
  );

  const nestedSubcategories = activeDirectSub?.children ?? [];

  const commitSubSlug = useCallback((slug: string | null) => {
    setSubSlug(slug);
    writeSubSlugToHistory(slug, false);
  }, []);

  const setActiveSubcategoryId = useCallback(
    (id: string) => {
      if (id === CATALOG_ALL_TAB_ID) {
        commitSubSlug(null);
        return;
      }
      const sub = subcategories.find((s) => s.id === id);
      commitSubSlug(sub?.slug ?? null);
    },
    [subcategories, commitSubSlug],
  );

  const setNestedSubcategoryId = useCallback(
    (id: string) => {
      if (!activeDirectSub) return;
      if (id === activeDirectSub.id) {
        commitSubSlug(activeDirectSub.slug);
        return;
      }
      const nested = nestedSubcategories.find((s) => s.id === id);
      if (nested) commitSubSlug(nested.slug);
    },
    [activeDirectSub, nestedSubcategories, commitSubSlug],
  );

  const value = useMemo(
    () => ({
      pageCategoryId,
      pageSlug,
      activeSubcategoryId: topTabId,
      productCategoryId,
      setActiveSubcategoryId,
      setNestedSubcategoryId,
      subcategories,
      nestedSubcategories,
    }),
    [
      pageCategoryId,
      pageSlug,
      topTabId,
      productCategoryId,
      setActiveSubcategoryId,
      setNestedSubcategoryId,
      subcategories,
      nestedSubcategories,
    ],
  );

  return (
    <CatalogBrowseContext.Provider value={value}>{children}</CatalogBrowseContext.Provider>
  );
}
