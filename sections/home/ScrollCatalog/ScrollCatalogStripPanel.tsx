'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { animateScrollStripBy } from './scrollStripScroll';
import styles from './ScrollCatalog.module.css';
import { useMatchMinWidth } from './useMatchMinWidth';

export type ScrollCatalogStripItem = {
  key: string;
  href: string;
  name: string;
  imageSrc: string;
};

const DRAG_THRESHOLD = 5;

type Props = {
  items: ScrollCatalogStripItem[];
  /** fullBleed — полоса на всю ширину вьюпорта (главная); contained — внутри колонки; superMenu — bleed только вправо. */
  layout?: 'fullBleed' | 'contained' | 'superMenu';
  /** dark — белые подписи карточек (фон мега-меню). */
  theme?: 'light' | 'dark';
  /** Одинаковая ширина карточек (без wide на 0/3). */
  uniformCards?: boolean;
  /** caption — подпись как --text-caption (мега-меню). */
  titleVariant?: 'default' | 'caption';
  tightTop?: boolean;
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function ScrollCatalogStripPanel({
  items,
  layout = 'fullBleed',
  theme = 'light',
  uniformCards = false,
  titleVariant = 'default',
  tightTop = false,
  onLinkClick,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollStripAnimCancelRef = useRef<(() => void) | null>(null);
  const didDragRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const lastXRef = useRef(0);

  const desktopStrip = useMatchMinWidth(769);

  const handlePointerDown = (e: React.MouseEvent) => {
    scrollStripAnimCancelRef.current?.();
    scrollStripAnimCancelRef.current = null;
    didDragRef.current = false;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    if (wrapperRef.current) {
      startScrollLeftRef.current = wrapperRef.current.scrollLeft;
    }
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if (e.buttons !== 1) return;

    const dx = lastXRef.current - e.clientX;
    lastXRef.current = e.clientX;
    wrapper.scrollLeft += dx;

    if (Math.abs(wrapper.scrollLeft - startScrollLeftRef.current) > DRAG_THRESHOLD) {
      didDragRef.current = true;
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (didDragRef.current) {
      e.preventDefault();
      return;
    }
    onLinkClick?.(e);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    if (el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft += e.deltaY;
    e.preventDefault();
  };

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const itemsKey = useMemo(() => items.map((c) => c.key).join('\0'), [items]);

  const updateScrollArrows = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollPrev(scrollLeft > 2);
    setCanScrollNext(maxScroll > 2 && scrollLeft < maxScroll - 2);
  }, []);

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (el) el.scrollLeft = 0;
    if (desktopStrip) updateScrollArrows();
  }, [itemsKey, desktopStrip, updateScrollArrows]);

  useEffect(() => {
    if (!desktopStrip) return;
    const el = wrapperRef.current;
    if (!el) return;
    updateScrollArrows();
    el.addEventListener('scroll', updateScrollArrows, { passive: true });
    const ro = new ResizeObserver(updateScrollArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollArrows);
      ro.disconnect();
    };
  }, [desktopStrip, updateScrollArrows, itemsKey]);

  useEffect(
    () => () => {
      scrollStripAnimCancelRef.current?.();
    },
    [],
  );

  const scrollStrip = useCallback((dir: -1 | 1) => {
    const el = wrapperRef.current;
    if (!el) return;
    scrollStripAnimCancelRef.current?.();
    const anim = animateScrollStripBy(el, dir, () => {
      scrollStripAnimCancelRef.current = null;
    });
    scrollStripAnimCancelRef.current = anim.cancel;
  }, []);

  if (!items.length) {
    return null;
  }

  const hostClass = [
    styles.stripHostFlex,
    layout === 'superMenu'
      ? styles.stripHostFlexSuperMenu
      : layout === 'contained'
        ? styles.stripHostFlexContained
        : styles.stripHostFlexTightTop,
    tightTop ? styles.stripHostFlexTightTop : null,
  ]
    .filter(Boolean)
    .join(' ');

  const panelClass = theme === 'dark' ? `${styles.stripPanel} ${styles.stripPanelOnDark}` : styles.stripPanel;

  const cardsClass = [
    styles.cardsWrapper,
    styles.cardsWrapperOnCategoryParent,
    tightTop ? styles.cardsWrapperTightTop : null,
  ]
    .filter(Boolean)
    .join(' ');

  const titleClass =
    titleVariant === 'caption'
      ? `${styles.cardTitle} ${styles.cardTitleCaption}`
      : styles.cardTitle;

  return (
    <div className={hostClass}>
      <div className={panelClass}>
        <div
          ref={wrapperRef}
          className={cardsClass}
          onWheel={handleWheel}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseLeave={handlePointerMove}
        >
          {items.map((card, index) => {
            const wide = !uniformCards && (index === 0 || index === 3);
            return (
            <Link
              key={card.key}
              href={card.href}
              className={styles.card}
              onClick={handleLinkClick}
            >
              <div className={wide ? `${styles.imgWrap} ${styles.imgWrapWide}` : styles.imgWrap}>
                {card.imageSrc ? (
                  <img
                    src={card.imageSrc}
                    alt=""
                    width={wide ? 306 : 242}
                    height={220}
                    className={styles.imgCover}
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
              </div>
              <span className={titleClass}>{card.name}</span>
            </Link>
            );
          })}
        </div>
        <button
          type="button"
          className={`${styles.stripArrow} ${styles.stripArrowPrev}`}
          aria-label="Прокрутить влево"
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
          aria-label="Прокрутить вправо"
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
