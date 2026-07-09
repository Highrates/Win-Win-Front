'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import {
  brandCoverImageUrl,
  brandsSortedAlphabetically,
  featuredBrandsWithCover,
  fetchPublicBrandsClient,
  type PublicBrandListRow,
} from '@/lib/brandsPublic';
import { chunkColumns, groupBrandsByLetter } from '@/lib/public/brands';
import type { HomeCatalogRoot } from '@/lib/homeCatalog';
import styles from './BrandsPage.module.css';

const ALL_TAB_ID = 'all';

type Props = {
  initialBrands: PublicBrandListRow[];
  catalogRoots: HomeCatalogRoot[];
  initialCategoryId: string | null;
};

function resolveCategoryFromParam(
  param: string | null,
  roots: HomeCatalogRoot[],
): string {
  if (!param?.trim()) return ALL_TAB_ID;
  return roots.some((r) => r.id === param) ? param : ALL_TAB_ID;
}

export function BrandsPageClient({ initialBrands, catalogRoots, initialCategoryId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [brands, setBrands] = useState(initialBrands);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState(() =>
    initialCategoryId && catalogRoots.some((r) => r.id === initialCategoryId)
      ? initialCategoryId
      : ALL_TAB_ID,
  );

  const selfNavRef = useRef(false);
  const mountedRef = useRef(false);

  const tabs = useMemo(
    () => [{ id: ALL_TAB_ID, name: 'Все бренды' }, ...catalogRoots.map((r) => ({ id: r.id, name: r.name }))],
    [catalogRoots],
  );

  const loadBrands = useCallback(async (categoryId: string | null) => {
    setLoading(true);
    try {
      const rows = await fetchPublicBrandsClient(categoryId);
      setBrands(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectTab = useCallback(
    (tabId: string) => {
      if (tabId === activeId) return;
      selfNavRef.current = true;
      setActiveId(tabId);
      const categoryId = tabId === ALL_TAB_ID ? null : tabId;
      const href = categoryId ? `/brands?category=${encodeURIComponent(categoryId)}` : '/brands';
      router.replace(href, { scroll: false });
      void loadBrands(categoryId);
    },
    [activeId, loadBrands, router],
  );

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (selfNavRef.current) {
      selfNavRef.current = false;
      return;
    }
    const param = searchParams.get('category');
    const nextId = resolveCategoryFromParam(param, catalogRoots);
    setActiveId(nextId);
    const categoryId = nextId === ALL_TAB_ID ? null : nextId;
    void loadBrands(categoryId);
  }, [searchParams, catalogRoots, loadBrands]);

  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, searchQuery]);

  const featured = featuredBrandsWithCover(filteredBrands, 8);
  const forAlphabet = brandsSortedAlphabetically(filteredBrands).map((b) => ({
    slug: b.slug,
    name: b.name,
  }));

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

            {tabs.length > 1 ? (
              <nav className={styles.tabsWrapper} aria-label="Категории брендов">
                {tabs.map((tab) => {
                  const isActive = tab.id === activeId;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      aria-current={isActive ? 'page' : undefined}
                      className={isActive ? styles.tabActive : styles.tab}
                      onClick={() => selectTab(tab.id)}
                    >
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            ) : null}

            {loading ? (
              <p className={styles.loadingHint} role="status" aria-live="polite">
                Загружаем бренды…
              </p>
            ) : null}

            {featured.length > 0 ? (
              <div className={styles.brandCardsWrapper}>
                {featured.map((brand) => {
                  const src = brandCoverImageUrl(brand) ?? '/images/placeholder.svg';
                  return (
                    <Link
                      key={brand.slug}
                      href={`/brands/${brand.slug}`}
                      className={styles.brandCard}
                    >
                      <img
                        src={src}
                        alt=""
                        className={styles.brandCardImage}
                        width={320}
                        height={320}
                        loading="lazy"
                        decoding="async"
                      />
                      <span className={styles.brandCardName}>{brand.name}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptyFeatured}>
                {searchQuery.trim()
                  ? 'Нет брендов по вашему запросу.'
                  : 'В этой категории пока нет брендов с обложкой — ниже полный список по алфавиту.'}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={styles.allBrandsSection} aria-label="Все бренды по алфавиту">
        <div className="padding-global">
          <div className={styles.allBrandsWrapper}>
            {forAlphabet.length === 0 && !loading ? (
              <p className={styles.emptyFeatured}>В этой категории пока нет брендов.</p>
            ) : (
              (() => {
                const byLetter = groupBrandsByLetter(forAlphabet);
                const letters = Array.from(byLetter.keys()).sort((a, b) => a.localeCompare(b, 'ru'));
                return letters.map((letter) => {
                  const list = byLetter.get(letter)!;
                  const columns = chunkColumns(list, 4);
                  return (
                    <div key={letter} className={styles.allBrandsLetterBlock}>
                      <h2 className={styles.allBrandsLetter}>{letter}</h2>
                      <div className={styles.allBrandsGrid}>
                        {columns.map((col, ci) => (
                          <div key={ci} className={styles.allBrandsColumn}>
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
              })()
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
