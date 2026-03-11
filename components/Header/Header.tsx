'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';

const MENU_SECTIONS = [
  { id: 'categories', href: '/categories', label: 'Каталог' },
  { id: 'brands', href: '/brands', label: 'Бренды' },
  { id: 'designers', href: '/designers', label: 'Дизайнеры' },
  { id: 'projects', href: '/projects', label: 'Проекты и концепции' },
] as const;

const SUPER_MENU_PANEL_ID = 'super-menu-panel';
const MOBILE_MENU_PANEL_ID = 'mobile-menu-panel';
const BODY_SUPER_MENU_OPEN = 'header-super-menu-open';
const BODY_MOBILE_MENU_OPEN = 'header-mobile-menu-open';

const MOBILE_MENU_SUBLINKS: Record<string, string[]> = {
  categories: ['Гостиная', 'Столовая', 'Свет', 'Офис', 'Отель', 'Декор', 'Сад'],
  brands: ['Гостиная', 'Столовая', 'Свет', 'Офис', 'Отель', 'Декор', 'Сад'],
  designers: ['Гостиная', 'Столовая', 'Свет', 'Офис', 'Отель', 'Декор', 'Сад'],
  projects: ['Гостиная', 'Столовая', 'Свет', 'Офис', 'Отель', 'Декор', 'Сад'],
};

