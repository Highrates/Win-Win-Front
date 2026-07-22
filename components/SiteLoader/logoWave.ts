export const LOGO_WAVE_STAGGER_MS = 40;
export const LOGO_WAVE_IN_DURATION = 600;
export const LOGO_WAVE_OUT_DURATION = 480;
export const LOGO_WAVE_LETTER_SELECTOR = '.logo-wave__letter';

type AnimeModule = {
  animate: (
    targets: Element | NodeListOf<Element> | Element[],
    params: Record<string, unknown>,
  ) => PromiseLike<unknown>;
  stagger: (value: number) => unknown;
};

export async function loadAnime(): Promise<AnimeModule> {
  const mod = await import('animejs');
  return mod as unknown as AnimeModule;
}

export function logoWaveLetters(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(LOGO_WAVE_LETTER_SELECTOR));
}

/** Distance that fully clears the clip. */
export function logoWaveDistance(root: HTMLElement): number {
  const h = root.getBoundingClientRect().height || root.offsetHeight || 0;
  if (h > 0) return Math.ceil(h * 1.4);
  return 80;
}

export function prepareLogoWaveIn(root: HTMLElement, distancePx?: number) {
  const letters = logoWaveLetters(root);
  const dist = distancePx ?? logoWaveDistance(root);
  for (const el of letters) {
    el.style.transform = `translateY(${dist}px)`;
  }
  return { letters, dist };
}

/** Сброс inline-transform после wave или отмены анимации. */
export function resetLogoWaveVisible(root: HTMLElement) {
  for (const el of logoWaveLetters(root)) {
    el.style.transform = '';
  }
}

export async function animateLogoWaveIn(
  root: HTMLElement,
  distancePx?: number,
): Promise<void> {
  const { letters, dist } = prepareLogoWaveIn(root, distancePx);
  if (!letters.length) return;
  try {
    const { animate, stagger } = await loadAnime();
    await animate(letters, {
      translateY: [dist, 0],
      duration: LOGO_WAVE_IN_DURATION,
      ease: 'outCubic',
      delay: stagger(LOGO_WAVE_STAGGER_MS),
    });
  } finally {
    resetLogoWaveVisible(root);
  }
}

export async function animateLogoWaveOut(
  root: HTMLElement,
  distancePx?: number,
): Promise<void> {
  const letters = logoWaveLetters(root);
  if (!letters.length) return;
  const dist = distancePx ?? logoWaveDistance(root);
  const { animate, stagger } = await loadAnime();
  await animate(letters, {
    translateY: [0, dist],
    duration: LOGO_WAVE_OUT_DURATION,
    ease: 'inQuad',
    delay: stagger(LOGO_WAVE_STAGGER_MS),
  });
}
