import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import {
  ALL_BRANDS_TABS,
  BRANDS,
  chunkColumns,
  groupBrandsByLetter,
} from '@/lib/public/brands';
import styles from './BrandsPage.module.css';

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

            <nav className={styles.tabsWrapper} aria-label="Категории брендов">
              {ALL_BRANDS_TABS.map((tab) => {
                const isActive = tab.id === currentCategory;
                const href = tab.id === 'all' ? '/brands' : `/brands?category=${tab.id}`;
                return (
                  <Link
                    key={tab.id}
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={isActive ? styles.tabActive : styles.tab}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>

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
