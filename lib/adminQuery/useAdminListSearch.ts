'use client';

import { useEffect, useState } from 'react';
import { useDebouncedValue } from './useDebouncedValue';

/** Поиск + страница: debounce q, сброс page при смене q и resetPageWhen. */
export function useAdminListSearch(debounceMs = 300, resetPageWhen: unknown[] = []) {
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q.trim(), debounceMs);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- сброс page по debouncedQ и внешним фильтрам
  }, [debouncedQ, ...resetPageWhen]);

  return { q, setQ, debouncedQ, page, setPage };
}
