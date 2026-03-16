import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { ProductCard } from '@/components/ProductCard';
import { MoreAboutBrandModal } from './MoreAboutBrandModal';
import styles from './BrandPage.module.css';

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

const LONG_DESCRIPTION =
  'Продукция компании охватывает все жилые зоны, такие как гостиная, чайная комната, столовая, спальня и кабинет и включает различные виды мебели, такие как диваны, чайные столики, обеденные столы и кровати.';

/** Slug → название бренда (позже можно заменить на API) */
const SLUG_TO_BRAND: Record<string, { name: string; description: string }> = {
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

/** Табы категорий — как в ScrollCatalog на главной */
const BRAND_CATEGORY_TABS = [
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

function getBrandBySlug(slug: string): { name: string; description: string } {
  const entry = SLUG_TO_BRAND[slug];
  if (entry) return entry;
  const name = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return { name, description: LONG_DESCRIPTION };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { name } = getBrandBySlug(slug);
  return {
    title: `${name} — Бренд — Win-Win`,
    description: `Страница бренда ${name}`,
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { slug } = await params;
  const { category: categoryParam } = await searchParams;
  const currentCategory = categoryParam && BRAND_CATEGORY_TABS.some((t) => t.id === categoryParam) ? categoryParam : 'living';
  const { name, description } = getBrandBySlug(slug);

  const brandProducts = PRODUCTS_POOL.slice(0, 20).map((p, i) => ({ ...p, key: `${p.slug}-${i}` }));

  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Бренды', href: '/brands', current: false },
    { label: name, href: '', current: true },
  ];

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
              <div className={styles.previewPageTitlesOuter}>
                <div className={styles.previewPageTitlesInner}>
                  <span className={styles.previewParentName}>БРЕНД</span>
                  <h1 className={styles.previewCurrentName}>{name}</h1>
                </div>
                <div className={styles.shortBrandDescriptionWrapper}>
                  <p>{description}</p>
                </div>
                <MoreAboutBrandModal
                  linkClassName={styles.moreAboutBrandLink}
                  textClassName={styles.moreAboutBrandText}
                  arrowClassName={styles.moreAboutBrandArrow}
                />
              </div>
            </div>
            <img
              src="/images/placeholder.svg"
              alt=""
              width={768}
              height={393}
              className={styles.previewImage}
            />
          </div>
        </div>
      </section>

      <section className={styles.marketSection} aria-label="Товары бренда">
        <div className="padding-global">
          <div className={styles.marketSectionInner}>
            <div className={styles.tabsWrapper} role="tablist" aria-label="Категории товаров бренда">
              {BRAND_CATEGORY_TABS.map((tab) => {
                const isActive = tab.id === currentCategory;
                const href = isActive ? undefined : `/brands/${slug}?category=${tab.id}`;
                return href ? (
                  <Link
                    key={tab.id}
                    href={href}
                    role="tab"
                    aria-selected={false}
                    className={styles.tab}
                  >
                    {tab.label}
                  </Link>
                ) : (
                  <span
                    key={tab.id}
                    role="tab"
                    aria-selected
                    className={styles.tabActive}
                  >
                    {tab.label}
                  </span>
                );
              })}
            </div>
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
                <span className={styles.marketSectionRowResultValue}>{brandProducts.length}</span>
              </div>
            </div>
            <div className={styles.marketGrid}>
              {brandProducts.map((p) => (
                <ProductCard key={p.key} slug={p.slug} name={p.name} price={p.price} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
