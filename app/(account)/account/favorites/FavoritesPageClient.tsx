'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import { ProjectsMarketSection } from '@/app/(public)/projects/ProjectsMarketSection';
import listingLayoutStyles from '@/app/(public)/projects/ProjectsListingLayout.module.css';
import { mapPublicCaseToProjectData } from '@/lib/mapPublicCaseToProjectData';
import { parseNestPublicCaseItem } from '@/lib/parseNestPublicCase';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import type { ProjectData } from '@/app/(public)/designers/DesignerProjectsSection';
import productListStyles from '@/components/AccountProductList/AccountProductList.module.css';
import recStyles from '@/sections/home/Recommendations/Recommendations.module.css';
import styles from './FavoritesPage.module.css';

const TAB_NAMES = ['Товары', 'Проекты и концепции'] as const;

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
};

export function FavoritesPageClient() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [caseProjects, setCaseProjects] = useState<ProjectData[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/likes/collection', { credentials: 'same-origin', cache: 'no-store' });
      if (res.status === 401) {
        setError('Войдите в аккаунт, чтобы видеть избранное.');
        setProducts([]);
        setCaseProjects([]);
        return;
      }
      if (!res.ok) {
        setError(`Не удалось загрузить (${res.status})`);
        return;
      }
      const data = (await res.json()) as CollectionJson;
      const rawProducts = Array.isArray(data.products) ? data.products : [];
      setProducts(rawProducts);
      const rawCases = Array.isArray(data.cases) ? data.cases : [];
      const mapped: ProjectData[] = [];
      for (const row of rawCases) {
        const parsed = parseNestPublicCaseItem(row, { requireDesignerMeta: false });
        if (!parsed) continue;
        const designer = parsed.designer;
        mapped.push(
          mapPublicCaseToProjectData(
            parsed.case,
            designer
              ? { slug: designer.slug, name: designer.name, photoUrl: designer.photoUrl }
              : undefined,
          ),
        );
      }
      setCaseProjects(mapped);
    } catch {
      setError('Сеть или сервер недоступны');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const empty = useMemo(
    () => !loading && tab === 0 && products.length === 0,
    [loading, tab, products.length],
  );
  const emptyCases = useMemo(
    () => !loading && tab === 1 && caseProjects.length === 0,
    [loading, tab, caseProjects.length],
  );

  const favoritesProjectsStyles = useMemo(
    () => ({
      ...listingLayoutStyles,
      sliderCoversGrid: `${listingLayoutStyles.sliderCoversGrid} ${styles.favoritesProjectsSliderCoversGrid}`,
    }),
    [],
  );

  const favoritesRecSectionStyles = useMemo(
    () => ({
      ...recStyles,
      section: `${recStyles.section} ${styles.favoritesProjectsRecommendationsSection}`,
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
          ariaLabel="Избранное"
        />
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {loading ? (
        tab === 0 ? (
          <div className={styles.skeletonGrid} aria-busy="true" aria-label="Загрузка избранного">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonThumb} />
                <div className={styles.skeletonTitleLine} />
                <div className={styles.skeletonPriceLine} />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.skeletonProjectsBlock} aria-busy="true" aria-label="Загрузка избранного">
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
            <p className={styles.muted}>Пока нет товаров в избранном.</p>
          ) : (
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
                    onLikedChange={(liked) => {
                      if (!liked) void load();
                    }}
                  />
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {!loading && tab === 1 ? (
        emptyCases ? (
          <p className={styles.muted}>Пока нет проектов в избранном.</p>
        ) : (
          <div className={favoritesRecSectionStyles.section}>
            <ProjectsMarketSection
              projects={caseProjects}
              stylesModule={favoritesProjectsStyles}
              gridOnly
            />
          </div>
        )
      ) : null}
    </div>
  );
}
