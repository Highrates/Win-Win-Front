import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogSectionsTabs } from '@/app/(public)/catalog/CatalogSectionsTabs';
import { fetchCategoryBySlug } from '@/lib/catalogPublic';
import { findCatalogRootForCategoryId } from '@/lib/catalog/findCatalogRoot';
import { fetchProductsSearch } from '@/lib/server/catalogAuthFetch';
import { fetchHomeCatalogRoots } from '@/lib/homeCatalog';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import { CategoryCatalogContent } from '@/app/(public)/categories/CategoryCatalogContent';
import { CATEGORY_PER_PAGE } from '@/app/(public)/categories/categoryCatalogData';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  if (!category) {
    return { title: 'Каталог — Win-Win' };
  }
  const title = category.seoTitle?.trim() || `${category.name} — Win-Win`;
  const description = category.seoDescription?.trim() || `Категория: ${category.name}`;
  return { title, description };
}

export default async function CatalogSlugPage({ params }: Props) {
  const { slug } = await params;

  const [roots, category] = await Promise.all([
    fetchHomeCatalogRoots(),
    fetchCategoryBySlug(slug),
  ]);
  if (!category) {
    notFound();
  }

  const catalogRoot = findCatalogRootForCategoryId(roots, category.id) ?? roots[0] ?? null;

  const search = await fetchProductsSearch({
    categoryId: category.id,
    page: 1,
    limit: CATEGORY_PER_PAGE,
  });

  const isRoot = category.parentId == null;
  const previewImageSrc = resolveMediaUrlForServer(category.backgroundImageUrl);

  const breadcrumbs = isRoot
    ? [
        { label: 'Главная', href: '/', current: false as const },
        { label: 'Каталог', href: '/catalog', current: false as const },
        { label: category.name, href: '', current: true as const },
      ]
    : [
        { label: 'Главная', href: '/', current: false as const },
        { label: 'Каталог', href: '/catalog', current: false as const },
        {
          label: category.parent!.name,
          href: `/catalog/${category.parent!.slug}`,
          current: false as const,
        },
        { label: category.name, href: '', current: true as const },
      ];

  return (
    <CategoryCatalogContent
      categoryTitle={category.name}
      parentCategoryName={isRoot ? null : category.parent!.name}
      breadcrumbs={breadcrumbs}
      categoryId={category.id}
      catalogHits={search.hits}
      catalogTotal={search.total}
      previewImageSrc={previewImageSrc}
      belowPreview={
        catalogRoot ? (
          <CatalogSectionsTabs initialRoots={roots} activeRootId={catalogRoot.id} />
        ) : null
      }
    />
  );
}
