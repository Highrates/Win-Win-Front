'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useId } from 'react';
import { homeRootsFromPublicTreeClient, type HomeCatalogRoot } from '@/lib/homeCatalog';
import { animateScrollStripBy } from '@/sections/home/ScrollCatalog/scrollStripScroll';
import scrollStyles from '@/sections/home/ScrollCatalog/ScrollCatalog.module.css';
import brandsStyles from '@/app/(public)/brands/BrandsPage.module.css';
import categoryStyles from '@/app/(public)/categories/CategoryPage.module.css';

const DRAG_THRESHOLD = 5;

type Props = {
  initialRoots: HomeCatalogRoot[];
  /** Смена корневой категории (таб) — для обновления сетки товаров на `/catalog`. */
  onActiveCategoryChange?: (categoryId: string) => void;
};

/** Страница `/catalog`: табы как на странице брендов + горизонтальная полоса карточек как на главной. */
export function CatalogSectionsTabs({ initialRoots, onActiveCategoryChange }: Props) {
  const [roots, setRoots] = useState<HomeCatalogRoot[]>(initialRoots);

  const pullTree = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog/tree');
      if (!res.ok) return;
      const data = await res.json();
      if (data?.roots && Array.isArray(data.roots)) {
        setRoots(homeRootsFromPublicTreeClient(data));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const reactUiId = useId().replace(/:/g, '');
  const tabIdsPrefix = `catalog-page-${reactUiId}`;
  const cardsPanelId = `${tabIdsPrefix}-cards-panel`;

  useEffect(() => {
    setRoots(initialRoots);
  }, [initialRoots]);

  const lastTreePullRef = useRef(0);
  const TREE_PULL_MIN_INTERVAL_MS = 10 * 60 * 1000;

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastTreePullRef.current < TREE_PULL_MIN_INTERVAL_MS) return;
      lastTreePullRef.current = now;
      void pullTree();
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
    setActiveId((prev) => (roots.some((r) => r.id === prev) ? prev : roots[0].id));
  }, [roots]);

  const activeRoot = useMemo(
    () => roots.find((r) => r.id === activeId) ?? roots[0],
    [roots, activeId],
  );

  const stripCards = useMemo(() => {
    if (!roots.length || !activeRoot) return [];
    const direct = activeRoot.children ?? [];
    if (direct.length > 0) {
      return direct.map((c) => ({
        slug: c.slug,
        name: c.name,
        image: c.cardImageUrl,
      }));
    }
    return [{ slug: activeRoot.slug, name: activeRoot.name, image: activeRoot.cardImageUrl }];
  }, [roots, activeRoot]);

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
    const el = wrapperRef.current;
    if (el) el.scrollLeft = 0;
    updateScrollArrows();
  }, [activeId, stripCards.length, updateScrollArrows]);

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
  }, [updateScrollArrows, stripCards.length]);

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

  if (!roots.length) {
    return null;
  }

  return (
    <section className={`${scrollStyles.section} ${categoryStyles.catalogSectionsSlot}`}>
      <div className="padding-global">
        <nav className={brandsStyles.tabsWrapper} aria-label="Разделы каталога" role="tablist">
          {roots.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${tabIdsPrefix}-tab-${tab.id}`}
              aria-selected={tab.id === activeId}
              aria-controls={cardsPanelId}
              className={tab.id === activeId ? brandsStyles.tabActive : brandsStyles.tab}
              onClick={() => {
                if (tab.id === activeId) return;
                setActiveId(tab.id);
                onActiveCategoryChange?.(tab.id);
              }}
            >
              {tab.name}
            </button>
          ))}
        </nav>
        <div className={`${scrollStyles.stripHostFlex} ${scrollStyles.stripHostFlexHome}`}>
          <div className={scrollStyles.stripPanel}>
            <div
              id={cardsPanelId}
              role="tabpanel"
              aria-labelledby={activeRoot ? `${tabIdsPrefix}-tab-${activeRoot.id}` : undefined}
              ref={wrapperRef}
              className={scrollStyles.cardsWrapper}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseLeave={handlePointerMove}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
            >
              {stripCards.map((card, index) => (
                <Link
                  key={card.slug}
                  href={`/catalog/${card.slug}`}
                  className={scrollStyles.card}
                  onClick={handleLinkClick}
                >
                  <div
                    className={
                      index === 0 || index === 3
                        ? `${scrollStyles.imgWrap} ${scrollStyles.imgWrapWide}`
                        : scrollStyles.imgWrap
                    }
                  >
                    <img
                      src={card.image}
                      alt=""
                      width={index === 0 || index === 3 ? 306 : 242}
                      height={220}
                      className={scrollStyles.imgCover}
                    />
                  </div>
                  <span className={scrollStyles.cardTitle}>{card.name}</span>
                </Link>
              ))}
            </div>
            <button
              type="button"
              className={`${scrollStyles.stripArrow} ${scrollStyles.stripArrowPrev}`}
              aria-label="Прокрутить каталог влево"
              disabled={!canScrollPrev}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                scrollStrip(-1);
              }}
            >
              <img src="/icons/arrow.svg" alt="" className={scrollStyles.stripArrowIcon} aria-hidden />
            </button>
            <button
              type="button"
              className={`${scrollStyles.stripArrow} ${scrollStyles.stripArrowNext}`}
              aria-label="Прокрутить каталог вправо"
              disabled={!canScrollNext}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                scrollStrip(1);
              }}
            >
              <img src="/icons/arrow.svg" alt="" className={scrollStyles.stripArrowIconNext} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
