'use client';

import { useEffect, useRef, useState } from 'react';

/** Увеличивает signal, когда секция впервые попадает в viewport (сброс при уходе из него). */
export function useGalleryAdvanceOnView(threshold = 1) {
  const sectionRef = useRef<HTMLElement>(null);
  const [galleryAdvanceSignal, setGalleryAdvanceSignal] = useState(0);
  const wasIntersectingRef = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const intersecting =
          entry.isIntersecting && entry.intersectionRatio >= threshold;
        if (intersecting && !wasIntersectingRef.current) {
          setGalleryAdvanceSignal((n) => n + 1);
        }
        wasIntersectingRef.current = intersecting;
      },
      { threshold: [0, 0.5, 0.75, threshold] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { sectionRef, galleryAdvanceSignal };
}
