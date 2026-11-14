import type { MetadataRoute } from 'next';
import { fetchChinaToursList } from '@/lib/chinaTours/publicApi';
import { getPublicSiteOriginFromEnv, getServerRequestOrigin } from '@/lib/serverRequestOrigin';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin =
    getPublicSiteOriginFromEnv() ?? (await getServerRequestOrigin()).replace(/\/+$/, '');

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${origin}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${origin}/catalog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${origin}/tours`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${origin}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${origin}/brands`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${origin}/designers`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${origin}/projects`, changeFrequency: 'weekly', priority: 0.6 },
  ];

  let tourEntries: MetadataRoute.Sitemap = [];
  try {
    const tours = (await fetchChinaToursList()) ?? [];
    tourEntries = tours.map((t) => ({
      url: `${origin}/tours/${encodeURIComponent(t.slug)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    /* Nest недоступен при сборке — отдаём static */
  }

  return [...staticEntries, ...tourEntries];
}
