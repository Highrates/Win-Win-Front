'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { buildLikesBulkUiProp } from '@/lib/buildLikesBulkUiProp';
import { markCaseListLikesStale } from '@/lib/caseListLikesStale';
import { markProductListLikesStale } from '@/lib/productListLikesStale';
import { useLikesBulk } from '@/hooks/useLikesBulk';
import { UnderlineTabs } from '@/components/UnderlineTabs';
import { DesignerViewToggle, type ViewMode } from './[slug]/DesignerViewToggle';
import { MoreAboutProjectModal } from './[slug]/MoreAboutProjectModal';
import { DesignerProjectsListView } from './DesignerProjectsListView';
import { DesignerProjectsMasonryGrid } from './DesignerProjectsMasonryGrid';
import {
  PRODUCT_FILTER_TABS,
  type CasesPagination,
  type ProductFilterTab,
  type ProjectData,
} from './designerProjectsTypes';
import { useCasesPagination } from './useCasesPagination';

export type { CasesPagination, ProjectData, ProjectDesignerLink } from './designerProjectsTypes';

type Props = {
  projects: ProjectData[];
  stylesModule: Record<string, string>;
  titlesLeft?: ReactNode;
  defaultView?: ViewMode;
  gridOnly?: boolean;
  productFilterTabs?: boolean;
  casesPagination?: CasesPagination;
};

export function DesignerProjectsSection({
  projects,
  stylesModule,
  titlesLeft,
  defaultView = 'list',
  gridOnly = false,
  productFilterTabs = false,
  casesPagination,
}: Props) {
  const forceGrid = gridOnly || productFilterTabs;
  const [activeView, setActiveView] = useState<ViewMode>(forceGrid ? 'grid' : defaultView);
  const [productFilter, setProductFilter] = useState<ProductFilterTab>('all');
  const [modalProject, setModalProject] = useState<ProjectData | null>(null);

  const { items, filterLoading, hasMore, sentinelRef, clientFilterWithProducts } = useCasesPagination({
    initialProjects: projects,
    casesPagination,
    productFilter,
    productFilterTabs,
  });

  const visibleProjects = useMemo(() => {
    if (clientFilterWithProducts) return items.filter((p) => p.products.length > 0);
    return items;
  }, [items, clientFilterWithProducts]);

  useEffect(() => {
    if (forceGrid) setActiveView('grid');
  }, [forceGrid]);

  const openProjectModal = useCallback((project: ProjectData) => {
    setModalProject(project);
  }, []);

  const closeProjectModal = useCallback(() => {
    setModalProject(null);
  }, []);

  const caseIds = useMemo(
    () => items.map((p) => p.id?.trim()).filter((id): id is string => Boolean(id)),
    [items],
  );
  const productIds = useMemo(() => {
    const s = new Set<string>();
    for (const p of items) {
      for (const pr of p.products) {
        const id = pr.productId?.trim();
        if (id) s.add(id);
      }
    }
    return Array.from(s);
  }, [items]);

  const caseBulk = useLikesBulk('case', caseIds);
  const productBulk = useLikesBulk('product', productIds);

  const onCaseLikedChange = useCallback(
    (id: string, liked: boolean) => {
      caseBulk.setLiked(id, liked);
      markCaseListLikesStale();
    },
    [caseBulk.setLiked],
  );

  const onProductLikedChange = useCallback(
    (id: string, liked: boolean) => {
      productBulk.setLiked(id, liked);
      markProductListLikesStale();
    },
    [productBulk.setLiked],
  );

  const caseBulkUi = useCallback(
    (caseId: string | undefined) => buildLikesBulkUiProp(caseBulk, caseId, onCaseLikedChange),
    [caseBulk, onCaseLikedChange],
  );

  const productBulkUi = useCallback(
    (productId: string | undefined) => buildLikesBulkUiProp(productBulk, productId, onProductLikedChange),
    [productBulk, onProductLikedChange],
  );

  const showBulkStatus =
    (caseBulk.auth === true && caseIds.length > 0) || (productBulk.auth === true && productIds.length > 0);
  const bulkError = showBulkStatus && (caseBulk.status === 'error' || productBulk.status === 'error');

  const retryBulk = useCallback(() => {
    if (caseBulk.status === 'error') caseBulk.retry();
    if (productBulk.status === 'error') productBulk.retry();
  }, [caseBulk, productBulk]);

  const showList = !forceGrid && activeView === 'list' && visibleProjects.length > 0;
  const showGrid = (forceGrid || activeView === 'grid') && visibleProjects.length > 0;

  return (
    <>
      {productFilterTabs ? (
        <UnderlineTabs
          ariaLabel="Фильтр проектов"
          tabs={PRODUCT_FILTER_TABS}
          activeId={productFilter}
          onSelect={(id) => setProductFilter(id as ProductFilterTab)}
        />
      ) : (
        <div className={stylesModule.titlesWrapper}>
          {titlesLeft ?? <h5 className={stylesModule.titlesWrapperH5}>Проекты</h5>}
          {items.length > 0 && !forceGrid ? (
            <DesignerViewToggle
              styles={stylesModule}
              activeView={activeView}
              onViewChange={setActiveView}
            />
          ) : null}
        </div>
      )}

      {!filterLoading && items.length === 0 && productFilter === 'all' ? (
        <p className={stylesModule.projectsEmpty}>У дизайнера пока нет опубликованных кейсов.</p>
      ) : null}

      {!filterLoading && items.length === 0 && productFilter === 'with-products' ? (
        <p className={stylesModule.projectsEmpty}>Нет проектов с товарами.</p>
      ) : null}

      {!filterLoading && clientFilterWithProducts && items.length > 0 && visibleProjects.length === 0 ? (
        <p className={stylesModule.projectsEmpty}>Нет проектов с товарами.</p>
      ) : null}

      {showList ? (
        <DesignerProjectsListView
          projects={visibleProjects}
          stylesModule={stylesModule}
          caseBulkUi={caseBulkUi}
          productBulkUi={productBulkUi}
        />
      ) : null}

      {showGrid ? (
        <DesignerProjectsMasonryGrid
          projects={visibleProjects}
          stylesModule={stylesModule}
          caseBulkUi={caseBulkUi}
          onOpenProject={openProjectModal}
          ariaBusy={filterLoading}
        />
      ) : null}

      {bulkError ? (
        <div className={stylesModule.projectsLikesBulkRetryWrap} role="status">
          <button type="button" className={stylesModule.projectsLikesBulkRetryBtn} onClick={retryBulk}>
            Повторить загрузку лайков
          </button>
        </div>
      ) : null}

      {hasMore ? <div ref={sentinelRef} aria-hidden style={{ height: 1 }} /> : null}

      {modalProject && (
        <MoreAboutProjectModal
          project={{
            title: modalProject.title,
            places: modalProject.places,
            descriptionHtml: modalProject.descriptionHtml ?? null,
            products: modalProject.products,
            coverImages: [
              modalProject.gridCoverImage ?? modalProject.coverImage,
              ...(modalProject.coverImage2?.trim() ? [modalProject.coverImage2.trim()] : []),
            ],
          }}
          linkClassName={stylesModule.moreAboutProjectLink}
          textClassName={stylesModule.moreAboutProjectText}
          arrowClassName={stylesModule.moreAboutProjectArrow}
          controlledOpen
          onClose={closeProjectModal}
          productLikesBulkFor={productBulkUi}
        />
      )}
    </>
  );
}
