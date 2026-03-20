import type { Metadata } from 'next';
import { CategoryCatalogContent } from '../CategoryCatalogContent';

/** Маппинг slug → название (можно расширить из API) */
const SLUG_TO_NAME: Record<string, string> = {
  divany: 'Диваны',
  kresla: 'Кресла',
  'kofejnye-stoliki': 'Кофейные столики',
  shkafy: 'Консольные столики',
  'knizhnye-shkafy': 'Книжные шкафы',
  'vinnye-shkafy': 'Винные шкафы',
  stoly: 'Столы',
  pufy: 'Пуфы',
};

const PARENT_CATEGORY_NAME = 'Гостиная';
const PARENT_CATEGORY_PATH = '/categories';

function getCategoryName(slug: string): string {
  return SLUG_TO_NAME[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = getCategoryName(slug);
  return {
    title: `${name} — Win-Win`,
    description: `Категория: ${name}`,
  };
}

export default async function CategorySlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(String(pageParam || '1'), 10) || 1);
  const categoryName = getCategoryName(slug);

  return (
    <CategoryCatalogContent
      categoryTitle={categoryName}
      parentCategoryName={PARENT_CATEGORY_NAME}
      breadcrumbs={[
        { label: 'Главная', href: '/', current: false },
        { label: PARENT_CATEGORY_NAME, href: PARENT_CATEGORY_PATH, current: false },
        { label: categoryName, href: '', current: true },
      ]}
      paginationBasePath={`/categories/${slug}`}
      currentPage={currentPage}
    />
  );
}
