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

/** Ссылка на страницу пагинации: `/catalog` или `/catalog/<slug>` + ?page= */
export function categoryCatalogPageHref(basePath: string, pageNum: number): string {
  if (pageNum <= 1) return basePath;
  return `${basePath}?page=${pageNum}`;
}

export type CatalogPaginationEntry = number | 'ellipsis';

/** Окно страниц вокруг текущей, крайние 1 и N, промежутки как «…». */
export function buildCatalogPaginationEntries(
  currentPage: number,
  totalPages: number,
  sibling: number = 2,
): CatalogPaginationEntry[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (let i = currentPage - sibling; i <= currentPage + sibling; i++) {
    if (i >= 1 && i <= totalPages) pages.add(i);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const out: CatalogPaginationEntry[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push('ellipsis');
    out.push(p);
    prev = p;
  }
  return out;
}
