'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LogoPaths } from './LogoPaths';
import {
  animateLogoWaveIn,
  animateLogoWaveOut,
  loadAnime,
  logoWaveDistance,
  prepareLogoWaveIn,
} from './logoWave';

const BOOT_LOADER_ID = 'site-boot-loader';

const HOLD_AFTER_IN_MS = 280;
const BG_COLLAPSE_DURATION = 700;

function removeBootLoader() {
  try {
    document.getElementById(BOOT_LOADER_ID)?.remove();
  } catch {
    /* ignore */
  }
}

function markReady() {
  document.body.classList.add('--js-ready');
}

export function SiteLoader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [shouldShow, setShouldShow] = useState(false);

  useLayoutEffect(() => {
    removeBootLoader();
    /* Всегда показываем preload с волной (в т.ч. reload) — иначе анимация «пропадает» при обновлении. */
    setShouldShow(true);
  }, []);

  useEffect(() => {
    if (!shouldShow || !rootRef.current || !bgRef.current || !logoRef.current) return;

    let cancelled = false;
    const logoEl = logoRef.current;
    const distance = logoWaveDistance(logoEl);
    prepareLogoWaveIn(logoEl, distance);

    const runSequence = async () => {
      const bgEl = bgRef.current;
      if (!logoEl || !bgEl || cancelled) return;

      await animateLogoWaveIn(logoEl, distance);
      if (cancelled) return;

      await new Promise((r) => setTimeout(r, HOLD_AFTER_IN_MS));
      if (cancelled) return;

      await animateLogoWaveOut(logoEl, distance);
      if (cancelled) return;

      markReady();
      const { animate } = await loadAnime();
      if (cancelled) return;

      await animate(bgEl, {
        translateY: '100%',
        duration: BG_COLLAPSE_DURATION,
        ease: 'inQuad',
      });
      if (!cancelled) _destroy();
    };

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void runSequence();
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [shouldShow]);

  function _destroy() {
    const el = rootRef.current;
    if (!el) return;
    el.style.pointerEvents = 'none';
    el.style.visibility = 'hidden';
    const parent = el.parentNode;
    if (!parent) return;
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
