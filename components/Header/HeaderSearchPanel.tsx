'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useCatalogNavRoots } from '@/components/CatalogNavContext';
import {
  MENU_COVERED_EVENT,
  TransitionLink,
  useSiteTransition,
} from '@/components/SiteTransition';
import { highlightSearchTitle } from '@/lib/searchHighlight';
import { HeaderOverlayShell } from './HeaderOverlayShell';
import { focusablesIn, useOverlayPanel } from './useOverlayPanel';
import styles from './Header.module.css';

export type SearchHit = {
  id: string;
  title: string;
  href: string;
  subtitle?: string | null;
  imageUrl?: string | null;
};

export type SearchGroup = {
  key: string;
  label: string;
  items: SearchHit[];
  total?: number;
  hasMore?: boolean;
};

type FlatHit = SearchHit & { groupLabel: string; groupKey: string };

type Props = {
  open: boolean;
  closing: boolean;
  onClose: () => void;
  onNavigate: () => void;
};

const RECENT_KEY = 'wupapa.search.recent';
const RECENT_MAX = 6;
const IDLE_CATEGORY_LIMIT = 6;
const IDLE_ZONE_LIMIT = 6;

function readRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .map((x) => x.trim())
      .slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

function pushRecent(term: string): string[] {
  const q = term.trim();
  if (q.length < 2 || typeof window === 'undefined') return readRecent();
  const next = [q, ...readRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(
    0,
    RECENT_MAX,
  );
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}

function wipeRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    window.localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
  return [];
}

const IDLE_SECTION_LINKS = [
  { href: '/catalog', label: 'Каталог', key: 'sec-catalog' },
  { href: '/brands', label: 'Бренды', key: 'sec-brands' },
  { href: '/collections', label: 'Коллекции', key: 'sec-collections' },
  { href: '/blog', label: 'Блог', key: 'sec-blog' },
] as const;

type IdleNavItem =
  | { kind: 'recent'; term: string }
  | { kind: 'link'; href: string; key: string; label: string };

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M15 5L5 15M5 5l10 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

