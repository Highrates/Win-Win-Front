export type BrandTab = { id: string; label: string };

export type PublicBrandListItem = {
  slug: string;
  name: string;
};

export type PublicBrandDetail = {
  name: string;
  description: string;
};

export type BrandProductStub = {
  slug: string;
  name: string;
  price: number;
};

/** Табы категорий (список брендов + страница бренда) */
export const BRAND_CATEGORY_TABS: BrandTab[] = [
  { id: 'living', label: 'Гостиная' },
  { id: 'dining', label: 'Столовая' },
  { id: 'light', label: 'Свет' },
  { id: 'office', label: 'Офис' },
  { id: 'hotel', label: 'Отель' },
  { id: 'decor', label: 'Декор' },
  { id: 'garden', label: 'Сад' },
  { id: 'materials', label: 'Отделочные материалы' },
  { id: 'plumbing', label: 'Сантехника' },
];

export const ALL_BRANDS_TABS: BrandTab[] = [{ id: 'all', label: 'Все бренды' }, ...BRAND_CATEGORY_TABS];

/** Список брендов для сетки и алфавитного блока */
export const BRANDS: PublicBrandListItem[] = [
  { slug: 'glamor-master', name: 'Glamor Master' },
  { slug: 'adidas', name: 'Adidas' },
  { slug: 'nike', name: 'Nike' },
  { slug: 'zara', name: 'Zara' },
  { slug: 'h-m', name: 'H&M' },
  { slug: 'gucci', name: 'Gucci' },
  { slug: 'puma', name: 'Puma' },
  { slug: 'uniqlo', name: 'Uniqlo' },
  { slug: 'massimo-dutti', name: 'Massimo Dutti' },
  { slug: 'reserved', name: 'Reserved' },
  { slug: 'bershka', name: 'Bershka' },
];

export const LONG_DESCRIPTION =
  'Продукция компании охватывает все жилые зоны, такие как гостиная, чайная комната, столовая, спальня и кабинет и включает различные виды мебели, такие как диваны, чайные столики, обеденные столы и кровати.';

const SLUG_TO_BRAND: Record<string, PublicBrandDetail> = {
  'glamor-master': { name: 'Glamor Master', description: LONG_DESCRIPTION },
  adidas: { name: 'Adidas', description: LONG_DESCRIPTION },
  nike: { name: 'Nike', description: LONG_DESCRIPTION },
  zara: { name: 'Zara', description: LONG_DESCRIPTION },
  'h-m': { name: 'H&M', description: LONG_DESCRIPTION },
  gucci: { name: 'Gucci', description: LONG_DESCRIPTION },
  puma: { name: 'Puma', description: LONG_DESCRIPTION },
  uniqlo: { name: 'Uniqlo', description: LONG_DESCRIPTION },
  'massimo-dutti': { name: 'Massimo Dutti', description: LONG_DESCRIPTION },
  reserved: { name: 'Reserved', description: LONG_DESCRIPTION },
  bershka: { name: 'Bershka', description: LONG_DESCRIPTION },
};

export function getBrandBySlug(slug: string): PublicBrandDetail {
  const entry = SLUG_TO_BRAND[slug];
  if (entry) return entry;
  const name = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return { name, description: LONG_DESCRIPTION };
}

/** Заглушки товаров для сетки на странице бренда */
export const PRODUCTS_POOL: BrandProductStub[] = [
  { slug: 'sofa-classic', name: 'Диван Classic', price: 135090 },
  { slug: 'kreslo-lounge', name: 'Кресло Lounge', price: 45000 },
  { slug: 'stolik-round', name: 'Столик Round', price: 28500 },
  { slug: 'konsol-wood', name: 'Консоль Wood', price: 67200 },
  { slug: 'stul-comfort', name: 'Стул Comfort', price: 19900 },
  { slug: 'puf-velvet', name: 'Пуф Velvet', price: 12400 },
  { slug: 'shkaf-modern', name: 'Шкаф Modern', price: 89000 },
  { slug: 'lampa-arc', name: 'Лампа Arc', price: 35090 },
  { slug: 'krovat-dream', name: 'Кровать Dream', price: 156000 },
  { slug: 'tumba-night', name: 'Тумба Night', price: 24300 },
  { slug: 'zerkalo-wall', name: 'Зеркало Wall', price: 31500 },
  { slug: 'polka-open', name: 'Полка Open', price: 14700 },
  { slug: 'stol-dining', name: 'Стол Dining', price: 78000 },
  { slug: 'bra-minimal', name: 'Бра Minimal', price: 9800 },
  { slug: 'komod-line', name: 'Комод Line', price: 54600 },
  { slug: 'kreslo-relax', name: 'Кресло Relax', price: 62000 },
  { slug: 'stol-coffee', name: 'Стол Coffee', price: 42000 },
  { slug: 'kreslo-wing', name: 'Кресло Wing', price: 73500 },
  { slug: 'svetilnik-spot', name: 'Светильник Spot', price: 11200 },
  { slug: 'polka-wall', name: 'Полка Wall', price: 18900 },
];

/** Группировка брендов по первой букве (секция А–Я на /brands) */
export function groupBrandsByLetter(brands: PublicBrandListItem[]): Map<string, PublicBrandListItem[]> {
  const map = new Map<string, PublicBrandListItem[]>();
  for (const b of brands) {
    const letter = b.name.charAt(0).toUpperCase();
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(b);
  }
  map.forEach((arr) => arr.sort((a, b) => a.name.localeCompare(b.name)));
  return map;
}

/** Разбить массив на n колонок (по порядку) */
export function chunkColumns<T>(arr: T[], cols: number): T[][] {
  const result: T[][] = Array.from({ length: cols }, () => []);
  arr.forEach((item, i) => result[i % cols].push(item));
  return result;
}
