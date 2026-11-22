'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { CatalogHubTabId } from '@/lib/catalog/parseCatalogHubTab';
import styles from './CatalogHubTabs.module.css';

export type { CatalogHubTabId } from '@/lib/catalog/parseCatalogHubTab';

type Props = {
  activeTab: CatalogHubTabId;
  onTabChange: (id: CatalogHubTabId) => void;
  fillFold?: boolean;
};

const TAB_LABELS: Record<CatalogHubTabId, string> = {
  categories: 'Категории',
  zones: 'Зоны',
  collections: 'Коллекции и наборы',
};

const TABS: CatalogHubTabId[] = ['categories', 'zones', 'collections'];

export function CatalogHubTabs({ activeTab, onTabChange, fillFold = false }: Props) {
  const [hoverTab, setHoverTab] = useState<CatalogHubTabId | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const tabsWrapperRef = useRef<HTMLDivElement>(null);
  const tabBtnRefs = useRef(new Map<CatalogHubTabId, HTMLButtonElement>());
  const indicatorTarget = hoverTab ?? activeTab;

  const updateScrollEdges = useCallback(() => {
    const el = tabsWrapperRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const scrollable = maxScroll > 2;
    setCanScrollPrev(scrollable && scrollLeft > 2);
    setCanScrollNext(scrollable && scrollLeft < maxScroll - 2);
  }, []);

  const updateIndicator = useCallback(() => {
    const wrap = tabsWrapperRef.current;
    if (!wrap) return;
    const btn = tabBtnRefs.current.get(indicatorTarget);
    if (!btn) {
      wrap.style.setProperty('--tabs-indicator-x', '0px');
      wrap.style.setProperty('--tabs-indicator-w', '0px');
      return;
    }
    wrap.style.setProperty('--tabs-indicator-x', `${Math.max(0, btn.offsetLeft)}px`);
    wrap.style.setProperty('--tabs-indicator-w', `${Math.max(0, btn.offsetWidth)}px`);
  }, [indicatorTarget]);

  useLayoutEffect(() => {
    updateIndicator();
    updateScrollEdges();
    const t = window.setTimeout(() => {
      updateIndicator();
      updateScrollEdges();
    }, 0);
    return () => window.clearTimeout(t);
  }, [updateIndicator, updateScrollEdges, activeTab, hoverTab]);

  useLayoutEffect(() => {
    const wrap = tabsWrapperRef.current;
    if (!wrap) return;
    const sync = () => {
      updateIndicator();
      updateScrollEdges();
    };
    const ro = new ResizeObserver(sync);
    ro.observe(wrap);
    wrap.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      ro.disconnect();
      wrap.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [updateIndicator, updateScrollEdges]);

  return (
    <section
      className={fillFold ? `${styles.section} ${styles.sectionFold}` : styles.section}
      aria-label="Разделы каталога"
    >
      <div className="padding-global">
        <div
          className={styles.tabsShell}
          data-can-scroll-prev={canScrollPrev ? 'true' : 'false'}
          data-can-scroll-next={canScrollNext ? 'true' : 'false'}
        >
          <div className={styles.tabsPill}>
            <div
              className={styles.tabsWrapper}
              role="tablist"
              aria-label="Каталог"
              ref={tabsWrapperRef}
              onMouseLeave={() => setHoverTab(null)}
            >
              {TABS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`catalog-hub-tab-${id}`}
                  aria-selected={id === activeTab}
                  aria-controls="catalog-hub-panel"
                  className={id === activeTab ? styles.tabActive : styles.tab}
                  onClick={() => onTabChange(id)}
                  onMouseEnter={() => setHoverTab(id)}
                  ref={(el) => {
                    if (!el) tabBtnRefs.current.delete(id);
                    else tabBtnRefs.current.set(id, el);
                  }}
                >
                  {TAB_LABELS[id]}
                </button>
              ))}
              <span className={styles.tabsIndicator} aria-hidden="true" />
            </div>
            <span className={styles.tabsFadeStart} aria-hidden="true" />
            <span className={styles.tabsFadeEnd} aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
