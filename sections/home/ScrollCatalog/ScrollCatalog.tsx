'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useId } from 'react';
import {
  homeRootsFromPublicTreeClient,
  type HomeCatalogChild,
  type HomeCatalogRoot,
} from '@/lib/homeCatalog';
import { animateScrollStripBy } from './scrollStripScroll';
import styles from './ScrollCatalog.module.css';

const DRAG_THRESHOLD = 5;

type Props = {
  roots: HomeCatalogRoot[];
};

type StripCard = {
  slug: string;
  name: string;
  image: string;
};

function cardsForRoot(root: HomeCatalogRoot | undefined): StripCard[] {
  if (!root) return [];
  const children = root.children ?? [];
  if (children.length > 0) {
    return children.map((c: HomeCatalogChild) => ({
      slug: c.slug,
      name: c.name,
      image: c.cardImageUrl,
    }));
  }
  return [{ slug: root.slug, name: root.name, image: root.cardImageUrl }];
}

export function ScrollCatalog({ roots: initialRoots }: Props) {
  const [roots, setRoots] = useState<HomeCatalogRoot[]>(initialRoots);
  const tabsWrapperRef = useRef<HTMLDivElement>(null);
  const tabBtnRefs = useRef(new Map<string, HTMLButtonElement>());
  const [hoverTabSlug, setHoverTabSlug] = useState<string | null>(null);
  const [activeRootSlug, setActiveRootSlug] = useState<string>(() => initialRoots[0]?.slug ?? '');
  const [tabsCanScrollPrev, setTabsCanScrollPrev] = useState(false);
  const [tabsCanScrollNext, setTabsCanScrollNext] = useState(false);

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
  const tabIdsPrefix = `home-catalog-${reactUiId}`;
  const cardsPanelId = `${tabIdsPrefix}-cards-panel`;

  useEffect(() => {
    setRoots(initialRoots);
  }, [initialRoots]);

  const tabRoots = roots;

  useEffect(() => {
    if (!tabRoots.length) {
      setActiveRootSlug('');
      return;
    }
    if (!tabRoots.some((r) => r.slug === activeRootSlug)) {
      setActiveRootSlug(tabRoots[0].slug);
    }
  }, [tabRoots, activeRootSlug]);

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

  const activeRoot = useMemo(
    () => tabRoots.find((r) => r.slug === activeRootSlug) ?? tabRoots[0],
    [tabRoots, activeRootSlug],
  );

  const stripCards = useMemo(() => cardsForRoot(activeRoot), [activeRoot]);

  const indicatorTargetSlug = hoverTabSlug ?? activeRootSlug;

  const updateTabsScrollEdges = useCallback(() => {
    const el = tabsWrapperRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const scrollable = maxScroll > 2;
    setTabsCanScrollPrev(scrollable && scrollLeft > 2);
    setTabsCanScrollNext(scrollable && scrollLeft < maxScroll - 2);
  }, []);

  const updateIndicator = useCallback(() => {
    const wrap = tabsWrapperRef.current;
    if (!wrap) return;
    const btn = indicatorTargetSlug ? tabBtnRefs.current.get(indicatorTargetSlug) : null;
    if (!btn) {
      wrap.style.setProperty('--tabs-indicator-x', '0px');
      wrap.style.setProperty('--tabs-indicator-w', '0px');
      return;
    }
    const x = Math.max(0, btn.offsetLeft);
    const w = Math.max(0, btn.offsetWidth);
    wrap.style.setProperty('--tabs-indicator-x', `${x}px`);
    wrap.style.setProperty('--tabs-indicator-w', `${w}px`);
  }, [indicatorTargetSlug]);

  useLayoutEffect(() => {
    updateIndicator();
    updateTabsScrollEdges();
  }, [updateIndicator, updateTabsScrollEdges, activeRootSlug, hoverTabSlug, tabRoots.length]);

  useEffect(() => {
    const wrap = tabsWrapperRef.current;
    if (!wrap) return;
    const sync = () => {
      updateIndicator();
      updateTabsScrollEdges();
    };
    const ro = new ResizeObserver(sync);
    ro.observe(wrap);
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (wrap.scrollWidth <= wrap.clientWidth + 2) return;
      e.preventDefault();
      wrap.scrollLeft += e.deltaY;
    };
    wrap.addEventListener('scroll', sync, { passive: true });
    wrap.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', sync);
    sync();
    return () => {
      ro.disconnect();
      wrap.removeEventListener('scroll', sync);
      wrap.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', sync);
    };
  }, [updateIndicator, updateTabsScrollEdges]);

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
  }, [activeRootSlug, stripCards.length, updateScrollArrows]);

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

  const selectRoot = useCallback((slug: string) => {
    setActiveRootSlug(slug);
    const btn = tabBtnRefs.current.get(slug);
    btn?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
  }, []);

  if (!tabRoots.length) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className="padding-global">
        <div
          className={styles.tabsShell}
          data-can-scroll-prev={tabsCanScrollPrev ? 'true' : 'false'}
          data-can-scroll-next={tabsCanScrollNext ? 'true' : 'false'}
        >
          <div className={styles.tabsPill}>
            <div
              className={styles.tabsWrapper}
              role="tablist"
              aria-label="Разделы каталога"
              ref={tabsWrapperRef}
              onMouseLeave={() => setHoverTabSlug(null)}
            >
              {tabRoots.map((tab) => (
                <button
                  key={tab.slug}
                  type="button"
                  role="tab"
                  id={`${tabIdsPrefix}-tab-${tab.slug}`}
                  aria-selected={tab.slug === activeRootSlug}
                  aria-controls={cardsPanelId}
                  className={tab.slug === activeRootSlug ? styles.tabActive : styles.tab}
                  onClick={() => selectRoot(tab.slug)}
                  onMouseEnter={() => setHoverTabSlug(tab.slug)}
                  ref={(el) => {
                    if (!el) tabBtnRefs.current.delete(tab.slug);
                    else tabBtnRefs.current.set(tab.slug, el);
                  }}
                >
                  {tab.name}
                </button>
              ))}
              <span className={styles.tabsIndicator} aria-hidden="true" />
            </div>
            <span className={styles.tabsFadeStart} aria-hidden="true" />
            <span className={styles.tabsFadeEnd} aria-hidden="true" />
          </div>
        </div>
        <div className={`${styles.stripHostFlex} ${styles.stripHostFlexHome}`}>
          <div className={styles.stripPanel}>
            <div
              id={cardsPanelId}
              role="tabpanel"
              aria-labelledby={
                activeRoot ? `${tabIdsPrefix}-tab-${activeRoot.slug}` : undefined
              }
              ref={wrapperRef}
              className={`${styles.cardsWrapper} ${styles.cardsWrapperHome}`}
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
                      loading={index < 2 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </div>
                  <span className={styles.cardTitle}>{card.name}</span>
                </Link>
              ))}
            </div>
            <button
              type="button"
              className={`${styles.stripArrow} ${styles.stripArrowPrev}`}
              aria-label="Прокрутить подкатегории влево"
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
              aria-label="Прокрутить подкатегории вправо"
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
      </div>
    </section>
  );
}
