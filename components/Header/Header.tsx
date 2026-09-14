'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCatalogNavRoots } from '@/components/CatalogNavContext';
import { TransitionLink, useSiteTransition, MENU_COVERED_EVENT, TRANSITION_ENTER_COMPLETE_EVENT } from '@/components/SiteTransition';
import { LogoPaths } from '@/components/SiteLoader/LogoPaths';
import {
  animateLogoWaveIn,
  logoWaveDistance,
  preloadLogoWaveAnime,
  prepareLogoWaveIn,
  resetLogoWaveVisible,
} from '@/components/SiteLoader/logoWave';
import { SITE_LOGO_SRC, SITE_NAME } from '@/lib/brand';
import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import { ScrollCatalogStripPanel } from '@/sections/home/ScrollCatalog/ScrollCatalogStripPanel';
import { USER_SESSION_CHANGED_EVENT } from '@/lib/userSessionClient';
import styles from './Header.module.css';
import { HeaderSearchPanel } from './HeaderSearchPanel';

const MENU_SECTIONS = [
  { id: 'categories', href: '/catalog', label: 'Каталог' },
  { id: 'zones', href: '/catalog', label: 'Зоны' },
  { id: 'brands', href: '/brands', label: 'Бренды' },
] as const;

const SUPER_MENU_PANEL_ID = 'super-menu-panel';
const MOBILE_MENU_PANEL_ID = 'mobile-menu-panel';
const BODY_SUPER_MENU_OPEN = 'header-super-menu-open';
const BODY_MOBILE_MENU_OPEN = 'header-mobile-menu-open';

const SUPER_MENU_FALLBACK_LINKS = [
  'Гостиная',
  'Столовая',
  'Свет',
  'Офис',
  'Отель',
  'Декор',
  'Сад',
] as const;

