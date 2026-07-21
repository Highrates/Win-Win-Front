'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useId } from 'react';
import {
  CATALOG_ALL_TAB_ID,
  useCatalogBrowse,
} from '@/app/(site)/(public)/catalog/CatalogBrowseContext';
import { UnderlineTabs } from '@/components/UnderlineTabs';
import { homeRootsFromPublicTreeClient, type HomeCatalogRoot } from '@/lib/homeCatalog';
import categoryStyles from '@/app/(site)/(public)/categories/CategoryPage.module.css';

type Props = {
  initialRoots: HomeCatalogRoot[];
};

/**
 * Табы подкатегорий на `/catalog/[slug]`:
 * верхний ряд — прямые дети; второй ряд — внуки (только `?sub=`, без смены slug).
 */
export function CatalogSectionsTabs({ initialRoots }: Props) {
  const {
    activeSubcategoryId,
    productCategoryId,
    setActiveSubcategoryId,
    setNestedSubcategoryId,
    subcategories,
    nestedSubcategories,
  } = useCatalogBrowse();
  const [, setRoots] = useState<HomeCatalogRoot[]>(initialRoots);

  const pullTree = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog/tree');
      if (!res.ok) return;
      const data = await res.json();
      if (data?.roots && Array.isArray(data.roots)) {
        setRoots(homeRootsFromPublicTreeClient(data));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const reactUiId = useId().replace(/:/g, '');
  const tabIdsPrefix = `catalog-page-${reactUiId}`;
  const nestedTabIdsPrefix = `${tabIdsPrefix}-nested`;

  useEffect(() => {
    setRoots(initialRoots);
  }, [initialRoots]);

  const lastTreePullRef = useRef(0);
  const TREE_PULL_MIN_INTERVAL_MS = 10 * 60 * 1000;

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastTreePullRef.current < TREE_PULL_MIN_INTERVAL_MS) return;
      lastTreePullRef.current = now;
      void pullTree();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [pullTree]);

  const isAllTab = activeSubcategoryId === CATALOG_ALL_TAB_ID;

  const activeDirectSub = useMemo(
    () =>
      isAllTab
        ? undefined
        : subcategories.find((s) => s.id === activeSubcategoryId) ?? subcategories[0],
    [subcategories, activeSubcategoryId, isAllTab],
  );

  const underlineTabs = useMemo(
    () => [
      {
        id: CATALOG_ALL_TAB_ID,
        label: 'Все',
        buttonProps: {
          id: `${tabIdsPrefix}-tab-${CATALOG_ALL_TAB_ID}`,
        },
      },
      ...subcategories.map((tab) => ({
        id: tab.id,
        label: tab.name,
        buttonProps: {
          id: `${tabIdsPrefix}-tab-${tab.id}`,
        },
      })),
    ],
    [subcategories, tabIdsPrefix],
  );

  const nestedTabs = useMemo(() => {
    if (!activeDirectSub || nestedSubcategories.length === 0) return [];
    return [
      {
        id: activeDirectSub.id,
        label: 'Все',
        buttonProps: {
          id: `${nestedTabIdsPrefix}-tab-all`,
        },
      },
      ...nestedSubcategories.map((tab) => ({
        id: tab.id,
        label: tab.name,
        buttonProps: {
          id: `${nestedTabIdsPrefix}-tab-${tab.id}`,
        },
      })),
    ];
  }, [activeDirectSub, nestedSubcategories, nestedTabIdsPrefix]);

  if (!subcategories.length) {
    return null;
  }

  const activeTabId = isAllTab
    ? CATALOG_ALL_TAB_ID
    : (activeDirectSub?.id ?? activeSubcategoryId);

  const nestedActiveId =
    nestedSubcategories.length > 0 && activeDirectSub
      ? productCategoryId
      : activeDirectSub?.id;

  return (
    <section className={categoryStyles.catalogSectionsSlot}>
      <div className="padding-global">
        <UnderlineTabs
          ariaLabel="Подкатегории"
          tabs={underlineTabs}
          activeId={activeTabId}
          onSelect={setActiveSubcategoryId}
        />
        {nestedTabs.length > 0 ? (
          <div className={categoryStyles.catalogNestedTabsSlot}>
            <UnderlineTabs
              ariaLabel="Подразделы"
              tabs={nestedTabs}
              activeId={nestedActiveId ?? nestedTabs[0]!.id}
              onSelect={setNestedSubcategoryId}
              className={categoryStyles.catalogNestedTabs}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
