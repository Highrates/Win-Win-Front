'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { CatalogScrollToTop } from '@/components/CatalogScrollToTop/CatalogScrollToTop';
import { HeaderWrapper } from '@/components/Header';
import { Footer } from '@/components/Footer';

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

  return (
    <>
      <CatalogScrollToTop />
      {!hideChrome && (
        <Suspense fallback={null}>
          <HeaderWrapper />
        </Suspense>
      )}
      {children}
      {!hideChrome && !hideFooter && <Footer />}
    </>
  );
}
