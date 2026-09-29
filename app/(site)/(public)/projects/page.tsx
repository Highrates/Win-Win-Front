import Link from 'next/link';
import React, { Fragment } from 'react';
import type { Metadata } from 'next';
import type { ProjectData } from '../designers/DesignerProjectsSection';
import { ProjectsMarketSection } from './ProjectsMarketSection';
import { mapPublicCaseToProjectData } from '@/lib/mapPublicCaseToProjectData';
import { parseNestPublicCaseItem } from '@/lib/parseNestPublicCase';
import { DESIGNER_PUBLIC_REVALIDATE_SECONDS, PUBLIC_CASES_PAGE_SIZE } from '@/lib/designersPublicShared';
import { getServerApiBase } from '@/lib/serverApiBase';
/**
 * Общие стили превью, маркета и карточек проектов (те же классы, что на странице дизайнера).
 */
import listingLayoutStyles from './ProjectsListingLayout.module.css';
import projectsStyles from './ProjectsPage.module.css';

export const metadata: Metadata = {
  title: 'Проекты и концепции — Wupapa',
  description: 'Проекты и концепции интерьеров',
};

async function fetchProductTitleForFilter(productId: string): Promise<string | null> {
  const id = productId.trim();
  if (!id) return null;
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/catalog/products/resolve-ids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: Array<{ id: string; name: string }> };
    const item = data.items?.find((i) => i.id === id);
    const name = item?.name?.trim();
    return name && name.length > 0 ? name : null;
  } catch {
    return null;
  }
}

async function fetchPublicProjectsListing(
  productFilterId?: string | null,
): Promise<{ projects: ProjectData[]; total: number }> {
  const base = getServerApiBase();
  const qs = new URLSearchParams({
    page: '1',
    limit: String(PUBLIC_CASES_PAGE_SIZE),
  });
  if (productFilterId?.trim()) qs.set('product', productFilterId.trim());
  try {
    const res = await fetch(`${base}/designers/cases?${qs}`, {
      next: { revalidate: DESIGNER_PUBLIC_REVALIDATE_SECONDS },
    });
    if (!res.ok) return { projects: [], total: 0 };
    const raw = (await res.json()) as Record<string, unknown>;
    const rawItems = raw.items;
    if (!Array.isArray(rawItems)) return { projects: [], total: 0 };
    const out: ProjectData[] = [];
    for (const row of rawItems) {
      const parsed = parseNestPublicCaseItem(row, { requireDesignerMeta: true });
      if (!parsed?.designer) continue;
      out.push(
        mapPublicCaseToProjectData(parsed.case, {
          slug: parsed.designer.slug,
          name: parsed.designer.name,
          photoUrl: parsed.designer.photoUrl,
        }),
      );
    }
    return {
      projects: out,
      total: typeof raw.total === 'number' ? raw.total : out.length,
    };
  } catch {
    return { projects: [], total: 0 };
  }
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<{ product?: string }>;
}) {
  const productQuery = searchParams ? (await searchParams)?.product : undefined;
  const productIdTrimmed = productQuery?.trim() || '';
  const [listing, productTitle] = await Promise.all([
    fetchPublicProjectsListing(productQuery),
    productIdTrimmed ? fetchProductTitleForFilter(productIdTrimmed) : Promise.resolve(null),
  ]);
  const productFilter =
    productIdTrimmed.length > 0
      ? {
          id: productIdTrimmed,
          label: productTitle ?? 'Товар',
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
            <ProjectsMarketSection
              projects={listing.projects}
              stylesModule={listingLayoutStyles}
              productFilter={productFilter}
              casesPagination={{
                mode: 'public',
                productId: productIdTrimmed || null,
                total: listing.total,
                pageSize: PUBLIC_CASES_PAGE_SIZE,
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
