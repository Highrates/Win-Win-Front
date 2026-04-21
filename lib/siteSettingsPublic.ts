import { getServerApiBase } from './serverApiBase';
import { jsonFromResponse } from './jsonFromResponse';

export type PublicSiteSettingsPayload = {
  heroImageUrls: string[];
};

export async function fetchPublicSiteSettings(): Promise<PublicSiteSettingsPayload> {
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/settings/site`, { next: { revalidate: 60 } });
    if (!res.ok) return { heroImageUrls: [] };
    return await jsonFromResponse<PublicSiteSettingsPayload>(res, { heroImageUrls: [] });
  } catch {
    return { heroImageUrls: [] };
  }
}

