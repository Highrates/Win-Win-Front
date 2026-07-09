'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ADMIN_NAV_MANIFEST,
  isAdminNavCatalogPath,
  isAdminNavChildActive,
  isAdminNavSettingsPath,
  type AdminNavLabelKey,
  type AdminSectionId,
} from '@win-win/admin-sections';
import { AdminNavBadge } from '@/components/admin/AdminNavBadge/AdminNavBadge';
import { useAdminOrderChatStaffUnreadEvents } from '@/hooks/useAdminOrderChatStaffUnreadEvents';
import { useAdminLogout } from '@/lib/adminAuth/useAdminLogout';
import { AdminDeployRecovery } from '@/lib/adminDeployRecovery/AdminDeployRecovery';
import { AdminConfirmProvider } from '@/lib/adminConfirm/AdminConfirmProvider';
import { AdminQueryProvider } from '@/lib/adminQuery/AdminQueryProvider';
import { AdminLocaleProvider } from '@/lib/admin-i18n/adminLocaleContext';
import {
  AdminPermissionsProvider,
  useAdminPermissions,
} from '@/lib/adminPermissions/AdminPermissionsProvider';
import { AdminRouteGuard } from '@/lib/adminPermissions/AdminRouteGuard';
import {
  AdminSidebarBadgesProvider,
  useAdminSidebarBadges,
} from '@/lib/adminSidebarBadgesContext';
import {
  ADMIN_LOCALE_STORAGE_KEY,
  adminBrandLine,
  adminChromeStrings,
  adminLocaleCookieString,
  adminNavBadgeTitles,
  getNavLabel,
  type AdminLocale,
} from '@/lib/admin-i18n/adminChromeI18n';
import styles from './layout.module.css';
import { DEFAULT_STAFF_AVATAR } from './settings/staff/StaffAvatarField';

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

