'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import * as transition from './transitionLogic';

export function SiteTransition() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isFirstMount = useRef(true);

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
