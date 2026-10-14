/** Чистые хелперы URL витрины `/projects` (`?source=`). */

export type ProjectsFeedSourceParam = 'all' | 'designers' | 'brands';

/**
 * Обновляет `source` в query, сохраняя остальные параметры.
 * `all` → параметр убираем (канон без `?source=`).
 * Без изменений → `null` (без rewrite).
 */
export function nextProjectsSearchWithSource(
  currentSearch: string,
  feed: ProjectsFeedSourceParam,
): string | null {
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
