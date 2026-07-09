'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LogoPaths } from './LogoPaths';

const BOOT_LOADER_ID = 'site-boot-loader';

const LOGO_HEIGHT = 41;
const STAGGER_MS = 35;
const PATH_DURATION = 500;
const BG_COLLAPSE_DURATION = 600;

function removeBootLoader() {
  try {
    document.getElementById(BOOT_LOADER_ID)?.remove();
  } catch {
    /* ignore */
  }
}

export function SiteLoader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [shouldShow, setShouldShow] = useState(false);

  /** До первого layout-прохода клиента держим SSR `#site-boot-loader`; затем синхронно решаем — показывать ли анимированный лоадер. */
  useLayoutEffect(() => {
    removeBootLoader();
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav?.type === 'reload' || nav?.type === 'back_forward') {
        setShouldShow(false);
      } else {
        setShouldShow(true);
      }
    } catch {
      setShouldShow(true);
    }
  }, []);

  useEffect(() => {
    if (!shouldShow || !rootRef.current || !bgRef.current || !logoRef.current) return;

    const paths = logoRef.current.querySelectorAll('.site-loader__path');
    if (!paths.length) return;

    let cancelled = false;

    const runSequence = () => {
      if (cancelled) return;
      import('animejs').then(({ animate, stagger }) => {
        if (cancelled) return;
        const pathAnimation = animate(paths, {
          translateY: LOGO_HEIGHT,
          duration: PATH_DURATION,
          ease: 'outCubic',
          delay: stagger(STAGGER_MS),
        });

        pathAnimation.then(() => {
          if (cancelled) return;
          document.body.classList.add('--js-ready');
          const bgAnimation = animate(bgRef.current!, {
            translateY: '100%',
            duration: BG_COLLAPSE_DURATION,
            ease: 'inQuad',
          });
          bgAnimation.then(() => {
            if (!cancelled) _destroy();
          });
        });
      });
    };

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(runSequence);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [shouldShow]);

  function _destroy() {
    const el = rootRef.current;
    if (!el) return;
    const parent = el.parentNode;
    if (!parent) return;
    if ((parent as ParentNode).contains?.(el) === false) return;
    try {
      parent.removeChild(el);
    } catch {
      /* ignore */
    }
  }

  if (!shouldShow) return null;

  return (
    <div
      className="site-loader"
      data-site-loader
      aria-hidden="true"
      ref={rootRef}
    >
      <div className="site-loader__bg" ref={bgRef} />
      <div className="site-loader__logo" ref={logoRef}>
        <LogoPaths />
      </div>
    </div>
  );
}
