import type { Metadata } from 'next';
import { fetchPublicBrands } from '@/lib/brandsPublic';
import { BrandsPageClient } from './BrandsPageClient';

export const metadata: Metadata = {
  title: 'Бренды — Wupapa',
  description: 'Каталог брендов Wupapa',
};

export default async function BrandsPage() {
  const initialBrands = await fetchPublicBrands();
  return <BrandsPageClient initialBrands={initialBrands} />;
}
