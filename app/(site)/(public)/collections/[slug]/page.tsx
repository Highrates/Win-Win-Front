import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { CategoryCatalogContent } from '@/app/(site)/(public)/categories/CategoryCatalogContent';
import { CollectionCategoryTabs } from '@/app/(site)/(public)/collections/[slug]/CollectionCategoryTabs';
import {
  CollectionProductsGrid,
  type CollectionProductRow,
} from '@/app/(site)/(public)/collections/[slug]/CollectionProductsGrid';
import {
  normalizeCatalogPriceRange,
  parseCatalogPriceBound,
} from '@/lib/catalog/catalogPriceFilter';
import { parseCatalogFacetFiltersFromSearchParams } from '@/lib/catalog/catalogProductFilters';
import { parseCatalogSort } from '@/lib/catalog/catalogSort';
import { loadCatalogTags } from '@/lib/catalog/loadCatalogPageData';
import { parseCatalogTagSlugs } from '@/lib/catalog/parseCatalogTagSlugs';
import { fetchHomeCatalogRoots } from '@/lib/homeCatalog';
import { brandProductRowToProductGridItem } from '@/lib/productGridItem';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import { fetchCuratedProductCollectionBySlug } from '@/lib/server/catalogAuthFetch';
import { getServerRequestOrigin } from '@/lib/serverRequestOrigin';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    category?: string;
    tag?: string;
    sort?: string;
    priceFrom?: string;
    priceTo?: string;
    brandId?: string;
    materialId?: string;
    widthFrom?: string;
    widthTo?: string;
    heightFrom?: string;
    heightTo?: string;
    hasCase?: string;
    has3d?: string;
    hasDrawing?: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await fetchCuratedProductCollectionBySlug(slug);
  if (!collection) {
    return { title: 'Коллекция — 588est' };
  }
  const siteOrigin = await getServerRequestOrigin();
  const title = `${collection.name} — Коллекции — 588est`;
  return {
    title,
    openGraph: {
      title,
      url: `${siteOrigin}/collections/${encodeURIComponent(collection.slug)}`,
    },
  };
}

export default async function PublicCollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const tagSlugs = parseCatalogTagSlugs(sp.tag);
  const tagParam = tagSlugs.length ? tagSlugs.join(',') : undefined;
  const sort = parseCatalogSort(sp.sort);
  const { priceFrom, priceTo } = normalizeCatalogPriceRange(
    parseCatalogPriceBound(sp.priceFrom),
    parseCatalogPriceBound(sp.priceTo),
  );
  const facets = parseCatalogFacetFiltersFromSearchParams({
    get: (name: string) => {
      const v = sp[name as keyof typeof sp];
      return typeof v === 'string' ? v : null;
    },
  });

  const [collection, catalogRoots, zones] = await Promise.all([
    fetchCuratedProductCollectionBySlug(slug),
    fetchHomeCatalogRoots(),
    loadCatalogTags(),
  ]);
  if (!collection) notFound();

  const products: CollectionProductRow[] = collection.products.map((row) => ({
    ...brandProductRowToProductGridItem(row),
    categoryId: row.categoryId?.trim() || null,
    brandId: row.brandId?.trim() || null,
    brandName: row.brandName?.trim() || null,
    tagSlugs: row.tagSlugs ?? [],
    materials: row.materials ?? [],
    widthMm: row.widthMm ?? null,
    heightMm: row.heightMm ?? null,
    hasCase: row.hasCase ?? false,
    has3d: row.has3d ?? false,
    hasDrawing: row.hasDrawing ?? false,
  }));

  const tabProducts = products.map((p) => ({
    productId: p.productId,
    categoryId: p.categoryId,
  }));

  const coverSrc =
    resolveMediaUrlForServer(collection.coverImageUrl) || '/images/placeholder.svg';

  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Каталог', href: '/catalog', current: false },
    {
      label: 'Коллекции',
      href: '/catalog?tab=collections',
      current: false,
    },
    { label: collection.name, href: '', current: true },
  ];

  return (
    <CategoryCatalogContent
      categoryTitle={collection.name}
      parentCategoryName="Коллекция"
      breadcrumbs={breadcrumbs}
      previewImageSrc={coverSrc}
      marketCompact
      marketSectionLabel={`Товары коллекции ${collection.name}`}
      belowPreview={
        <Suspense fallback={null}>
          <CollectionCategoryTabs
            collectionSlug={collection.slug}
            catalogRoots={catalogRoots}
            products={tabProducts}
          />
        </Suspense>
      }
      productGrid={
        <Suspense fallback={null}>
          <CollectionProductsGrid
            catalogRoots={catalogRoots}
            products={products}
            zones={zones}
            initialTagSlug={tagParam}
            initialFacets={facets}
            initialSort={sort}
            initialPriceFrom={priceFrom}
            initialPriceTo={priceTo}
          />
        </Suspense>
      }
    />
  );
}
