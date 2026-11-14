import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_NAME } from '@/lib/brand';
import { fetchChinaTourBySlug } from '@/lib/chinaTours/publicApi';
import { tourDetailMetadata } from '@/lib/chinaTours/mapChinaToursMetadata';
import { getServerRequestOrigin } from '@/lib/serverRequestOrigin';
import { getUserAccessTokenFromCookies } from '@/lib/userSessionServer';
import { TourDetailClient } from './TourDetailClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [tour, siteOrigin] = await Promise.all([
    fetchChinaTourBySlug(slug),
    getServerRequestOrigin(),
  ]);
  if (!tour) return { title: `Тур — ${SITE_NAME}` };
  return tourDetailMetadata(tour, { siteOrigin });
}

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tour = await fetchChinaTourBySlug(slug);
  if (!tour) notFound();
  const isAuthenticated = Boolean(getUserAccessTokenFromCookies());
  return <TourDetailClient tour={tour} isAuthenticated={isAuthenticated} />;
}
