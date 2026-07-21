/** Парсит `?priceFrom=` / `?priceTo=` → неотрицательное число или undefined. */
export function parseCatalogPriceBound(raw?: string | null): number | undefined {
  if (raw == null || String(raw).trim() === '') return undefined;
  const n = Number(String(raw).trim().replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

export function normalizeCatalogPriceRange(
  from?: number,
  to?: number,
): { priceFrom?: number; priceTo?: number } {
  let priceFrom = from;
  let priceTo = to;
  if (priceFrom != null && priceTo != null && priceFrom > priceTo) {
    const tmp = priceFrom;
    priceFrom = priceTo;
    priceTo = tmp;
  }
  return { priceFrom, priceTo };
}

/** Подпись чипа: «от 50 000 ₽» / «до 200 000 ₽». */
export function formatCatalogPriceChip(bound: 'from' | 'to', value: number): string {
  const digits = Math.floor(value).toLocaleString('ru-RU');
  return bound === 'from' ? `от ${digits} ₽` : `до ${digits} ₽`;
}
