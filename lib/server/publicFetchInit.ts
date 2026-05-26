import 'server-only';

import { catalogPublicFetchNext } from '@/lib/catalogCache';
import { getServerUserSession } from '@/lib/userSessionServer';

/** Публичный fetch: ISR для гостя, no-store + Bearer при валидной сессии (не только cookie). */
export async function publicFetchInitWithOptionalUserAuth(): Promise<RequestInit> {
  const session = await getServerUserSession();
  if (session.authenticated && session.accessToken) {
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${session.accessToken}`);
    return { headers, cache: 'no-store' };
  }
  return { next: catalogPublicFetchNext() };
}