const MOBILE_INFO_LINKS = [
  { href: '/about', label: 'О Win-Win' },
  { href: '/delivery', label: 'Доставка и оплата' },
  { href: '/guarantee', label: 'Гарантия, обмен и возврат' },
] as const;

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
  superMenuOpen: superMenuOpenProp,
  setSuperMenuOpen: setSuperMenuOpenProp,
}: {
  variant?: HeaderVariant;
  isMainOverlayOnHome?: boolean;
  superMenuOpen?: boolean;
  setSuperMenuOpen?: (open: boolean) => void;
}) {
  const [mainOverlayVisible, setMainOverlayVisible] = useState(false);
  const [internalSuperMenuOpen, setInternalSuperMenuOpen] = useState(false);
  const superMenuOpen = setSuperMenuOpenProp !== undefined ? (superMenuOpenProp ?? false) : internalSuperMenuOpen;
  const setSuperMenuOpen = setSuperMenuOpenProp ?? setInternalSuperMenuOpen;
  const [superMenuSection, setSuperMenuSection] = useState<string | null>(null);
  const [superMenuClosing, setSuperMenuClosing] = useState(false);
  const [superMenuContentRevealed, setSuperMenuContentRevealed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuContentRevealed, setMobileMenuContentRevealed] = useState(false);
  const [mobileMenuClosing, setMobileMenuClosing] = useState(false);
  const [mobileMenuExpandedId, setMobileMenuExpandedId] = useState<string | null>(null);
  const mobileMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTransitioningRef = useRef(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeSuperMenuRef = useRef<() => void>(() => {});
  const setSuperMenuOpenRef = useRef(setSuperMenuOpen);
  const superMenuPanelRef = useRef<HTMLDivElement | null>(null);
  setSuperMenuOpenRef.current = setSuperMenuOpen;

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
    if (!superMenuOpen && !superMenuClosing) {
      setSuperMenuSection(null);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSuperMenuRef.current();
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
    document.body.classList.add(BODY_SUPER_MENU_OPEN);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClickOutside);
      document.body.classList.remove(BODY_SUPER_MENU_OPEN);
    };
  }, [superMenuOpen, superMenuClosing]);

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

  const closeMobileMenu = () => {
    if (!mobileMenuOpen || mobileMenuClosing) return;
    setMobileMenuContentRevealed(false);
    setMobileMenuClosing(true);
    if (mobileMenuCloseTimeoutRef.current) clearTimeout(mobileMenuCloseTimeoutRef.current);
    mobileMenuCloseTimeoutRef.current = setTimeout(() => {
      mobileMenuCloseTimeoutRef.current = null;
      setMobileMenuOpen(false);
      setMobileMenuClosing(false);
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

  const className = [
    headerClassMap[variant] ?? styles.header,
    variant === 'main' && isMainOverlayOnHome && styles.headerMainOverlay,
    variant === 'main' && isMainOverlayOnHome && mainOverlayVisible && styles.headerMainOverlayVisible,
    superMenuVisible && styles.headerSuperMenuOpen,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={className}>
      <div className={`padding-global ${styles.headerBar}`}>
        <div className={styles.siteHeaderWrap}>
          <button
            type="button"
            className={styles.burgerBtn}
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={mobileMenuOpen}
            aria-controls={MOBILE_MENU_PANEL_ID}
            onClick={toggleMobileMenu}
          >
            <span className={styles.burgerIcon} aria-hidden data-open={mobileMenuOpen || undefined}>
              <svg className={styles.burgerIconSvg} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <svg className={styles.closeIconSvg} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
          <div className={styles.logoBlock}>
            <Link href="/" aria-label="На главную">
              <Image
                src="/images/logo.svg"
                alt="Win-Win"
                width={280}
                height={41}
                className={styles.logoImg}
                style={{ height: 'auto' }}
                priority
              />
            </Link>
          </div>
          <nav className={styles.siteHeaderNav} aria-label="Основное меню">
            <div className={styles.siteHeaderMenu}>
              {MENU_SECTIONS.map(({ id, href, label }) => (
                <button
                  key={id}
                  type="button"
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
              ))}
            </div>
          </nav>
          <nav className={styles.rightNav} aria-label="Поиск и аккаунт">
            <button type="button" className={styles.iconBtn} aria-label="Поиск">
              <img src="/icons/search-normal.svg" alt="" width={20} height={20} />
            </button>
            <Link href="/login" className={styles.iconBtn} aria-label="Вход в аккаунт">
              <img src="/icons/user.svg" alt="" width={20} height={20} />
            </Link>
          </nav>
        </div>
      </div>

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
                src="/images/logo.svg"
                alt="Win-Win"
                width={200}
                height={30}
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
                const isExpanded = mobileMenuExpandedId === id;
                const sublinks = MOBILE_MENU_SUBLINKS[id] ?? [];
                return (
                  <div key={id} className={styles.mobileMenuItem}>
                    <div
                      role="button"
                      tabIndex={0}
                      className={styles.mobileMenuTrigger}
                      onClick={() => setMobileMenuExpandedId((prev) => (prev === id ? null : id))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setMobileMenuExpandedId((prev) => (prev === id ? null : id));
                        }
                      }}
                      aria-expanded={isExpanded}
                    >
                      <span className={styles.mobileMenuTriggerRow}>
                        <span className={styles.mobileMenuTriggerText}>{label}</span>
                        <span className={styles.mobileMenuArrow} aria-hidden data-open={isExpanded || undefined}>
                          <svg width="9" height="5" viewBox="0 0 9 5" fill="none">
                            <path d="M0 0L4.5 5L9 0" stroke="currentColor" strokeWidth="1.2" />
                          </svg>
                        </span>
                      </span>
                      {sublinks.length > 0 && (
                        <div
                          className={styles.mobileMenuSublinks}
                          hidden={!isExpanded}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {sublinks.map((sublabel, i) => (
                            <Link
                              key={i}
                              href={`${href}#${i}`}
                              className={styles.mobileMenuSublink}
                              onClick={closeMobileMenu}
                            >
                              {sublabel}
                            </Link>
                          ))}
                          <Link href={href} className={styles.mobileMenuShowAll} onClick={closeMobileMenu}>
                            Показать все
                          </Link>
                        </div>
                      )}
                    </div>
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
              <button type="button" className={styles.mobileMenuSearchBtn} aria-label="Поиск" onClick={closeMobileMenu}>
                <img src="/icons/search-normal.svg" alt="" width={18} height={18} />
                <span className={styles.mobileMenuSearchLabel}>Поиск</span>
              </button>
              <Link
                href="/login"
                className={styles.mobileMenuLoginLink}
                onClick={closeMobileMenu}
              >
                <img src="/icons/user.svg" alt="" width={18} height={18} />
                <span>Войти в личный кабинет</span>
              </Link>
            </div>
          </div>
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
                {MENU_SECTIONS.map((section) => (
              <div
                key={section.id}
                className={styles.superMenuSection}
                data-active={superMenuSection === section.id || undefined}
                hidden={superMenuSection !== section.id}
              >
                <div className={styles.superMenuSectionWrap}>
                  <div className={styles.superMenuLogoBlock} />
                  <ul className={styles.superMenuMenu} role="list">
                    {[
                      'Гостиная',
                      'Столовая',
                      'Свет',
                      'Офис',
                      'Отель',
                      'Декор',
                      'Сад',
                    ].map((label, i) => (
                      <li key={i}>
                        <Link
                          href={`${section.href}#${i}`}
                          className={styles.superMenuItem}
                          onClick={closeSuperMenu}
                        >
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={styles.superMenuSectionItemsEnd}>
                  <Link
                    href={section.href}
                    className={styles.superMenuSectionShowAll}
                    onClick={closeSuperMenu}
                  >
                    Показать все
                  </Link>
                </div>
              </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </header>
  );
}
