import type { HomeCatalogRoot } from '@/lib/homeCatalog';
import { ScrollCatalogLazyGate } from './ScrollCatalogLazyGate';
import { ScrollCatalogStaticStrip } from './ScrollCatalogStaticStrip';
import { ScrollCatalogTabsStatic } from './ScrollCatalogTabsStatic';
import styles from './ScrollCatalog.module.css';
import {
  HOME_SCROLL_CATALOG_PANEL_ID,
  homeScrollCatalogTabId,
  stripItemsForRoot,
  stripItemsForRoots,
} from './scrollCatalogStripItems';

type Props = {
  roots: HomeCatalogRoot[];
  /** Hero + ScrollCatalog в fold: hero сжимается, карточки — фиксированный размер */
  fillFold?: boolean;
};

export function ScrollCatalog({ roots, fillFold = false }: Props) {
  if (!roots.length) {
    return null;
  }

  const initialRoot = roots[0];
  const initialActiveSlug = initialRoot.slug;
  const initialStripItems = stripItemsForRoot(initialRoot);
  const rootSquareItems = stripItemsForRoots(roots);

  const staticView = (
    <>
      {/* Desktop: табы + дочерние; mobile: только корневые квадраты */}
      <div className={styles.homeDesktopCatalog}>
        <ScrollCatalogTabsStatic roots={roots} activeSlug={initialActiveSlug} />
        <ScrollCatalogStaticStrip
          items={initialStripItems}
          panelId={HOME_SCROLL_CATALOG_PANEL_ID}
          panelLabelledBy={homeScrollCatalogTabId(initialActiveSlug)}
          eagerImageCount={2}
        />
      </div>
      <div className={styles.homeMobileCatalog}>
        <ScrollCatalogStaticStrip
          items={rootSquareItems}
          panelId={`${HOME_SCROLL_CATALOG_PANEL_ID}-roots`}
          eagerImageCount={4}
          variant="rootSquares"
        />
      </div>
    </>
  );

  return (
    <section className={fillFold ? `${styles.section} ${styles.sectionFold}` : styles.section}>
      <div className="padding-global">
        <ScrollCatalogLazyGate
          roots={roots}
          initialActiveSlug={initialActiveSlug}
          staticView={staticView}
        />
      </div>
    </section>
  );
}
