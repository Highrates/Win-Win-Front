import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogBrowseProvider } from '@/app/(site)/(public)/catalog/CatalogBrowseContext';
import { CatalogCategoryBrowseTitles } from '@/app/(site)/(public)/catalog/CatalogCategoryBrowseTitles';
import { CatalogCategoryMarketClient } from '@/app/(site)/(public)/catalog/CatalogCategoryMarketClient';
import { CatalogSectionsTabs } from '@/app/(site)/(public)/catalog/CatalogSectionsTabs';
import { CategoryCatalogContent } from '@/app/(site)/(public)/categories/CategoryCatalogContent';
import { CATEGORY_PER_PAGE } from '@/app/(site)/(public)/categories/categoryCatalogData';
import { findCatalogNodeById, findCatalogPathToId, findCatalogPathToSlugUnder } from '@/lib/catalog/findCatalogRoot';
import {
  loadCatalogCategoryBySlug,
  loadCatalogTags,
  loadCatalogTreeRoots,
} from '@/lib/catalog/loadCatalogPageData';
import { buildCategoryBreadcrumbs } from '@/lib/catalog/mapCatalogCategoryPageView';
import {
  catalogCategoryMetadataFromCategory,
  catalogCategoryNotFoundMetadata,
} from '@/lib/catalog/mapCatalogMetadata';
import { parseCatalogTagSlugs } from '@/lib/catalog/parseCatalogTagSlugs';
import {
  normalizeCatalogPriceRange,
  parseCatalogPriceBound,
} from '@/lib/catalog/catalogPriceFilter';
import {
  catalogFacetFiltersToPatch,
  parseCatalogFacetFiltersFromSearchParams,
} from '@/lib/catalog/catalogProductFilters';
import { parseCatalogSort } from '@/lib/catalog/catalogSort';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import {
  fetchProductFilterOptions,
  fetchProductsSearch,
} from '@/lib/server/catalogAuthFetch';
import { getServerRequestOrigin } from '@/lib/serverRequestOrigin';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    tag?: string;
    sub?: string;
    sort?: string;
    priceFrom?: string;
    priceTo?: string;
    brandId?: string;
    widthFrom?: string;
    widthTo?: string;
    heightFrom?: string;
    heightTo?: string;
    materialId?: string;
    hasCase?: string;
    has3d?: string;
    hasDrawing?: string;
  }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { tag: tagSlugRaw, sub: subSlugRaw } = await searchParams;
  const tagSlugs = parseCatalogTagSlugs(tagSlugRaw);
  const subSlug = subSlugRaw?.trim() || undefined;
  const [category, zones, roots, siteOrigin] = await Promise.all([
    loadCatalogCategoryBySlug(slug),
    loadCatalogTags(),
    loadCatalogTreeRoots(),
    getServerRequestOrigin(),
  ]);
  if (!category) {
    return catalogCategoryNotFoundMetadata();
  }
  const activeTag =
    tagSlugs.length === 1 ? zones.find((z) => z.slug === tagSlugs[0]) ?? null : null;
  let subName: string | undefined;
  if (subSlug) {
    const pageNode = findCatalogNodeById(roots, category.id);
    const path = pageNode ? findCatalogPathToSlugUnder(pageNode, subSlug) : [];
    if (path.length) subName = path[path.length - 1]!.name;
  }
  return catalogCategoryMetadataFromCategory(category, { activeTag, subName, siteOrigin });
}

