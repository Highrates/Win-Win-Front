'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useMemo, useState } from 'react';
import styles from './CustomerAccountSidebar.module.css';

const BODY_DOCK_OPEN = 'account-mobile-dock-open';

export type CustomerAccountSidebarProps = {
  userName?: string;
  /** Одобренный партнёр Win-Win (админ): видны Кейсы, Команда, Проекты и т.д. */
  isWinWinPartner?: boolean;
  /** Профиль с сервера загружен — до этого пункты партнёра скрыты, чтобы не мигать лишним доступом */
  profileLoaded?: boolean;
  /** Пункты меню (href), для которых показывается точка уведомления */
  menuItemsWithNotification?: string[];
};

/** ЛК: чёрный stroke; избранное/проекты — account-sidebar (в /icons/heart и collections — серый для карточек) */
const ICON = {
  orders: '/icons/group.svg',
  favorites: '/icons/account-sidebar/heart.svg',
  projects: '/icons/account-sidebar/collections.svg',
  cases: '/icons/cases.svg',
  team: '/icons/team.svg',
  profile: '/icons/account-sidebar/profile.svg',
  docs: '/icons/doc.svg',
  contact: '/icons/sms.svg',
} as const;

type MenuDef = { href: string; iconSrc: string; label: string };

function isMenuItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href !== '/' && pathname.startsWith(`${href}/`)) return true;
  return false;
}

