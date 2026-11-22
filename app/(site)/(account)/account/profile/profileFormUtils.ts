import type { ProfileDto } from './profileTypes';

export type CoverGrid = '4:3' | '16:9';

export const DEFAULT_SERVICE_OPTIONS = [
  'Дизайн интерьера',
  'Комплектация',
  'Авторский надзор',
  'Планировка',
] as const;

export function parseStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

export function displayName(firstName: string | null, lastName: string | null): string {
  const t = [firstName, lastName].filter((x) => x && x.trim()).join(' ').trim();
  return t || 'Имя пользователя';
}

export type CoverFormState = {
  coverGrid: CoverGrid;
  remoteCoverA: string | null;
  remoteCoverB: string | null;
  remoteCover169: string | null;
  cover43aPreview: string | null;
  cover43bPreview: string | null;
  cover169Preview: string | null;
  /** Основной кадр коллажа (coverImageUrls[0]). */
  collagePrimaryUrl: string | null;
  /** Второй кадр коллажа (coverImageUrls[1]); если нет — на сайте берётся аватар. */
  collageSecondaryUrl: string | null;
};

export function coverFormStateFromProfile(
  p: ProfileDto,
  opts?: { forceHorizontal?: boolean },
): CoverFormState {
  const urls = parseStringArray(p.coverImageUrls);
  const primary = urls[0] ?? null;
  const secondary = urls[1] ?? null;
  const force169 = Boolean(opts?.forceHorizontal) || p.coverLayout === '16:9';
  if (force169) {
    return {
      coverGrid: '16:9',
      remoteCoverA: null,
      remoteCoverB: null,
      remoteCover169: primary,
      cover43aPreview: null,
      cover43bPreview: null,
      cover169Preview: primary,
      collagePrimaryUrl: primary,
      collageSecondaryUrl: secondary,
    };
  }
  return {
    coverGrid: '4:3',
    remoteCoverA: primary,
    remoteCoverB: secondary,
    remoteCover169: null,
    cover43aPreview: primary,
    cover43bPreview: secondary,
    cover169Preview: null,
    collagePrimaryUrl: primary,
    collageSecondaryUrl: secondary,
  };
}
