import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { ProductCard } from '@/components/ProductCard';
import styles from './CategoryPage.module.css';

const PRODUCTS_POOL = [
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

const PER_PAGE = 20;

function getMarketProducts(total: number) {
  return Array.from({ length: total }, (_, i) => {
    const p = PRODUCTS_POOL[i % PRODUCTS_POOL.length];
    return { ...p, key: `${p.slug}-${i}` };
  });
}

/** Маппинг slug → название для хлебных крошек (можно расширить из API) */
const SLUG_TO_NAME: Record<string, string> = {
  divany: 'Диваны',
  kresla: 'Кресла',
  'kofejnye-stoliki': 'Кофейные столики',
  shkafy: 'Консольные столики',
  'knizhnye-shkafy': 'Книжные шкафы',
  'vinnye-shkafy': 'Винные шкафы',
  stoly: 'Столы',
  pufy: 'Пуфы',
};

function getCategoryName(slug: string): string {
  return SLUG_TO_NAME[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const name = getCategoryName(slug);
  return {
    title: `${name} — Win-Win`,
    description: `Категория: ${name}`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(String(pageParam || '1'), 10) || 1);
  const categoryName = getCategoryName(slug);

  const allProducts = getMarketProducts(60);
  const totalPages = Math.ceil(allProducts.length / PER_PAGE);
  const page = Math.min(currentPage, totalPages) || 1;
  const start = (page - 1) * PER_PAGE;
  const marketProducts = allProducts.slice(start, start + PER_PAGE);

  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Гостиная', href: '/categories', current: false },
    { label: categoryName, href: '', current: true },
  ];

  /** Родительская категория (например Гостиная); если нет — null */
  const parentCategoryName: string | null = 'Гостиная';

  return (
    <main>
      <section className={styles.previewPageSection}>
        <div className="padding-global">
          <div className={styles.previewPageWrapper}>
            <div className={styles.previewPageTitles}>
              <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
                {breadcrumbs.map((item, i) => (
                  <Fragment key={i}>
                    {i > 0 && <span className={styles.breadcrumbsSep}>/</span>}
                    {item.current ? (
                      <span className={styles.breadcrumbsCurrent}>{item.label}</span>
                    ) : (
                      <Link href={item.href} className={styles.breadcrumbsLink}>
                        {item.label}
                      </Link>
                    )}
                  </Fragment>
                ))}
              </nav>
              <div className={styles.previewPageTitlesInner}>
                {parentCategoryName != null && (
                  <span className={styles.previewParentName}>{parentCategoryName}</span>
                )}
                <h1 className={styles.previewCurrentName}>{categoryName}</h1>
              </div>
            </div>
            <img
              src="https://placehold.co/768x393"
              alt=""
              width={768}
              height={393}
              className={styles.previewImage}
            />
          </div>
        </div>
      </section>

      <section className={styles.marketSection} aria-label="Каталог товаров">
        <div className="padding-global">
          <div className={styles.marketSectionInner}>
            <div className={styles.marketSectionRow}>
              <div className={styles.marketSectionRowLeft}>
                <div className={styles.marketFilterGroup}>
                  <button type="button" aria-label="Фильтр">
                    <img src="/icons/filter.svg" alt="" width={20} height={20} />
                    <span>Фильтр</span>
                  </button>
                </div>
                <div className={styles.marketSortGroup}>
                  <button type="button" aria-label="Сортировка">
                    <img src="/icons/sort.svg" alt="" width={20} height={20} />
                    <span>Самые популярные</span>
                  </button>
                </div>
              </div>
              <div className={styles.marketSectionRowResult}>
                <span className={styles.marketSectionRowResultLabel}>Результат: </span>
                <span className={styles.marketSectionRowResultValue}>{allProducts.length}</span>
              </div>
            </div>
            <div className={styles.marketGrid}>
              {marketProducts.map((p) => (
                <ProductCard key={p.key} slug={p.slug} name={p.name} price={p.price} />
              ))}
            </div>
            <nav className={styles.paginationWrapper} aria-label="Пагинация">
              {page <= 1 ? (
                <span className={styles.paginationBtnDisabled}>НАЗАД</span>
              ) : (
                <Link
                  href={`/categories/${slug}${page - 1 === 1 ? '' : `?page=${page - 1}`}`}
                  className={styles.paginationBtn}
                >
                  НАЗАД
                </Link>
              )}
              <div className={styles.paginationPages}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) =>
                  n === page ? (
                    <span key={n} className={styles.paginationPageCurrent}>
                      {n}
                    </span>
                  ) : (
                    <Link
                      key={n}
                      href={n === 1 ? `/categories/${slug}` : `/categories/${slug}?page=${n}`}
                      className={styles.paginationPage}
                    >
                      {n}
                    </Link>
                  )
                )}
              </div>
              {page >= totalPages ? (
                <span className={styles.paginationBtnDisabled}>ДАЛЕЕ</span>
              ) : (
                <Link
                  href={`/categories/${slug}?page=${page + 1}`}
                  className={styles.paginationBtn}
                >
                  ДАЛЕЕ
                </Link>
              )}
            </nav>
          </div>
        </div>
      </section>
    </main>
  );
}