function MenuItem({
  href,
  iconSrc,
  label,
  active,
  hasNotification,
  onNavigate,
}: {
  href: string;
  iconSrc: string;
  label: string;
  active: boolean;
  hasNotification?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      className={`${styles.menuItem} ${active ? styles.menuItemActive : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
    >
      <span className={styles.menuItemInner}>
        <img src={iconSrc} alt="" width={16} height={16} className={styles.menuItemIconImg} />
        <span className={styles.menuItemLabel}>{label}</span>
        {hasNotification ? (
          <span className={styles.menuItemNotificationDot} aria-label="Есть уведомления" />
        ) : null}
      </span>
    </Link>
  );
}

function MobileDockItem({
  href,
  iconSrc,
  label,
  active,
  onNavigate,
}: {
  href: string;
  iconSrc: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      className={`${styles.mobileDockItem} ${active ? styles.mobileDockItemActive : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
    >
      <img src={iconSrc} alt="" width={16} height={16} className={styles.mobileDockIconImg} />
      <span className={styles.mobileDockLabel}>{label}</span>
    </Link>
  );
}

export function CustomerAccountSidebar({
  userName = 'Имя пользователя',
  isWinWinPartner = false,
  profileLoaded = false,
  menuItemsWithNotification = [],
}: CustomerAccountSidebarProps) {
  const pathname = usePathname() ?? '';
  const notifySet = new Set(menuItemsWithNotification);
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetId = useId();

  const showDesignerNav = profileLoaded && isWinWinPartner;

  const { primaryItems, moreTopItems, moreBottomItems } = useMemo(() => {
    const primary: MenuDef[] = [
      { href: '/account/orders', iconSrc: ICON.orders, label: 'Заказы' },
      { href: '/account/favorites', iconSrc: ICON.favorites, label: 'Избранное' },
    ];
    if (showDesignerNav) {
      primary.push({ href: '/account/projects', iconSrc: ICON.projects, label: 'Проекты' });
    }

    const moreTop: MenuDef[] = [];
    if (showDesignerNav) {
      moreTop.push(
        { href: '/account/cases', iconSrc: ICON.cases, label: 'Кейсы' },
        { href: '/account/team', iconSrc: ICON.team, label: 'Команда' },
      );
    }
    moreTop.push({ href: '/account/profile', iconSrc: ICON.profile, label: 'Профиль' });

    const moreBottom: MenuDef[] = [
      { href: '/account/docs', iconSrc: ICON.docs, label: 'Документы' },
      { href: '/account/contact', iconSrc: ICON.contact, label: 'Связаться с нами' },
    ];

    return { primaryItems: primary, moreTopItems: moreTop, moreBottomItems: moreBottom };
  }, [showDesignerNav]);

  useEffect(() => {
    if (!moreOpen) return;
    document.body.classList.add(BODY_DOCK_OPEN);
    return () => document.body.classList.remove(BODY_DOCK_OPEN);
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const closeMore = () => setMoreOpen(false);
  const moreActive = [...moreTopItems, ...moreBottomItems].some((item) => isMenuItemActive(pathname, item.href));

  return (
    <>
      <aside className={styles.sidebarRoot} aria-label="Меню личного кабинета">
        {!profileLoaded ? (
          <div className={styles.menuHeader}>
            <div className={styles.menuHeaderRow}>
              <div className={styles.menuGhostName} />
              <div className={styles.menuGhostEdit} />
            </div>
            <div className={styles.menuGhostPartner} />
          </div>
        ) : (
          <div className={styles.menuHeader}>
            <div className={styles.menuHeaderRow}>
              <span className={styles.userName}>{userName}</span>
              <Link
                href="/account/profile?profileEdit=1"
                className={styles.editLink}
                aria-label="Редактировать профиль"
              >
                <img src="/icons/account-sidebar/edit.svg" alt="" width={16} height={16} />
              </Link>
            </div>
            {showDesignerNav ? <p className={styles.partnerStatus}>Партнер Win-Win</p> : <p className={styles.partnerStatus} aria-hidden />}
          </div>
        )}

        {!profileLoaded ? (
          <nav className={styles.menuAllItems} aria-busy="true" aria-label="Загрузка меню">
            <div className={styles.menuItemsWrapper}>
              {[1, 2, 3].map((k) => (
                <div key={k} className={styles.menuItemGhost} />
              ))}
            </div>
            <hr className={styles.divider} aria-hidden />
            <div className={styles.menuItemsWrapper}>
              {[1, 2, 3].map((k) => (
                <div key={`m-${k}`} className={styles.menuItemGhost} />
              ))}
            </div>
            <hr className={styles.divider} aria-hidden />
            <div className={styles.menuItemsWrapper}>
              {[1, 2].map((k) => (
                <div key={`b-${k}`} className={styles.menuItemGhost} />
              ))}
            </div>
          </nav>
        ) : (
          <nav className={styles.menuAllItems} aria-label="Разделы личного кабинета">
            <div className={styles.menuItemsWrapper}>
              {primaryItems.map((item) => (
                <MenuItem
                  key={item.href}
                  href={item.href}
                  iconSrc={item.iconSrc}
                  label={item.label}
                  active={isMenuItemActive(pathname, item.href)}
                  hasNotification={notifySet.has(item.href)}
                />
              ))}
            </div>

            <hr className={styles.divider} aria-hidden />

            <div className={styles.menuItemsWrapper}>
              {moreTopItems.map((item) => (
                <MenuItem
                  key={item.href}
                  href={item.href}
                  iconSrc={item.iconSrc}
                  label={item.label}
                  active={isMenuItemActive(pathname, item.href)}
                  hasNotification={notifySet.has(item.href)}
                />
              ))}
            </div>

            <hr className={styles.divider} aria-hidden />

            <div className={styles.menuItemsWrapper}>
              {moreBottomItems.map((item) => (
                <MenuItem
                  key={item.href}
                  href={item.href}
                  iconSrc={item.iconSrc}
                  label={item.label}
                  active={isMenuItemActive(pathname, item.href)}
                  hasNotification={notifySet.has(item.href)}
                />
              ))}
            </div>
          </nav>
        )}
      </aside>

      <nav className={styles.mobileDock} aria-label="Навигация личного кабинета">
        {!profileLoaded ? (
          <>
            {[1, 2, 3].map((k) => (
              <div key={k} className={styles.mobileDockGhost} aria-hidden />
            ))}
            <button
              type="button"
              className={`${styles.mobileDockBurger} ${moreOpen ? styles.mobileDockBurgerOpen : ''}`}
              disabled
              aria-label="Загрузка меню"
            >
              <span className={styles.mobileDockBurgerIcon} aria-hidden>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    className={styles.mobileDockBurgerLineMenu}
                    d="M3 6h18M3 12h18M3 18h18"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    className={styles.mobileDockBurgerLineClose}
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className={styles.mobileDockLabel}>Ещё</span>
            </button>
          </>
        ) : (
          <>
            {primaryItems.map((item) => (
              <MobileDockItem
                key={item.href}
                href={item.href}
                iconSrc={item.iconSrc}
                label={item.label}
                active={isMenuItemActive(pathname, item.href)}
              />
            ))}
            <button
              type="button"
              className={`${styles.mobileDockBurger} ${moreOpen ? styles.mobileDockBurgerOpen : ''} ${moreActive ? styles.mobileDockItemActive : ''}`}
              aria-expanded={moreOpen}
              aria-controls={sheetId}
              aria-label={moreOpen ? 'Закрыть список разделов' : 'Остальные разделы'}
              onClick={() => setMoreOpen((o) => !o)}
            >
          <span className={styles.mobileDockBurgerIcon} aria-hidden>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                className={styles.mobileDockBurgerLineMenu}
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                className={styles.mobileDockBurgerLineClose}
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
              <span className={styles.mobileDockLabel}>Ещё</span>
            </button>
          </>
        )}
      </nav>

      {moreOpen && profileLoaded ? (
        <div className={styles.mobileSheet} role="presentation">
          <button
            type="button"
            className={styles.mobileSheetBackdrop}
            aria-label="Закрыть"
            onClick={closeMore}
          />
          <div
            id={sheetId}
            className={styles.mobileSheetPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Меню личного кабинета"
          >
            <div className={styles.mobileSheetTop}>
              <div className={styles.mobileSheetProfile}>
                <div className={styles.menuHeaderRow}>
                  <span className={styles.userName}>{userName}</span>
                  <Link
                    href="/account/profile?profileEdit=1"
                    className={styles.editLink}
                    aria-label="Редактировать профиль"
                    onClick={closeMore}
                  >
                    <img src="/icons/account-sidebar/edit.svg" alt="" width={16} height={16} />
                  </Link>
                </div>
              </div>
              <button
                type="button"
                className={styles.mobileSheetClose}
                aria-label="Закрыть"
                onClick={closeMore}
              >
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div className={styles.mobileSheetList}>
              {primaryItems.map((item) => (
                <MenuItem
                  key={item.href}
                  href={item.href}
                  iconSrc={item.iconSrc}
                  label={item.label}
                  active={isMenuItemActive(pathname, item.href)}
                  hasNotification={notifySet.has(item.href)}
                  onNavigate={closeMore}
                />
              ))}
              <hr className={styles.sheetDivider} aria-hidden />
              {moreTopItems.map((item) => (
                <MenuItem
                  key={item.href}
                  href={item.href}
                  iconSrc={item.iconSrc}
                  label={item.label}
                  active={isMenuItemActive(pathname, item.href)}
                  hasNotification={notifySet.has(item.href)}
                  onNavigate={closeMore}
                />
              ))}
              <hr className={styles.sheetDivider} aria-hidden />
              {moreBottomItems.map((item) => (
                <MenuItem
                  key={item.href}
                  href={item.href}
                  iconSrc={item.iconSrc}
                  label={item.label}
                  active={isMenuItemActive(pathname, item.href)}
                  hasNotification={notifySet.has(item.href)}
                  onNavigate={closeMore}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
