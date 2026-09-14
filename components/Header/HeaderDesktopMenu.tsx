'use client';

import { TransitionLink } from '@/components/SiteTransition';
import { HeaderMenuSourcingPromo } from './HeaderMenuSourcingPromo';
import { HeaderOverlayShell } from './HeaderOverlayShell';
import { useOverlayPanel } from './useOverlayPanel';
import styles from './Header.module.css';

export const DESKTOP_MENU_PANEL_ID = 'header-desktop-menu';

/** Полный sitemap (бургер). Primary nav = visual mega (Каталог/Зоны с картинками). */
export const INFO_ABOUT_LINKS = [
  { href: '/about', label: 'О нас' },
  { href: '/designers', label: 'Дизайнеры' },
  { href: '/projects', label: 'Проекты' },
  { href: '/blog', label: 'Новости и статьи' },
] as const;

export const INFO_SERVICE_LINKS = [
  { href: '/delivery', label: 'Доставка и оплата' },
  { href: '/warranty', label: 'Гарантия, обмен и возврат' },
  { href: '/referral', label: 'Реферальная программа' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contacts', label: 'Контакты' },
] as const;

/** Все INFO-ссылки (mobile sitemap). */
export const INFO_LINKS = [...INFO_ABOUT_LINKS, ...INFO_SERVICE_LINKS] as const;

/** Разделы ЛК в десктоп-меню. */
export const ACCOUNT_MENU_LINKS = [
  { href: '/account/orders', label: 'Заказы' },
  { href: '/account/favorites', label: 'Избранное' },
  { href: '/account/projects', label: 'Проекты' },
  { href: '/account/docs', label: 'Документы' },
] as const;

const ZONES_HREF = '/catalog?tab=zones';

type Props = {
  open: boolean;
  closing: boolean;
  onClose: () => void;
  onNavigate: () => void;
  onSourcing: () => void;
  telegramHref: string;
};

export function HeaderDesktopMenu({
  open,
  closing,
  onClose,
  onNavigate,
  onSourcing,
  telegramHref,
}: Props) {
  const { panelRef, panelVisible, contentRevealed } = useOverlayPanel({
    open,
    closing,
    onClose,
    autoFocus: true,
  });

  if (!panelVisible) return null;

  return (
    <HeaderOverlayShell
      id={DESKTOP_MENU_PANEL_ID}
      open={open}
      closing={closing}
      contentRevealed={contentRevealed}
      onClose={onClose}
      ariaLabel="Меню сайта"
      panelRef={panelRef}
      className={styles.desktopMenuRoot}
      slideWrapClassName={styles.desktopMenuSlideWrap}
      panelClassName={styles.desktopMenuPanel}
      scrimClassName={styles.desktopMenuScrim}
      scrimLabel="Закрыть меню"
    >
      <div className={styles.desktopMenuScroll}>
        <div className="padding-global">
          <div className={styles.siteHeaderWrap}>
            <div className={styles.desktopMenuInner}>
              <nav className={styles.desktopMenuCol} aria-label="Разделы">
                <h2 className={styles.desktopMenuColTitle}>Разделы</h2>
                <ul className={styles.desktopMenuList}>
                  <li>
                    <TransitionLink href="/catalog" className={styles.desktopMenuLink} fromMenu>
                      Каталог
                    </TransitionLink>
                  </li>
                  <li>
                    <TransitionLink href={ZONES_HREF} className={styles.desktopMenuLink} fromMenu>
                      Зоны
                    </TransitionLink>
                  </li>
                </ul>
              </nav>

              <nav className={styles.desktopMenuCol} aria-label="Полезное">
                <h2 className={styles.desktopMenuColTitle}>Полезное</h2>
                <ul className={styles.desktopMenuList}>
                  <li>
                    <TransitionLink href="/brands" className={styles.desktopMenuLink} fromMenu>
                      Бренды
                    </TransitionLink>
                  </li>
                  {INFO_ABOUT_LINKS.map((link) => (
                    <li key={link.href}>
                      <TransitionLink href={link.href} className={styles.desktopMenuLink} fromMenu>
                        {link.label}
                      </TransitionLink>
                    </li>
                  ))}
                </ul>
              </nav>

              <nav className={styles.desktopMenuCol} aria-label="Покупателям">
                <h2 className={styles.desktopMenuColTitle}>Покупателям</h2>
                <ul className={styles.desktopMenuList}>
                  {INFO_SERVICE_LINKS.map((link) => (
                    <li key={link.href}>
                      <TransitionLink href={link.href} className={styles.desktopMenuLink} fromMenu>
                        {link.label}
                      </TransitionLink>
                    </li>
                  ))}
                  <li>
                    <a
                      href={telegramHref}
                      className={styles.desktopMenuLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onNavigate}
                    >
                      Телеграм
                    </a>
                  </li>
                </ul>
              </nav>

              <nav className={styles.desktopMenuCol} aria-label="Личный кабинет">
                <h2 className={styles.desktopMenuColTitle}>Личный кабинет</h2>
                <ul className={styles.desktopMenuList}>
                  {ACCOUNT_MENU_LINKS.map((link) => (
                    <li key={link.href}>
                      <TransitionLink href={link.href} className={styles.desktopMenuLink} fromMenu>
                        {link.label}
                      </TransitionLink>
                    </li>
                  ))}
                </ul>
              </nav>

              <HeaderMenuSourcingPromo variant="desktop" onClick={onSourcing} />
            </div>
          </div>
        </div>
      </div>
    </HeaderOverlayShell>
  );
}
