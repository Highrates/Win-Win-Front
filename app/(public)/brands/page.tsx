import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import styles from './BrandsPage.module.css';

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

const ALL_BRANDS_TABS = [
  { id: 'all', label: 'Все бренды' },
  ...BRAND_CATEGORY_TABS,
];

/** Список брендов для сетки (slug + name) */
const BRANDS = [
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

/** Группировка брендов по первой букве (для секции А–Я) */
function groupBrandsByLetter(
  brands: { slug: string; name: string }[]
): Map<string, { slug: string; name: string }[]> {
  const map = new Map<string, { slug: string; name: string }[]>();
  for (const b of brands) {
    const letter = b.name.charAt(0).toUpperCase();
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(b);
  }
  map.forEach((arr) => arr.sort((a, b) => a.name.localeCompare(b.name)));
  return map;
}

/** Разбить массив на n колонок (по порядку) */
function chunkColumns<T>(arr: T[], cols: number): T[][] {
  const result: T[][] = Array.from({ length: cols }, () => []);
  arr.forEach((item, i) => result[i % cols].push(item));
  return result;
}

export const metadata: Metadata = {
  title: 'Бренды — Win-Win',
  description: 'Каталог брендов Win-Win',
};

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function BrandsPage({ searchParams }: Props) {
  const { category: categoryParam } = await searchParams;
  const currentCategory =
    categoryParam && ALL_BRANDS_TABS.some((t) => t.id === categoryParam)
      ? categoryParam
      : 'all';

  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Бренды', href: '', current: true },
  ];

  return (
    <main>
      <section className={styles.mainSection} aria-label="Все бренды">
        <div className="padding-global">
          <div className={styles.mainSectionInner}>
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

            <div className={styles.searchBox}>
              <SearchBox placeholder="Поиск по брендам" ariaLabel="Поиск по брендам" />
            </div>

            <div
              className={styles.tabsWrapper}
              role="tablist"
              aria-label="Категории брендов"
            >
              {ALL_BRANDS_TABS.map((tab) => {
                const isActive = tab.id === currentCategory;
                const href = isActive ? undefined : `/brands?category=${tab.id}`;
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

            <div className={styles.brandCardsWrapper}>
              {BRANDS.slice(0, 8).map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/brands/${brand.slug}`}
                  className={styles.brandCard}
                >
                  <img
                    src="/images/placeholder.svg"
                    alt=""
                    className={styles.brandCardImage}
                    width={320}
                    height={320}
                  />
                  <span className={styles.brandCardName}>{brand.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className={styles.allBrandsSection}
        aria-label="Все бренды по алфавиту"
      >
        <div className="padding-global">
          <div className={styles.allBrandsWrapper}>
            {(() => {
              const byLetter = groupBrandsByLetter(BRANDS);
              const letters = Array.from(byLetter.keys()).sort((a, b) =>
                a.localeCompare(b)
              );
              return letters.map((letter) => {
                const list = byLetter.get(letter)!;
                const columns = chunkColumns(list, 4);
                return (
                  <div
                    key={letter}
                    className={styles.allBrandsLetterBlock}
                  >
                    <h2 className={styles.allBrandsLetter}>{letter}</h2>
                    <div className={styles.allBrandsGrid}>
                      {columns.map((col, ci) => (
                        <div
                          key={ci}
                          className={styles.allBrandsColumn}
                        >
                          {col.map((brand) => (
                            <Link
                              key={brand.slug}
                              href={`/brands/${brand.slug}`}
                              className={styles.allBrandsLink}
                            >
                              {brand.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </section>
    </main>
  );
}
