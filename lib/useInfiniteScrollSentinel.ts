'use client';

import { useEffect, useRef } from 'react';

/** Вызывает callback, когда sentinel попадает в viewport (с запасом rootMargin). */
export function useInfiniteScrollSentinel(
  onVisible: () => void,
  enabled: boolean,
  rootMargin = '480px',
) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  useEffect(() => {
    if (!enabled) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisibleRef.current();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return sentinelRef;
}
