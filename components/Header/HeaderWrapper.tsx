'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Header, HeaderVariant } from './Header';

const MOBILE_BREAKPOINT = 768;
const HERO_SECTION_ID = 'hero-section';
/** Мёртвая зона (px): переключаем на main только когда проскроллили на PAST_THRESHOLD ниже низа hero, обратно на minimal — когда hero снова на OVER_MINIMAL выше низа вьюпорта. Убирает рябь на границе. */
const PAST_THRESHOLD = 80;
const OVER_MINIMAL_THRESHOLD = 80;

function isHeroLandingPath(pathname: string, hasTagQuery: boolean) {
  if (pathname === '/') return true;
  // Хаб каталога с fold/hero; `?tag=` — обычная страница без hero
  if (pathname === '/catalog' && !hasTagQuery) return true;
  return false;
}

function useScrolledPastHero(pathname: string, hasTagQuery: boolean) {
  const [past, setPast] = useState(false);
  const pastRef = useRef(false);
  const isLanding = isHeroLandingPath(pathname, hasTagQuery);

  useEffect(() => {
    if (!isLanding) {
      setPast(true);
      pastRef.current = true;
      return;
    }
    setPast(false);
    pastRef.current = false;

    let rafId: number;
    let scrollCleanup: (() => void) | null = null;
    let attempts = 0;

    const setup = () => {
      const hero = document.getElementById(HERO_SECTION_ID);
      if (!hero) {
        attempts += 1;
        if (attempts > 90) {
          pastRef.current = true;
          setPast(true);
          return;
        }
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
  }, [pathname, isLanding]);

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
  const searchParams = useSearchParams();
  const hasTagQuery = Boolean(searchParams.get('tag')?.trim());
  const isLanding = isHeroLandingPath(pathname, hasTagQuery);
  const hasScrolledPastHero = useScrolledPastHero(pathname, hasTagQuery);
  const isMobile = useIsMobile();
  const [superMenuOpen, setSuperMenuOpen] = useState(false);

  const variant: HeaderVariant =
    isMobile ? 'main' : !isLanding ? 'main' : hasScrolledPastHero ? 'main' : 'minimal';
  const showHeroLogoBadge = isLanding && variant === 'minimal';
  const isMainOverlayOnHome =
    (isLanding && variant === 'main') ||
    pathname === '/catalog' ||
    pathname.startsWith('/catalog/') ||
    pathname.startsWith('/product/') ||
    pathname.startsWith('/brands');

  const prevScrolledPastHeroRef = useRef(hasScrolledPastHero);

  // Закрываем супер-меню только в момент перехода minimal → main
  useEffect(() => {
    if (!isLanding) return;
    const justScrolledPast = hasScrolledPastHero && !prevScrolledPastHeroRef.current;
    prevScrolledPastHeroRef.current = hasScrolledPastHero;
    if (superMenuOpen && justScrolledPast) {
      setSuperMenuOpen(false);
    }
  }, [isLanding, hasScrolledPastHero, superMenuOpen]);

  return (
    <Header
      variant={variant}
      isMainOverlayOnHome={isMainOverlayOnHome}
      showHeroLogoBadge={showHeroLogoBadge}
      superMenuOpen={superMenuOpen}
      setSuperMenuOpen={setSuperMenuOpen}
    />
  );
}
