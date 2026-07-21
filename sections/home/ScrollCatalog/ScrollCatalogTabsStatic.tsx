import type { HomeCatalogRoot } from '@/lib/homeCatalog';
import styles from './ScrollCatalog.module.css';
import { HOME_SCROLL_CATALOG_PANEL_ID, homeScrollCatalogTabId } from './scrollCatalogStripItems';

type Props = {
  roots: HomeCatalogRoot[];
  activeSlug: string;
};

/** SSR-табы каталога на главной — без JS до lazy-mount клиента. */
export function ScrollCatalogTabsStatic({ roots, activeSlug }: Props) {
  if (!roots.length) return null;

  return (
    <div className={styles.tabsShell}>
      <div className={styles.tabsPill}>
        <div
          className={styles.tabsWrapper}
          role="tablist"
          aria-label="Разделы каталога"
        >
          {roots.map((tab) => (
            <span
              key={tab.slug}
              role="tab"
              id={homeScrollCatalogTabId(tab.slug)}
              aria-selected={tab.slug === activeSlug}
              aria-controls={HOME_SCROLL_CATALOG_PANEL_ID}
              className={tab.slug === activeSlug ? styles.tabActive : styles.tab}
            >
              {tab.name}
            </span>
          ))}
          <span className={styles.tabsIndicator} aria-hidden="true" />
        </div>
        <span className={styles.tabsFadeStart} aria-hidden="true" />
        <span className={styles.tabsFadeEnd} aria-hidden="true" />
      </div>
    </div>
  );
}
