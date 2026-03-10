'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './Nav.module.css';

const links = [
  { href: '/categories', label: 'Каталог' },
  { href: '/brands', label: 'Бренды' },
  { href: '/designers', label: 'Дизайнеры' },
  { href: '/projects', label: 'Проекты' },
  { href: '/blog', label: 'Статьи' },
];

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.links}>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className={styles.link}>
              {label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          className={styles.burger}
          aria-label="Открыть меню"
          onClick={() => setMobileOpen(true)}
        >
          ☰
        </button>
      </nav>

      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuOpen : ''}`} aria-hidden={!mobileOpen}>
        <button type="button" className={styles.closeBtn} aria-label="Закрыть меню" onClick={() => setMobileOpen(false)}>
          ×
        </button>
        {links.map(({ href, label }) => (
          <Link key={href} href={href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
            {label}
          </Link>
        ))}
      </div>
    </>
  );
}
