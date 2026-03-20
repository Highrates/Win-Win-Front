import type { Metadata } from 'next';
import { CategoryCatalogContent } from './CategoryCatalogContent';

const LIVING_ROOM_NAME = 'Гостиная';

export const metadata: Metadata = {
  title: `${LIVING_ROOM_NAME} — Win-Win`,
  description: `Каталог: ${LIVING_ROOM_NAME}`,
};

type Props = {
  searchParams: Promise<{ page?: string }>;
};

/** Родительская категория «Гостиная» — тот же макет, что у подкатегорий (`/categories/[slug]`). */
export default async function CategoriesPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(String(pageParam || '1'), 10) || 1);

  return (
    <CategoryCatalogContent
      categoryTitle={LIVING_ROOM_NAME}
      parentCategoryName={null}
      breadcrumbs={[
        { label: 'Главная', href: '/', current: false },
        { label: LIVING_ROOM_NAME, href: '', current: true },
      ]}
      paginationBasePath="/categories"
      currentPage={currentPage}
      showSubcategoryCardsStrip
    />
  );
}
