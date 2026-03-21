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

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const hideChrome = shouldHideChrome(pathname);

  return (
    <>
      {!hideChrome && <HeaderWrapper />}
      {children}
      {!hideChrome && <Footer />}
    </>
  );
}
