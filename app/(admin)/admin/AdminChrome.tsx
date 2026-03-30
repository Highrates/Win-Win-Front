'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ADMIN_LOCALE_STORAGE_KEY,
  adminBrandLine,
  adminChromeStrings,
  defaultAdminLocale,
  getNavLabel,
  type AdminLocale,
} from '@/lib/adminChromeI18n';
import styles from './layout.module.css';

const NAV_HREFS = [
  '/admin',
  '/admin/catalog',
  '/admin/modeling',
  '/admin/clients',
  '/admin/orders',
  '/admin/brands',
  '/admin/blog',
  '/admin/referrals',
  '/admin/collections',
  '/admin/pages',
] as const;

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
