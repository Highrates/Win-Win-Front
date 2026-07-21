'use client';

import { useMemo } from 'react';
import { ScrollCatalogStripCards } from './ScrollCatalogStripCards';
import styles from './ScrollCatalog.module.css';
import type { ScrollCatalogStripItem } from './scrollCatalogStripItems';
import { useHorizontalScrollStrip } from './useHorizontalScrollStrip';
import { useMatchMinWidth } from './useMatchMinWidth';

export type { ScrollCatalogStripItem } from './scrollCatalogStripItems';

type Props = {
  items: ScrollCatalogStripItem[];
  layout?: 'fullBleed' | 'home' | 'contained' | 'superMenu';
  theme?: 'light' | 'dark';
  uniformCards?: boolean;
  titleVariant?: 'default' | 'caption';
  tightTop?: boolean;
  eagerImageCount?: number;
  scrollPrevLabel?: string;
  scrollNextLabel?: string;
  tabPanel?: { id: string; labelledBy?: string };
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function ScrollCatalogStripPanel({
  items,
  layout = 'fullBleed',
  theme = 'light',
  uniformCards = false,
  titleVariant = 'default',
  tightTop = false,
  eagerImageCount,
  scrollPrevLabel = 'Прокрутить влево',
  scrollNextLabel = 'Прокрутить вправо',
  tabPanel,
  onLinkClick,
}: Props) {
  const desktopStrip = useMatchMinWidth(769);
  const itemsKey = useMemo(() => items.map((c) => c.key).join('\0'), [items]);

  const { wrapperRef, canScrollPrev, canScrollNext, scrollStrip, handleLinkClick, wrapperProps } =
    useHorizontalScrollStrip({
      resetKey: itemsKey,
      enabled: desktopStrip,
    });

  if (!items.length) {
    return null;
  }

  const hostClass = [
    styles.stripHostFlex,
    layout === 'superMenu'
      ? styles.stripHostFlexSuperMenu
      : layout === 'contained'
        ? styles.stripHostFlexContained
        : layout === 'home'
          ? styles.stripHostFlexHome
          : styles.stripHostFlexTightTop,
    tightTop ? styles.stripHostFlexTightTop : null,
  ]
    .filter(Boolean)
    .join(' ');

  const panelClass =
    theme === 'dark' ? `${styles.stripPanel} ${styles.stripPanelOnDark}` : styles.stripPanel;

  const cardsClass = [
    styles.cardsWrapper,
    layout === 'home'
      ? styles.cardsWrapperHome
      : styles.cardsWrapperOnCategoryParent,
    tightTop ? styles.cardsWrapperTightTop : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={hostClass}>
      <div className={panelClass}>
        <ScrollCatalogStripCards
          items={items}
          cardsClassName={cardsClass}
          panelId={tabPanel?.id}
          panelLabelledBy={tabPanel?.labelledBy}
          eagerImageCount={eagerImageCount}
          titleVariant={titleVariant}
          uniformCards={uniformCards}
          onLinkClick={(e) => handleLinkClick(e, onLinkClick)}
          scrollRef={wrapperRef}
          scrollWrapperProps={wrapperProps}
        />
        <button
          type="button"
          className={`${styles.stripArrow} ${styles.stripArrowPrev}`}
          aria-label={scrollPrevLabel}
          disabled={!canScrollPrev}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            scrollStrip(-1);
          }}
        >
          <img src="/icons/arrow.svg" alt="" className={styles.stripArrowIcon} aria-hidden />
        </button>
        <button
          type="button"
          className={`${styles.stripArrow} ${styles.stripArrowNext}`}
          aria-label={scrollNextLabel}
          disabled={!canScrollNext}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            scrollStrip(1);
          }}
        >
          <img src="/icons/arrow.svg" alt="" className={styles.stripArrowIconNext} aria-hidden />
        </button>
      </div>
    </div>
  );
}
