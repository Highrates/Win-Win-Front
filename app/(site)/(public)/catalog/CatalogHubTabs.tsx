'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import styles from './CatalogHubTabs.module.css';

export type CatalogHubTabId = 'categories' | 'zones' | 'collections';

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
  const tabsWrapperRef = useRef<HTMLDivElement>(null);
  const tabBtnRefs = useRef(new Map<CatalogHubTabId, HTMLButtonElement>());
  const indicatorTarget = hoverTab ?? activeTab;

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
    // После шрифтов/лейаута пересчитать позицию линии
    const t = window.setTimeout(updateIndicator, 0);
    return () => window.clearTimeout(t);
  }, [updateIndicator, activeTab, hoverTab]);

  useLayoutEffect(() => {
    const wrap = tabsWrapperRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(updateIndicator);
    ro.observe(wrap);
    window.addEventListener('resize', updateIndicator);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [updateIndicator]);

  return (
    <section
      className={fillFold ? `${styles.section} ${styles.sectionFold}` : styles.section}
      aria-label="Разделы каталога"
    >
      <div className="padding-global">
        <div className={styles.tabsShell}>
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
          </div>
        </div>
      </div>
    </section>
  );
}
