import { ScrollCatalogStripCards } from './ScrollCatalogStripCards';
import styles from './ScrollCatalog.module.css';
import type { ScrollCatalogStripItem } from './scrollCatalogStripItems';

type Props = {
  items: ScrollCatalogStripItem[];
  panelId?: string;
  panelLabelledBy?: string;
  eagerImageCount?: number;
};

/** SSR-полоса карточек без drag/стрелок — первый экран до гидратации скролла. */
export function ScrollCatalogStaticStrip({
  items,
  panelId,
  panelLabelledBy,
  eagerImageCount = 2,
}: Props) {
  if (!items.length) return null;

  return (
    <div className={`${styles.stripHostFlex} ${styles.stripHostFlexHome}`}>
      <div className={styles.stripPanel}>
        <ScrollCatalogStripCards
          items={items}
          cardsClassName={`${styles.cardsWrapper} ${styles.cardsWrapperHome}`}
          panelId={panelId}
          panelLabelledBy={panelLabelledBy}
          eagerImageCount={eagerImageCount}
        />
      </div>
    </div>
  );
}
