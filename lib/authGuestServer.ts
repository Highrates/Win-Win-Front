import { redirect } from 'next/navigation';
import { sanitizeCallbackUrl } from '@/lib/authRedirect';
import { getServerUserSession } from '@/lib/userSessionServer';

/** RSC: уже авторизован — уходим с login/register (проверка JWT, не только cookie). */
export async function redirectIfUserAuthenticated(callbackUrl?: string | null): Promise<void> {
  const session = await getServerUserSession();
  if (session.authenticated) {
    redirect(sanitizeCallbackUrl(callbackUrl));
  }
}
