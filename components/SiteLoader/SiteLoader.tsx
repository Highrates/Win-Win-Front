'use client';

import { useEffect, useRef, useState } from 'react';
import { LogoPaths } from './LogoPaths';

const LOGO_HEIGHT = 41;
const STAGGER_MS = 35;
const PATH_DURATION = 500;
const BG_COLLAPSE_DURATION = 600;

export function SiteLoader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
    // Не показываем прелоадер на reload/back-forward — только на "первый вход" в новой вкладке.
    // Это убирает эффект "страница успела отрисоваться → потом прелоадер поверх".
    try {
      const nav = performance.getEntriesByType('navigation')?.[0] as PerformanceNavigationTiming | undefined;
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
    if (!mounted || !rootRef.current || !bgRef.current || !logoRef.current) return;

    const paths = logoRef.current.querySelectorAll('.site-loader__path');
    if (!paths.length) return;

    const runSequence = () => {
      import('animejs').then(({ animate, stagger }) => {
        // 1) Paths translateY down with stagger
        const pathAnimation = animate(paths, {
          translateY: LOGO_HEIGHT,
          duration: PATH_DURATION,
          ease: 'outCubic',
          delay: stagger(STAGGER_MS),
        });

        pathAnimation.then(() => {
          document.body.classList.add('--js-ready');
          const bgAnimation = animate(bgRef.current!, {
            translateY: '100%',
            duration: BG_COLLAPSE_DURATION,
            ease: 'inQuad',
          });
          bgAnimation.then(() => _destroy());
        });
      });
    };

    const handleLoad = () => {
      runSequence();
    };

    if (document.readyState === 'complete') {
      const t = setTimeout(runSequence, 0);
      return () => clearTimeout(t);
    }
    window.addEventListener('load', handleLoad);
    return () => window.removeEventListener('load', handleLoad);
  }, [mounted]);

  function _destroy() {
    const el = rootRef.current;
    if (!el) return;
    const parent = el.parentNode;
    if (!parent) return;
    // На быстрых переходах / повторных вызовах анимации узел уже может быть удалён.
    if ((parent as ParentNode).contains?.(el) === false) return;
    try {
      parent.removeChild(el);
    } catch {
      /* ignore */
    }
  }

  if (!mounted || !shouldShow) return null;

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
