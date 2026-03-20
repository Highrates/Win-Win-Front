'use client';

import Link from 'next/link';
import { useRef } from 'react';
import styles from './ScrollCatalog.module.css';

/** Родительские разделы: href — реальные маршруты (не `/categories/<id>` из id). */
const tabs = [
  { id: 'living', label: 'Гостиная', active: true, href: '/categories' },
  /* Пока нет отдельных страниц родителей — ведём в каталог; заменить href при появлении роутов */
  { id: 'dining', label: 'Столовая', active: false, href: '/categories' },
  { id: 'light', label: 'Свет', active: false, href: '/categories' },
  { id: 'office', label: 'Офис', active: false, href: '/categories' },
  { id: 'hotel', label: 'Отель', active: false, href: '/categories' },
  { id: 'decor', label: 'Декор', active: false, href: '/categories' },
  { id: 'garden', label: 'Сад', active: false, href: '/categories' },
  { id: 'materials', label: 'Отделочные материалы', active: false, href: '/categories' },
  { id: 'plumbing', label: 'Сантехника', active: false, href: '/categories' },
];

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

export function ScrollCatalog() {
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

  return (
    <section className={styles.section}>
      <div className="padding-global">
        <div className={styles.tabsWrapper}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={tab.active ? styles.tabActive : styles.tab}
              aria-pressed={tab.active}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={wrapperRef}
        className={styles.cardsWrapper}
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
      {/* Мобильная версия: только родительские категории (табы) в виде карточек*/}
      <div className={styles.mobileWrapper}>
        <div className={styles.mobileCardsWrapper}>
          {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={styles.mobileCard}
              >
                <div className={styles.mobileCardImgWrap}>
                  <img
                    src="/images/placeholder.svg"
                    alt=""
                    width={120}
                    height={109}
                    className={styles.mobileCardImg}
                  />
                </div>
                <span className={styles.mobileCardTitle}>{tab.label}</span>
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
