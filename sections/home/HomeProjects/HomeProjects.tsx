import Link from 'next/link';
import { ProjectsGrid } from '@/app/(site)/(public)/projects/ProjectsGrid';
import listingLayoutStyles from '@/app/(site)/(public)/projects/ProjectsListingLayout.module.css';
import { fetchPublicProjectsListing } from '@/lib/publicProjectsListing';
import styles from './HomeProjects.module.css';

/** Превью на главной: ~4–5 рядов в 4-колоночной masonry. */
export const HOME_PROJECTS_PREVIEW_LIMIT = 18;

export async function HomeProjects() {
  const listing = await fetchPublicProjectsListing({
    limit: HOME_PROJECTS_PREVIEW_LIMIT,
    source: 'all',
  });
  if (!listing.ok || listing.projects.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Проекты">
      <div className={`padding-global ${styles.inner}`}>
        <div className={styles.titleRow}>
          <h5 className={styles.title}>Проекты</h5>
          <Link href="/projects" className={styles.allLink}>
            ВСЕ
          </Link>
        </div>
        <ProjectsGrid
          projects={listing.projects}
          stylesModule={listingLayoutStyles}
          gridOnly
          hideTitles
          emptyLabel="Пока нет опубликованных проектов."
        />
      </div>
    </section>
  );
}
