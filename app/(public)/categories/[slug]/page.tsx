import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchCategoryBySlug, fetchProductsSearch } from '@/lib/catalogPublic';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import { CategoryCatalogContent } from '../CategoryCatalogContent';
import { CATEGORY_PER_PAGE } from '../categoryCatalogData';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  if (!category) {
    return { title: 'Категория — Win-Win' };
  }
  const title =
    category.seoTitle?.trim() || `${category.name} — Win-Win`;
  const description =
    category.seoDescription?.trim() || `Категория: ${category.name}`;
  return { title, description };
}

export default async function CategorySlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const rawPage = Math.max(1, parseInt(String(pageParam || '1'), 10) || 1);

  const category = await fetchCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  let search = await fetchProductsSearch({
    categoryId: category.id,
    page: rawPage,
    limit: CATEGORY_PER_PAGE,
  });
  const totalPages = Math.max(1, Math.ceil(search.total / CATEGORY_PER_PAGE));
  const pageEff = Math.min(rawPage, totalPages);
  if (pageEff !== rawPage) {
    search = await fetchProductsSearch({
      categoryId: category.id,
      page: pageEff,
      limit: CATEGORY_PER_PAGE,
    });
  }

  const isRoot = category.parentId == null;
  const previewImageSrc = resolveMediaUrlForServer(category.backgroundImageUrl);

  const subcategoryItems = (category.children ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ru'))
    .map((ch) => ({
      slug: ch.slug,
      name: ch.name,
      imageSrc: resolveMediaUrlForServer(ch.backgroundImageUrl),
    }));

  const breadcrumbs = isRoot
    ? [
        { label: 'Главная', href: '/', current: false as const },
        { label: category.name, href: '', current: true as const },
      ]
    : [
        { label: 'Главная', href: '/', current: false as const },
        {
          label: category.parent!.name,
          href: `/categories/${category.parent!.slug}`,
          current: false as const,
        },
        { label: category.name, href: '', current: true as const },
      ];

  return (
    <CategoryCatalogContent
      categoryTitle={category.name}
      parentCategoryName={isRoot ? null : category.parent!.name}
      breadcrumbs={breadcrumbs}
      paginationBasePath={`/categories/${slug}`}
      catalogPage={pageEff}
      catalogHits={search.hits}
      catalogTotal={search.total}
      showSubcategoryCardsStrip={isRoot && subcategoryItems.length > 0}
      previewImageSrc={previewImageSrc}
      subcategoryItems={isRoot && subcategoryItems.length > 0 ? subcategoryItems : undefined}
    />
  );
}
