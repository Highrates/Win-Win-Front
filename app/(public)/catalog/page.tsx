import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchProductsSearch } from '@/lib/server/catalogAuthFetch';
import { fetchHomeCatalogRoots } from '@/lib/homeCatalog';
import { CategoryCatalogContent } from '@/app/(public)/categories/CategoryCatalogContent';
import { CATEGORY_PER_PAGE } from '@/app/(public)/categories/categoryCatalogData';
import { CatalogIndexBody } from './CatalogIndexBody';
import { CATALOG_PREVIEW_IMAGE_SRC } from './catalogHero';

export const metadata: Metadata = {
  title: 'Каталог — Win-Win',
  description: 'Каталог мебели и предметов интерьера',
};

export default async function CatalogIndexPage() {
  const roots = await fetchHomeCatalogRoots();

  if (roots.length === 0) {
    return (
      <main className="padding-global" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <p>Каталог пока пуст.</p>
        <p style={{ marginTop: '1rem' }}>
          <Link href="/">На главную</Link>
        </p>
      </main>
    );
  }

  const firstRoot = roots[0];

  const search = await fetchProductsSearch({
    categoryId: firstRoot.id,
    page: 1,
    limit: CATEGORY_PER_PAGE,
  });

  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false as const },
    { label: 'Каталог', href: '', current: true as const },
  ];

  return (
    <CategoryCatalogContent
      categoryTitle="Каталог"
      parentCategoryName={null}
      breadcrumbs={breadcrumbs}
      categoryId={firstRoot.id}
      catalogHits={search.hits}
      catalogTotal={search.total}
      previewImageSrc={CATALOG_PREVIEW_IMAGE_SRC}
      catalogIndexBody={
        <CatalogIndexBody
          roots={roots}
          initialCategoryId={firstRoot.id}
          initialHits={search.hits}
          initialTotal={search.total}
        />
      }
    />
  );
}
