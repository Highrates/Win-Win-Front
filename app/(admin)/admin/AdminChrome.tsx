'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ADMIN_LOCALE_STORAGE_KEY,
  adminBrandLine,
  adminChromeStrings,
  catalogGroupLabel,
  catalogSubLabel,
  defaultAdminLocale,
  getNavLabel,
  type AdminLocale,
} from '@/lib/adminChromeI18n';
import styles from './layout.module.css';

const CATALOG_CHILDREN = [
  { href: '/admin/catalog/products', key: 'products' as const },
  { href: '/admin/catalog/categories', key: 'categories' as const },
  { href: '/admin/collections', key: 'collections' as const },
];

const NAV_HREFS = [
  '/admin',
  '/admin/modeling',
  '/admin/clients',
  '/admin/orders',
  '/admin/brands',
  '/admin/objects',
  '/admin/blog',
  '/admin/referrals',
  '/admin/pages',
] as const;

function CatalogChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={styles.navChevronIcon}
      data-open={open || undefined}
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden
    >
      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [locale, setLocale] = useState<AdminLocale>(defaultAdminLocale);
  const [localeReady, setLocaleReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY);
      if (saved === 'zh' || saved === 'ru') setLocale(saved);
    } catch {
      /* ignore */
    }
    setLocaleReady(true);
  }, []);

  function setAdminLocale(next: AdminLocale) {
    setLocale(next);
    try {
      localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    router.push('/admin/login');
    router.refresh();
  }

  const t = adminChromeStrings(locale);
  const navAria = locale === 'zh' ? '管理区' : 'Разделы админки';
  const inCatalog =
    pathname.startsWith('/admin/catalog') || pathname.startsWith('/admin/collections');
  const [catalogOpen, setCatalogOpen] = useState(inCatalog);
  useEffect(() => {
    if (inCatalog) setCatalogOpen(true);
  }, [inCatalog]);

  return (
    <div className={styles.shell}>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <p className={styles.brand}>
            {localeReady ? adminBrandLine(locale) : adminBrandLine(defaultAdminLocale)}
          </p>
          <div className={styles.localeBlock}>
            <p className={styles.localeHeading}>{localeReady ? t.langHeading : 'Язык'}</p>
            <div className={styles.localeRow} role="group" aria-label={localeReady ? t.langHeading : 'Язык'}>
              <button
                type="button"
                className={`${styles.localeBtn} ${locale === 'ru' ? styles.localeBtnActive : ''}`}
                onClick={() => setAdminLocale('ru')}
                disabled={!localeReady}
              >
                {localeReady ? t.langBtnRu : 'Русский'}
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
          <nav aria-label={navAria}>
            <div className={styles.navGroup}>
              <div className={styles.navGroupRow}>
                <button
                  type="button"
                  className={styles.navChevronBtn}
                  aria-expanded={catalogOpen}
                  aria-controls="admin-nav-catalog-sub"
                  onClick={() => setCatalogOpen((o) => !o)}
                  title={locale === 'zh' ? '展开或折叠' : 'Развернуть или свернуть'}
                >
                  <CatalogChevron open={catalogOpen} />
                </button>
                <span
                  className={`${styles.navLink} ${styles.navGroupLink} ${styles.navGroupTitle} ${
                    pathname.startsWith('/admin/catalog') || pathname.startsWith('/admin/collections')
                      ? styles.navLinkActive
                      : ''
                  }`}
                >
                  {catalogGroupLabel(localeReady ? locale : defaultAdminLocale)}
                </span>
              </div>
              {catalogOpen ? (
                <div id="admin-nav-catalog-sub" className={styles.navSub}>
                  {CATALOG_CHILDREN.map(({ href, key }) => {
                    const active =
                      href === '/admin/collections'
                        ? pathname.startsWith('/admin/collections')
                        : pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`${styles.navLink} ${styles.navSublink} ${
                          active ? styles.navLinkActive : ''
                        }`}
                      >
                        {catalogSubLabel(localeReady ? locale : defaultAdminLocale, key)}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
            {NAV_HREFS.map((href) => {
              const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                >
                  {getNavLabel(localeReady ? locale : defaultAdminLocale, href)}
                </Link>
              );
            })}
          </nav>
          <button type="button" className={styles.logout} onClick={logout}>
            {localeReady ? t.logout : 'Выйти'}
          </button>
        </aside>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
