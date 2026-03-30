'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './layout.module.css';

const NAV: { href: string; label: string }[] = [
  { href: '/admin', label: 'Дашборд' },
  { href: '/admin/catalog', label: 'Каталог' },
  { href: '/admin/modeling', label: 'Моделирование' },
  { href: '/admin/clients', label: 'Клиенты' },
  { href: '/admin/orders', label: 'Заказы' },
  { href: '/admin/brands', label: 'Бренды' },
  { href: '/admin/blog', label: 'Блог' },
  { href: '/admin/referrals', label: 'Рефералы' },
  { href: '/admin/collections', label: 'Коллекции' },
  { href: '/admin/pages', label: 'Страницы' },
];

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className={styles.shell}>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <p className={styles.brand}>Win-Win · Админка</p>
          <nav aria-label="Разделы админки">
            {NAV.map(({ href, label }) => {
              const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <button type="button" className={styles.logout} onClick={logout}>
            Выйти
          </button>
        </aside>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
