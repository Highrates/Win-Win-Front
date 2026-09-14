/** Нормализация для поиска/подсветки: lower + ё→е. */
export function normalizeSearchText(s: string): string {
  return s.trim().toLowerCase().replace(/ё/g, 'е');
}