export default async function CatalogSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const {
    tag: tagSlugRaw,
    sub: subSlugRaw,
    sort: sortRaw,
    priceFrom: priceFromRaw,
    priceTo: priceToRaw,
  } = sp;
  const tagSlugs = parseCatalogTagSlugs(tagSlugRaw);
  const tagParam = tagSlugs.length ? tagSlugs.join(',') : undefined;
  const subSlug = subSlugRaw?.trim() || undefined;
  const sort = parseCatalogSort(sortRaw);
  const { priceFrom, priceTo } = normalizeCatalogPriceRange(
    parseCatalogPriceBound(priceFromRaw),
    parseCatalogPriceBound(priceToRaw),
  );
  const facets = parseCatalogFacetFiltersFromSearchParams({
    get: (name: string) => {
      const v = sp[name as keyof typeof sp];
      return typeof v === 'string' ? v : null;
    },
  });
  const facetPatch = catalogFacetFiltersToPatch(facets);

  const [roots, category, zones] = await Promise.all([
    loadCatalogTreeRoots(),
    loadCatalogCategoryBySlug(slug),
    loadCatalogTags(),
  ]);

  if (!category) {
    notFound();
  }

  const knownSlugs = new Set(zones.map((z) => z.slug));
  if (tagSlugs.some((s) => !knownSlugs.has(s))) {
    notFound();
  }

  const activeTag =
    tagSlugs.length === 1 ? zones.find((z) => z.slug === tagSlugs[0]) ?? null : null;

  const previewImageSrc = resolveMediaUrlForServer(category.backgroundImageUrl);
  const pageNode = findCatalogNodeById(roots, category.id);
  let productCategoryId = category.id;
  if (subSlug) {
    if (!pageNode) notFound();
    const path = findCatalogPathToSlugUnder(pageNode, subSlug);
    if (!path.length) notFound();
    productCategoryId = path[path.length - 1]!.id;
  }

  const pageBreadcrumbs = buildCategoryBreadcrumbs(category, activeTag, roots);
  const pathToPage = findCatalogPathToId(roots, category.id);
  const parentCategoryName =
    pathToPage.length >= 2
      ? pathToPage[pathToPage.length - 2]!.name
      : category.parent?.name ?? null;

  const needsFilterOptions =
    Boolean(tagParam) ||
    priceFrom != null ||
    priceTo != null ||
    facets.brandIds.length > 0 ||
    facets.materialIds.length > 0 ||
    facets.widthFrom != null ||
    facets.widthTo != null ||
    facets.heightFrom != null ||
    facets.heightTo != null ||
    facets.hasCase ||
    facets.has3d ||
    facets.hasDrawing;

  const [search, initialFilterOptions] = await Promise.all([
    fetchProductsSearch({
      categoryId: productCategoryId,
      tag: tagParam,
      page: 1,
      limit: CATEGORY_PER_PAGE,
      sort,
      priceFrom,
      priceTo,
      brandId: facetPatch.brandId ?? undefined,
      widthFrom: facets.widthFrom,
      widthTo: facets.widthTo,
      heightFrom: facets.heightFrom,
      heightTo: facets.heightTo,
      materialId: facetPatch.materialId ?? undefined,
      hasCase: facets.hasCase,
      has3d: facets.has3d,
      hasDrawing: facets.hasDrawing,
    }),
    needsFilterOptions
      ? fetchProductFilterOptions({
          categoryId: productCategoryId,
          tag: tagParam,
          priceFrom,
          priceTo,
          brandId: facetPatch.brandId ?? undefined,
          materialId: facetPatch.materialId ?? undefined,
          widthFrom: facets.widthFrom,
          widthTo: facets.widthTo,
          heightFrom: facets.heightFrom,
          heightTo: facets.heightTo,
          hasCase: facets.hasCase,
          has3d: facets.has3d,
          hasDrawing: facets.hasDrawing,
        })
      : Promise.resolve(undefined),
  ]);

  return (
    <CatalogBrowseProvider
      initialRoots={roots}
      pageCategoryId={category.id}
      pageSlug={category.slug}
      initialSubSlug={subSlug}
    >
      <CategoryCatalogContent
        categoryTitle={category.name}
        parentCategoryName={parentCategoryName}
        breadcrumbs={pageBreadcrumbs}
        heroTitles={
          <CatalogCategoryBrowseTitles
            pageCategoryName={category.name}
            pageCategorySlug={category.slug}
            pageCategoryId={category.id}
            parentCategoryName={parentCategoryName}
            pageBreadcrumbs={pageBreadcrumbs}
            roots={roots}
          />
        }
        previewImageSrc={previewImageSrc}
        marketCompact
        belowPreview={<CatalogSectionsTabs initialRoots={roots} />}
        productGrid={
          <CatalogCategoryMarketClient
            initialTagSlug={tagParam}
            initialPriceFrom={priceFrom}
            initialPriceTo={priceTo}
            initialFacets={facets}
            initialSort={sort}
            initialFilterOptions={initialFilterOptions}
            zones={zones}
            initialProductCategoryId={productCategoryId}
            initialHits={search.hits}
            initialTotal={search.total}
          />
        }
      />
    </CatalogBrowseProvider>
  );
}
