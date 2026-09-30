import Link from 'next/link';
import { Fragment, Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { CollectionProductRow } from '@/app/(site)/(public)/collections/[slug]/CollectionProductsGrid';
import { AccountDocRow } from '@/components/AccountDocRow/AccountDocRow';
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
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import { fetchPublicBrandBySlug } from '@/lib/server/brandAuthFetch';
import { brandProductRowToProductGridItem } from '@/lib/productGridItem';
import { BrandPageMarketClient } from './BrandPageMarketClient';
import { MoreAboutBrandModal } from './MoreAboutBrandModal';
import styles from './BrandPage.module.css';

function ChipArrow() {
  return (
    <svg
      className={styles.brandProjectsChipArrow}
      width="12"
      height="7"
      viewBox="0 0 12 7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8.17993 5.62L10.7399 3.06L8.17993 0.5"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0.5 3.06006H10.67"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const row = await fetchPublicBrandBySlug(slug);
  if (!row) {
    return { title: 'Бренд — Wupapa' };
  }
  const title = row.seoTitle?.trim() || `${row.name} — Бренд — Wupapa`;
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
  const logoSrc = row.logoUrl?.trim()
    ? resolveMediaUrlForServer(row.logoUrl.trim())
    : null;
  const catalogPdfRaw = row.catalogPdfUrl?.trim() || '';
  const catalogPdfHref = catalogPdfRaw ? resolveMediaUrlForServer(catalogPdfRaw) : '';
  const siteUrl = row.siteUrl?.trim() || '';
  const casesCount = typeof row.casesCount === 'number' ? Math.max(0, row.casesCount) : 0;
  const galleryUrls = Array.isArray(row.galleryImageUrls)
    ? row.galleryImageUrls
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((u) => resolveMediaUrlForServer(u.trim()))
        .slice(0, 3)
    : [];

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
                    brandName={name}
                    linkClassName={styles.moreAboutBrandLink}
                    textClassName={styles.moreAboutBrandText}
                    arrowClassName={styles.moreAboutBrandArrow}
                    bodyHtml={richHtml}
                    shortDescription={short || null}
                    logoUrl={logoSrc}
                    siteUrl={siteUrl || null}
                    galleryUrls={galleryUrls}
                    catalogPdfHref={catalogPdfHref || null}
                  />
                  <div className={styles.brandProjectsBlock}>
                    <span className={styles.brandProjectsLabel}>Проекты:</span>
                    <div className={styles.brandProjectsChips} role="group" aria-label="Проекты бренда">
                      <Link
                        href={`/projects?source=designers&productBrand=${encodeURIComponent(slug)}`}
                        className={styles.brandProjectsChipLink}
                        prefetch={false}
                      >
                        <span className={styles.brandProjectsChipLabel}>от дизайнеров</span>
                        <ChipArrow />
                      </Link>
                      {casesCount > 0 ? (
                        <Link
                          href={`/projects?brand=${encodeURIComponent(slug)}`}
                          className={styles.brandProjectsChipLink}
                          prefetch={false}
                        >
                          <span className={styles.brandProjectsChipLabel}>от бренда</span>
                          <ChipArrow />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.previewMediaCol}>
              <img
                src={heroSrc}
                alt={name}
                width={768}
                height={393}
                className={styles.previewImage}
              />
              {catalogPdfHref ? (
                <div className={styles.previewCatalogDoc}>
                  <AccountDocRow
                    title="КАТАЛОГ БРЕНДА"
                    fileType={{ kind: 'pdf', badge: 'PDF' }}
                    href={catalogPdfHref}
                    action="open"
                  />
                </div>
              ) : null}
            </div>
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
