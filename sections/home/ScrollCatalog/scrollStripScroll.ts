/** Шаг по стрелкам: небольшой относительно ширины, с верхней границей (раньше было ~72% вьюпорта). */
export function getScrollStripStep(clientWidth: number): number {
  return Math.min(320, Math.max(160, Math.round(clientWidth * 0.28)));
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export type ScrollStripAnim = { cancel: () => void };

/**
 * Плавная прокрутка по горизонтали с easing (точнее и мягче, чем один вызов scrollBy(smooth)).
 */
export function animateScrollStripBy(
  el: HTMLElement,
  dir: -1 | 1,
  onDone?: () => void
): ScrollStripAnim {
  const step = getScrollStripStep(el.clientWidth) * dir;
  const start = el.scrollLeft;
  const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
  const target = Math.max(0, Math.min(maxScroll, start + step));
  const distance = Math.abs(target - start);
  if (distance < 1) {
    onDone?.();
    return { cancel: () => {} };
  }

  const durationMs = Math.min(720, Math.max(400, 380 + distance * 0.35));
  const t0 = performance.now();
  let rafId = 0;
  let cancelled = false;

  const frame = (now: number) => {
    if (cancelled) return;
    const t = Math.min(1, (now - t0) / durationMs);
    const eased = easeInOutCubic(t);
    el.scrollLeft = start + (target - start) * eased;
    if (t < 1) {
      rafId = requestAnimationFrame(frame);
    } else {
      onDone?.();
    }
  };

  rafId = requestAnimationFrame(frame);
  return {
    cancel: () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    },
  };
}
