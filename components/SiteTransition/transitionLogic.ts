'use client';

const TRANSITION_DURATION = 280;
const TRANSITION_EASE = 'outCubic';

let overlayEl: HTMLDivElement | null = null;
let bgEl: HTMLDivElement | null = null;
let lastExitContext: TransitionContext = 'default';
let animateFn: typeof import('animejs').animate | null = null;

async function getAnimate() {
  if (!animateFn) {
    const mod = await import('animejs');
    animateFn = mod.animate;
  }
  return animateFn;
}

export type TransitionContext = 'default' | 'menu';

export function registerTransitionElements(overlay: HTMLDivElement | null, bg: HTMLDivElement | null) {
  overlayEl = overlay;
  bgEl = bg;
}

export async function exit(nextContext: TransitionContext = 'default'): Promise<void> {
  if (!overlayEl || !bgEl) return;
  lastExitContext = nextContext;
  overlayEl.classList.remove('visibility-hidden', 'pointer-events-none');
  const animate = await getAnimate();

  if (nextContext === 'menu') {
    bgEl.style.transform = 'translateY(-100%)';
    overlayEl.getBoundingClientRect();
    await animate(bgEl!, {
      translateY: 0,
      duration: TRANSITION_DURATION,
      ease: TRANSITION_EASE,
    });
    return;
  }

  bgEl.style.transform = '';
  bgEl.style.opacity = '0';
  overlayEl.getBoundingClientRect();
  await animate(bgEl!, {
    opacity: 1,
    duration: TRANSITION_DURATION,
    ease: TRANSITION_EASE,
  });
}

export function entering(): void {
  // Optional: set CSS custom property or class for incoming page module delays
  document.documentElement.style.setProperty('--site-transition-entering', '1');
}

export async function enter(fromMenu?: boolean): Promise<void> {
  if (!overlayEl || !bgEl) return;

  document.documentElement.style.removeProperty('--site-transition-entering');
  const fromMenuTransition = fromMenu ?? lastExitContext === 'menu';
  const animate = await getAnimate();

  if (fromMenuTransition) {
    await animate(bgEl!, {
      translateY: '100%',
      duration: TRANSITION_DURATION,
      ease: TRANSITION_EASE,
    });
    bgEl!.style.transform = '';
    overlayEl!.classList.add('visibility-hidden', 'pointer-events-none');
    return;
  }

  await animate(bgEl!, {
    opacity: 0,
    duration: TRANSITION_DURATION,
    ease: TRANSITION_EASE,
  });
  bgEl!.style.opacity = '';
  overlayEl!.classList.add('visibility-hidden', 'pointer-events-none');
}

export function setTransitionBgWhite() {
  if (bgEl) {
    bgEl.classList.remove('bg-color-black');
    bgEl.classList.add('bg-color-white');
  }
}

export function setTransitionBgBlack() {
  if (bgEl) {
    bgEl.classList.remove('bg-color-white');
    bgEl.classList.add('bg-color-black');
  }
}
