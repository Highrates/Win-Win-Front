'use client';

import { useEffect, useState } from 'react';

function readMatch(minPx: number): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(min-width: ${minPx}px)`).matches;
}

/** Синхронизация с брейкпоинтами ScrollCatalog (стрелки: min-width 769px). */
export function useMatchMinWidth(minPx: number): boolean {
  const [matches, setMatches] = useState(() => readMatch(minPx));
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minPx}px)`);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [minPx]);
  return matches;
}
