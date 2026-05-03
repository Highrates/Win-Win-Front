import Link from 'next/link';
import React, { Fragment } from 'react';
import type { Metadata } from 'next';
import type { ProjectData } from '../designers/DesignerProjectsSection';
import { ProjectsMarketSection } from './ProjectsMarketSection';
import { mapPublicCaseToProjectData } from '@/lib/mapPublicCaseToProjectData';
import { parseNestPublicCaseItem } from '@/lib/parseNestPublicCase';
import { getServerApiBase } from '@/lib/serverApiBase';
/**
 * Общие стили превью, маркета и карточек проектов (те же классы, что на странице дизайнера).
 */
import listingLayoutStyles from './ProjectsListingLayout.module.css';
import projectsStyles from './ProjectsPage.module.css';

export const metadata: Metadata = {
  title: 'Проекты и концепции — Win-Win',
  description: 'Проекты и концепции интерьеров',
};

async function fetchPublicProjectsListing(): Promise<ProjectData[]> {
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/designers/cases`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const raw = (await res.json()) as Record<string, unknown>;
    const rawItems = raw.items;
    if (!Array.isArray(rawItems)) return [];
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
    return out;
  } catch {
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await fetchPublicProjectsListing();

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
            <ProjectsMarketSection projects={projects} stylesModule={listingLayoutStyles} />
          </div>
        </div>
      </section>
    </main>
  );
}
