'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import { ProjectsMarketSection } from '@/app/(public)/projects/ProjectsMarketSection';
import listingLayoutStyles from '@/app/(public)/projects/ProjectsListingLayout.module.css';
import { mapPublicCaseToProjectData } from '@/lib/mapPublicCaseToProjectData';
import { parseNestPublicCaseItem } from '@/lib/parseNestPublicCase';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import type { ProjectData } from '@/app/(public)/designers/DesignerProjectsSection';
import productListStyles from '@/components/AccountProductList/AccountProductList.module.css';
import styles from './FavoritesPage.module.css';
import designerCardStyles from '@/app/(public)/designers/DesignersPage.module.css';
import { FavoriteDesignerCard, type FavoriteDesignerDto } from './FavoriteDesignerCard';

const TAB_NAMES = ['Товары', 'Проекты и концепции', 'Дизайнеры'] as const;

const PAGE_SIZE = 36;

type CollectionProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  imageUrls?: string[];
  casesLinkedCount: number;
  likesDisplayCount: number;
};

type CollectionJson = {
  products?: CollectionProduct[];
  cases?: unknown[];
  designers?: Array<{
    id: string;
    slug: string;
    displayName: string;
    photoUrl: string | null;
    city: string | null;
    servicesLine: string | null;
    likesDisplayCount: number;
    casesCount?: number;
  }>;
  productsTotal?: number;
  casesTotal?: number;
  designersTotal?: number;
};

function collectionUrl(params: {
  productsLimit: number;
  productsOffset: number;
  casesLimit: number;
  casesOffset: number;
  designersLimit: number;
  designersOffset: number;
}) {
  const q = new URLSearchParams({
    productsLimit: String(params.productsLimit),
    productsOffset: String(params.productsOffset),
    casesLimit: String(params.casesLimit),
    casesOffset: String(params.casesOffset),
    designersLimit: String(params.designersLimit),
    designersOffset: String(params.designersOffset),
  });
  return `/api/user/likes/collection?${q.toString()}`;
}

function mapCases(rawCases: unknown[]): ProjectData[] {
  const mapped: ProjectData[] = [];
  for (const row of rawCases) {
    const parsed = parseNestPublicCaseItem(row, { requireDesignerMeta: false });
    if (!parsed) continue;
    const designer = parsed.designer;
    mapped.push(
      mapPublicCaseToProjectData(
        parsed.case,
        designer ? { slug: designer.slug, name: designer.name, photoUrl: designer.photoUrl } : undefined,
      ),
    );
  }
  return mapped;
}

