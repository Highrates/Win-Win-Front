'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useId } from 'react';
import { homeRootsFromPublicTreeClient, type HomeCatalogRoot } from '@/lib/homeCatalog';
import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import { animateScrollStripBy } from './scrollStripScroll';
import styles from './ScrollCatalog.module.css';

const DRAG_THRESHOLD = 5;

type CatalogTagTab = {
  slug: string;
  name: string;
};

type TagStripCategory = {
  slug: string;
  name: string;
  backgroundImageUrl: string | null;
};

type Props = {
  roots: HomeCatalogRoot[];
};

export function ScrollCatalog({ roots: initialRoots }: Props) {
  const [roots, setRoots] = useState<HomeCatalogRoot[]>(initialRoots);
  const [tags, setTags] = useState<CatalogTagTab[]>([]);
  const tabsWrapperRef = useRef<HTMLDivElement>(null);
  const tabBtnRefs = useRef(new Map<string, HTMLButtonElement>());
  const [hoverTabSlug, setHoverTabSlug] = useState<string | null>(null);

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

  const pullTags = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog/tags', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: CatalogTagTab[] };
      const items = (data.items ?? []).filter((t) => t.slug && t.name);
      if (items.length) setTags(items);
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

  useEffect(() => {
    void pullTags();
  }, [pullTags]);

  const lastTreePullRef = useRef(0);
  const TREE_PULL_MIN_INTERVAL_MS = 10 * 60 * 1000;

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastTreePullRef.current < TREE_PULL_MIN_INTERVAL_MS) return;
      lastTreePullRef.current = now;
      void pullTree();
      void pullTags();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [pullTree, pullTags]);

  const [activeTagSlug, setActiveTagSlug] = useState<string>(() => '');
  const [tagStripCategories, setTagStripCategories] = useState<TagStripCategory[]>([]);

  useEffect(() => {
    if (!tags.length) {
      setActiveTagSlug('');
      return;
    }
    if (!tags.some((t) => t.slug === activeTagSlug)) {
      setActiveTagSlug(tags[0].slug);
    }
  }, [tags, activeTagSlug]);

  useEffect(() => {
    if (!activeTagSlug) {
      setTagStripCategories([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/catalog/tags/${encodeURIComponent(activeTagSlug)}/strip-categories`,
          { cache: 'no-store' },
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { items?: TagStripCategory[] };
        const items = (data.items ?? []).filter((c) => c.slug && c.name);
        if (!cancelled) setTagStripCategories(items);
      } catch {
        if (!cancelled) setTagStripCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTagSlug]);

  const activeTag = useMemo(
    () => tags.find((t) => t.slug === activeTagSlug) ?? tags[0],
    [tags, activeTagSlug]
  );

  const indicatorTargetSlug = hoverTabSlug ?? activeTagSlug;

  const updateIndicator = useCallback(() => {
    const wrap = tabsWrapperRef.current;
    if (!wrap) return;
    const btn = indicatorTargetSlug ? tabBtnRefs.current.get(indicatorTargetSlug) : null;
    if (!btn) {
      wrap.style.setProperty('--tabs-indicator-x', '0px');
      wrap.style.setProperty('--tabs-indicator-w', '0px');
      return;
    }
    const wRect = wrap.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    const x = Math.max(0, bRect.left - wRect.left);
    const w = Math.max(0, bRect.width);
    wrap.style.setProperty('--tabs-indicator-x', `${x}px`);
    wrap.style.setProperty('--tabs-indicator-w', `${w}px`);
  }, [indicatorTargetSlug]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, activeTagSlug, hoverTabSlug, tags.length]);

  useEffect(() => {
    const wrap = tabsWrapperRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => updateIndicator());
    ro.observe(wrap);
    window.addEventListener('resize', updateIndicator);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [updateIndicator]);

  const stripCards = useMemo(() => {
    if (tagStripCategories.length > 0) {
      return tagStripCategories.map((c) => ({
        slug: c.slug,
        name: c.name,
        image: resolveMediaUrlForClient(c.backgroundImageUrl),
      }));
    }
    return roots.map((root) => ({
      slug: root.slug,
      name: root.name,
      image: root.cardImageUrl,
    }));
  }, [tagStripCategories, roots]);

  const tagQuery = activeTagSlug ? `?tag=${encodeURIComponent(activeTagSlug)}` : '';

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
  }, [activeTagSlug, stripCards.length, updateScrollArrows]);

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

  if (!roots.length) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className="padding-global">
        {tags.length > 0 ? (
          <div
            className={styles.tabsWrapper}
            role="tablist"
            aria-label="Контекстные теги"
            ref={tabsWrapperRef}
            onMouseLeave={() => setHoverTabSlug(null)}
          >
            {tags.map((tab) => (
              <button
                key={tab.slug}
                type="button"
                role="tab"
                id={`${tabIdsPrefix}-tab-${tab.slug}`}
                aria-selected={tab.slug === activeTagSlug}
                aria-controls={cardsPanelId}
                className={tab.slug === activeTagSlug ? styles.tabActive : styles.tab}
                onClick={() => setActiveTagSlug(tab.slug)}
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
        ) : null}
        <div className={`${styles.stripHostFlex} ${styles.stripHostFlexHome}`}>
          <div className={styles.stripPanel}>
            <div
              id={cardsPanelId}
              role="tabpanel"
              aria-labelledby={
                activeTag ? `${tabIdsPrefix}-tab-${activeTag.slug}` : undefined
              }
              ref={wrapperRef}
              className={styles.cardsWrapper}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseLeave={handlePointerMove}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
            >
              {stripCards.map((card, index) => (
                <Link
                  key={card.slug}
                  href={`/catalog/${card.slug}${tagQuery}`}
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
      </div>
      <div className={styles.mobileWrapper}>
        <div className={styles.mobileCardsWrapper}>
          {roots.map((tab) => (
            <Link key={tab.id} href={`/catalog/${tab.slug}`} className={styles.mobileCard}>
              <div className={styles.mobileCardImgWrap}>
                <img
                  src={tab.cardImageUrl}
                  alt=""
                  width={120}
                  height={109}
                  className={styles.mobileCardImg}
                  loading="lazy"
                  decoding="async"
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
