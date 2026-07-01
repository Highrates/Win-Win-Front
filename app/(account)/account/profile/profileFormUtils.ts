import type { ProfileDto } from './profileTypes';

export type CoverGrid = '4:3' | '16:9';

export const DEFAULT_SERVICE_OPTIONS = [
  'Дизайн интерьера',
  'Комплектация',
  'Авторский надзор',
  'Планировка',
] as const;

export const CITY_OPTIONS = ['Москва', 'Санкт-Петербург', 'Казань', 'Сочи'] as const;

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
};

export function coverFormStateFromProfile(p: ProfileDto): CoverFormState {
  const layout = (p.coverLayout === '16:9' ? '16:9' : '4:3') as CoverGrid;
  const urls = parseStringArray(p.coverImageUrls);
  if (layout === '16:9') {
    const u0 = urls[0] ?? null;
    return {
      coverGrid: layout,
      remoteCoverA: null,
      remoteCoverB: null,
      remoteCover169: u0,
      cover43aPreview: null,
      cover43bPreview: null,
      cover169Preview: u0,
    };
  }
  const a = urls[0] ?? null;
  const b = urls[1] ?? null;
  return {
    coverGrid: layout,
    remoteCoverA: a,
    remoteCoverB: b,
    remoteCover169: null,
    cover43aPreview: a,
    cover43bPreview: b,
    cover169Preview: null,
  };
}
