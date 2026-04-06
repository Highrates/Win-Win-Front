'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animateScrollStripBy } from './scrollStripScroll';
import styles from './ScrollCatalog.module.css';
import { useMatchMinWidth } from './useMatchMinWidth';

const catalogCards = [
  { slug: 'divany', name: 'Диваны' },
  { slug: 'kresla', name: 'Кресла' },
  { slug: 'kofejnye-stoliki', name: 'Кофейные столики' },
  { slug: 'shkafy', name: 'Консольные столики' },
  { slug: 'knizhnye-shkafy', name: 'Книжные шкафы' },
  { slug: 'vinnye-shkafy', name: 'Винные шкафы' },
  { slug: 'stoly', name: 'Столы' },
  { slug: 'pufy', name: 'Пуфы' },
];

const DRAG_THRESHOLD = 5;

/** Только горизонтальная полоса карточек (`ScrollCatalog_cardsWrapper`), без табов — для страницы родительской категории. */
export function ScrollCatalogCardsStrip() {
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
    }
  };

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollArrows = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollPrev(scrollLeft > 2);
    setCanScrollNext(maxScroll > 2 && scrollLeft < maxScroll - 2);
  }, []);

  useLayoutEffect(() => {
    if (desktopStrip) updateScrollArrows();
  }, [desktopStrip, updateScrollArrows]);

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
  }, [desktopStrip, updateScrollArrows]);

  useEffect(
    () => () => {
      scrollStripAnimCancelRef.current?.();
    },
    []
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

  return (
    <div className={`${styles.stripHostFlex} ${styles.stripHostFlexTightTop}`}>
      <div className={styles.stripPanel}>
        <div
          ref={wrapperRef}
          className={`${styles.cardsWrapper} ${styles.cardsWrapperOnCategoryParent} ${styles.cardsWrapperTightTop}`}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseLeave={handlePointerMove}
        >
          {catalogCards.map((card, index) => (
            <Link
              key={card.slug}
              href={`/categories/${card.slug}`}
              className={styles.card}
              onClick={handleLinkClick}
            >
              <div
                className={
                  index === 0 || index === 3
                    ? `${styles.imgWrap} ${styles.imgWrapWide}`
                    : styles.imgWrap
                }
              >
                <img
                  src="/images/placeholder.svg"
                  alt=""
                  width={index === 0 || index === 3 ? 306 : 242}
                  height={220}
                  className={styles.imgCover}
                />
              </div>
              <span className={styles.cardTitle}>{card.name}</span>
            </Link>
          ))}
        </div>
        <button
          type="button"
          className={`${styles.stripArrow} ${styles.stripArrowPrev}`}
          aria-label="Прокрутить каталог влево"
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
          aria-label="Прокрутить каталог вправо"
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
