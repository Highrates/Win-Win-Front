/**
 * Server-only: публичная карточка дизайнера (Nest `GET /designers/:slug`).
 * `cache()` — один запрос на metadata + page в одном RSC-рендере.
 */
import { cache } from 'react';
import {
  DESIGNER_CASES_PAGE_SIZE,
  DESIGNER_PUBLIC_REVALIDATE_SECONDS,
  parsePublicDesignerPayload,
  type PublicDesignerPayload,
} from '@/lib/designersPublicShared';
import { getServerApiBase } from '@/lib/serverApiBase';

export type { PublicDesignerPayload };
export {
  DESIGNER_CASES_PAGE_SIZE,
  DESIGNER_PUBLIC_REVALIDATE_SECONDS,
  PUBLIC_CASES_PAGE_SIZE,
  designerPageMetadata,
  designerProjectsFromPayload,
} from '@/lib/designersPublicShared';

export type FetchDesignerResult =
  | { status: 'ok'; designer: PublicDesignerPayload }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

async function fetchDesignerUncached(
  slug: string,
  opts?: { page?: number; limit?: number },
): Promise<FetchDesignerResult> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? DESIGNER_CASES_PAGE_SIZE;
  const base = getServerApiBase();
  const qs = new URLSearchParams({
    page: String(Math.max(1, page)),
    limit: String(Math.min(60, Math.max(1, limit))),
  });
  try {
    const res = await fetch(`${base}/designers/${encodeURIComponent(slug)}?${qs}`, {
      next: { revalidate: DESIGNER_PUBLIC_REVALIDATE_SECONDS },
    });
    if (res.status === 404) return { status: 'not_found' };
    if (!res.ok) return { status: 'error', message: `Designer API ${res.status}` };
    const raw = (await res.json()) as Record<string, unknown>;
    return { status: 'ok', designer: parsePublicDesignerPayload(raw, slug) };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Designer API unreachable';
    return { status: 'error', message };
  }
}

/** Дедуп metadata + page в одном запросе. */
export const loadPublicDesignerBySlug = cache(async (slug: string): Promise<FetchDesignerResult> => {
  return fetchDesignerUncached(slug, { page: 1, limit: DESIGNER_CASES_PAGE_SIZE });
});
