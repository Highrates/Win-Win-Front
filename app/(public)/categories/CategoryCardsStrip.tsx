'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { animateScrollStripBy } from '@/sections/home/ScrollCatalog/scrollStripScroll';
import styles from '@/sections/home/ScrollCatalog/ScrollCatalog.module.css';

export type CategoryCardItem = { slug: string; name: string; imageSrc: string };

const DRAG_THRESHOLD = 5;

/** Горизонтальная полоса подкатегорий — та же вёрстка и поведение, что у ScrollCatalogCardsStrip на главной. */
export function CategoryCardsStrip({ items }: { items: CategoryCardItem[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollStripAnimCancelRef = useRef<(() => void) | null>(null);
  const didDragRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const lastXRef = useRef(0);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    scrollStripAnimCancelRef.current?.();
    scrollStripAnimCancelRef.current = null;
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

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    if (el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft += e.deltaY;
    e.preventDefault();
  };

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const itemsKey = useMemo(() => items.map((c) => c.slug).join('\0'), [items]);

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
    updateScrollArrows();
  }, [itemsKey, updateScrollArrows]);

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
  }, [updateScrollArrows, itemsKey]);

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

  if (!items.length) {
    return null;
  }

  return (
    <div className={`${styles.stripHostFlex} ${styles.stripHostFlexTightTop}`}>
      <div className={styles.stripPanel}>
        <div
          ref={wrapperRef}
          className={`${styles.cardsWrapper} ${styles.cardsWrapperOnCategoryParent} ${styles.cardsWrapperTightTop}`}
          onWheel={handleWheel}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseLeave={handlePointerMove}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
        >
          {items.map((card, index) => (
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
                  src={card.imageSrc}
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
