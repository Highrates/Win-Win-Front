'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './ScrollCatalog.module.css';

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
  const didDragRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const lastXRef = useRef(0);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    didDragRef.current = false;
    startXRef.current = clientX;
    lastXRef.current = clientX;
    if (wrapperRef.current) {
      startScrollLeftRef.current = wrapperRef.current.scrollLeft;
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if ('touches' in e === false && (e as React.MouseEvent).buttons !== 1) return;

    const dx = lastXRef.current - clientX;
    lastXRef.current = clientX;
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
    updateScrollArrows();
  }, [updateScrollArrows]);

  useEffect(() => {
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
  }, [updateScrollArrows]);

  const scrollStrip = useCallback((dir: -1 | 1) => {
    const el = wrapperRef.current;
    if (!el) return;
    const step = Math.max(280, Math.round(el.clientWidth * 0.72));
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
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
