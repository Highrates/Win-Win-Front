'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { MENU_COVERED_EVENT } from '@/components/SiteTransition';
import { DESKTOP_MENU_PANEL_ID } from './HeaderDesktopMenu';
import { motionMs } from './useOverlayPanel';

export const BODY_SUPER_MENU_OPEN = 'header-super-menu-open';
export const BODY_MOBILE_MENU_OPEN = 'header-mobile-menu-open';
export const MOBILE_MENU_MQ = '(max-width: 768px)';
export const MOBILE_MENU_PANEL_ID = 'mobile-menu-panel';

export type CloseOverlayOpts = { restoreFocus?: boolean };

export type UseHeaderOverlaysParams = {
  closeSuperMenu: () => void;
  superMenuOpen: boolean;
  superMenuClosing: boolean;
  searchBtnRef?: RefObject<HTMLButtonElement>;
  burgerBtnRef?: RefObject<HTMLButtonElement>;
  /** Called after mobile menu finish-close timeout (e.g. reset accordion state). */
  onMobileMenuClosed?: () => void;
};

export type UseHeaderOverlaysResult = {
  searchBtnRef: RefObject<HTMLButtonElement>;
  burgerBtnRef: RefObject<HTMLButtonElement>;

  searchOpen: boolean;
  searchClosing: boolean;
  openSearch: () => void;
  closeSearch: (opts?: CloseOverlayOpts) => void;
  dismissSearchInstant: () => void;

  desktopMenuOpen: boolean;
  desktopMenuClosing: boolean;
  openDesktopMenu: () => void;
  closeDesktopMenu: (opts?: CloseOverlayOpts) => void;
  dismissDesktopMenuInstant: () => void;

  mobileMenuOpen: boolean;
  mobileMenuClosing: boolean;
  mobileMenuContentRevealed: boolean;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
  dismissMobileMenuInstant: () => void;

  toggleBurgerMenu: () => void;
  burgerMenuExpanded: boolean;
  /** Один panel id по текущему MQ (desktop vs mobile). */
  burgerAriaControls: string;
  searchPanelOpen: boolean;
  desktopMenuPanelOpen: boolean;
};

/**
 * Orchestrates search, desktop burger menu, and mobile menu overlays
 * (open/close/dismiss, body classes, hotkeys, MENU_COVERED, resize MQ).
 * Super-menu open/close stays in Header; pass closeSuperMenu / open flags in.
 */
