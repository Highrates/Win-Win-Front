import Link from 'next/link';
import React, { Fragment, Suspense } from 'react';
import type { Metadata } from 'next';
import { ProjectsListingSection } from './ProjectsListingSection';
import {
  fetchProductTitleForFilter,
  fetchPublicProjectsListing,
} from '@/lib/publicProjectsListing';
import { DESIGNER_PUBLIC_REVALIDATE_SECONDS, PUBLIC_CASES_PAGE_SIZE } from '@/lib/designersPublicShared';
import { getServerApiBase } from '@/lib/serverApiBase';
import listingLayoutStyles from './ProjectsListingLayout.module.css';
import projectsStyles from './ProjectsPage.module.css';

const DEFAULT_TITLE = 'Проекты и концепции — Wupapa';
const DEFAULT_DESCRIPTION = 'Проекты и концепции интерьеров';

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ brand?: string; productBrand?: string }>;
}): Promise<Metadata> {
  const sp = searchParams ? await searchParams : undefined;
  const brandSlug = sp?.brand?.trim() || sp?.productBrand?.trim() || '';
  if (!brandSlug) {
    return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
  }
  try {
    const res = await fetch(`${getServerApiBase()}/brands/${encodeURIComponent(brandSlug)}`, {
      next: { revalidate: DESIGNER_PUBLIC_REVALIDATE_SECONDS },
    });
    if (!res.ok) return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
    const data = (await res.json()) as { name?: string } | null;
    const name = data?.name?.trim();
    if (!name) return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
    const title = sp?.brand?.trim()
      ? `Проекты ${name} — Wupapa`
      : `Проекты с товарами ${name} — Wupapa`;
    return {
      title,
      description: `Проекты и концепции: ${name}`,
      openGraph: { title, description: `Проекты и концепции: ${name}` },
    };
  } catch {
    return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
  }
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<{ product?: string; brand?: string; productBrand?: string; source?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const productQuery = sp?.product;
  const brandSlug = sp?.brand?.trim() || '';
  const productBrandSlug = sp?.productBrand?.trim() || '';
  const sourceParam =
    sp?.source === 'designers' || sp?.source === 'brands' || sp?.source === 'all'
      ? sp.source
      : undefined;
  const productIdTrimmed = productQuery?.trim() || '';
  const brandNameSlug = brandSlug || productBrandSlug;
  const [listing, productTitle, brandRow] = await Promise.all([
    fetchPublicProjectsListing({
      brandSlug: brandSlug || null,
      productBrandSlug: productBrandSlug || null,
      productId: productQuery,
      source: sourceParam,
    }),
    productIdTrimmed ? fetchProductTitleForFilter(productIdTrimmed) : Promise.resolve(null),
    brandNameSlug
      ? fetch(`${getServerApiBase()}/brands/${encodeURIComponent(brandNameSlug)}`, {
          next: { revalidate: DESIGNER_PUBLIC_REVALIDATE_SECONDS },
        })
          .then(async (res) => {
            if (!res.ok) return null;
            const data = (await res.json()) as { name?: string; slug?: string } | null;
            return data?.slug ? data : null;
          })
          .catch(() => null)
      : Promise.resolve(null),
  ]);
  const productFilter =
    productIdTrimmed.length > 0
      ? {
          id: productIdTrimmed,
          label: productTitle ?? 'Товар',
        }
      : null;
  const brandFilter =
    brandSlug.length > 0
      ? {
          slug: brandSlug,
          label: brandRow?.name?.trim() || brandSlug,
        }
      : null;
  const productBrandFilter =
    productBrandSlug.length > 0
      ? {
          slug: productBrandSlug,
          label: brandRow?.name?.trim()
            ? `Товары ${brandRow.name.trim()}`
            : `Товары ${productBrandSlug}`,
        }
      : null;

  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Проекты', href: '', current: true },
  ];

  return (
    <main>
      <section className={listingLayoutStyles.previewPageSection}>
        <div className="padding-global">
          <div className={listingLayoutStyles.previewPageWrapper}>
            <div
              className={`${listingLayoutStyles.previewPageTitles} ${projectsStyles.projectsPreviewTitlesTight}`}
            >
              <nav className={listingLayoutStyles.breadcrumbs} aria-label="Хлебные крошки">
                {breadcrumbs.map((item, i) => (
                  <Fragment key={i}>
                    {i > 0 && (
                      <span className={listingLayoutStyles.breadcrumbsSep}>/</span>
                    )}
                    {item.current ? (
                      <span className={listingLayoutStyles.breadcrumbsCurrent}>{item.label}</span>
                    ) : (
                      <Link href={item.href} className={listingLayoutStyles.breadcrumbsLink}>
                        {item.label}
                      </Link>
                    )}
                  </Fragment>
                ))}
              </nav>
              <div className={projectsStyles.projectsPageHeroOuter}>
                <h1 className={projectsStyles.projectsPageHeroTitle}>
                  Проекты и концепции
                </h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={`${listingLayoutStyles.marketSection} ${projectsStyles.projectsPageMarketSection}`}
        aria-label="Проекты"
      >
        <div className="padding-global">
          <div className={listingLayoutStyles.marketSectionInner}>
            <Suspense fallback={null}>
              <ProjectsListingSection
                projects={listing.projects}
                stylesModule={listingLayoutStyles}
                productFilter={productFilter}
                brandFilter={brandFilter}
                productBrandFilter={productBrandFilter}
                initialSource={sourceParam ?? (productBrandFilter ? 'designers' : brandFilter ? 'brands' : 'all')}
                initialTotal={listing.total}
                pageSize={PUBLIC_CASES_PAGE_SIZE}
                initialRooms={listing.rooms}
                loadError={!listing.ok}
              />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
