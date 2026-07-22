'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCatalogNavRoots } from '@/components/CatalogNavContext';
import { LogoPaths } from '@/components/SiteLoader/LogoPaths';
import {
  getCachedIsAuthenticated,
  USER_SESSION_CHANGED_EVENT,
} from '@/lib/userSessionClient';
import styles from './Footer.module.css';

const infoLinks = [
  { href: '/about', label: 'О нас' },
  { href: '/brands', label: 'Бренды' },
  { href: '/designers', label: 'Дизайнеры' },
  { href: '/projects', label: 'Проекты и концепции' },
  { href: '/blog', label: 'Новости и статьи' },
  { href: '/delivery', label: 'Доставка и оплата' },
  { href: '/warranty', label: 'Гарантия, обмен и возврат' },
  { href: '/referral', label: 'Реферальная программа' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contacts', label: 'Контакты' },
  { href: '/sitemap', label: 'Карта сайта' },
];

const legalLinks = [
  { href: '/privacy', label: 'Политика конфиденциальности' },
  { href: '/terms', label: 'Условия использования' },
  { href: '/cookies', label: 'Cookies' },
];

/** Пока нет URL в настройках — заглушка. */
const TELEGRAM_HREF = 'https://t.me/';

/** CTA партнёрства → регистрация. */
const PARTNER_HREF = '/register';

const FOOTER_RIGHT_HOME = '#EFDECD';
const FOOTER_RIGHT_CATALOG = '#FFC0CB';
const FOOTER_RIGHT_PRODUCT = '#DBC5EE';

/** Пастельная палитра для прочих страниц (детерминированный «рандом» по pathname). */
const FOOTER_RIGHT_OTHER = [
  '#E8F0E3',
  '#F5E6D3',
  '#E3EEF5',
  '#F0E8F5',
  '#E8F5F0',
  '#F5F0E3',
  '#EDE4DC',
  '#E4EDE8',
] as const;

type TagItem = { slug: string; name: string };

function hashPathname(pathname: string): number {
  let h = 0;
  for (let i = 0; i < pathname.length; i++) {
    h = (h * 31 + pathname.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function footerRightBackground(pathname: string): string {
  if (pathname === '/' || pathname === '') return FOOTER_RIGHT_HOME;
  if (pathname.startsWith('/product/')) return FOOTER_RIGHT_PRODUCT;
  if (
    pathname === '/catalog' ||
    pathname.startsWith('/catalog/') ||
    pathname.startsWith('/collections/') ||
    pathname === '/brands' ||
    pathname.startsWith('/brands/')
  ) {
    return FOOTER_RIGHT_CATALOG;
  }
  const idx = hashPathname(pathname) % FOOTER_RIGHT_OTHER.length;
  return FOOTER_RIGHT_OTHER[idx]!;
}

export function Footer() {
  const pathname = usePathname() ?? '';
  const catalogRoots = useCatalogNavRoots();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [accountHref, setAccountHref] = useState('/login');
  const logoRef = useRef<HTMLDivElement>(null);

  const rightBg = useMemo(() => footerRightBackground(pathname), [pathname]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/catalog/tags', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          items?: { slug: string; name: string }[];
        };
        const items = (data.items ?? [])
          .filter((t) => t.slug && t.name)
          .map((t) => ({ slug: t.slug, name: t.name }));
        if (!cancelled) setTags(items);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const sync = () => {
      void getCachedIsAuthenticated()
        .then((ok: boolean) => {
          if (!cancelled) setAccountHref(ok ? '/account/orders' : '/login');
        })
        .catch(() => {
          if (!cancelled) setAccountHref('/login');
        });
    };
    sync();
    window.addEventListener(USER_SESSION_CHANGED_EVENT, sync);
    return () => {
      cancelled = true;
      window.removeEventListener(USER_SESSION_CHANGED_EVENT, sync);
    };
  }, []);

  /* Скролл: начало ведёт, конец догоняет (без timed-появления). */
  useEffect(() => {
    const root = logoRef.current;
    if (!root) return;
    const letters = Array.from(
      root.querySelectorAll<HTMLElement>('.logo-wave__letter'),
    );
    if (!letters.length) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const n = letters.length;
    const lag = new Array<number>(n).fill(0);
    const maxLag = 36;
    let lastScroll = window.scrollY;
    let raf = 0;

    const paint = () => {
      let alive = false;
      lag[0] *= 0.86;
      if (Math.abs(lag[0]) > 0.08) alive = true;

      for (let i = 1; i < n; i++) {
        lag[i] += (lag[i - 1] - lag[i]) * 0.28;
        lag[i] *= 0.97;
        if (Math.abs(lag[i]) > 0.08) alive = true;
      }

      for (let i = 0; i < n; i++) {
        letters[i]!.style.transform = `translate3d(0, ${lag[i]}px, 0)`;
      }

      if (alive) raf = requestAnimationFrame(paint);
      else raf = 0;
    };

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastScroll;
      lastScroll = y;
      if (dy === 0) return;

      lag[0] = Math.max(-maxLag, Math.min(maxLag, lag[0]! + dy * 0.55));
      if (!raf) raf = requestAnimationFrame(paint);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      for (const el of letters) el.style.transform = '';
    };
  }, []);

  const catalogLinks = useMemo(() => {
    if (catalogRoots.length === 0) {
      return [{ href: '/catalog', label: 'Каталог', key: 'catalog-fallback' }];
    }
    return catalogRoots.map((c) => ({
      href: `/catalog/${c.slug}`,
      label: c.name,
      key: c.slug,
    }));
  }, [catalogRoots]);

  return (
    <footer className={styles.footer}>
      <div className={styles.shell}>
        <div className={styles.left}>
          <nav className={styles.columns} aria-label="Футер">
            <div className={styles.column}>
              <span className={styles.columnTitle}>588est</span>
              <div className={styles.columnLinks}>
                {catalogLinks.map((link) => (
                  <Link key={link.key} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className={styles.column}>
              <span className={styles.columnTitle}>Зоны</span>
              <div className={styles.columnLinks}>
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <Link
                      key={tag.slug}
                      href={`/catalog?tag=${encodeURIComponent(tag.slug)}`}
                    >
                      {tag.name}
                    </Link>
                  ))
                ) : (
                  <span className={styles.columnMuted}>—</span>
                )}
              </div>
            </div>

            <div className={styles.column}>
              <span className={styles.columnTitle}>Инфо</span>
              <div className={styles.columnLinks}>
                {infoLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <div className={styles.leftBottom}>
            <aside className={styles.partnerCta} aria-label="Партнёрство">
              <p className={styles.partnerCtaTitle}>Станьте партнёром 588est</p>
              <p className={styles.partnerCtaText}>
                Для дизайнеров, студий и команд —
                <br />
                присоединяйтесь к{'\u00A0'}реферальной программе и получайте выгоды
                с{'\u00A0'}каждой{'\u00A0'}сделки.
              </p>
              <Link href={PARTNER_HREF} className={styles.partnerCtaLink}>
                Стать партнёром
              </Link>
            </aside>

            <div className={styles.leftBottomMeta}>
              <div className={styles.legalLinks}>
                {legalLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
              <span className={styles.copyright}>588est. Все права защищены.</span>
            </div>
          </div>
        </div>

        <div className={styles.right} style={{ background: rightBg }}>
          <div className={styles.rightTop}>
            <Link href={accountHref} className={styles.rightLink}>
              Вход
            </Link>
            <a
              href={TELEGRAM_HREF}
              className={styles.rightLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Телеграм
            </a>
          </div>

          <div className={styles.rightLogoSlot}>
            <div ref={logoRef} className={styles.rightLogo} aria-label="588est">
              <LogoPaths className={styles.rightLogoMark} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
