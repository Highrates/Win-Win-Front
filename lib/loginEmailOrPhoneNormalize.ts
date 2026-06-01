/**
 * Нормализация логина: email → lower case; телефон → только цифры (как в БД после регистрации).
 */
export function normalizeLoginEmailOrPhone(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) return trimmed.toLowerCase();
  return (trimmed.startsWith('+') ? trimmed.slice(1) : trimmed).replace(/\D/g, '');
}
