import { getServerApiBase } from './serverApiBase';
import { jsonFromResponse } from './jsonFromResponse';

export type PublicSiteSettingsPayload = {
  heroImageUrls: string[];
  designerServiceOptions: string[];
};

export async function fetchPublicSiteSettings(): Promise<PublicSiteSettingsPayload> {
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/settings/site`, { next: { revalidate: 60 } });
    if (!res.ok) return { heroImageUrls: [], designerServiceOptions: [] };
    return await jsonFromResponse<PublicSiteSettingsPayload>(res, {
      heroImageUrls: [],
      designerServiceOptions: [],
    });
  } catch {
    return { heroImageUrls: [], designerServiceOptions: [] };
  }
}

