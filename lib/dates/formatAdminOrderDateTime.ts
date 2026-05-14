import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

/**
 * Разбор даты из API (Prisma/Nest). Если в строке нет зоны (`Z` / `±HH:mm`),
 * но есть вид `YYYY-MM-DDTHH:mm:ss(.fff)?`, считаем момент в **UTC** (как отдаёт Prisma при `timestamp` без `Z` в JSON).
 */
export function parseBackendDateInstant(raw: string): Date {
  const s = raw.trim();
  if (!s) return new Date(NaN);
  if (/[zZ]$|[+\-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?$/.test(s)) return new Date(`${s}Z`);
  return new Date(s);
}

function timeZoneForAdminLocale(locale: AdminLocale): string {
  return locale === 'zh' ? 'Asia/Shanghai' : 'Europe/Moscow';
}

function dateLocaleForAdmin(locale: AdminLocale): string {
  return locale === 'zh' ? 'zh-CN' : 'ru-RU';
}

/** Дата и время заказа в админке: календарь локали + фиксированная TZ (не «часовой пояс браузера»). */
export function formatAdminOrderDateTime(raw: string, locale: AdminLocale): string {
  const d = parseBackendDateInstant(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return new Intl.DateTimeFormat(dateLocaleForAdmin(locale), {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: timeZoneForAdminLocale(locale),
  }).format(d);
}