export function FavoritesPageClient() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [loadingMoreCases, setLoadingMoreCases] = useState(false);
  const [loadingMoreDesigners, setLoadingMoreDesigners] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [caseProjects, setCaseProjects] = useState<ProjectData[]>([]);
  const [designers, setDesigners] = useState<FavoriteDesignerDto[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [casesTotal, setCasesTotal] = useState(0);
  const [designersTotal, setDesignersTotal] = useState(0);
  const prevTabRef = useRef(0);

  const loadFull = useCallback(async () => {
    setLoading(true);
    setLoadingMoreProducts(false);
    setLoadingMoreCases(false);
    setError(null);
    try {
      const res = await fetch(collectionUrl({ productsLimit: PAGE_SIZE, productsOffset: 0, casesLimit: PAGE_SIZE, casesOffset: 0, designersLimit: PAGE_SIZE, designersOffset: 0 }), {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (res.status === 401) {
        setError('Войдите в аккаунт, чтобы видеть товары и проекты с вашим лайком.');
        setProducts([]);
        setCaseProjects([]);
        setDesigners([]);
        setProductsTotal(0);
        setCasesTotal(0);
        setDesignersTotal(0);
        return;
      }
      if (!res.ok) {
        setError(`Не удалось загрузить (${res.status})`);
        return;
      }
      const data = (await res.json()) as CollectionJson;
      const rawProducts = Array.isArray(data.products) ? data.products : [];
      setProducts(rawProducts);
      setCaseProjects(mapCases(Array.isArray(data.cases) ? data.cases : []));
      const rawDesigners = Array.isArray(data.designers) ? (data.designers as FavoriteDesignerDto[]) : [];
      setDesigners(rawDesigners);
      setProductsTotal(typeof data.productsTotal === 'number' ? data.productsTotal : rawProducts.length);
      setCasesTotal(
        typeof data.casesTotal === 'number' ? data.casesTotal : (Array.isArray(data.cases) ? data.cases.length : 0),
      );
      setDesignersTotal(typeof data.designersTotal === 'number' ? data.designersTotal : rawDesigners.length);
    } catch {
      setError('Сеть или сервер недоступны');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreProducts = useCallback(async () => {
    if (loadingMoreProducts || products.length >= productsTotal) return;
    setLoadingMoreProducts(true);
    setError(null);
    try {
      const offset = products.length;
      const res = await fetch(
        collectionUrl({
          productsLimit: PAGE_SIZE,
          productsOffset: offset,
          casesLimit: 0,
          casesOffset: 0,
          designersLimit: 0,
          designersOffset: 0,
        }),
        { credentials: 'same-origin', cache: 'no-store' },
      );
      if (!res.ok) {
        setError(`Не удалось подгрузить товары (${res.status})`);
        return;
      }
      const data = (await res.json()) as CollectionJson;
      const raw = Array.isArray(data.products) ? data.products : [];
      setProducts((prev) => [...prev, ...raw]);
      if (typeof data.productsTotal === 'number') setProductsTotal(data.productsTotal);
    } catch {
      setError('Сеть или сервер недоступны');
    } finally {
      setLoadingMoreProducts(false);
    }
  }, [loadingMoreProducts, products.length, productsTotal]);

  const loadMoreCases = useCallback(async () => {
    if (loadingMoreCases || caseProjects.length >= casesTotal) return;
    setLoadingMoreCases(true);
    setError(null);
    try {
      const offset = caseProjects.length;
      const res = await fetch(
        collectionUrl({
          productsLimit: 0,
          productsOffset: 0,
          casesLimit: PAGE_SIZE,
          casesOffset: offset,
          designersLimit: 0,
          designersOffset: 0,
        }),
        { credentials: 'same-origin', cache: 'no-store' },
      );
      if (!res.ok) {
        setError(`Не удалось подгрузить проекты (${res.status})`);
        return;
      }
      const data = (await res.json()) as CollectionJson;
      const rawCases = Array.isArray(data.cases) ? data.cases : [];
      const chunk = mapCases(rawCases);
      setCaseProjects((prev) => [...prev, ...chunk]);
      if (typeof data.casesTotal === 'number') setCasesTotal(data.casesTotal);
    } catch {
      setError('Сеть или сервер недоступны');
    } finally {
      setLoadingMoreCases(false);
    }
  }, [loadingMoreCases, caseProjects.length, casesTotal]);

  const loadMoreDesigners = useCallback(async () => {
    if (loadingMoreDesigners || designers.length >= designersTotal) return;
    setLoadingMoreDesigners(true);
    setError(null);
    try {
      const offset = designers.length;
      const res = await fetch(
        collectionUrl({
          productsLimit: 0,
          productsOffset: 0,
          casesLimit: 0,
          casesOffset: 0,
          designersLimit: PAGE_SIZE,
          designersOffset: offset,
        }),
        { credentials: 'same-origin', cache: 'no-store' },
      );
      if (!res.ok) {
        setError(`Не удалось подгрузить дизайнеров (${res.status})`);
        return;
      }
      const data = (await res.json()) as CollectionJson;
      const raw = Array.isArray(data.designers) ? (data.designers as FavoriteDesignerDto[]) : [];
      setDesigners((prev) => [...prev, ...raw]);
      if (typeof data.designersTotal === 'number') setDesignersTotal(data.designersTotal);
    } catch {
      setError('Сеть или сервер недоступны');
    } finally {
      setLoadingMoreDesigners(false);
    }
  }, [loadingMoreDesigners, designers.length, designersTotal]);

  useEffect(() => {
    void loadFull();
  }, [loadFull]);

  useEffect(() => {
    const prev = prevTabRef.current;
    prevTabRef.current = tab;
    if (tab === 0 && prev !== 0) void loadFull();
  }, [tab, loadFull]);

  const empty = useMemo(
    () => !loading && tab === 0 && products.length === 0,
    [loading, tab, products.length],
  );
  const emptyCases = useMemo(
    () => !loading && tab === 1 && caseProjects.length === 0,
    [loading, tab, caseProjects.length],
  );
  const emptyDesigners = useMemo(
    () => !loading && tab === 2 && designers.length === 0,
    [loading, tab, designers.length],
  );

  const hasMoreProducts = products.length < productsTotal;
  const hasMoreCases = caseProjects.length < casesTotal;
  const hasMoreDesigners = designers.length < designersTotal;

  const favoritesProjectsStyles = useMemo(
    () => ({
      ...listingLayoutStyles,
      sliderCoversGrid: `${listingLayoutStyles.sliderCoversGrid} ${styles.favoritesProjectsSliderCoversGrid}`,
    }),
    [],
  );

  return (
    <div className={productListStyles.page}>
      <div className={productListStyles.toolbar}>
        <AccountProjectTabs
          projects={TAB_NAMES as unknown as string[]}
          selectedIndex={tab}
          onSelect={setTab}
          ariaLabel="Лайкнутые товары и проекты"
        />
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {loading ? (
        tab === 0 ? (
          <div className={styles.skeletonGrid} aria-busy="true" aria-label="Загрузка лайков на товары">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonThumb} />
                <div className={styles.skeletonTitleLine} />
                <div className={styles.skeletonPriceLine} />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.skeletonProjectsBlock} aria-busy="true" aria-label="Загрузка лайков на проекты">
            <div className={styles.skeletonProjectsHeader} />
            <div className={styles.skeletonProjectsRow}>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={styles.skeletonProjectCard} />
              ))}
            </div>
          </div>
        )
      ) : null}

      {!loading && tab === 0 ? (
        <>
          {empty ? (
            <p className={styles.muted}>Пока нет товаров с вашим лайком.</p>
          ) : (
            <>
              <div className={styles.grid}>
                {products.map((p) => {
                  const rawGallery = Array.isArray(p.imageUrls) ? p.imageUrls : [];
                  const resolvedGallery =
                    rawGallery.length > 0
                      ? rawGallery.map((u) => resolveMediaUrlForServer(u)).filter(Boolean)
                      : [];
                  return (
                    <ProductCard
                      key={p.id}
                      slug={p.slug}
                      name={p.name}
                      price={p.price}
                      productId={p.id}
                      imageUrl={p.imageUrl ? resolveMediaUrlForServer(p.imageUrl) : undefined}
                      imageUrls={resolvedGallery.length > 1 ? resolvedGallery : undefined}
                      collections={p.casesLinkedCount}
                      likes={p.likesDisplayCount}
                      heartActive
                      likesInteractive
                      onLikedChange={({ liked, productId }) => {
                        if (!liked) {
                          setProducts((prev) => prev.filter((x) => x.id !== productId));
                          setProductsTotal((t) => Math.max(0, t - 1));
                        }
                      }}
                    />
                  );
                })}
              </div>
              {hasMoreProducts ? (
                <div className={styles.loadMoreWrap}>
                  <button
                    type="button"
                    className={styles.loadMoreBtn}
                    disabled={loadingMoreProducts}
                    aria-busy={loadingMoreProducts}
                    aria-label="Подгрузить ещё товары с лайком"
                    onClick={() => void loadMoreProducts()}
                  >
                    {loadingMoreProducts ? 'Загрузка…' : 'Показать ещё'}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </>
      ) : null}

      {!loading && tab === 1 ? (
        emptyCases ? (
          <p className={styles.muted}>Пока нет проектов с вашим лайком.</p>
        ) : (
          <>
            <div className={styles.favoritesProjectsRecommendationsSection}>
              <ProjectsMarketSection
                projects={caseProjects}
                stylesModule={favoritesProjectsStyles}
                gridOnly
              />
            </div>
            {hasMoreCases ? (
              <div className={styles.loadMoreWrap}>
                <button
                  type="button"
                  className={styles.loadMoreBtn}
                  disabled={loadingMoreCases}
                  aria-busy={loadingMoreCases}
                  aria-label="Подгрузить ещё проекты с лайком"
                  onClick={() => void loadMoreCases()}
                >
                  {loadingMoreCases ? 'Загрузка…' : 'Показать ещё'}
                </button>
              </div>
            ) : null}
          </>
        )
      ) : null}

      {!loading && tab === 2 ? (
        emptyDesigners ? (
          <p className={styles.muted}>Пока нет дизайнеров с вашим лайком.</p>
        ) : (
          <>
            <div className={`${designerCardStyles.designersCardsWrapper} ${styles.favoritesDesignersCardsWrapper}`}>
              {designers.map((d) => (
                <FavoriteDesignerCard
                  key={d.id}
                  designer={d}
                  onUnliked={(id) => {
                    setDesigners((prev) => prev.filter((x) => x.id !== id));
                    setDesignersTotal((t) => Math.max(0, t - 1));
                  }}
                />
              ))}
            </div>
            {hasMoreDesigners ? (
              <div className={styles.loadMoreWrap}>
                <button
                  type="button"
                  className={styles.loadMoreBtn}
                  disabled={loadingMoreDesigners}
                  aria-busy={loadingMoreDesigners}
                  aria-label="Подгрузить ещё дизайнеров с лайком"
                  onClick={() => void loadMoreDesigners()}
                >
                  {loadingMoreDesigners ? 'Загрузка…' : 'Показать ещё'}
                </button>
              </div>
            ) : null}
          </>
        )
      ) : null}
    </div>
  );
}
