'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { homeRootsFromPublicTreeClient, type HomeCatalogRoot } from '@/lib/homeCatalog';
import styles from './ScrollCatalog.module.css';

const DRAG_THRESHOLD = 5;

type Props = {
  roots: HomeCatalogRoot[];
};

export function ScrollCatalog({ roots: initialRoots }: Props) {
  const pathname = usePathname();
  const [roots, setRoots] = useState<HomeCatalogRoot[]>(initialRoots);

  const pullTree = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog/tree', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.roots && Array.isArray(data.roots)) {
        setRoots(homeRootsFromPublicTreeClient(data));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setRoots(initialRoots);
  }, [initialRoots]);

  useEffect(() => {
    pullTree();
  }, [pathname, pullTree]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') pullTree();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [pullTree]);

  const [activeId, setActiveId] = useState<string>(() => initialRoots[0]?.id ?? '');

  useEffect(() => {
    if (!roots.length) {
      setActiveId('');
      return;
    }
    if (!roots.some((r) => r.id === activeId)) {
      setActiveId(roots[0].id);
    }
  }, [roots, activeId]);

  const activeRoot = useMemo(
    () => roots.find((r) => r.id === activeId) ?? roots[0],
    [roots, activeId]
  );

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

  if (!roots.length) {
    return null;
  }

  const stripCards =
    activeRoot && activeRoot.children.length > 0
      ? activeRoot.children.map((c) => ({ slug: c.slug, name: c.name, image: c.cardImageUrl }))
      : activeRoot
        ? [{ slug: activeRoot.slug, name: activeRoot.name, image: activeRoot.cardImageUrl }]
        : [];

  return (
    <section className={styles.section}>
      <div className="padding-global">
        <div className={styles.tabsWrapper} role="tablist" aria-label="Разделы каталога">
          {roots.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`catalog-tab-${tab.id}`}
              aria-selected={tab.id === activeId}
              aria-controls="catalog-cards-panel"
              className={tab.id === activeId ? styles.tabActive : styles.tab}
              onClick={() => setActiveId(tab.id)}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
      <div
        id="catalog-cards-panel"
        role="tabpanel"
        aria-labelledby={activeRoot ? `catalog-tab-${activeRoot.id}` : undefined}
        ref={wrapperRef}
        className={styles.cardsWrapper}
        onWheel={handleWheel}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerMove}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
      >
        {stripCards.map((card, index) => (
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
                src={card.image}
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
      <div className={styles.mobileWrapper}>
        <div className={styles.mobileCardsWrapper}>
          {roots.map((tab) => (
            <Link key={tab.id} href={`/categories/${tab.slug}`} className={styles.mobileCard}>
              <div className={styles.mobileCardImgWrap}>
                <img
                  src={tab.cardImageUrl}
                  alt=""
                  width={120}
                  height={109}
                  className={styles.mobileCardImg}
                />
              </div>
              <span className={styles.mobileCardTitle}>{tab.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
