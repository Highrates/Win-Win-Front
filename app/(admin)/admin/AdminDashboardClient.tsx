'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ADMIN_DASHBOARD_LINKS } from '@win-win/admin-sections';
import { adminDashboardStrings } from '@/lib/admin-i18n/adminChromeI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useAdminPermissions } from '@/lib/adminPermissions/AdminPermissionsProvider';
import styles from './catalog/catalogAdmin.module.css';

export function AdminDashboardClient() {
  const { locale } = useAdminLocale();
  const { canAccessSection, loading } = useAdminPermissions();
  const { title, lead, linkMeta, accessDenied } = adminDashboardStrings(locale);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showDeniedBanner, setShowDeniedBanner] = useState(false);

  useEffect(() => {
    if (searchParams.get('denied') === '1') {
      setShowDeniedBanner(true);
      router.replace('/admin');
    }
  }, [searchParams, router]);

  const links = ADMIN_DASHBOARD_LINKS.filter(
    (item) => !loading && canAccessSection(item.section),
  ).map((item) => ({
    href: item.href,
    label: linkMeta[item.key].label,
    note: linkMeta[item.key].note,
  }));

  return (
    <main>
      {showDeniedBanner ? (
        <div className={styles.errorBanner} role="alert">
          <span>{accessDenied}</span>
          <button
            type="button"
            className={styles.errorBannerDismiss}
            onClick={() => setShowDeniedBanner(false)}
            aria-label={locale === 'zh' ? '关闭' : 'Закрыть'}
          >
            ×
          </button>
        </div>
      ) : null}
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lead}>{lead}</p>
      {loading ? (
        <p className={styles.lead}>{locale === 'zh' ? '加载中…' : 'Загрузка…'}</p>
      ) : links.length > 0 ? (
        <ul className={styles.grid} aria-label={title}>
          {links.map(({ href, label, note }) => (
            <li key={href}>
              <Link href={href} className={styles.card}>
                <span className={styles.cardTitle}>{label}</span>
                <span className={styles.cardNote}>{note}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.lead}>{locale === 'zh' ? '暂无可用分区。' : 'Нет доступных разделов.'}</p>
      )}
    </main>
  );
}
