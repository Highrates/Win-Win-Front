'use client';

import { useEffect, useState } from 'react';

/** Синхронизация с брейкпоинтами ScrollCatalog (стрелки: min-width 769px). */
export function useMatchMinWidth(minPx: number): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minPx}px)`);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [minPx]);
  return matches;
}
