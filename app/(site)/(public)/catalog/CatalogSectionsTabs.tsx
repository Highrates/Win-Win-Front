'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useId, type MouseEvent } from 'react';
import {
  CATALOG_ALL_TAB_ID,
  useCatalogBrowse,
} from '@/app/(site)/(public)/catalog/CatalogBrowseContext';
import { UnderlineTabs } from '@/components/UnderlineTabs';
import { homeRootsFromPublicTreeClient, type HomeCatalogRoot } from '@/lib/homeCatalog';
import categoryStyles from '@/app/(site)/(public)/categories/CategoryPage.module.css';
import { ScrollCatalogStripPanel } from '@/sections/home/ScrollCatalog/ScrollCatalogStripPanel';
import type { ScrollCatalogStripItem } from '@/sections/home/ScrollCatalog/scrollCatalogStripItems';

type Props = {
  initialRoots: HomeCatalogRoot[];
};

/**
 * Табы подкатегорий на `/catalog/[slug]`:
 * верхний ряд — прямые дети; полоса карточек — внуки (только `?sub=`, без смены slug).
 */
export function CatalogSectionsTabs({ initialRoots }: Props) {
  const {
    activeSubcategoryId,
    pageSlug,
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

  /** Внуки активной подкатегории — полоса ScrollCatalog (не на табе «Все»). */
  const nestedStripItems = useMemo((): ScrollCatalogStripItem[] => {
    if (isAllTab || !nestedSubcategories.length) return [];
    return nestedSubcategories.map((c) => ({
      key: c.slug,
      href: `/catalog/${encodeURIComponent(pageSlug)}?sub=${encodeURIComponent(c.slug)}`,
      name: c.name,
      imageSrc: c.cardImageUrl,
    }));
  }, [isAllTab, nestedSubcategories, pageSlug]);

  const onNestedStripClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      let sub: string | null = null;
      try {
        sub = new URL(e.currentTarget.href).searchParams.get('sub');
      } catch {
        return;
      }
      const nested = nestedSubcategories.find((c) => c.slug === sub);
      if (nested) setNestedSubcategoryId(nested.id);
    },
    [nestedSubcategories, setNestedSubcategoryId],
  );

  if (!subcategories.length) {
    return null;
  }

  const activeTabId = isAllTab
    ? CATALOG_ALL_TAB_ID
    : (activeDirectSub?.id ?? activeSubcategoryId);

  return (
    <section className={categoryStyles.catalogSectionsSlot}>
      <div className="padding-global">
        <UnderlineTabs
          ariaLabel="Подкатегории"
          tabs={underlineTabs}
          activeId={activeTabId}
          onSelect={setActiveSubcategoryId}
        />
        {nestedStripItems.length > 0 ? (
          <div className={categoryStyles.catalogNestedTabsSlot}>
            <ScrollCatalogStripPanel
              layout="contained"
              items={nestedStripItems}
              onLinkClick={onNestedStripClick}
              tabPanel={{ id: `${tabIdsPrefix}-cards-panel` }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
