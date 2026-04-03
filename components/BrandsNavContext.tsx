'use client';

import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type BrandsNavItem = { slug: string; name: string };

const BrandsNavContext = createContext<BrandsNavItem[]>([]);

function parseMenuPayload(data: unknown): BrandsNavItem[] {
  if (!data || typeof data !== 'object' || !('items' in data)) return [];
  const items = (data as { items: BrandsNavItem[] }).items;
  if (!Array.isArray(items)) return [];
  return items.map((x) => ({ slug: x.slug, name: x.name }));
}

export function BrandsNavProvider({
  initialItems,
  children,
}: {
  initialItems: BrandsNavItem[];
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<BrandsNavItem[]>(initialItems);
  const pathname = usePathname();

  const pull = useCallback(async () => {
    try {
      const res = await fetch('/api/brands/menu', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setItems(parseMenuPayload(data));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    pull();
  }, [pathname, pull]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') pull();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [pull]);

  return <BrandsNavContext.Provider value={items}>{children}</BrandsNavContext.Provider>;
}

export function useBrandsNavMenu(): BrandsNavItem[] {
  return useContext(BrandsNavContext);
}