function AdminSidebarNavSkeleton() {
  return (
    <div className={styles.skeletonNav} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={styles.skeletonNavItem} />
      ))}
    </div>
  );
}

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
  const { pendingPartnerApps, pendingOrdersApproval, pendingSourcingReview, ordersChatUnread } =
    useAdminSidebarBadges();
  const { canAccessSection, isSuperAdmin, staff, email, loading: permissionsLoading } =
    useAdminPermissions();
  const logout = useAdminLogout();
  const t = adminChromeStrings(locale);
  const badgeTitles = adminNavBadgeTitles(locale);

  const inCatalog = isAdminNavCatalogPath(pathname);
  const [catalogOpen, setCatalogOpen] = useState(inCatalog);
  useEffect(() => {
    if (inCatalog) setCatalogOpen(true);
  }, [inCatalog]);

  const inSettings = isAdminNavSettingsPath(pathname);
  const [settingsOpen, setSettingsOpen] = useState(inSettings);
  useEffect(() => {
    if (inSettings) setSettingsOpen(true);
  }, [inSettings]);

  const showCatalog = !permissionsLoading && canAccessSection('catalog');
  const showSettings = !permissionsLoading && (canAccessSection('settings') || isSuperAdmin);
  const visibleSettingsChildren = permissionsLoading
    ? []
    : ADMIN_NAV_MANIFEST.settings.children.filter(({ section }) =>
        section === 'staff' ? isSuperAdmin : canAccessSection('settings'),
      );

  function renderNavLink(href: string, section: AdminSectionId, labelKey: AdminNavLabelKey) {
    if (permissionsLoading) return null;
    if (!canAccessSection(section)) return null;

    const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

    return (
      <Link
        key={href}
        href={href}
        className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
      >
        <NavLinkLeading />
        <span className={styles.navLinkLabel}>
          {getNavLabel(locale, labelKey)}
          {href === '/admin/applications' ? (
            <AdminNavBadge
              count={pendingPartnerApps ?? 0}
              title={badgeTitles.partnerApps}
            />
          ) : null}
          {href === '/admin/orders' ? (
            <>
              <AdminNavBadge
                count={pendingOrdersApproval ?? 0}
                title={badgeTitles.ordersPending}
              />
              <AdminNavBadge
                count={pendingSourcingReview ?? 0}
                title={badgeTitles.sourcingPending}
                variant="bracket"
              />
              <AdminNavBadge
                count={ordersChatUnread ?? 0}
                title={badgeTitles.ordersChatUnread}
              />
            </>
          ) : null}
        </span>
      </Link>
    );
  }

  const profileName = staff?.staffDisplayName || email || '—';
  const profileAvatar = staff?.staffAvatarUrl?.trim() || DEFAULT_STAFF_AVATAR;
  const profileRole = isSuperAdmin
    ? locale === 'zh'
      ? '超级管理员'
      : 'Суперадмин'
    : locale === 'zh'
      ? '员工'
      : 'Сотрудник';

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
      <nav className={styles.nav} aria-label={t.navAria} aria-busy={permissionsLoading}>
        {permissionsLoading ? (
          <AdminSidebarNavSkeleton />
        ) : (
          <>
            {renderNavLink(
              ADMIN_NAV_MANIFEST.dashboard.href,
              ADMIN_NAV_MANIFEST.dashboard.section,
              ADMIN_NAV_MANIFEST.dashboard.labelKey,
            )}
            {showCatalog ? (
              <div className={styles.navGroup}>
                <button
                  type="button"
                  className={`${styles.navLink} ${
                    isAdminNavCatalogPath(pathname) ? styles.navLinkActive : ''
                  }`}
                  aria-expanded={catalogOpen}
                  aria-controls="admin-nav-catalog-sub"
                  onClick={() => setCatalogOpen((o) => !o)}
                >
                  <NavLinkLeading expandable open={catalogOpen} />
                  <span className={styles.navLinkLabel}>
                    {getNavLabel(locale, ADMIN_NAV_MANIFEST.catalog.labelKey)}
                  </span>
                </button>
                {catalogOpen ? (
                  <div id="admin-nav-catalog-sub" className={styles.navSub}>
                    {ADMIN_NAV_MANIFEST.catalog.children.map((child) => {
                      const active = isAdminNavChildActive(pathname, child);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`${styles.navLink} ${styles.navSublink} ${
                            active ? styles.navLinkActive : ''
                          }`}
                        >
                          <NavLinkLeading />
                          <span className={styles.navLinkLabel}>
                            {getNavLabel(locale, child.labelKey)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
            {ADMIN_NAV_MANIFEST.midLinks.map(({ href, section, labelKey }) =>
              renderNavLink(href, section, labelKey),
            )}
            {showSettings && visibleSettingsChildren.length > 0 ? (
              <div className={styles.navGroup}>
                <button
                  type="button"
                  className={`${styles.navLink} ${inSettings ? styles.navLinkActive : ''}`}
                  aria-expanded={settingsOpen}
                  aria-controls="admin-nav-settings-sub"
                  onClick={() => setSettingsOpen((o) => !o)}
                >
                  <NavLinkLeading expandable open={settingsOpen} />
                  <span className={styles.navLinkLabel}>
                    {getNavLabel(locale, ADMIN_NAV_MANIFEST.settings.labelKey)}
                  </span>
                </button>
                {settingsOpen ? (
                  <div id="admin-nav-settings-sub" className={styles.navSub}>
                    {visibleSettingsChildren.map((child) => {
                      const active = isAdminNavChildActive(pathname, child);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`${styles.navLink} ${styles.navSublink} ${
                            active ? styles.navLinkActive : ''
                          }`}
                        >
                          <NavLinkLeading />
                          <span className={styles.navLinkLabel}>
                            {getNavLabel(locale, child.labelKey)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </nav>
      <div className={styles.sidebarProfileBlock}>
        <Link href="/admin/settings/staff/me" prefetch={false} className={styles.sidebarProfile}>
          <div className={styles.sidebarProfileMain}>
            <img
              src={profileAvatar}
              alt=""
              width={32}
              height={32}
              className={styles.sidebarProfileAvatar}
            />
            <div className={styles.sidebarProfileText}>
              <span className={styles.sidebarProfileName}>{profileName}</span>
              <span className={styles.sidebarProfileRole}>{profileRole}</span>
            </div>
          </div>
        </Link>
        <button
          type="button"
          className={styles.sidebarLogout}
          onClick={() => void logout()}
          title={t.logout}
        >
          {t.logout}
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
          <AdminPermissionsProvider>
            <AdminRouteGuard>
              <AdminSidebarBadgesProvider enabled>
                <AdminShellBody sidebar={<AdminSidebar {...sidebarProps} />}>{children}</AdminShellBody>
              </AdminSidebarBadgesProvider>
            </AdminRouteGuard>
          </AdminPermissionsProvider>
        </AdminConfirmProvider>
      </AdminQueryProvider>
    </AdminLocaleProvider>
  );
}
