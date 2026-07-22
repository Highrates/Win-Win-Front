import Link from 'next/link';
import { Fragment, Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { CollectionProductRow } from '@/app/(site)/(public)/collections/[slug]/CollectionProductsGrid';
import {
  normalizeCatalogPriceRange,
  parseCatalogPriceBound,
} from '@/lib/catalog/catalogPriceFilter';
import { parseCatalogFacetFiltersFromSearchParams } from '@/lib/catalog/catalogProductFilters';
import { parseCatalogSort } from '@/lib/catalog/catalogSort';
import { loadCatalogTags } from '@/lib/catalog/loadCatalogPageData';
import { parseCatalogTagSlugs } from '@/lib/catalog/parseCatalogTagSlugs';
import { fetchHomeCatalogRoots } from '@/lib/homeCatalog';
import { brandCoverImageUrl, plainTextExcerptFromHtml } from '@/lib/brandsPublic';
import { fetchPublicBrandBySlug } from '@/lib/server/brandAuthFetch';
import { brandProductRowToProductGridItem } from '@/lib/productGridItem';
import { BrandPageMarketClient } from './BrandPageMarketClient';
import { MoreAboutBrandModal } from './MoreAboutBrandModal';
import styles from './BrandPage.module.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const row = await fetchPublicBrandBySlug(slug);
  if (!row) {
    return { title: 'Бренд — Win-Win' };
  }
  const title = row.seoTitle?.trim() || `${row.name} — Бренд — Win-Win`;
  const desc =
    row.seoDescription?.trim() ||
    row.shortDescription?.trim() ||
    plainTextExcerptFromHtml(row.description, 200) ||
    `Страница бренда ${row.name}`;
  return { title, description: desc };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
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
}) {
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

  const [catalogRoots, zones, row] = await Promise.all([
    fetchHomeCatalogRoots(),
    loadCatalogTags(),
    /** Все товары бренда — табы и фильтры на клиенте. */
    fetchPublicBrandBySlug(slug),
  ]);
  if (!row) notFound();

  const name = row.name;
  const short = row.shortDescription?.trim() ?? '';
  const excerpt = short || plainTextExcerptFromHtml(row.description, 280);
  const heroSrc = brandCoverImageUrl(row) ?? '/images/placeholder.svg';
  const richHtml = row.description?.trim() || '';

  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Бренды', href: '/brands', current: false },
    { label: name, href: '', current: true },
  ];

  const products: CollectionProductRow[] = row.products.map((p) => ({
    ...brandProductRowToProductGridItem(p),
    categoryId: p.categoryId?.trim() || null,
    brandId: p.brandId?.trim() || null,
    brandName: p.brandName?.trim() || null,
    tagSlugs: p.tagSlugs ?? [],
    materials: p.materials ?? [],
    widthMm: p.widthMm ?? null,
    heightMm: p.heightMm ?? null,
    hasCase: p.hasCase ?? false,
    has3d: p.has3d ?? false,
    hasDrawing: p.hasDrawing ?? false,
  }));

  return (
    <main>
      <section className={styles.previewPageSection}>
        <div className="padding-global">
          <div className={styles.previewPageWrapper}>
            <div className={styles.previewPageTitles}>
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
              <div className={styles.previewPageTitlesBody}>
                <div className={styles.previewPageTitlesOuter}>
                  <div className={styles.previewPageTitlesInner}>
                    <span className={styles.previewParentName}>БРЕНД</span>
                    <h1 className={styles.previewCurrentName}>{name}</h1>
                  </div>
                  {excerpt ? (
                    <div className={styles.shortBrandDescriptionWrapper}>
                      <p>{excerpt}</p>
                    </div>
                  ) : null}
                  <MoreAboutBrandModal
                    linkClassName={styles.moreAboutBrandLink}
                    textClassName={styles.moreAboutBrandText}
                    arrowClassName={styles.moreAboutBrandArrow}
                    bodyHtml={richHtml}
                  />
                </div>
              </div>
            </div>
            <img
              src={heroSrc}
              alt=""
              width={768}
              height={393}
              className={styles.previewImage}
            />
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <BrandPageMarketClient
          slug={slug}
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
    </main>
  );
}
