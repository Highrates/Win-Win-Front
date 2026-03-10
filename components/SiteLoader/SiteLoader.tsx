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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
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
    if (rootRef.current?.parentNode) {
      rootRef.current.parentNode.removeChild(rootRef.current);
    }
  }

  if (!mounted) return null;

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
