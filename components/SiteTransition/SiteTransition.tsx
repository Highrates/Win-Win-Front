'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import * as transition from './transitionLogic';

/** Совпадает с зоной без хрома в SiteChrome — переходы только между auth без оверлея */
function isAuthPath(p: string) {
  return (
    p === '/login' ||
    p.startsWith('/login/') ||
    p === '/register' ||
    p.startsWith('/register/')
  );
}

export function SiteTransition() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isFirstMount = useRef(true);
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!overlayRef.current || !bgRef.current) return;
    transition.registerTransitionElements(overlayRef.current, bgRef.current);
    return () => {
      transition.registerTransitionElements(null, null);
    };
  }, []);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevPathnameRef.current = pathname;
      return;
    }

    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    if (prev != null && isAuthPath(prev) && isAuthPath(pathname)) {
      return;
    }

    transition.enter();
  }, [pathname]);

  return (
    <div
      className="site-transition visibility-hidden pointer-events-none"
      data-site-transition
      aria-hidden="true"
      ref={overlayRef}
    >
      <div className="site-transition__bg bg-color-white" ref={bgRef} />
    </div>
  );
}
