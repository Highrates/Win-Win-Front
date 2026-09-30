/** Чистые хелперы URL витрины `/projects` (source-чипы ↔ `?source=`). */

export type ProjectsFeedSourceParam = 'all' | 'designers' | 'brands';

export type ProjectsSourceChips = {
  designers: boolean;
  brands: boolean;
};

export function chipsFromFeedSource(source: ProjectsFeedSourceParam): ProjectsSourceChips {
  return {
    designers: source === 'all' || source === 'designers',
    brands: source === 'all' || source === 'brands',
  };
}

/** Источник ленты из чипов (без forced brand/productBrand). */
export function feedSourceFromChips(sources: ProjectsSourceChips): ProjectsFeedSourceParam {
  if (sources.designers && sources.brands) return 'all';
  if (sources.brands) return 'brands';
  if (sources.designers) return 'designers';
  /** оба off — в URL не пишем; локально feed не ходит. */
  return 'all';
}

/**
 * Обновляет `source` в query, сохраняя остальные параметры.
 * `all` → параметр убираем (канон без `?source=`).
 * Оба чипа off → `source` не трогаем (возвращаем null = без rewrite).
 */
export function nextProjectsSearchWithSource(
  currentSearch: string,
  sources: ProjectsSourceChips,
): string | null {
  if (!sources.designers && !sources.brands) return null;
  const feed = feedSourceFromChips(sources);
  const params = new URLSearchParams(
    currentSearch.startsWith('?') ? currentSearch.slice(1) : currentSearch,
  );
  const prev = params.get('source');
  if (feed === 'all') {
    if (prev == null || prev === 'all') {
      if (prev === 'all') {
        params.delete('source');
        const qs = params.toString();
        return qs ? `?${qs}` : '';
      }
      return null;
    }
    params.delete('source');
  } else {
    if (prev === feed) return null;
    params.set('source', feed);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