export function useHeaderOverlays({
  closeSuperMenu,
  superMenuOpen,
  superMenuClosing,
  searchBtnRef: searchBtnRefProp,
  burgerBtnRef: burgerBtnRefProp,
  onMobileMenuClosed,
}: UseHeaderOverlaysParams): UseHeaderOverlaysResult {
  const internalSearchBtnRef = useRef<HTMLButtonElement>(null);
  const internalBurgerBtnRef = useRef<HTMLButtonElement>(null);
  const searchBtnRef = searchBtnRefProp ?? internalSearchBtnRef;
  const burgerBtnRef = burgerBtnRefProp ?? internalBurgerBtnRef;

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchClosing, setSearchClosing] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [desktopMenuClosing, setDesktopMenuClosing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuClosing, setMobileMenuClosing] = useState(false);
  const [mobileMenuContentRevealed, setMobileMenuContentRevealed] = useState(false);
  const [burgerAriaControls, setBurgerAriaControls] = useState(DESKTOP_MENU_PANEL_ID);

  const searchCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const desktopMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreSearchFocusRef = useRef(false);
  const restoreDesktopMenuFocusRef = useRef(false);

  const closeSuperMenuRef = useRef(closeSuperMenu);
  closeSuperMenuRef.current = closeSuperMenu;
  const onMobileMenuClosedRef = useRef(onMobileMenuClosed);
  onMobileMenuClosedRef.current = onMobileMenuClosed;

  const closeSearchRef = useRef<(opts?: CloseOverlayOpts) => void>(() => {});
  const closeDesktopMenuRef = useRef<(opts?: CloseOverlayOpts) => void>(() => {});
  const closeMobileMenuRef = useRef<() => void>(() => {});
  const dismissMobileMenuInstantRef = useRef<() => void>(() => {});
  const dismissDesktopMenuInstantRef = useRef<() => void>(() => {});
  const dismissSearchInstantRef = useRef<() => void>(() => {});

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

  const dismissSearchInstant = useCallback(() => {
    if (searchCloseTimeoutRef.current) {
      clearTimeout(searchCloseTimeoutRef.current);
      searchCloseTimeoutRef.current = null;
    }
    setSearchOpen(false);
    setSearchClosing(false);
    restoreSearchFocusRef.current = false;
  }, []);
  dismissSearchInstantRef.current = dismissSearchInstant;

  const dismissDesktopMenuInstant = useCallback(() => {
    if (desktopMenuCloseTimeoutRef.current) {
      clearTimeout(desktopMenuCloseTimeoutRef.current);
      desktopMenuCloseTimeoutRef.current = null;
    }
    setDesktopMenuOpen(false);
    setDesktopMenuClosing(false);
    restoreDesktopMenuFocusRef.current = false;
  }, []);
  dismissDesktopMenuInstantRef.current = dismissDesktopMenuInstant;

  const closeSearch = useCallback(
    (opts?: CloseOverlayOpts) => {
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
    },
    [searchOpen, searchClosing, searchBtnRef],
  );
  closeSearchRef.current = closeSearch;

  const closeDesktopMenu = useCallback(
    (opts?: CloseOverlayOpts) => {
      if (!desktopMenuOpen && !desktopMenuClosing) return;
      const shouldRestore = opts?.restoreFocus === true;
      restoreDesktopMenuFocusRef.current = shouldRestore;

      if (shouldRestore) {
        burgerBtnRef.current?.focus();
      } else {
        const active = document.activeElement;
        const panel = document.getElementById(DESKTOP_MENU_PANEL_ID);
        if (active instanceof HTMLElement && panel?.contains(active)) {
          active.blur();
        }
      }

      setDesktopMenuClosing(true);
      setDesktopMenuOpen(false);
      if (desktopMenuCloseTimeoutRef.current) clearTimeout(desktopMenuCloseTimeoutRef.current);
      desktopMenuCloseTimeoutRef.current = setTimeout(() => {
        setDesktopMenuClosing(false);
        desktopMenuCloseTimeoutRef.current = null;
        if (restoreDesktopMenuFocusRef.current) {
          restoreDesktopMenuFocusRef.current = false;
          burgerBtnRef.current?.focus();
        }
      }, motionMs(560));
    },
    [desktopMenuOpen, desktopMenuClosing, burgerBtnRef],
  );
  closeDesktopMenuRef.current = closeDesktopMenu;

  const openSearch = useCallback(() => {
    if (searchClosing) return;
    closeSuperMenuRef.current();
    dismissMobileMenuInstant();
    dismissDesktopMenuInstant();
    setSearchOpen(true);
    setSearchClosing(false);
  }, [searchClosing, dismissMobileMenuInstant, dismissDesktopMenuInstant]);

  const openDesktopMenu = useCallback(() => {
    if (desktopMenuClosing) return;
    closeSuperMenuRef.current();
    dismissMobileMenuInstant();
    dismissSearchInstant();
    setDesktopMenuOpen(true);
    setDesktopMenuClosing(false);
  }, [desktopMenuClosing, dismissMobileMenuInstant, dismissSearchInstant]);

  const closeMobileMenu = useCallback(() => {
    if (!mobileMenuOpen || mobileMenuClosing) return;
    setMobileMenuContentRevealed(false);
    setMobileMenuClosing(true);
    if (mobileMenuCloseTimeoutRef.current) clearTimeout(mobileMenuCloseTimeoutRef.current);
    mobileMenuCloseTimeoutRef.current = setTimeout(() => {
      mobileMenuCloseTimeoutRef.current = null;
      setMobileMenuOpen(false);
      setMobileMenuClosing(false);
      onMobileMenuClosedRef.current?.();
    }, motionMs(280));
  }, [mobileMenuOpen, mobileMenuClosing]);
  closeMobileMenuRef.current = closeMobileMenu;

  const toggleMobileMenu = useCallback(() => {
    if (mobileMenuClosing) return;
    setMobileMenuOpen((o) => !o);
  }, [mobileMenuClosing]);

  const isMobileMenuViewport = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(MOBILE_MENU_MQ).matches;
  }, []);

  const toggleBurgerMenu = useCallback(() => {
    if (isMobileMenuViewport()) {
      dismissDesktopMenuInstant();
      dismissSearchInstant();
      if (mobileMenuOpen) {
        closeMobileMenu();
      } else {
        toggleMobileMenu();
      }
      return;
    }
    dismissMobileMenuInstant();
    if (desktopMenuOpen && !desktopMenuClosing) {
      closeDesktopMenu({ restoreFocus: true });
      return;
    }
    openDesktopMenu();
  }, [
    isMobileMenuViewport,
    dismissDesktopMenuInstant,
    dismissSearchInstant,
    mobileMenuOpen,
    closeMobileMenu,
    toggleMobileMenu,
    dismissMobileMenuInstant,
    desktopMenuOpen,
    desktopMenuClosing,
    closeDesktopMenu,
    openDesktopMenu,
  ]);

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
      closeDesktopMenuRef.current({ restoreFocus: false });
      dismissMobileMenuInstantRef.current();
    };
    window.addEventListener(MENU_COVERED_EVENT, onMenuCovered);
    return () => window.removeEventListener(MENU_COVERED_EVENT, onMenuCovered);
  }, []);

  useEffect(() => {
    const anyOverlay =
      superMenuOpen ||
      superMenuClosing ||
      searchOpen ||
      searchClosing ||
      desktopMenuOpen ||
      desktopMenuClosing;
    document.body.classList.toggle(BODY_SUPER_MENU_OPEN, anyOverlay);
    return () => document.body.classList.remove(BODY_SUPER_MENU_OPEN);
  }, [
    superMenuOpen,
    superMenuClosing,
    searchOpen,
    searchClosing,
    desktopMenuOpen,
    desktopMenuClosing,
  ]);

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
      if (e.key === 'Escape') closeMobileMenuRef.current();
    };
    document.body.classList.add(BODY_MOBILE_MENU_OPEN);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove(BODY_MOBILE_MENU_OPEN);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MENU_MQ);
    const sync = () => {
      setBurgerAriaControls(mq.matches ? MOBILE_MENU_PANEL_ID : DESKTOP_MENU_PANEL_ID);
      if (mq.matches) {
        dismissDesktopMenuInstantRef.current();
      } else {
        dismissMobileMenuInstantRef.current();
      }
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    return () => {
      if (searchCloseTimeoutRef.current) clearTimeout(searchCloseTimeoutRef.current);
      if (desktopMenuCloseTimeoutRef.current) clearTimeout(desktopMenuCloseTimeoutRef.current);
      if (mobileMenuCloseTimeoutRef.current) clearTimeout(mobileMenuCloseTimeoutRef.current);
    };
  }, []);

  const searchPanelOpen = searchOpen || searchClosing;
  const desktopMenuPanelOpen = desktopMenuOpen || desktopMenuClosing;
  /* X до конца close-анимации (open || closing) */
  const burgerMenuExpanded =
    mobileMenuOpen || mobileMenuClosing || desktopMenuOpen || desktopMenuClosing;

  return {
    searchBtnRef,
    burgerBtnRef,
    searchOpen,
    searchClosing,
    openSearch,
    closeSearch,
    dismissSearchInstant,
    desktopMenuOpen,
    desktopMenuClosing,
    openDesktopMenu,
    closeDesktopMenu,
    dismissDesktopMenuInstant,
    mobileMenuOpen,
    mobileMenuClosing,
    mobileMenuContentRevealed,
    closeMobileMenu,
    toggleMobileMenu,
    dismissMobileMenuInstant,
    toggleBurgerMenu,
    burgerMenuExpanded,
    burgerAriaControls,
    searchPanelOpen,
    desktopMenuPanelOpen,
  };
}
