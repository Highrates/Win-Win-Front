'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { useCatalogNavRoots } from '@/components/CatalogNavContext';
import styles from './Footer.module.css';

const infoLinks = [
  { href: '/about', label: 'O Win-Win' },
  { href: '/delivery', label: 'Доставка и оплата' },
  { href: '/warranty', label: 'Гарантия, обмен и возврат' },
  { href: '/careers', label: 'Карьера' },
  { href: '/sitemap', label: 'Карта сайта' },
  { href: '/referral', label: 'Реферальная программа' },
];

const partnerLinks = [
  { href: '/about', label: 'O Win-Win' },
  { href: '/delivery', label: 'Доставка и оплата' },
  { href: '/referral', label: 'Реферальная программа' },
];

export function Footer() {
  const catalogRoots = useCatalogNavRoots();

  const menuColumns = useMemo(() => {
    const catalogLinks =
      catalogRoots.length > 0
        ? catalogRoots.map((c) => ({ href: `/categories/${c.slug}`, label: c.name, key: c.slug }))
        : [{ href: '/categories', label: 'Каталог', key: 'catalog-fallback' }];

    return [
      { title: 'Информация', links: infoLinks.map((l, i) => ({ ...l, key: `info-${i}` })) },
      { title: 'Каталог', links: catalogLinks },
      {
        title: 'Партнерам',
        links: partnerLinks.map((l, i) => ({ ...l, key: `partner-${i}` })),
      },
    ];
  }, [catalogRoots]);

  return (
    <footer className={styles.footer}>
      <div className={styles.bg}>
        <div className={`padding-global ${styles.footerContent}`}>
          <div className={styles.top}>
            <div className={styles.topLeft}>
              <img
                className={styles.footerImg}
                src="/images/footer-img.png"
                alt=""
                width={500}
                height={300}
              />
              <Image
                src="/images/logo.svg"
                alt="Win-Win"
                width={400}
                height={59}
                className={styles.logo}
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
            <nav className={styles.footerMenu} aria-label="Футер">
              {menuColumns.map((col) => (
                <div key={col.title} className={styles.menuColumn}>
                  <span className={styles.columnTitle}>{col.title}</span>
                  <div className={styles.columnLinks}>
                    {col.links.map((link) => (
                      <Link key={link.key} href={link.href}>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          <div className={styles.bottom}>
            <div className={styles.bottomInner}>
              <span className={styles.bottomText}>Win-Win. Все права защищены.</span>
              <div className={styles.bottomLinks}>
                <Link href="/privacy">Политика конфиденциальности</Link>
                <Link href="/terms">Условия использования</Link>
                <Link href="/cookies">Cookies</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
