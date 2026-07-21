import type { HomeCatalogRoot } from '@/lib/homeCatalog';
import { ScrollCatalogLazyGate } from './ScrollCatalogLazyGate';
import { ScrollCatalogStaticStrip } from './ScrollCatalogStaticStrip';
import { ScrollCatalogTabsStatic } from './ScrollCatalogTabsStatic';
import styles from './ScrollCatalog.module.css';
import {
  HOME_SCROLL_CATALOG_PANEL_ID,
  homeScrollCatalogTabId,
  stripItemsForRoot,
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

  const staticView = (
    <>
      <ScrollCatalogTabsStatic roots={roots} activeSlug={initialActiveSlug} />
      <ScrollCatalogStaticStrip
        items={initialStripItems}
        panelId={HOME_SCROLL_CATALOG_PANEL_ID}
        panelLabelledBy={homeScrollCatalogTabId(initialActiveSlug)}
        eagerImageCount={2}
      />
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
