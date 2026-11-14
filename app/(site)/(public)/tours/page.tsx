import type { Metadata } from 'next';
import { fetchChinaToursLanding, fetchChinaToursList } from '@/lib/chinaTours/publicApi';
import { toursListMetadata } from '@/lib/chinaTours/mapChinaToursMetadata';
import { getServerRequestOrigin } from '@/lib/serverRequestOrigin';
import { ToursListingClient } from './ToursListingClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const [landing, siteOrigin] = await Promise.all([
    fetchChinaToursLanding(),
    getServerRequestOrigin(),
  ]);
  return toursListMetadata({ landing, siteOrigin });
}

export default async function ToursPage() {
  const [landing, tours] = await Promise.all([fetchChinaToursLanding(), fetchChinaToursList()]);
  return <ToursListingClient landing={landing} tours={tours ?? []} />;
}
