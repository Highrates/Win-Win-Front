export const CATEGORY_PRODUCTS_POOL = [
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
] as const;

export const CATEGORY_PER_PAGE = 20;

export type CategoryMarketProduct = {
  slug: string;
  name: string;
  price: number;
  key: string;
};

export function getCategoryMarketProducts(total: number): CategoryMarketProduct[] {
  const pool = CATEGORY_PRODUCTS_POOL;
  return Array.from({ length: total }, (_, i) => {
    const p = pool[i % pool.length];
    return { ...p, key: `${p.slug}-${i}` };
  });
}

/** Ссылка на страницу пагинации: `/categories` или `/categories/divany` + ?page= */
export function categoryCatalogPageHref(basePath: string, pageNum: number): string {
  if (pageNum <= 1) return basePath;
  return `${basePath}?page=${pageNum}`;
}
