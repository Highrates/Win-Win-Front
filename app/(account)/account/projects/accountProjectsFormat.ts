import type { DesignerProjectLineApi } from '@/lib/designerProjects/apiTypes';

export const ACCOUNT_PROJECTS_PDP_RETURN = '/account/projects';

export function formatTotalRub(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return '—';
  return `~${Math.round(n).toLocaleString('ru-RU')} ₽`;
}

export function displayLineQuantity(quantity: number, unit: string | undefined): number {
  const u = (unit || 'шт').toLowerCase();
  if (u === 'шт' || u === 'шт.') return Math.max(1, Math.round(Number(quantity)));
  return Number(quantity);
}

export function lineProductPath(line: DesignerProjectLineApi): string | null {
  const slug = line.productSlug?.trim();
  if (!slug) return null;
  return `/product/${encodeURIComponent(slug)}?returnTo=${encodeURIComponent(ACCOUNT_PROJECTS_PDP_RETURN)}`;
}
