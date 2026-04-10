/**
 * Slug сегмента варианта (query `vs=`). Должен совпадать с
 * `backend/src/modules/catalog/slug-transliteration.ts` и `packages/catalog-slug`.
 */
const CYR_TO_LAT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

export function slugifyVariantLabel(name: string): string {
  const raw = name.trim().toLowerCase();
  if (!raw) return '';
  let s = '';
  for (const ch of raw) {
    const lower = ch.toLowerCase();
    if (CYR_TO_LAT[lower]) s += CYR_TO_LAT[lower];
    else if (/[a-z0-9]/.test(ch)) s += ch;
    else if (/\s/.test(ch) || ch === '-' || ch === '_') s += '-';
  }
  return s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
