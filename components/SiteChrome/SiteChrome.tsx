'use client';

import { usePathname } from 'next/navigation';
import { HeaderWrapper } from '@/components/Header';
import { Footer } from '@/components/Footer';

/** Пути без хедера и футера (страницы auth). */
const NO_CHROME_PREFIXES = ['/login', '/register'];

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

  return (
    <>
      {!hideChrome && <HeaderWrapper />}
      {children}
      {!hideChrome && !hideFooter && <Footer />}
    </>
  );
}
