'use client';

import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type CatalogNavRoot = { slug: string; name: string };

const CatalogNavContext = createContext<CatalogNavRoot[]>([]);

function parseRootsPayload(data: unknown): CatalogNavRoot[] {
  if (!data || typeof data !== 'object' || !('items' in data)) return [];
  const items = (data as { items: { slug: string; name: string }[] }).items;
  if (!Array.isArray(items)) return [];
  return items.map((x) => ({ slug: x.slug, name: x.name }));
}

export function CatalogNavProvider({
  initialRoots,
  children,
}: {
  initialRoots: CatalogNavRoot[];
  children: React.ReactNode;
}) {
  const [roots, setRoots] = useState<CatalogNavRoot[]>(initialRoots);
  const pathname = usePathname();

  const pull = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog/roots', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setRoots(parseRootsPayload(data));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setRoots(initialRoots);
  }, [initialRoots]);

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    pull();
  }, [pathname, pull]);

  useEffect(() => {
    const onVis = () => {
      if (pathname.startsWith('/admin')) return;
      if (document.visibilityState === 'visible') pull();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [pathname, pull]);

  return <CatalogNavContext.Provider value={roots}>{children}</CatalogNavContext.Provider>;
}

export function useCatalogNavRoots(): CatalogNavRoot[] {
  return useContext(CatalogNavContext);
}