const MOBILE_INFO_LINKS = [
  { href: '/about', label: 'О нас' },
  { href: '/designers', label: 'Дизайнеры' },
  { href: '/projects', label: 'Проекты и концепции' },
  { href: '/blog', label: 'Новости и статьи' },
  { href: '/delivery', label: 'Доставка и оплата' },
  { href: '/warranty', label: 'Гарантия, обмен и возврат' },
  { href: '/referral', label: 'Реферальная программа' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contacts', label: 'Контакты' },
] as const;

/** Пока нет URL в настройках — заглушка. */
const TELEGRAM_HREF = 'https://t.me/';

function motionMs(full: number) {
  if (typeof window === 'undefined') return full;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : full;
}

function MenuChevron({ open }: { open: boolean }) {
  return (
    <figure className={styles.menuChevron} aria-hidden data-open={open || undefined}>
      <svg xmlns="http://www.w3.org/2000/svg" width="9" height="5" viewBox="0 0 9 5" fill="none">
        <path d="M0 0L4.5 5L9 0" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </figure>
  );
}

export type HeaderVariant = 'default' | 'minimal' | 'main';

const headerClassMap: Record<HeaderVariant, string> = {
  default: styles.header,
  minimal: styles.headerMinimal,
  main: styles.headerMain,
};

export function Header({
  variant = 'default',
  isMainOverlayOnHome = false,
  showHeroLogoBadge: _showHeroLogoBadge = false,
  superMenuOpen: superMenuOpenProp,
  setSuperMenuOpen: setSuperMenuOpenProp,
}: {
  variant?: HeaderVariant;
  isMainOverlayOnHome?: boolean;
  /** @deprecated бейдж убран — только логотип */
  showHeroLogoBadge?: boolean;
  superMenuOpen?: boolean;
  setSuperMenuOpen?: (open: boolean) => void;
}) {
  const [mainOverlayVisible, setMainOverlayVisible] = useState(false);
  const [internalSuperMenuOpen, setInternalSuperMenuOpen] = useState(false);
  const [logoWaveReady, setLogoWaveReady] = useState(false);
  const [logoFading, setLogoFading] = useState(false);
  /** >0 — перезапуск wave после client-nav / page transition */
  const [logoWaveSeq, setLogoWaveSeq] = useState(0);
  const logoWaveRef = useRef<HTMLSpanElement>(null);
  /** Лого уже показано — не перезапускать wave только при смене variant на той же странице. */
  const logoRevealedRef = useRef(false);
  const isFirstPathnameRef = useRef(true);
  const pathname = usePathname();
  const superMenuOpen = setSuperMenuOpenProp !== undefined ? (superMenuOpenProp ?? false) : internalSuperMenuOpen;
  const setSuperMenuOpen = setSuperMenuOpenProp ?? setInternalSuperMenuOpen;
  const [superMenuSection, setSuperMenuSection] = useState<string | null>(null);
  const [superMenuClosing, setSuperMenuClosing] = useState(false);
  const [superMenuContentRevealed, setSuperMenuContentRevealed] = useState(false);
  const siteTransition = useSiteTransition();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuContentRevealed, setMobileMenuContentRevealed] = useState(false);
  const [mobileMenuClosing, setMobileMenuClosing] = useState(false);
  const [mobileMenuCatalogOpen, setMobileMenuCatalogOpen] = useState(false);
  const [mobileMenuZonesOpen, setMobileMenuZonesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchClosing, setSearchClosing] = useState(false);
  const [accountEntryHref, setAccountEntryHref] = useState('/login');
  const [accountAuthenticated, setAccountAuthenticated] = useState(false);
  const mobileMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const restoreSearchFocusRef = useRef(false);
  const closeSearchRef = useRef<(opts?: { restoreFocus?: boolean }) => void>(() => {});
  const dismissMobileMenuInstantRef = useRef<() => void>(() => {});
  const isTransitioningRef = useRef(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeSuperMenuRef = useRef<() => void>(() => {});
  const setSuperMenuOpenRef = useRef(setSuperMenuOpen);
  const superMenuPanelRef = useRef<HTMLDivElement | null>(null);
  const catalogMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const superMenuMenuColRef = useRef<HTMLDivElement>(null);
  const superMenuTagsPanelRef = useRef<HTMLDivElement>(null);
  setSuperMenuOpenRef.current = setSuperMenuOpen;
  const catalogRoots = useCatalogNavRoots();
  const [catalogTags, setCatalogTags] = useState<
    { slug: string; name: string; coverImageUrl: string | null }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/catalog/tags', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          items?: { slug: string; name: string; coverImageUrl?: string | null }[];
        };
        const items = (data.items ?? [])
          .filter((t) => t.slug && t.name)
          .map((t) => ({
            slug: t.slug,
            name: t.name,
            coverImageUrl: t.coverImageUrl ?? null,
          }));
        if (!cancelled) setCatalogTags(items);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    preloadLogoWaveAnime();
  }, []);

  /* Перезапуск wave при смене страницы (главная → каталог и т.д.) */
  useEffect(() => {
    if (isFirstPathnameRef.current) {
      isFirstPathnameRef.current = false;
      return;
    }
    const deferForPageTransition =
      document.documentElement.style.getPropertyValue('--site-transition-entering') === '1';
    if (deferForPageTransition) return;
    setLogoWaveSeq((seq) => seq + 1);
  }, [pathname]);

  /* Wave после ширмы mega-menu */
  useEffect(() => {
    const onTransitionEnterComplete = (event: Event) => {
      const fromMenu = (event as CustomEvent<{ fromMenu?: boolean }>).detail?.fromMenu;
      if (!fromMenu) return;
      setLogoWaveSeq((seq) => seq + 1);
    };
    window.addEventListener(TRANSITION_ENTER_COMPLETE_EVENT, onTransitionEnterComplete);
    return () => window.removeEventListener(TRANSITION_ENTER_COMPLETE_EVENT, onTransitionEnterComplete);
  }, []);

  useEffect(() => {
    const el = logoWaveRef.current;
    if (!el) return;

    let cancelled = false;
    let safetyTimer: number | undefined;

    const revealStatic = () => {
      resetLogoWaveVisible(el);
      logoRevealedRef.current = true;
      if (!cancelled) setLogoWaveReady(true);
    };

    const playWave = () => {
      if (cancelled) return;
      void (async () => {
        await preloadLogoWaveAnime();
        if (cancelled) return;
        if (variant === 'main' && isMainOverlayOnHome && !mainOverlayVisible) return;

        const distance = logoWaveDistance(el);
        prepareLogoWaveIn(el, distance);
        if (!cancelled) setLogoWaveReady(false);

        try {
          await animateLogoWaveIn(el, distance);
        } catch {
          resetLogoWaveVisible(el);
        } finally {
          if (cancelled) {
            resetLogoWaveVisible(el);
            return;
          }
          logoRevealedRef.current = true;
          setLogoWaveReady(true);
        }
      })();
    };

    /* Overlay main ещё не показан — ждём, буквы не трогаем. */
    if (variant === 'main' && isMainOverlayOnHome && !mainOverlayVisible) {
      return () => {
        cancelled = true;
        resetLogoWaveVisible(el);
      };
    }

    const isInitialWave = logoWaveSeq === 0 && !logoRevealedRef.current;
    const isReplayWave = logoWaveSeq > 0;

    /*
     * Уже сыграли wave — при переходе minimal→main на той же странице
     * не прячем буквы и не перезапускаем анимацию.
     */
    if (logoRevealedRef.current && !isReplayWave) {
      revealStatic();
      return () => {
        cancelled = true;
        resetLogoWaveVisible(el);
      };
    }

    const runWhenReady = () => {
      if (cancelled) return;
      playWave();
    };

    if (!isInitialWave && !isReplayWave) {
      return () => {
        cancelled = true;
        resetLogoWaveVisible(el);
      };
    }

    safetyTimer = window.setTimeout(() => {
      if (!cancelled && !logoRevealedRef.current) {
        revealStatic();
      }
    }, 3000);

    /* Первый заход: ждём SiteLoader. Replay после nav — сразу. */
    const waitForLoader =
      isInitialWave &&
      Boolean(document.querySelector('[data-site-loader]')) &&
      !document.body.classList.contains('--js-ready');

    if (!waitForLoader) {
      runWhenReady();
      return () => {
        cancelled = true;
        window.clearTimeout(safetyTimer);
        resetLogoWaveVisible(el);
      };
    }

    const mo = new MutationObserver(() => {
      if (document.body.classList.contains('--js-ready')) {
        mo.disconnect();
        runWhenReady();
      }
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    const fallback = window.setTimeout(() => {
      mo.disconnect();
      runWhenReady();
    }, 4000);

    return () => {
      cancelled = true;
      mo.disconnect();
      window.clearTimeout(fallback);
      window.clearTimeout(safetyTimer);
      resetLogoWaveVisible(el);
    };
  }, [variant, mainOverlayVisible, isMainOverlayOnHome, logoWaveSeq]);

  /* Уход с hero: плавный opacity лого (без wave-out) */
  useEffect(() => {
    if (variant !== 'minimal') return;
    const hero = document.getElementById('hero-section');
    if (!hero) return;

    let raf = 0;
    const update = () => {
      const bottom = hero.getBoundingClientRect().bottom;
      /* Начинаем гасить лого, когда низ hero подходит к верху вьюпорта */
      const fading = bottom < 160;
      setLogoFading(fading);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
      setLogoFading(false);
    };
  }, [variant]);

  const syncSuperMenuCatalogLayout = useCallback(() => {
    const catalogBtn = catalogMenuTriggerRef.current;
    const menuCol = superMenuMenuColRef.current;
    const tagsPanel = superMenuTagsPanelRef.current;
    if (!catalogBtn || !menuCol || !tagsPanel) return;

    menuCol.style.marginLeft = '0';
    const catalogLeft = catalogBtn.getBoundingClientRect().left;
    const menuLeft = menuCol.getBoundingClientRect().left;
    const offset = Math.round(catalogLeft - menuLeft);
    if (offset !== 0) {
      menuCol.style.marginLeft = `${offset}px`;
    }

    const tagsLeft = tagsPanel.getBoundingClientRect().left;
    tagsPanel.style.setProperty('--super-menu-strip-left', `${tagsLeft}px`);
  }, []);

  useLayoutEffect(() => {
    if (!superMenuOpen || superMenuClosing || superMenuSection !== 'categories') return;

    syncSuperMenuCatalogLayout();
    const raf = requestAnimationFrame(syncSuperMenuCatalogLayout);
    window.addEventListener('resize', syncSuperMenuCatalogLayout);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', syncSuperMenuCatalogLayout);
    };
  }, [
    superMenuOpen,
    superMenuClosing,
    superMenuSection,
    superMenuContentRevealed,
    catalogRoots.length,
    catalogTags.length,
    syncSuperMenuCatalogLayout,
  ]);

  useEffect(() => {
    if (superMenuOpen) return;
    if (superMenuMenuColRef.current) superMenuMenuColRef.current.style.marginLeft = '';
    if (superMenuTagsPanelRef.current) {
      superMenuTagsPanelRef.current.style.removeProperty('--super-menu-strip-left');
    }
  }, [superMenuOpen]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/user/session', { cache: 'no-store', credentials: 'same-origin' });
        const data = (await res.json().catch(() => ({}))) as { authenticated?: boolean };
        if (cancelled) return;
        const authed = data.authenticated === true;
        setAccountAuthenticated(authed);
        setAccountEntryHref(authed ? '/account/orders' : '/login');
      } catch {
        if (!cancelled) {
          setAccountAuthenticated(false);
          setAccountEntryHref('/login');
        }
      }
    };
    void load();
    const onSessionChanged = () => {
      void load();
    };
    window.addEventListener(USER_SESSION_CHANGED_EVENT, onSessionChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(USER_SESSION_CHANGED_EVENT, onSessionChanged);
    };
  }, []);

  const closeSuperMenu = () => {
    if (!superMenuOpen || superMenuClosing) return;
    setSuperMenuContentRevealed(false);
    setSuperMenuSection(null);
    setSuperMenuClosing(true);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      setSuperMenuOpenRef.current(false);
      setSuperMenuClosing(false);
      isTransitioningRef.current = false;
    }, 560);
  };
  closeSuperMenuRef.current = closeSuperMenu;

  const dismissMobileMenuInstant = useCallback(() => {
    if (mobileMenuCloseTimeoutRef.current) {
      clearTimeout(mobileMenuCloseTimeoutRef.current);
      mobileMenuCloseTimeoutRef.current = null;
    }
    setMobileMenuOpen(false);
    setMobileMenuClosing(false);
    setMobileMenuContentRevealed(false);
  }, []);
  dismissMobileMenuInstantRef.current = dismissMobileMenuInstant;

  const closeSearch = useCallback((opts?: { restoreFocus?: boolean }) => {
    if (!searchOpen && !searchClosing) return;
    const shouldRestore = opts?.restoreFocus === true;
    restoreSearchFocusRef.current = shouldRestore;

    /* Фокус уводим до open=false → inert, иначе фокус «зависает» в inert-узле */
    if (shouldRestore) {
      searchBtnRef.current?.focus();
    } else {
      const active = document.activeElement;
      const panel = document.getElementById('header-search-panel');
      if (active instanceof HTMLElement && panel?.contains(active)) {
        active.blur();
      }
    }

    setSearchClosing(true);
    setSearchOpen(false);
    if (searchCloseTimeoutRef.current) clearTimeout(searchCloseTimeoutRef.current);
    searchCloseTimeoutRef.current = setTimeout(() => {
      setSearchClosing(false);
      searchCloseTimeoutRef.current = null;
      if (restoreSearchFocusRef.current) {
        restoreSearchFocusRef.current = false;
        searchBtnRef.current?.focus();
      }
    }, motionMs(560));
  }, [searchOpen, searchClosing]);
  closeSearchRef.current = closeSearch;

  const openSearch = useCallback(() => {
    if (searchClosing) return;
    closeSuperMenuRef.current();
    dismissMobileMenuInstant();
    setSearchOpen(true);
    setSearchClosing(false);
  }, [searchClosing, dismissMobileMenuInstant]);

  useEffect(() => {
    const onHotkey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const editable =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        Boolean(target?.isContentEditable);

      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (searchOpen && !searchClosing) {
          document
            .querySelector<HTMLInputElement>('#header-search-panel input')
            ?.focus();
          return;
        }
        openSearch();
        return;
      }

      if (e.key === '/' && !editable && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', onHotkey);
    return () => window.removeEventListener('keydown', onHotkey);
  }, [openSearch, searchOpen, searchClosing]);

  useEffect(() => {
    const onMenuCovered = () => {
      closeSuperMenuRef.current();
      closeSearchRef.current({ restoreFocus: false });
      dismissMobileMenuInstantRef.current();
    };
    window.addEventListener(MENU_COVERED_EVENT, onMenuCovered);
    return () => window.removeEventListener(MENU_COVERED_EVENT, onMenuCovered);
  }, []);

  const navigateFromSuperMenu = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href');
    if (href && siteTransition) {
      e.preventDefault();
      siteTransition.navigateWithTransition(href, true);
    }
  };

  useEffect(() => {
    if (variant === 'main' && isMainOverlayOnHome) {
      setMainOverlayVisible(false);
      const t = setTimeout(() => setMainOverlayVisible(true), 20);
      return () => clearTimeout(t);
    }
    setMainOverlayVisible(false);
  }, [variant, isMainOverlayOnHome]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!superMenuOpen || superMenuClosing) {
      setSuperMenuContentRevealed(false);
      return;
    }
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSuperMenuContentRevealed(true));
    });
    return () => cancelAnimationFrame(rafId);
  }, [superMenuOpen, superMenuClosing]);

  useEffect(() => {
    const anyOverlay =
      superMenuOpen || superMenuClosing || searchOpen || searchClosing;
    document.body.classList.toggle(BODY_SUPER_MENU_OPEN, anyOverlay);
    return () => document.body.classList.remove(BODY_SUPER_MENU_OPEN);
  }, [superMenuOpen, superMenuClosing, searchOpen, searchClosing]);

  useEffect(() => {
    if (!superMenuOpen && !superMenuClosing) {
      setSuperMenuSection(null);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      /* Поиск: Escape обрабатывает HeaderSearchPanel */
      if (searchOpen) return;
      closeSuperMenuRef.current();
    };
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const panel = superMenuPanelRef.current;
      if (panel?.contains(target)) return;
      if ((e.target as Element)?.closest?.('[data-section]')) return;
      closeSuperMenuRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClickOutside);
    };
  }, [superMenuOpen, superMenuClosing, searchOpen]);

  // При открытии с minimal: при скролле вниз сразу закрываем супер-меню
  const lastScrollYRef = useRef(0);
  useEffect(() => {
    if (!superMenuOpen || variant !== 'minimal') return;
    lastScrollYRef.current = typeof window !== 'undefined' ? window.scrollY : 0;
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollYRef.current) {
        closeSuperMenuRef.current();
      }
      lastScrollYRef.current = currentScrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [superMenuOpen, variant]);

  const openSuperMenu = (sectionId: string) => {
    if (sectionId !== 'categories' && sectionId !== 'zones') return;
    closeSearchRef.current({ restoreFocus: false });
    if (superMenuOpen && superMenuSection === sectionId) {
      closeSuperMenu();
      return;
    }
    if (superMenuOpen && superMenuSection !== sectionId) {
      isTransitioningRef.current = true;
      setSuperMenuContentRevealed(false);
      setSuperMenuSection(sectionId);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSuperMenuContentRevealed(true));
      });
      return;
    }
    setSuperMenuClosing(false);
    setSuperMenuSection(sectionId);
    setSuperMenuOpen(true);
  };

  const closeSuperMenuIfOpen = () => {
    if (superMenuOpen) closeSuperMenu();
  };

  const closeMobileMenu = () => {
    if (!mobileMenuOpen || mobileMenuClosing) return;
    setMobileMenuContentRevealed(false);
    setMobileMenuClosing(true);
    if (mobileMenuCloseTimeoutRef.current) clearTimeout(mobileMenuCloseTimeoutRef.current);
    mobileMenuCloseTimeoutRef.current = setTimeout(() => {
      mobileMenuCloseTimeoutRef.current = null;
      setMobileMenuOpen(false);
      setMobileMenuClosing(false);
      setMobileMenuCatalogOpen(false);
      setMobileMenuZonesOpen(false);
    }, 280);
  };
  const toggleMobileMenu = () => {
    if (mobileMenuClosing) return;
    setMobileMenuOpen((o) => !o);
  };

  useEffect(() => {
    if (!mobileMenuOpen || mobileMenuClosing) {
      setMobileMenuContentRevealed(false);
      return;
    }
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => setMobileMenuContentRevealed(true));
    });
    return () => cancelAnimationFrame(rafId);
  }, [mobileMenuOpen, mobileMenuClosing]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileMenu();
    };
    document.body.classList.add(BODY_MOBILE_MENU_OPEN);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove(BODY_MOBILE_MENU_OPEN);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    return () => {
      if (mobileMenuCloseTimeoutRef.current) clearTimeout(mobileMenuCloseTimeoutRef.current);
    };
  }, []);

  // При открытии с minimal остаёмся minimal; с main — без изменений
  const openedFromMinimal = superMenuOpen && variant === 'minimal';
  const superMenuVisible = superMenuOpen || superMenuClosing;
  const searchPanelOpen = searchOpen || searchClosing;

  const className = [
    headerClassMap[variant] ?? styles.header,
    variant === 'main' && isMainOverlayOnHome && styles.headerMainOverlay,
    variant === 'main' && isMainOverlayOnHome && mainOverlayVisible && styles.headerMainOverlayVisible,
    (superMenuVisible || searchPanelOpen) && styles.headerSuperMenuOpen,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={className}>
      <div className={`padding-global ${styles.headerBar}`}>
        <div className={styles.siteHeaderWrap}>
          <div
            className={[styles.logoBlock, logoFading ? styles.logoBlockFading : '']
              .filter(Boolean)
              .join(' ')}
          >
            <Link href="/" aria-label="На главную" className={styles.logoLink}>
              <span className={styles.logoWaveMark} ref={logoWaveRef} aria-hidden={!logoWaveReady}>
                <LogoPaths className={styles.logoWaveSvg} />
              </span>
              <span className={styles.srOnly}>{SITE_NAME}</span>
            </Link>
          </div>
          <nav className={styles.siteHeaderNav} aria-label="Основное меню">
            <div className={styles.siteHeaderMenu}>
              {MENU_SECTIONS.map(({ id, href, label }) =>
                id === 'categories' || id === 'zones' ? (
                  <button
                    key={id}
                    type="button"
                    ref={id === 'categories' ? catalogMenuTriggerRef : undefined}
                    className={styles.menuItem}
                    onClick={() => openSuperMenu(id)}
                    aria-expanded={superMenuOpen && superMenuSection === id}
                    aria-controls={SUPER_MENU_PANEL_ID}
                    aria-haspopup="true"
                    data-section={id}
                  >
                    <span className={styles.menuItemText}>{label}</span>
                    <MenuChevron open={superMenuOpen && superMenuSection === id} />
                  </button>
                ) : (
                  <Link
                    key={id}
                    href={href}
                    className={styles.menuItem}
                    onClick={closeSuperMenuIfOpen}
                    data-section={id}
                  >
                    <span className={styles.menuItemText}>{label}</span>
                  </Link>
                ),
              )}
            </div>
          </nav>
          <nav className={styles.rightNav} aria-label="Аккаунт, поиск и меню">
            <Link
              href={accountEntryHref}
              className={styles.accountTextLink}
              aria-label={accountAuthenticated ? 'Профиль' : 'Войти'}
            >
              <span className={styles.menuItemText}>
                {accountAuthenticated ? 'Профиль' : 'Войти'}
              </span>
            </Link>
            <button
              ref={searchBtnRef}
              type="button"
              className={styles.iconBtn}
              aria-label="Поиск"
              aria-keyshortcuts="Meta+K Control+K"
              aria-expanded={searchOpen}
              aria-controls="header-search-panel"
              onClick={() => {
                /* Mobile: тот же openSearch, что и пункт меню (не toggle) */
                if (searchOpen) {
                  closeSearch({ restoreFocus: true });
                  return;
                }
                openSearch();
              }}
            >
              <img src="/icons/search-normal.svg" alt="" width={20} height={20} />
            </button>
            <button
              type="button"
              className={styles.burgerBtn}
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={mobileMenuOpen}
              aria-controls={MOBILE_MENU_PANEL_ID}
              onClick={() => {
                closeSearch({ restoreFocus: false });
                toggleMobileMenu();
              }}
            >
              <span className={styles.burgerIcon} aria-hidden data-open={mobileMenuOpen || undefined}>
                <img
                  className={styles.burgerIconSvg}
                  src="/icons/wupapa-burger.svg"
                  alt=""
                  width={24}
                  height={24}
                />
                <svg className={styles.closeIconSvg} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          </nav>
        </div>
      </div>

      <HeaderSearchPanel
        open={searchOpen}
        closing={searchClosing}
        onClose={() => closeSearch({ restoreFocus: true })}
        onNavigate={() => closeSearch({ restoreFocus: false })}
      />

      {/* Мобильное меню: раскрывается сверху вниз, на весь экран */}
      <div
        className={[styles.mobileMenuOverlay, mobileMenuOpen && styles.mobileMenuOverlayOpen].filter(Boolean).join(' ')}
        aria-hidden={!mobileMenuOpen}
        style={{ pointerEvents: mobileMenuOpen ? 'auto' : 'none' }}
      >
        <div
          id={MOBILE_MENU_PANEL_ID}
          className={[
            'padding-global',
            styles.mobileMenuPanel,
            mobileMenuOpen && styles.mobileMenuPanelOpen,
            mobileMenuContentRevealed && styles.mobileMenuContentRevealed,
            mobileMenuClosing && styles.mobileMenuClosing,
          ].filter(Boolean).join(' ')}
          role="dialog"
          aria-label="Мобильное меню"
        >
          <div className={styles.mobileMenuHeader}>
            <Link href="/" onClick={closeMobileMenu} className={styles.mobileMenuLogoLink} aria-label="На главную">
              <Image
                src={SITE_LOGO_SRC}
                alt={SITE_NAME}
                width={200}
                height={27}
                className={styles.mobileMenuLogoImg}
                style={{ height: 'auto' }}
              />
            </Link>
            <button
              type="button"
              className={styles.mobileMenuCloseBtn}
              aria-label="Закрыть меню"
              onClick={closeMobileMenu}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className={styles.mobileMenuScroll}>
          <div className={styles.mobileMenuInner}>
            <nav className={styles.mobileMenuNav} aria-label="Основное меню">
              {MENU_SECTIONS.map(({ id, href, label }) => {
                if (id === 'categories') {
                  const catalogSublinks =
                    catalogRoots.length > 0
                      ? catalogRoots.map((c) => ({
                          href: `/catalog/${c.slug}`,
                          label: c.name,
                        }))
                      : [{ href: '/catalog', label: 'Каталог' }];
                  return (
                    <div key={id} className={styles.mobileMenuItem}>
                      <div
                        role="button"
                        tabIndex={0}
                        className={styles.mobileMenuTrigger}
                        onClick={() => {
                          setMobileMenuCatalogOpen((o) => !o);
                          setMobileMenuZonesOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setMobileMenuCatalogOpen((o) => !o);
                            setMobileMenuZonesOpen(false);
                          }
                        }}
                        aria-expanded={mobileMenuCatalogOpen}
                      >
                        <span className={styles.mobileMenuTriggerRow}>
                          <span className={styles.mobileMenuTriggerText}>{label}</span>
                          <span
                            className={styles.mobileMenuArrow}
                            aria-hidden
                            data-open={mobileMenuCatalogOpen || undefined}
                          >
                            <svg width="9" height="5" viewBox="0 0 9 5" fill="none">
                              <path d="M0 0L4.5 5L9 0" stroke="currentColor" strokeWidth="1.2" />
                            </svg>
                          </span>
                        </span>
                        <div
                          className={styles.mobileMenuSublinks}
                          hidden={!mobileMenuCatalogOpen}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {catalogSublinks.map((sub) => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={styles.mobileMenuSublink}
                              onClick={closeMobileMenu}
                            >
                              {sub.label}
                            </Link>
                          ))}
                          <Link
                            href={href}
                            className={styles.mobileMenuShowAll}
                            onClick={closeMobileMenu}
                          >
                            В каталог
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (id === 'zones') {
                  const zoneSublinks =
                    catalogTags.length > 0
                      ? catalogTags.map((tag) => ({
                          href: `/catalog?tag=${encodeURIComponent(tag.slug)}`,
                          label: tag.name,
                          key: tag.slug,
                        }))
                      : [{ href: '/catalog', label: 'Зоны', key: 'zones-fallback' }];
                  return (
                    <div key={id} className={styles.mobileMenuItem}>
                      <div
                        role="button"
                        tabIndex={0}
                        className={styles.mobileMenuTrigger}
                        onClick={() => {
                          setMobileMenuZonesOpen((o) => !o);
                          setMobileMenuCatalogOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setMobileMenuZonesOpen((o) => !o);
                            setMobileMenuCatalogOpen(false);
                          }
                        }}
                        aria-expanded={mobileMenuZonesOpen}
                      >
                        <span className={styles.mobileMenuTriggerRow}>
                          <span className={styles.mobileMenuTriggerText}>{label}</span>
                          <span
                            className={styles.mobileMenuArrow}
                            aria-hidden
                            data-open={mobileMenuZonesOpen || undefined}
                          >
                            <svg width="9" height="5" viewBox="0 0 9 5" fill="none">
                              <path d="M0 0L4.5 5L9 0" stroke="currentColor" strokeWidth="1.2" />
                            </svg>
                          </span>
                        </span>
                        <div
                          className={styles.mobileMenuSublinks}
                          hidden={!mobileMenuZonesOpen}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {zoneSublinks.map((sub) => (
                            <Link
                              key={sub.key}
                              href={sub.href}
                              className={styles.mobileMenuSublink}
                              onClick={closeMobileMenu}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={id} className={styles.mobileMenuItem}>
                    <Link
                      href={href}
                      className={styles.mobileMenuTrigger}
                      onClick={closeMobileMenu}
                    >
                      <span className={styles.mobileMenuTriggerRow}>
                        <span className={styles.mobileMenuTriggerText}>{label}</span>
                      </span>
                    </Link>
                  </div>
                );
              })}
            </nav>
          </div>
          <div className={styles.mobileMenuInner}>
            <nav className={styles.mobileMenuSimpleNav} aria-label="Информация">
              {MOBILE_INFO_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={styles.mobileMenuSimpleLink}
                  onClick={closeMobileMenu}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className={styles.mobileMenuInner}>
            <div className={styles.mobileMenuActions}>
              <button
                type="button"
                className={styles.mobileMenuSearchBtn}
                aria-label="Поиск"
                onClick={openSearch}
              >
                <img src="/icons/search-normal.svg" alt="" width={18} height={18} />
                <span className={styles.mobileMenuSearchLabel}>Поиск</span>
              </button>
              <Link
                href={accountEntryHref}
                className={styles.mobileMenuLoginLink}
                onClick={closeMobileMenu}
              >
                <span>{accountAuthenticated ? 'Профиль' : 'Войти'}</span>
              </Link>
            </div>
          </div>
          </div>
          <div className={styles.mobileMenuBottom}>
            <a
              href={TELEGRAM_HREF}
              className={styles.mobileMenuTelegram}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMobileMenu}
            >
              Телеграм
            </a>
          </div>
        </div>
      </div>

      <div
        className={[
          styles.superMenu,
          superMenuClosing && styles.superMenuClosing,
          superMenuContentRevealed && styles.superMenuContentRevealed,
        ].filter(Boolean).join(' ')}
        aria-hidden={!superMenuVisible}
        style={{ pointerEvents: superMenuOpen && !superMenuClosing ? 'auto' : 'none' }}
      >
        <div className={styles.superMenuSlideWrap}>
          <div
            className={styles.superMenuBg}
            onClick={closeSuperMenu}
            aria-hidden="true"
          />
          <div
            ref={superMenuPanelRef}
            id={SUPER_MENU_PANEL_ID}
            className={styles.superMenuPanel}
            role="dialog"
            aria-label="Навигационное меню"
          >
          <div className="padding-global">
            <div className={styles.siteHeaderWrap}>
              <div className={`${styles.superMenuPanelInner} ${openedFromMinimal ? styles.superMenuOpenedFromMinimal : ''}`.trim()}>
                <div
                  className={styles.superMenuSection}
                  data-active={superMenuSection === 'categories' || undefined}
                  hidden={superMenuSection !== 'categories'}
                >
                  <div
                    className={[
                      styles.superMenuSectionWrap,
                      variant === 'main' ? styles.superMenuSectionWrapMain : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div className={styles.superMenuLogoBlock} />
                    <div className={styles.superMenuMenuCol} ref={superMenuMenuColRef}>
                      <ul className={styles.superMenuMenu} role="list">
                        {catalogRoots.length > 0 ? (
                          catalogRoots.map((c) => (
                            <li key={c.slug}>
                              <TransitionLink
                                href={`/catalog/${c.slug}`}
                                className={styles.superMenuItem}
                                fromMenu
                              >
                                {c.name}
                              </TransitionLink>
                            </li>
                          ))
                        ) : (
                          <li>
                            <TransitionLink
                              href="/catalog"
                              className={styles.superMenuItem}
                              fromMenu
                            >
                              Каталог
                            </TransitionLink>
                          </li>
                        )}
                      </ul>
                      <TransitionLink
                        href="/catalog"
                        className={styles.superMenuCatalogLink}
                        fromMenu
                      >
                        В Каталог
                      </TransitionLink>
                    </div>
                    <div
                      className={styles.superMenuTagsPanel}
                      role="region"
                      aria-label="Контекстные теги"
                      ref={superMenuTagsPanelRef}
                    >
                      {catalogTags.length > 0 ? (
                        <ScrollCatalogStripPanel
                          layout="superMenu"
                          theme="dark"
                          uniformCards
                          titleVariant="caption"
                          tightTop
                          items={catalogTags.map((tag) => ({
                            key: tag.slug,
                            href: `/catalog?tag=${encodeURIComponent(tag.slug)}`,
                            name: tag.name,
                            imageSrc: resolveMediaUrlForClient(tag.coverImageUrl),
                          }))}
                          onLinkClick={navigateFromSuperMenu}
                        />
                      ) : (
                        <span className={styles.superMenuTagsEmpty}>—</span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={styles.superMenuSection}
                  data-active={superMenuSection === 'zones' || undefined}
                  hidden={superMenuSection !== 'zones'}
                >
                  <div
                    className={[
                      styles.superMenuSectionWrap,
                      variant === 'main' ? styles.superMenuSectionWrapMain : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div className={styles.superMenuLogoBlock} />
                    <div className={styles.superMenuMenuCol}>
                      <ul className={styles.superMenuMenu} role="list">
                        {catalogTags.length > 0 ? (
                          catalogTags.map((tag) => (
                            <li key={tag.slug}>
                              <TransitionLink
                                href={`/catalog?tag=${encodeURIComponent(tag.slug)}`}
                                className={styles.superMenuItem}
                                fromMenu
                              >
                                {tag.name}
                              </TransitionLink>
                            </li>
                          ))
                        ) : (
                          <li>
                            <span className={styles.superMenuTagsEmpty}>—</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </header>
  );
}
