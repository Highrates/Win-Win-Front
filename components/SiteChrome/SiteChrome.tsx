'use client';

import { usePathname } from 'next/navigation';
import { HeaderWrapper } from '@/components/Header';
import { Footer } from '@/components/Footer';
import styles from './SiteChrome.module.css';

/** Пути без хедера и футера (страницы auth и админка со своим layout). */
const NO_CHROME_PREFIXES = ['/login', '/register', '/admin'];

function shouldHideChrome(pathname: string) {
  return NO_CHROME_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** ЛК: футер не показываем */
function shouldHideFooter(pathname: string) {
  return pathname === '/account' || pathname.startsWith('/account/');
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const hideChrome = shouldHideChrome(pathname);
  const hideFooter = shouldHideFooter(pathname);
  const isHome = pathname === '/';

  return (
    <>
      {!hideChrome && <HeaderWrapper />}
      {!hideChrome ? (
        <div className={`${styles.taglineRow} ${isHome ? styles.taglineRowOnHome : ''}`.trim()}>
          <div className="padding-global">
            <h3 className={`${styles.tagline} ${isHome ? styles.taglineOnHome : ''}`.trim()}>
              Качественный и стильный интерьер из Китая
            </h3>
          </div>
        </div>
      ) : null}
      {children}
      {!hideChrome && !hideFooter && <Footer />}
    </>
  );
}
