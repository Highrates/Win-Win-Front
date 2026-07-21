import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogHubClient } from '@/app/(site)/(public)/catalog/CatalogHubClient';
import { CatalogZonesGrid } from '@/app/(site)/(public)/catalog/CatalogZonesGrid';
import { CATALOG_HERO_IMAGE_SRC } from '@/app/(site)/(public)/catalog/catalogHero';
import { CategoryCatalogContent } from '@/app/(site)/(public)/categories/CategoryCatalogContent';
import {
  catalogHubMetadata,
  catalogTagMetadataFromTag,
  catalogTagNotFoundMetadata,
} from '@/lib/catalog/mapCatalogMetadata';
import { buildZoneBreadcrumbs } from '@/lib/catalog/mapCatalogCategoryPageView';
import {
  loadCatalogTagBySlug,
  loadCatalogTags,
  loadCatalogTreeRoots,
  loadTagStripCategories,
} from '@/lib/catalog/loadCatalogPageData';
import { parseCatalogHubTab } from '@/lib/catalog/parseCatalogHubTab';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import { getServerRequestOrigin } from '@/lib/serverRequestOrigin';

type Props = {
  searchParams: Promise<{ tag?: string; tab?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { tag: tagSlug } = await searchParams;
  const siteOrigin = await getServerRequestOrigin();
  if (!tagSlug?.trim()) {
    return catalogHubMetadata({ siteOrigin });
  }
  const tag = await loadCatalogTagBySlug(tagSlug);
  if (!tag) {
    return catalogTagNotFoundMetadata();
  }
  return catalogTagMetadataFromTag(tag, { siteOrigin });
}

export default async function CatalogIndexPage({ searchParams }: Props) {
  const { tag: tagSlugRaw, tab: tabRaw } = await searchParams;
  const tagSlug = tagSlugRaw?.trim() ?? '';
  const initialTab = parseCatalogHubTab(tabRaw);

  if (tagSlug) {
    const [tag, stripCategories] = await Promise.all([
      loadCatalogTagBySlug(tagSlug),
      loadTagStripCategories(tagSlug),
    ]);
    if (!tag) notFound();

    const coverSrc =
      resolveMediaUrlForServer(tag.coverImageUrl) || '/images/placeholder.svg';
    const tagQuery = `?tag=${encodeURIComponent(tag.slug)}`;

    const categoryItems = stripCategories.map((cat) => ({
      key: cat.slug,
      href: `/catalog/${encodeURIComponent(cat.slug)}${tagQuery}`,
      name: cat.name,
      imageSrc: resolveMediaUrlForServer(cat.backgroundImageUrl) || '/images/placeholder.svg',
    }));

    return (
      <CategoryCatalogContent
        categoryTitle={tag.name}
        parentCategoryName={null}
        breadcrumbs={buildZoneBreadcrumbs(tag)}
        previewImageSrc={coverSrc}
        belowPreview={
          <CatalogZonesGrid
            items={categoryItems}
            introCopy={`Выберите раздел каталога — товары будут отфильтрованы по зоне «${tag.name}».`}
            ariaLabel="Разделы каталога в зоне"
            emptyLabel="Разделы для этой зоны пока не настроены."
          />
        }
      />
    );
  }

  const [roots, tags] = await Promise.all([loadCatalogTreeRoots(), loadCatalogTags()]);

  const categoryItems = roots.map((root) => ({
    key: root.slug,
    href: `/catalog/${encodeURIComponent(root.slug)}`,
    name: root.name,
    imageSrc: root.cardImageUrl || '/images/placeholder.svg',
    productCount: typeof root.productCount === 'number' ? root.productCount : 0,
  }));

  const zoneItems = tags.map((tag) => ({
    key: tag.slug,
    href: `/catalog?tag=${encodeURIComponent(tag.slug)}`,
    name: tag.name,
    imageSrc: resolveMediaUrlForServer(tag.coverImageUrl) || '/images/placeholder.svg',
    productCount: typeof tag.productCount === 'number' ? tag.productCount : 0,
  }));

  return (
    <main>
      <CatalogHubClient
        heroImageSrc={CATALOG_HERO_IMAGE_SRC}
        categoryItems={categoryItems}
        zoneItems={zoneItems}
        initialTab={initialTab}
      />
    </main>
  );
}
