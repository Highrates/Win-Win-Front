/**
 * Только для Server Components: прямые запросы к Nest.
 * Клиентские компоненты импортируют `@/lib/chinaTours/formatTourDate` и типы из `./types`.
 */
import { cache } from 'react';
import { getServerApiBase } from '@/lib/serverApiBase';
import type { ChinaTourDetail, ChinaTourListItem, ChinaToursLanding } from './types';

async function fetchJson<T>(path: string): Promise<T | null> {
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/${path.replace(/^\//, '')}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Один запрос на request: home / page / metadata делят результат. */
export const fetchChinaToursLanding = cache((): Promise<ChinaToursLanding | null> => {
  return fetchJson<ChinaToursLanding>('china-tours/landing');
});

/** Один запрос на request: home teaser и `/tours` делят результат. */
export const fetchChinaToursList = cache((): Promise<ChinaTourListItem[] | null> => {
  return fetchJson<ChinaTourListItem[]>('china-tours');
});

/** Один запрос на request: metadata + page делят результат. */
export const fetchChinaTourBySlug = cache(
  async (slug: string): Promise<ChinaTourDetail | null> => {
    const s = slug.trim();
    if (!s) return null;
    return fetchJson<ChinaTourDetail>(`china-tours/${encodeURIComponent(s)}`);
  },
);
