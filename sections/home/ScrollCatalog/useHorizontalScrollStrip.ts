'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animateScrollStripBy } from './scrollStripScroll';

const DRAG_THRESHOLD = 5;

function clientXFromEvent(e: React.MouseEvent | React.TouchEvent): number {
  return 'touches' in e ? e.touches[0].clientX : e.clientX;
}

export type UseHorizontalScrollStripOptions = {
  /** При смене ключа полоса прокручивается в начало. */
  resetKey?: string;
  /** Если false — стрелки и ResizeObserver не активны (мобилка без desktop strip). */
  enabled?: boolean;
};

export function useHorizontalScrollStrip({
  resetKey = '',
  enabled = true,
}: UseHorizontalScrollStripOptions = {}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollStripAnimCancelRef = useRef<(() => void) | null>(null);
  const didDragRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const lastXRef = useRef(0);

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollArrows = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollPrev(scrollLeft > 2);
    setCanScrollNext(maxScroll > 2 && scrollLeft < maxScroll - 2);
  }, []);

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (el) el.scrollLeft = 0;
    if (enabled) updateScrollArrows();
  }, [resetKey, enabled, updateScrollArrows]);

  useEffect(() => {
    if (!enabled) return;
    const el = wrapperRef.current;
    if (!el) return;
    updateScrollArrows();
    el.addEventListener('scroll', updateScrollArrows, { passive: true });
    const ro = new ResizeObserver(updateScrollArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollArrows);
      ro.disconnect();
    };
  }, [enabled, updateScrollArrows, resetKey]);

  useEffect(
    () => () => {
      scrollStripAnimCancelRef.current?.();
    },
    [],
  );

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    scrollStripAnimCancelRef.current?.();
    scrollStripAnimCancelRef.current = null;
    const clientX = clientXFromEvent(e);
    didDragRef.current = false;
    startXRef.current = clientX;
    lastXRef.current = clientX;
    if (wrapperRef.current) {
      startScrollLeftRef.current = wrapperRef.current.scrollLeft;
    }
  }, []);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if ('touches' in e === false && (e as React.MouseEvent).buttons !== 1) return;

    const clientX = clientXFromEvent(e);
    const dx = lastXRef.current - clientX;
    lastXRef.current = clientX;
    wrapper.scrollLeft += dx;

    if (Math.abs(wrapper.scrollLeft - startScrollLeftRef.current) > DRAG_THRESHOLD) {
      didDragRef.current = true;
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // Вертикальный wheel — скролл страницы; горизонтальная полоса — только Shift+wheel или drag/стрелки.
    if (!e.shiftKey) return;
    const el = e.currentTarget;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    if (el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft += e.deltaY;
    e.preventDefault();
  }, []);

  const scrollStrip = useCallback((dir: -1 | 1) => {
    const el = wrapperRef.current;
    if (!el) return;
    scrollStripAnimCancelRef.current?.();
    const anim = animateScrollStripBy(el, dir, () => {
      scrollStripAnimCancelRef.current = null;
    });
    scrollStripAnimCancelRef.current = anim.cancel;
  }, []);

  const handleLinkClick = useCallback(
    (
      e: React.MouseEvent<HTMLAnchorElement>,
      onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void,
    ) => {
      if (didDragRef.current) {
        e.preventDefault();
        return;
      }
      onLinkClick?.(e);
    },
    [],
  );

  return {
    wrapperRef,
    canScrollPrev: enabled && canScrollPrev,
    canScrollNext: enabled && canScrollNext,
    scrollStrip,
    handleLinkClick,
    wrapperProps: {
      onWheel: handleWheel,
      onMouseDown: handlePointerDown,
      onMouseMove: handlePointerMove,
      onMouseLeave: handlePointerMove,
      onTouchStart: handlePointerDown,
      onTouchMove: handlePointerMove,
    },
  };
}
