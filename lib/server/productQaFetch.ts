import 'server-only';

import { getServerApiBase } from '@/lib/serverApiBase';
import { publicFetchInitWithOptionalUserAuth } from '@/lib/server/publicFetchInit';
import type { ProductQaMeta } from '@/lib/productQa/types';

/** SSR: лёгкий счётчик вопросов для PDP. */
export async function fetchProductQaMetaBySlug(slug: string): Promise<ProductQaMeta> {
  const base = getServerApiBase();
  const url = `${base}/catalog/products/${encodeURIComponent(slug)}/qa/meta`;
  try {
    const res = await fetch(url, await publicFetchInitWithOptionalUserAuth());
    if (!res.ok) return { threadId: null, messageCount: 0, topics: [], preModerationEnabled: false };
    return (await res.json()) as ProductQaMeta;
  } catch {
    return { threadId: null, messageCount: 0, topics: [], preModerationEnabled: false };
  }
}
