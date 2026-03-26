'use client';

import Link from 'next/link';
import { useRef } from 'react';
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

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    if (el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft += e.deltaY;
    e.preventDefault();
  };

  return (
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
  );
}
