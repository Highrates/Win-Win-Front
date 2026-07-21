'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { HomeCatalogRoot } from '@/lib/homeCatalog';
import { ScrollCatalogStripPanel } from './ScrollCatalogStripPanel';
import styles from './ScrollCatalog.module.css';
import {
  HOME_SCROLL_CATALOG_PANEL_ID,
  homeScrollCatalogTabId,
  stripItemsForRoot,
} from './scrollCatalogStripItems';

type Props = {
  roots: HomeCatalogRoot[];
  initialActiveSlug: string;
};

export function ScrollCatalogClient({
  roots,
  initialActiveSlug,
}: Props) {
  const tabsWrapperRef = useRef<HTMLDivElement>(null);
  const tabBtnRefs = useRef(new Map<string, HTMLButtonElement>());
  const [hoverTabSlug, setHoverTabSlug] = useState<string | null>(null);
  const [activeRootSlug, setActiveRootSlug] = useState(initialActiveSlug);
  const [tabsCanScrollPrev, setTabsCanScrollPrev] = useState(false);
  const [tabsCanScrollNext, setTabsCanScrollNext] = useState(false);

  useEffect(() => {
    if (!roots.length) {
      setActiveRootSlug('');
      return;
    }
    if (!roots.some((r) => r.slug === activeRootSlug)) {
      setActiveRootSlug(roots[0].slug);
    }
  }, [roots, activeRootSlug]);

  const activeRoot = useMemo(
    () => roots.find((r) => r.slug === activeRootSlug) ?? roots[0],
    [roots, activeRootSlug],
  );

  const stripItems = useMemo(() => stripItemsForRoot(activeRoot), [activeRoot]);

  const indicatorTargetSlug = hoverTabSlug ?? activeRootSlug;

  const updateTabsScrollEdges = useCallback(() => {
    const el = tabsWrapperRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const scrollable = maxScroll > 2;
    setTabsCanScrollPrev(scrollable && scrollLeft > 2);
    setTabsCanScrollNext(scrollable && scrollLeft < maxScroll - 2);
  }, []);

  const updateIndicator = useCallback(() => {
    const wrap = tabsWrapperRef.current;
    if (!wrap) return;
    const btn = indicatorTargetSlug ? tabBtnRefs.current.get(indicatorTargetSlug) : null;
    if (!btn) {
      wrap.style.setProperty('--tabs-indicator-x', '0px');
      wrap.style.setProperty('--tabs-indicator-w', '0px');
      return;
    }
    const x = Math.max(0, btn.offsetLeft);
    const w = Math.max(0, btn.offsetWidth);
    wrap.style.setProperty('--tabs-indicator-x', `${x}px`);
    wrap.style.setProperty('--tabs-indicator-w', `${w}px`);
  }, [indicatorTargetSlug]);

  useLayoutEffect(() => {
    updateIndicator();
    updateTabsScrollEdges();
  }, [updateIndicator, updateTabsScrollEdges, activeRootSlug, hoverTabSlug, roots.length]);

  useEffect(() => {
    const wrap = tabsWrapperRef.current;
    if (!wrap) return;
    const sync = () => {
      updateIndicator();
      updateTabsScrollEdges();
    };
    const ro = new ResizeObserver(sync);
    ro.observe(wrap);
    wrap.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
    return () => {
      ro.disconnect();
      wrap.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [updateIndicator, updateTabsScrollEdges]);

  const selectRoot = useCallback((slug: string) => {
    setActiveRootSlug(slug);
    const btn = tabBtnRefs.current.get(slug);
    btn?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
  }, []);

  if (!roots.length) {
    return null;
  }

  return (
    <>
      <div
        className={styles.tabsShell}
        data-can-scroll-prev={tabsCanScrollPrev ? 'true' : 'false'}
        data-can-scroll-next={tabsCanScrollNext ? 'true' : 'false'}
      >
        <div className={styles.tabsPill}>
          <div
            className={styles.tabsWrapper}
            role="tablist"
            aria-label="Разделы каталога"
            ref={tabsWrapperRef}
            onMouseLeave={() => setHoverTabSlug(null)}
          >
            {roots.map((tab) => (
              <button
                key={tab.slug}
                type="button"
                role="tab"
                id={homeScrollCatalogTabId(tab.slug)}
                aria-selected={tab.slug === activeRootSlug}
                aria-controls={HOME_SCROLL_CATALOG_PANEL_ID}
                className={tab.slug === activeRootSlug ? styles.tabActive : styles.tab}
                onClick={() => selectRoot(tab.slug)}
                onMouseEnter={() => setHoverTabSlug(tab.slug)}
                ref={(el) => {
                  if (!el) tabBtnRefs.current.delete(tab.slug);
                  else tabBtnRefs.current.set(tab.slug, el);
                }}
              >
                {tab.name}
              </button>
            ))}
            <span className={styles.tabsIndicator} aria-hidden="true" />
          </div>
          <span className={styles.tabsFadeStart} aria-hidden="true" />
          <span className={styles.tabsFadeEnd} aria-hidden="true" />
        </div>
      </div>

      <ScrollCatalogStripPanel
        items={stripItems}
        layout="home"
        eagerImageCount={2}
        scrollPrevLabel="Прокрутить подкатегории влево"
        scrollNextLabel="Прокрутить подкатегории вправо"
        tabPanel={{
          id: HOME_SCROLL_CATALOG_PANEL_ID,
          labelledBy: activeRoot ? homeScrollCatalogTabId(activeRoot.slug) : undefined,
        }}
      />
    </>
  );
}
