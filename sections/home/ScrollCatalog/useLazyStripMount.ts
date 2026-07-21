'use client';

import { useCallback, useEffect, useState } from 'react';

/** Откладывает mount интерактивной полосы до idle или первого взаимодействия. */
export function useLazyStripMount() {
  const [ready, setReady] = useState(false);

  const activate = useCallback(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) return;

    let cancelled = false;
    const mount = () => {
      if (!cancelled) setReady(true);
    };

    const idleId =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(mount, { timeout: 2500 })
        : window.setTimeout(mount, 2500);

    const onInteract = () => {
      mount();
      window.removeEventListener('pointerdown', onInteract, true);
      window.removeEventListener('keydown', onInteract, true);
    };

    window.addEventListener('pointerdown', onInteract, { capture: true, passive: true });
    window.addEventListener('keydown', onInteract, { capture: true, passive: true });

    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId as number);
      } else {
        window.clearTimeout(idleId as number);
      }
      window.removeEventListener('pointerdown', onInteract, true);
      window.removeEventListener('keydown', onInteract, true);
    };
  }, [ready]);

  return { stripReady: ready, activateStrip: activate };
}
