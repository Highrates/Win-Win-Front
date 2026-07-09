import { headers } from 'next/headers';

/** Pathname текущего admin-запроса (прокидывается из middleware). */
export function getAdminPathname(): string {
  return headers().get('x-pathname')?.trim() ?? '';
}
