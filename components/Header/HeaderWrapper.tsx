'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Header, HeaderVariant } from './Header';

const MOBILE_BREAKPOINT = 768;
const HERO_SECTION_ID = 'hero-section';
/** Мёртвая зона (px): переключаем на main только когда проскроллили на PAST_THRESHOLD ниже низа hero, обратно на minimal — когда hero снова на OVER_MINIMAL выше низа вьюпорта. Убирает рябь на границе. */
const PAST_THRESHOLD = 80;
const OVER_MINIMAL_THRESHOLD = 80;

function useScrolledPastHero(pathname: string) {
  const [past, setPast] = useState(false);
  const pastRef = useRef(false);

  useEffect(() => {
    if (pathname !== '/') {
      setPast(true);
      pastRef.current = true;
      return;
    }
    setPast(false);
    pastRef.current = false;

    let rafId: number;
    let scrollCleanup: (() => void) | null = null;

    const setup = () => {
      const hero = document.getElementById(HERO_SECTION_ID);
      if (!hero) {
        rafId = requestAnimationFrame(setup);
        return;
      }

      let scrollRafId = 0;

      const update = () => {
        const rect = hero.getBoundingClientRect();
        const bottom = rect.bottom;
        if (pastRef.current) {
          if (bottom > OVER_MINIMAL_THRESHOLD) {
            pastRef.current = false;
            setPast(false);
          }
        } else {
          if (bottom < -PAST_THRESHOLD) {
            pastRef.current = true;
            setPast(true);
          }
        }
      };

      const onScroll = () => {
        cancelAnimationFrame(scrollRafId);
        scrollRafId = requestAnimationFrame(update);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      update();

      scrollCleanup = () => {
        window.removeEventListener('scroll', onScroll);
        cancelAnimationFrame(scrollRafId);
      };
    };
    rafId = requestAnimationFrame(setup);

    return () => {
      cancelAnimationFrame(rafId);
      scrollCleanup?.();
    };
  }, [pathname]);

  return past;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  return isMobile;
}

export function HeaderWrapper() {
  const pathname = usePathname();
  const hasScrolledPastHero = useScrolledPastHero(pathname);
  const isMobile = useIsMobile();
  const [superMenuOpen, setSuperMenuOpen] = useState(false);

  const variant: HeaderVariant =
    isMobile ? 'main' : pathname !== '/' ? 'main' : hasScrolledPastHero ? 'main' : 'minimal';
  const isMainOverlayOnHome =
    (pathname === '/' && variant === 'main') ||
    pathname.startsWith('/categories/') ||
    pathname.startsWith('/product/') ||
    pathname.startsWith('/brands');

  const prevScrolledPastHeroRef = useRef(hasScrolledPastHero);

  // Закрываем супер-меню только в момент перехода minimal → main; ref обновляем всегда на главной, иначе при первом открытии с main мерцает
  useEffect(() => {
    if (pathname !== '/') return;
    const justScrolledPast = hasScrolledPastHero && !prevScrolledPastHeroRef.current;
    prevScrolledPastHeroRef.current = hasScrolledPastHero;
    if (superMenuOpen && justScrolledPast) {
      setSuperMenuOpen(false);
    }
  }, [pathname, hasScrolledPastHero, superMenuOpen]);

  return (
    <Header
      variant={variant}
      isMainOverlayOnHome={isMainOverlayOnHome}
      superMenuOpen={superMenuOpen}
      setSuperMenuOpen={setSuperMenuOpen}
    />
  );
}
