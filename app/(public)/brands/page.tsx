import { Suspense } from 'react';
import type { Metadata } from 'next';
import { fetchHomeCatalogRoots } from '@/lib/homeCatalog';
import { fetchPublicBrands } from '@/lib/brandsPublic';
import { BrandsPageClient } from './BrandsPageClient';

export const metadata: Metadata = {
  title: 'Бренды — Win-Win',
  description: 'Каталог брендов Win-Win',
};

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function BrandsPage({ searchParams }: Props) {
  const { category: categoryParam } = await searchParams;
  const catalogRoots = await fetchHomeCatalogRoots();
  const initialCategoryId =
    categoryParam?.trim() && catalogRoots.some((r) => r.id === categoryParam.trim())
      ? categoryParam.trim()
      : null;
  const initialBrands = await fetchPublicBrands({ categoryId: initialCategoryId });

  return (
    <Suspense fallback={null}>
      <BrandsPageClient
        initialBrands={initialBrands}
        catalogRoots={catalogRoots}
        initialCategoryId={initialCategoryId}
      />
    </Suspense>
  );
}
