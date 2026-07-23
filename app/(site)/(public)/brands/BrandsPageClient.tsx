'use client';

import Link from 'next/link';
import { Fragment, useMemo, useState } from 'react';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import {
  brandCoverImageUrl,
  brandsSortedAlphabetically,
  type PublicBrandListRow,
} from '@/lib/brandsPublic';
import styles from './BrandsPage.module.css';

type Props = {
  initialBrands: PublicBrandListRow[];
};

export function BrandsPageClient({ initialBrands }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return brandsSortedAlphabetically(initialBrands);
    return brandsSortedAlphabetically(
      initialBrands.filter((b) => b.name.toLowerCase().includes(q)),
    );
  }, [initialBrands, searchQuery]);

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
              <SearchBox
                placeholder="Поиск по брендам"
                ariaLabel="Поиск по брендам"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {filteredBrands.length > 0 ? (
              <div className={styles.brandCardsWrapper}>
                {filteredBrands.map((brand) => {
                  const src = brandCoverImageUrl(brand) ?? '/images/placeholder.svg';
                  return (
                    <Link
                      key={brand.slug}
                      href={`/brands/${brand.slug}`}
                      className={styles.brandCard}
                    >
                      <span className={styles.brandCardImageWrap}>
                        <img
                          src={src}
                          alt=""
                          className={styles.brandCardImage}
                          width={320}
                          height={320}
                          loading="lazy"
                          decoding="async"
                        />
                      </span>
                      <span className={styles.brandCardName}>{brand.name}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptyFeatured}>
                {searchQuery.trim() ? 'Нет брендов по вашему запросу.' : 'Пока нет брендов.'}
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
