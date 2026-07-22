'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Витринные страницы каталога — при смене pathname всегда с верха. */
function isCatalogTemplatePath(pathname: string): boolean {
  if (pathname === '/catalog' || pathname.startsWith('/catalog/')) return true;
  if (pathname.startsWith('/collections/')) return true;
  if (pathname === '/brands' || pathname.startsWith('/brands/')) return true;
  if (pathname.startsWith('/product/')) return true;
  return false;
}

/**
 * Скролл вверх при переходе между шаблонными страницами каталога.
 * Не трогает смену только `?query` (табы/фильтры с `scroll: false`).
 */
export function CatalogScrollToTop() {
  const pathname = usePathname() ?? '';

  useLayoutEffect(() => {
    if (!isCatalogTemplatePath(pathname)) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
