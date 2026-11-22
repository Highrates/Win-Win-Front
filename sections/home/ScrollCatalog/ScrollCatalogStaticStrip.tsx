import { ScrollCatalogStripCards } from './ScrollCatalogStripCards';
import styles from './ScrollCatalog.module.css';
import type { ScrollCatalogStripItem } from './scrollCatalogStripItems';

type Props = {
  items: ScrollCatalogStripItem[];
  panelId?: string;
  panelLabelledBy?: string;
  eagerImageCount?: number;
  /** Моб. home: квадраты корневых категорий */
  variant?: 'default' | 'rootSquares';
  hostClassName?: string;
};

/** SSR-полоса карточек без drag/стрелок — первый экран до гидратации скролла. */
export function ScrollCatalogStaticStrip({
  items,
  panelId,
  panelLabelledBy,
  eagerImageCount = 2,
  variant = 'default',
  hostClassName,
}: Props) {
  if (!items.length) return null;

  const cardsClass =
    variant === 'rootSquares'
      ? `${styles.cardsWrapper} ${styles.cardsWrapperHome} ${styles.cardsWrapperRootSquares}`
      : `${styles.cardsWrapper} ${styles.cardsWrapperHome}`;

  return (
    <div
      className={[
        styles.stripHostFlex,
        styles.stripHostFlexHome,
        hostClassName,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.stripPanel}>
        <ScrollCatalogStripCards
          items={items}
          cardsClassName={cardsClass}
          panelId={panelId}
          panelLabelledBy={panelLabelledBy}
          eagerImageCount={eagerImageCount}
          uniformCards={variant === 'rootSquares'}
        />
      </div>
    </div>
  );
}
