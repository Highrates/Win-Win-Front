import 'server-only';

import { cookies } from 'next/headers';
import { ADMIN_LOCALE_COOKIE_NAME, type AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

/** Локаль админки из cookie (для Server Components). Клиент выставляет cookie при смене языка. */
export function getAdminLocale(): AdminLocale {
  const v = cookies().get(ADMIN_LOCALE_COOKIE_NAME)?.value;
  return v === 'zh' ? 'zh' : 'ru';
}