async function fetchSearchGroups(
  q: string,
  signal?: AbortSignal,
): Promise<SearchGroup[]> {
  const res = await fetch(`/api/public/search?q=${encodeURIComponent(q)}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) throw new Error('search failed');
  const data = (await res.json().catch(() => ({}))) as { groups?: SearchGroup[] };
  return Array.isArray(data.groups) ? data.groups : [];
}

function HitGlyph({ type }: { type: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    'aria-hidden': true as const,
  };
  const stroke = {
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (type) {
    case 'category':
      return (
        <svg {...common}>
          <path d="M3 7.5V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9.5a2 2 0 0 0-2-2h-7l-1.5-2H5a2 2 0 0 0-2 2Z" {...stroke} />
        </svg>
      );
    case 'product':
      return (
        <svg {...common}>
          <path
            d="M8 7h8c2.8 0 3.1 1.3 3.3 2.9l.8 6.2c.2 2-.4 3.7-3.3 3.7H7.2c-2.9 0-3.5-1.7-3.3-3.7l.8-6.2C5 8.3 5.3 7 8 7Z"
            {...stroke}
          />
          <path d="M8 8.2V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5v2.7" {...stroke} />
        </svg>
      );
    case 'brand':
      return (
        <svg {...common}>
          <path d="M12 3 4.5 6.5v5.2c0 4.4 3.2 8.3 7.5 9.3 4.3-1 7.5-4.9 7.5-9.3V6.5L12 3Z" {...stroke} />
          <path d="M12 11v5M12 8.2v.2" {...stroke} />
        </svg>
      );
    case 'tag':
      return (
        <svg {...common}>
          <path d="M12 3H5.5A2.5 2.5 0 0 0 3 5.5V12l9.4 9.4a1.5 1.5 0 0 0 2.1 0L21.4 14.5a1.5 1.5 0 0 0 0-2.1L12 3Z" {...stroke} />
          <circle cx="8" cy="8" r="1.2" fill="currentColor" />
        </svg>
      );
    case 'collection':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="8" height="8" rx="1" {...stroke} />
          <rect x="13" y="3" width="8" height="8" rx="1" {...stroke} />
          <rect x="3" y="13" width="8" height="8" rx="1" {...stroke} />
          <rect x="13" y="13" width="8" height="8" rx="1" {...stroke} />
        </svg>
      );
    case 'blog':
      return (
        <svg {...common}>
          <path d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" {...stroke} />
          <path d="M15 4v3h3M8 11h8M8 15h6" {...stroke} />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" {...stroke} />
        </svg>
      );
  }
}

export function HeaderSearchPanel({ open, closing, onClose, onNavigate }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchPanelInnerRef = useRef<HTMLDivElement>(null);
  const transition = useSiteTransition();
  const abortRef = useRef<AbortController | null>(null);
  const catalogRoots = useCatalogNavRoots();
  const { panelRef, panelVisible } = useOverlayPanel({
    open,
    closing,
    onClose,
    trapTab: false,
    handleEscape: false,
    enableContentReveal: false,
  });

  const [q, setQ] = useState('');
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [retryTick, setRetryTick] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [zoneTags, setZoneTags] = useState<{ slug: string; name: string }[]>([]);

  const flatHits = useMemo<FlatHit[]>(
    () =>
      groups.flatMap((g) =>
        g.items.map((item) => ({
          ...item,
          groupLabel: g.label,
          groupKey: g.key,
        })),
      ),
    [groups],
  );

  const idleCategories = catalogRoots.slice(0, IDLE_CATEGORY_LIMIT);

  const idleItems = useMemo<IdleNavItem[]>(() => {
    const items: IdleNavItem[] = [];
    for (const term of recent) {
      items.push({ kind: 'recent', term });
    }
    for (const c of idleCategories) {
      items.push({
        kind: 'link',
        key: `cat-${c.slug}`,
        label: c.name,
        href: `/catalog/${encodeURIComponent(c.slug)}`,
      });
    }
    for (const t of zoneTags) {
      items.push({
        kind: 'link',
        key: `zone-${t.slug}`,
        label: t.name,
        href: `/catalog?tag=${encodeURIComponent(t.slug)}`,
      });
    }
    for (const s of IDLE_SECTION_LINKS) {
      items.push({ kind: 'link', key: s.key, label: s.label, href: s.href });
    }
    return items;
  }, [recent, idleCategories, zoneTags]);

  const rememberQuery = useCallback((term: string) => {
    setRecent(pushRecent(term));
  }, []);

  const clearRecentHistory = useCallback(() => {
    setRecent(wipeRecent());
    setActiveIndex(-1);
  }, []);

  const goToHref = useCallback(
    (href: string, termForHistory?: string) => {
      const historyTerm = (termForHistory ?? q).trim();
      if (historyTerm.length >= 2) rememberQuery(historyTerm);
      window.dispatchEvent(new Event(MENU_COVERED_EVENT));
      onNavigate();
      if (transition && href.startsWith('/') && !href.startsWith('//')) {
        transition.navigateWithTransition(href, true);
      } else {
        window.location.assign(href);
      }
    },
    [onNavigate, transition, q, rememberQuery],
  );

  const clearQuery = useCallback(() => {
    setQ('');
    setGroups([]);
    setSearched(false);
    setLoadError(false);
    setActiveIndex(-1);
    setBusy(false);
    inputRef.current?.focus();
  }, []);

  /* Левый край как у пункта «Каталог» в хедере (grid 4/-2 чуть промахивается) */
  useLayoutEffect(() => {
    if (!panelVisible) return;
    const inner = searchPanelInnerRef.current;
    if (!inner) return;

    const sync = () => {
      if (window.matchMedia('(max-width: 1279px)').matches) {
        inner.style.removeProperty('--search-align-left');
        return;
      }
      const catalogBtn = document.querySelector<HTMLElement>(
        'header [data-section="categories"]',
      );
      const wrap = inner.parentElement;
      if (!catalogBtn || !wrap) {
        inner.style.removeProperty('--search-align-left');
        return;
      }
      inner.style.removeProperty('--search-align-left');
      const catalogLeft = catalogBtn.getBoundingClientRect().left;
      const wrapLeft = wrap.getBoundingClientRect().left;
      const offset = Math.max(0, Math.round(catalogLeft - wrapLeft));
      inner.style.setProperty('--search-align-left', `${offset}px`);
    };

    sync();
    const raf = requestAnimationFrame(sync);
    window.addEventListener('resize', sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', sync);
      inner.style.removeProperty('--search-align-left');
    };
  }, [panelVisible, open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setRecent(readRecent());
  }, [open]);

  useEffect(() => {
    if (!open || zoneTags.length > 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/catalog/tags', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json().catch(() => ({}))) as {
          items?: { slug?: string; name?: string }[];
        };
        if (cancelled || !Array.isArray(data.items)) return;
        setZoneTags(
          data.items
            .filter((t): t is { slug: string; name: string } =>
              Boolean(t?.slug && t?.name),
            )
            .slice(0, IDLE_ZONE_LIMIT),
        );
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, zoneTags.length]);

  /* Сброс state только после closing — контент живёт до конца slide-up */
  useEffect(() => {
    if (open || closing) return;
    abortRef.current?.abort();
    abortRef.current = null;
    setQ('');
    setGroups([]);
    setSearched(false);
    setLoadError(false);
    setBusy(false);
    setActiveIndex(-1);
  }, [open, closing]);

  useEffect(() => {
    if (!open) return;
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      abortRef.current?.abort();
      abortRef.current = null;
      setGroups([]);
      setSearched(false);
      setLoadError(false);
      setBusy(false);
      setActiveIndex(-1);
      return;
    }

    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setBusy(true);
      setLoadError(false);
      /* stale-while-revalidate: прошлые groups не чистим до ответа */
      void (async () => {
        try {
          const next = await fetchSearchGroups(trimmed, ac.signal);
          if (ac.signal.aborted) return;
          setGroups(next);
          setSearched(true);
          setLoadError(false);
          setActiveIndex(-1);
        } catch (err) {
          if (ac.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
            return;
          }
          setLoadError(true);
          setSearched(true);
          setActiveIndex(-1);
        } finally {
          if (!ac.signal.aborted) setBusy(false);
        }
      })();
    }, 220);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [q, open, retryTick]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const trimmed = q.trim();
    const idle = trimmed.length < 2;
    const navLen = idle ? idleItems.length : flatHits.length;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (q.trim()) {
          clearQuery();
          return;
        }
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const nodes = focusablesIn(panel);
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }
        const first = nodes[0]!;
        const last = nodes[nodes.length - 1]!;
        if (e.shiftKey) {
          if (document.activeElement === first || !panel.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else if (
          document.activeElement === last ||
          !panel.contains(document.activeElement)
        ) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (navLen === 0) return;
        e.preventDefault();
        setActiveIndex((prev) => {
          if (e.key === 'ArrowDown') {
            return prev < 0 ? 0 : (prev + 1) % navLen;
          }
          return prev <= 0 ? navLen - 1 : prev - 1;
        });
        return;
      }

      if (e.key === 'Enter') {
        if (idle) {
          const item = activeIndex >= 0 ? idleItems[activeIndex] : null;
          if (!item) return;
          e.preventDefault();
          if (item.kind === 'recent') {
            setQ(item.term);
            setActiveIndex(-1);
            inputRef.current?.focus();
            return;
          }
          goToHref(item.href);
          return;
        }
        if (activeIndex >= 0 && flatHits[activeIndex]) {
          e.preventDefault();
          goToHref(flatHits[activeIndex]!.href);
          return;
        }
        if (trimmed.length >= 2) {
          e.preventDefault();
          goToHref(`/search?q=${encodeURIComponent(trimmed)}`);
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    open,
    onClose,
    flatHits,
    idleItems,
    activeIndex,
    goToHref,
    q,
    clearQuery,
  ]);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-search-hit-index="${activeIndex}"], [data-search-idle-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [q]);

  /* iOS keyboard: max-height по visualViewport, не по layout viewport */
  useEffect(() => {
    if (!panelVisible) return;
    const list = listRef.current;
    if (!list) return;

    const update = () => {
      const vv = window.visualViewport;
      if (!vv) {
        list.style.maxHeight = '';
        return;
      }
      const top = list.getBoundingClientRect().top;
      const pad = 12;
      const available = Math.floor(vv.height - (top - vv.offsetTop) - pad);
      list.style.maxHeight = `${Math.max(140, available)}px`;
    };

    update();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      list.style.maxHeight = '';
    };
  }, [panelVisible, open, busy, groups, recent, zoneTags, q]);

  const totalHits = flatHits.length;
  const trimmedQ = q.trim();
  const showIdle = trimmedQ.length < 2;
  const hint =
    trimmedQ.length > 0 && trimmedQ.length < 2 ? 'Введите минимум 2 символа' : null;
  const showSkeleton = busy && totalHits === 0 && !loadError;
  const showStaleBusy = busy && totalHits > 0;
  const showEmpty = searched && !busy && !loadError && totalHits === 0 && !showIdle;
  const showError = loadError && !busy && totalHits === 0;
  const showErrorBanner = loadError && !busy && totalHits > 0;

  let hitOffset = 0;

  if (!panelVisible) return null;

  return (
    <HeaderOverlayShell
      id="header-search-panel"
      open={open}
      closing={closing}
      contentRevealed={false}
      onClose={onClose}
      ariaLabel="Поиск по сайту"
      panelRef={panelRef}
      panelClassName={styles.searchPanel}
      scrimLabel="Закрыть поиск"
    >
            <div className="padding-global">
              <div className={styles.siteHeaderWrap}>
                <div className={styles.searchPanelInner} ref={searchPanelInnerRef}>
                  <div className={styles.searchFieldRow}>
                    <label className={styles.srOnly} htmlFor={inputId}>
                      Поиск по сайту
                    </label>
                    <div className={styles.searchInputWrap}>
                      <input
                        ref={inputRef}
                        id={inputId}
                        type="text"
                        role="combobox"
                        inputMode="search"
                        enterKeyHint="search"
                        className={styles.searchInput}
                        placeholder="Товар, категория, бренд, зона, коллекция или блог"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        aria-autocomplete="list"
                        aria-expanded={open}
                        aria-haspopup="listbox"
                        aria-controls="header-search-results"
                      aria-activedescendant={
                        activeIndex >= 0
                          ? showIdle
                            ? `header-search-idle-${activeIndex}`
                            : `header-search-hit-${activeIndex}`
                          : undefined
                      }
                      />
                      {q.length > 0 ? (
                        <button
                          type="button"
                          className={styles.searchClearBtn}
                          aria-label="Очистить запрос"
                          onClick={clearQuery}
                        >
                          <ClearIcon />
                        </button>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className={styles.searchCloseBtn}
                      aria-label="Закрыть поиск"
                      onClick={onClose}
                    >
                      <span className={styles.searchCloseBtnLabel}>Закрыть</span>
                      <svg
                        className={styles.searchCloseBtnIcon}
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>

                  <div
                    id="header-search-results"
                    ref={listRef}
                    className={styles.searchResults}
                    role={showIdle ? 'region' : 'listbox'}
                    aria-label={showIdle ? 'Подсказки поиска' : 'Результаты поиска'}
                    aria-busy={busy}
                    aria-live="polite"
                  >
                    {showIdle ? (
                      <div className={styles.searchIdle}>
                        {hint ? <p className={styles.searchMeta}>{hint}</p> : null}

                        {recent.length > 0 ? (
                          <section className={styles.searchIdleSection}>
                            <div className={styles.searchGroupHead}>
                              <h2 className={styles.searchGroupLabel}>Недавние</h2>
                              <button
                                type="button"
                                className={styles.searchRecentClear}
                                onClick={clearRecentHistory}
                              >
                                Очистить
                              </button>
                            </div>
                            <div className={styles.searchIdleChips}>
                              {recent.map((term) => {
                                const index = hitOffset++;
                                const active = index === activeIndex;
                                return (
                                  <button
                                    key={term}
                                    id={`header-search-idle-${index}`}
                                    type="button"
                                    className={`${styles.searchIdleChip} ${active ? styles.searchIdleChipActive : ''}`.trim()}
                                    data-search-idle-index={index}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => {
                                      setQ(term);
                                      setActiveIndex(-1);
                                      inputRef.current?.focus();
                                    }}
                                  >
                                    {term}
                                  </button>
                                );
                              })}
                            </div>
                          </section>
                        ) : null}

                        {idleCategories.length > 0 ? (
                          <section className={styles.searchIdleSection}>
                            <h2 className={styles.searchGroupLabel}>Категории</h2>
                            <ul className={styles.searchHitList} role="list">
                              {idleCategories.map((c) => {
                                const index = hitOffset++;
                                const active = index === activeIndex;
                                return (
                                  <li key={c.slug}>
                                    <TransitionLink
                                      id={`header-search-idle-${index}`}
                                      href={`/catalog/${encodeURIComponent(c.slug)}`}
                                      className={`${styles.searchHit} ${active ? styles.searchHitActive : ''}`.trim()}
                                      fromMenu
                                      data-search-idle-index={index}
                                      onMouseEnter={() => setActiveIndex(index)}
                                      onClick={() => {
                                        window.dispatchEvent(new Event(MENU_COVERED_EVENT));
                                        onNavigate();
                                      }}
                                    >
                                      <span className={styles.searchHitPh} aria-hidden>
                                        <HitGlyph type="category" />
                                      </span>
                                      <span className={styles.searchHitText}>
                                        <span className={styles.searchHitTitle}>{c.name}</span>
                                      </span>
                                    </TransitionLink>
                                  </li>
                                );
                              })}
                            </ul>
                          </section>
                        ) : null}

                        {zoneTags.length > 0 ? (
                          <section className={styles.searchIdleSection}>
                            <h2 className={styles.searchGroupLabel}>Зоны</h2>
                            <ul className={styles.searchHitList} role="list">
                              {zoneTags.map((t) => {
                                const index = hitOffset++;
                                const active = index === activeIndex;
                                return (
                                  <li key={t.slug}>
                                    <TransitionLink
                                      id={`header-search-idle-${index}`}
                                      href={`/catalog?tag=${encodeURIComponent(t.slug)}`}
                                      className={`${styles.searchHit} ${active ? styles.searchHitActive : ''}`.trim()}
                                      fromMenu
                                      data-search-idle-index={index}
                                      onMouseEnter={() => setActiveIndex(index)}
                                      onClick={() => {
                                        window.dispatchEvent(new Event(MENU_COVERED_EVENT));
                                        onNavigate();
                                      }}
                                    >
                                      <span className={styles.searchHitPh} aria-hidden>
                                        <HitGlyph type="tag" />
                                      </span>
                                      <span className={styles.searchHitText}>
                                        <span className={styles.searchHitTitle}>{t.name}</span>
                                      </span>
                                    </TransitionLink>
                                  </li>
                                );
                              })}
                            </ul>
                          </section>
                        ) : null}

                        <section className={styles.searchIdleSection}>
                          <h2 className={styles.searchGroupLabel}>Разделы</h2>
                          <div className={styles.searchEmptyActions}>
                            {IDLE_SECTION_LINKS.map((s) => {
                              const index = hitOffset++;
                              const active = index === activeIndex;
                              return (
                                <TransitionLink
                                  key={s.key}
                                  id={`header-search-idle-${index}`}
                                  href={s.href}
                                  className={`${styles.searchEmptyLink} ${active ? styles.searchIdleLinkActive : ''}`.trim()}
                                  fromMenu
                                  data-search-idle-index={index}
                                  onMouseEnter={() => setActiveIndex(index)}
                                  onClick={() => {
                                    window.dispatchEvent(new Event(MENU_COVERED_EVENT));
                                    onNavigate();
                                  }}
                                >
                                  {s.label}
                                </TransitionLink>
                              );
                            })}
                          </div>
                        </section>
                      </div>
                    ) : null}

                    {!showIdle && showStaleBusy ? (
                      <p className={styles.searchQuietBusy} aria-live="polite">
                        Ищем…
                      </p>
                    ) : null}

                    {!showIdle && showSkeleton ? (
                      <div className={styles.searchSkeleton} aria-hidden>
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className={styles.searchSkeletonRow}>
                            <span className={styles.searchSkeletonThumb} />
                            <span className={styles.searchSkeletonLines}>
                              <span className={styles.searchSkeletonLine} />
                              <span
                                className={`${styles.searchSkeletonLine} ${styles.searchSkeletonLineShort}`}
                              />
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {!showIdle && showErrorBanner ? (
                      <p className={styles.searchMeta}>
                        Не удалось обновить.{' '}
                        <button
                          type="button"
                          className={styles.searchEmptyBtn}
                          onClick={() => setRetryTick((n) => n + 1)}
                        >
                          Повторить
                        </button>
                      </p>
                    ) : null}

                    {!showIdle && showError ? (
                      <div className={styles.searchEmpty}>
                        <p className={styles.searchMeta}>Не удалось загрузить</p>
                        <div className={styles.searchEmptyActions}>
                          <button
                            type="button"
                            className={styles.searchEmptyBtn}
                            onClick={() => setRetryTick((n) => n + 1)}
                          >
                            Повторить
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {!showIdle && showEmpty ? (
                      <div className={styles.searchEmpty}>
                        <p className={styles.searchMeta}>Ничего не найдено</p>
                        <div className={styles.searchEmptyActions}>
                          <button
                            type="button"
                            className={styles.searchEmptyBtn}
                            onClick={clearQuery}
                          >
                            Сбросить
                          </button>
                          <TransitionLink
                            href={`/search?q=${encodeURIComponent(trimmedQ)}`}
                            className={styles.searchEmptyLink}
                            fromMenu
                            onClick={() => {
                              rememberQuery(q);
                              window.dispatchEvent(new Event(MENU_COVERED_EVENT));
                              onNavigate();
                            }}
                          >
                            Страница поиска
                          </TransitionLink>
                          <TransitionLink
                            href="/catalog"
                            className={styles.searchEmptyLink}
                            fromMenu
                            onClick={() => {
                              window.dispatchEvent(new Event(MENU_COVERED_EVENT));
                              onNavigate();
                            }}
                          >
                            В каталог
                          </TransitionLink>
                          <TransitionLink
                            href="/blog"
                            className={styles.searchEmptyLink}
                            fromMenu
                            onClick={() => {
                              window.dispatchEvent(new Event(MENU_COVERED_EVENT));
                              onNavigate();
                            }}
                          >
                            В блог
                          </TransitionLink>
                        </div>
                      </div>
                    ) : null}

                    {!showIdle && !showSkeleton
                      ? groups.map((group) => {
                          const offset = hitOffset;
                          hitOffset += group.items.length;
                          const showAll =
                            Boolean(group.hasMore) ||
                            (typeof group.total === 'number' &&
                              group.total > group.items.length);
                          const allHref = `/search?q=${encodeURIComponent(trimmedQ)}#search-${group.key}`;
                          return (
                            <section key={group.key} className={styles.searchGroup}>
                              <div className={styles.searchGroupHead}>
                                <h2 className={styles.searchGroupLabel}>{group.label}</h2>
                                {showAll ? (
                                  <TransitionLink
                                    href={allHref}
                                    className={styles.searchGroupAll}
                                    fromMenu
                                    onClick={() => {
                                      rememberQuery(q);
                                      window.dispatchEvent(new Event(MENU_COVERED_EVENT));
                                      onNavigate();
                                    }}
                                  >
                                    Смотреть все
                                    {typeof group.total === 'number' && group.total > group.items.length
                                      ? ` · ${group.total}`
                                      : ''}
                                  </TransitionLink>
                                ) : null}
                              </div>
                              <ul className={styles.searchHitList} role="presentation">
                                {group.items.map((hit, i) => {
                                  const index = offset + i;
                                  const active = index === activeIndex;
                                  return (
                                    <li key={`${group.key}-${hit.id}`} role="presentation">
                                      <TransitionLink
                                        id={`header-search-hit-${index}`}
                                        href={hit.href}
                                        className={`${styles.searchHit} ${active ? styles.searchHitActive : ''}`.trim()}
                                        fromMenu
                                        role="option"
                                        aria-selected={active}
                                        data-search-hit-index={index}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => {
                                          rememberQuery(q);
                                          window.dispatchEvent(new Event(MENU_COVERED_EVENT));
                                          onNavigate();
                                        }}
                                      >
                                        {hit.imageUrl ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={hit.imageUrl}
                                            alt=""
                                            className={styles.searchHitImg}
                                          />
                                        ) : (
                                          <span className={styles.searchHitPh} aria-hidden>
                                            <HitGlyph type={group.key} />
                                          </span>
                                        )}
                                        <span className={styles.searchHitText}>
                                          <span className={styles.searchHitTitle}>
                                            {highlightSearchTitle(hit.title, trimmedQ).map(
                                              (part, pi) =>
                                                part.mark ? (
                                                  <mark
                                                    key={pi}
                                                    className={styles.searchHitMark}
                                                  >
                                                    {part.text}
                                                  </mark>
                                                ) : (
                                                  <span key={pi}>{part.text}</span>
                                                ),
                                            )}
                                          </span>
                                          {hit.subtitle ? (
                                            <span className={styles.searchHitSub}>
                                              {hit.subtitle}
                                            </span>
                                          ) : null}
                                        </span>
                                      </TransitionLink>
                                    </li>
                                  );
                                })}
                              </ul>
                            </section>
                          );
                        })
                      : null}

                    {!showIdle && !showSkeleton && totalHits > 0 ? (
                      <div className={styles.searchAllFooter}>
                        <TransitionLink
                          href={`/search?q=${encodeURIComponent(trimmedQ)}`}
                          className={styles.searchAllFooterLink}
                          fromMenu
                          onClick={() => {
                            rememberQuery(q);
                            window.dispatchEvent(new Event(MENU_COVERED_EVENT));
                            onNavigate();
                          }}
                        >
                          Все результаты по запросу «{trimmedQ}»
                        </TransitionLink>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
    </HeaderOverlayShell>
  );
}
