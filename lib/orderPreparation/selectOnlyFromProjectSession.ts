const STORAGE_KEY = 'ww:orderPrep:selectOnlyLineIds';

/** После «Оформить» из проекта — id новых строк в черновике заказа (только они остаются в чекбоксах). */
export function storeSelectOnlyPreparationLineIds(ids: string[]): void {
  if (typeof window === 'undefined' || ids.length === 0) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/** Читает и сразу удаляет, чтобы повторный рендер не перезаписал выбор. */
export function takeSelectOnlyPreparationLineIds(): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((x): x is string => typeof x === 'string' && x.length > 0);
  } catch {
    return null;
  }
}
