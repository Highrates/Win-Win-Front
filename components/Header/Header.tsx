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
const BODY_SUPER_MENU_OPEN = 'header-super-menu-open';

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
          <div className={styles.logoBlock}>
            <Link href="/" aria-label="На главную">
              <Image
                src="/images/logo.svg"
                alt="Win-Win"
                width={280}
                height={41}
                className={styles.logoImg}
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
