'use client';

import { useEffect, useRef, useState } from 'react';

const GALLERY_ADVANCE_DELAY_MS = 2000;

/** Один раз за загрузку: через 3 с после полного попадания секции в viewport. */
export function useGalleryAdvanceOnView(threshold = 1) {
  const sectionRef = useRef<HTMLElement>(null);
  const [galleryAdvanceSignal, setGalleryAdvanceSignal] = useState(0);
  const hasTriggeredRef = useRef(false);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || hasTriggeredRef.current) return;

    const clearDelay = () => {
      if (delayTimerRef.current != null) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
    };

    let observer: IntersectionObserver;

    const triggerOnce = () => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;
      clearDelay();
      setGalleryAdvanceSignal(1);
      observer.disconnect();
    };

    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || hasTriggeredRef.current) return;
        const intersecting =
          entry.isIntersecting && entry.intersectionRatio >= threshold;
        if (intersecting) {
          if (delayTimerRef.current == null) {
            delayTimerRef.current = setTimeout(triggerOnce, GALLERY_ADVANCE_DELAY_MS);
          }
          return;
        }
        clearDelay();
      },
      { threshold: [0, 0.5, 0.75, threshold] },
    );

    observer.observe(el);
    return () => {
      clearDelay();
      observer.disconnect();
    };
  }, [threshold]);

  return { sectionRef, galleryAdvanceSignal };
};
