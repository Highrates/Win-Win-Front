'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useAdminOrderChatStaffUnreadEvents } from '@/hooks/useAdminOrderChatStaffUnreadEvents';
import { AdminDeployRecovery } from '@/lib/adminDeployRecovery/AdminDeployRecovery';
import { AdminConfirmProvider } from '@/lib/adminConfirm/AdminConfirmProvider';
import { AdminQueryProvider } from '@/lib/adminQuery/AdminQueryProvider';
import { AdminLocaleProvider } from '@/lib/admin-i18n/adminLocaleContext';
import {
  AdminSidebarBadgesProvider,
  useAdminSidebarBadges,
} from '@/lib/adminSidebarBadgesContext';
import {
  ADMIN_LOCALE_STORAGE_KEY,
  adminBrandLine,
  adminChromeStrings,
  adminLocaleCookieString,
  catalogGroupLabel,
  catalogSubLabel,
  getNavLabel,
  settingsGroupLabel,
  settingsSubLabel,
  type AdminLocale,
} from '@/lib/admin-i18n/adminChromeI18n';
import styles from './layout.module.css';

const ADMIN_AVATAR_SRC = '/images/Admin-avatar.jpeg';

function NavLinkLeading({ expandable, open }: { expandable?: boolean; open?: boolean }) {
  return (
    <span className={styles.navLinkLeading} aria-hidden={expandable ? undefined : true}>
      {expandable ? (
        <svg
          className={`${styles.navChevron} ${open ? styles.navChevronOpen : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ) : null}
    </span>
  );
}

const CATALOG_CHILDREN = [
  { href: '/admin/catalog/products', key: 'products' as const },
  { href: '/admin/catalog/categories', key: 'categories' as const },
  { href: '/admin/collections', key: 'collections' as const },
  { href: '/admin/product-sets', key: 'productSets' as const },
];

const SETTINGS_CHILDREN = [
  { href: '/admin/settings/pricing', key: 'pricing' as const },
  { href: '/admin/settings/staff', key: 'staff' as const },
  { href: '/admin/user-groups', key: 'userGroups' as const },
  { href: '/admin/referrals', key: 'referrals' as const },
  { href: '/admin/settings/site', key: 'site' as const },
];

/** Порядок пунктов сайдбара между «Каталог» и «Настройки». */
const MID_NAV_HREFS = [
  '/admin/brands',
  '/admin/blog',
  '/admin/orders',
  '/admin/applications',
  '/admin/clients',
  '/admin/objects',
  '/admin/journal',
] as const;

function AdminSidebar({
  locale,
  localeReady,
  pathname,
  setAdminLocale,
}: {
  locale: AdminLocale;
  localeReady: boolean;
  pathname: string;
  setAdminLocale: (next: AdminLocale) => void;
}) {
  const { pendingPartnerApps, pendingOrdersApproval, ordersChatUnread } = useAdminSidebarBadges();
  const t = adminChromeStrings(locale);

  const inCatalog =
    pathname.startsWith('/admin/catalog') ||
    pathname.startsWith('/admin/collections') ||
    pathname.startsWith('/admin/product-sets');
  const [catalogOpen, setCatalogOpen] = useState(inCatalog);
  useEffect(() => {
    if (inCatalog) setCatalogOpen(true);
  }, [inCatalog]);

  const inSettings =
    pathname.startsWith('/admin/settings') || pathname.startsWith('/admin/referrals');
  const [settingsOpen, setSettingsOpen] = useState(inSettings);
  useEffect(() => {
    if (inSettings) setSettingsOpen(true);
  }, [inSettings]);

  function renderNavLink(href: string) {
    const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
    const showPendingBadge =
      href === '/admin/applications' && pendingPartnerApps != null && pendingPartnerApps > 0;
    const showOrdersPendingBadge =
      href === '/admin/orders' && pendingOrdersApproval != null && pendingOrdersApproval > 0;
    const showOrdersChatUnreadBadge =
      href === '/admin/orders' && ordersChatUnread != null && ordersChatUnread > 0;
    return (
      <Link
        key={href}
        href={href}
        className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
      >
        <NavLinkLeading />
        <span className={styles.navLinkLabel}>
          {getNavLabel(locale, href)}
          {showPendingBadge ? (
            <span className={styles.navLinkCount}> ({pendingPartnerApps})</span>
          ) : null}
          {showOrdersPendingBadge ? (
            <span className={styles.navLinkCount}> ({pendingOrdersApproval})</span>
          ) : null}
          {showOrdersChatUnreadBadge ? (
            <span className={styles.navLinkCount} title="Непрочитанные сообщения от клиента">
              {' '}
              ({ordersChatUnread})
            </span>
          ) : null}
        </span>
      </Link>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <p className={styles.brand}>{adminBrandLine(locale)}</p>
      <div className={styles.localeBlock}>
        <p className={styles.localeHeading}>{t.langHeading}</p>
        <div className={styles.localeRow} role="group" aria-label={t.langHeading}>
          <button
            type="button"
            className={`${styles.localeBtn} ${locale === 'ru' ? styles.localeBtnActive : ''}`}
            onClick={() => setAdminLocale('ru')}
            disabled={!localeReady}
          >
            {t.langBtnRu}
          </button>
          <button
            type="button"
            className={`${styles.localeBtn} ${locale === 'zh' ? styles.localeBtnActive : ''}`}
            onClick={() => setAdminLocale('zh')}
            disabled={!localeReady}
          >
            {localeReady ? t.langBtnZh : '中文'}
          </button>
        </div>
      </div>
      <nav className={styles.nav} aria-label={t.navAria}>
        {renderNavLink('/admin')}
        <div className={styles.navGroup}>
          <button
            type="button"
            className={`${styles.navLink} ${
              pathname.startsWith('/admin/catalog') ||
              pathname.startsWith('/admin/collections') ||
              pathname.startsWith('/admin/product-sets')
                ? styles.navLinkActive
                : ''
            }`}
            aria-expanded={catalogOpen}
            aria-controls="admin-nav-catalog-sub"
            onClick={() => setCatalogOpen((o) => !o)}
          >
            <NavLinkLeading expandable open={catalogOpen} />
            <span className={styles.navLinkLabel}>{catalogGroupLabel(locale)}</span>
          </button>
          {catalogOpen ? (
            <div id="admin-nav-catalog-sub" className={styles.navSub}>
              {CATALOG_CHILDREN.map(({ href, key }) => {
                const active =
                  href === '/admin/collections'
                    ? pathname.startsWith('/admin/collections')
                    : href === '/admin/product-sets'
                      ? pathname.startsWith('/admin/product-sets')
                      : pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`${styles.navLink} ${styles.navSublink} ${
                      active ? styles.navLinkActive : ''
                    }`}
                  >
                    <NavLinkLeading />
                    <span className={styles.navLinkLabel}>{catalogSubLabel(locale, key)}</span>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
        {MID_NAV_HREFS.map((href) => renderNavLink(href))}
        <div className={styles.navGroup}>
          <button
            type="button"
            className={`${styles.navLink} ${inSettings ? styles.navLinkActive : ''}`}
            aria-expanded={settingsOpen}
            aria-controls="admin-nav-settings-sub"
            onClick={() => setSettingsOpen((o) => !o)}
          >
            <NavLinkLeading expandable open={settingsOpen} />
            <span className={styles.navLinkLabel}>{settingsGroupLabel(locale)}</span>
          </button>
          {settingsOpen ? (
            <div id="admin-nav-settings-sub" className={styles.navSub}>
              {SETTINGS_CHILDREN.map(({ href, key }) => {
                const active =
                  key === 'referrals'
                    ? pathname.startsWith('/admin/referrals')
                    : pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`${styles.navLink} ${styles.navSublink} ${
                      active ? styles.navLinkActive : ''
                    }`}
                  >
                    <NavLinkLeading />
                    <span className={styles.navLinkLabel}>{settingsSubLabel(locale, key)}</span>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </nav>
      <div className={styles.sidebarProfile}>
        <div className={styles.sidebarProfileMain}>
          <img
            src={ADMIN_AVATAR_SRC}
            alt=""
            width={32}
            height={32}
            className={styles.sidebarProfileAvatar}
          />
          <div className={styles.sidebarProfileText}>
            <span className={styles.sidebarProfileName}>Solomon</span>
            <span className={styles.sidebarProfileRole}>Админ</span>
          </div>
        </div>
        <button type="button" className={styles.sidebarProfileMenu} aria-label="Меню профиля">
          <span aria-hidden>⋯</span>
        </button>
      </div>
    </aside>
  );
}

function AdminShellBody({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <div className={styles.body}>
        {sidebar}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

export function AdminChrome({
  children,
  initialLocale,
  buildId,
}: {
  children: React.ReactNode;
  initialLocale: AdminLocale;
  buildId: string;
}) {
  const pathname = usePathname() ?? '';
  const isLoginPage = pathname === '/admin/login';
  useAdminOrderChatStaffUnreadEvents(isLoginPage);
  const router = useRouter();
  const [locale, setLocale] = useState<AdminLocale>(initialLocale);
  const [localeReady, setLocaleReady] = useState(false);

  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY);
      if ((saved === 'zh' || saved === 'ru') && saved !== initialLocale) {
        document.cookie = adminLocaleCookieString(saved);
        router.refresh();
      }
    } catch {
      /* ignore */
    }
    setLocaleReady(true);
  }, [initialLocale, router]);

  function setAdminLocale(next: AdminLocale) {
    setLocale(next);
    try {
      localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, next);
      document.cookie = adminLocaleCookieString(next);
    } catch {
      /* ignore */
    }
    router.refresh();
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  const sidebarProps = {
    locale,
    localeReady,
    pathname,
    setAdminLocale,
  };

  return (
    <AdminLocaleProvider locale={locale} localeReady={localeReady}>
      <AdminDeployRecovery buildId={buildId} />
      <AdminQueryProvider>
        <AdminConfirmProvider>
          <AdminShellBody
            sidebar={
              <AdminSidebarBadgesProvider enabled>
                <AdminSidebar {...sidebarProps} />
              </AdminSidebarBadgesProvider>
            }
          >
            {children}
          </AdminShellBody>
        </AdminConfirmProvider>
      </AdminQueryProvider>
    </AdminLocaleProvider>
  );
}
