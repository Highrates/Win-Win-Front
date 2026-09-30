'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CasesPagination, ProjectData } from '../designers/designerProjectsTypes';
import { ProjectsGrid } from './ProjectsGrid';
import { ProjectsRoomFilter } from './ProjectsRoomFilter';
import { projectsFeedPaginationEnabled } from '@/lib/brandCaseForm';
import { useProjectsListingFilters } from './useProjectsListingFilters';
import pageStyles from './ProjectsPage.module.css';

type Props = {
  projects: ProjectData[];
  stylesModule: Record<string, string>;
  productFilter?: { id: string; label: string } | null;
  brandFilter?: { slug: string; label: string } | null;
  /** Дизайнерские кейсы с товарами бренда (`?productBrand=`). */
  productBrandFilter?: { slug: string; label: string } | null;
  initialSource?: 'all' | 'designers' | 'brands';
  gridOnly?: boolean;
  initialTotal?: number;
  pageSize?: number;
  initialRooms?: string[];
  /** SSR/API ошибка ленты — показать вместо «пусто». */
  loadError?: boolean;
};

export function ProjectsListingSection({
  projects,
  stylesModule,
  productFilter,
  brandFilter,
  productBrandFilter,
  initialSource,
  gridOnly = true,
  initialTotal,
  pageSize = 48,
  initialRooms = [],
  loadError = false,
}: Props) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const {
    activeRoom,
    setActiveRoom,
    withProducts,
    setWithProducts,
    sources,
    onSourceToggle,
    onFeedRooms,
    roomChips,
    bothSourcesOff,
    feedSource,
  } = useProjectsListingFilters({
    brandFilter,
    productBrandFilter,
    initialSource,
    initialRooms,
  });

  useEffect(() => {
    setRetrying(false);
  }, [loadError, projects, initialTotal]);

  const feedEnabled =
    initialTotal != null && projectsFeedPaginationEnabled(bothSourcesOff);

  const casesPagination = useMemo((): CasesPagination | undefined => {
    if (!feedEnabled || initialTotal == null) return undefined;
    const room = activeRoom === 'Все' ? null : activeRoom;
    return {
      mode: 'projects-feed',
      total: initialTotal,
      pageSize,
      productId: productFilter?.id ?? null,
      brandSlug: brandFilter?.slug ?? null,
      productBrandSlug: productBrandFilter?.slug ?? null,
      source: feedSource,
      room,
      hasProducts: withProducts,
    };
  }, [
    activeRoom,
    brandFilter?.slug,
    feedEnabled,
    feedSource,
    initialTotal,
    pageSize,
    productBrandFilter?.slug,
    productFilter?.id,
    withProducts,
  ]);

  const filterBar = (
    <ProjectsRoomFilter
      roomChips={roomChips}
      activeLabel={activeRoom}
      onActiveChange={setActiveRoom}
      productFilter={productFilter ?? null}
      brandFilter={brandFilter ?? null}
      productBrandFilter={productBrandFilter ?? null}
      withProducts={withProducts}
      onWithProductsChange={setWithProducts}
      sources={sources}
      onSourceToggle={onSourceToggle}
    />
  );

  return loadError ? (
    <div className={pageStyles.listingError} role="alert">
      <p className={pageStyles.listingStatus}>
        Не удалось загрузить проекты. Попробуйте ещё раз.
      </p>
      <button
        type="button"
        className={pageStyles.listingRetryBtn}
        disabled={retrying}
        onClick={() => {
          setRetrying(true);
          router.refresh();
        }}
      >
        {retrying ? 'Загрузка…' : 'Повторить'}
      </button>
    </div>
  ) : bothSourcesOff ? (
    <>
      <div className={pageStyles.listingFiltersAboveHint}>{filterBar}</div>
      <p className={pageStyles.listingStatus}>
        Включите хотя бы один источник: «Дизайнеры» или «Бренды».
      </p>
    </>
  ) : (
    <ProjectsGrid
      projects={projects}
      stylesModule={stylesModule}
      defaultView="grid"
      gridOnly={gridOnly}
      casesPagination={casesPagination}
      onFeedRooms={onFeedRooms}
      emptyLabel="Пока нет проектов по выбранным фильтрам."
      titlesLeft={filterBar}
    />
  );
}

/** @deprecated Используйте ProjectsListingSection */
export const ProjectsMarketSection = ProjectsListingSection;
