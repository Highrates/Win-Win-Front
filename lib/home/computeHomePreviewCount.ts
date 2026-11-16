type HomeGridSize = 'FOUR' | 'EIGHT' | 'UNLIMITED';
type HomeOrderMode = 'FIXED' | 'RANDOM';

function homeGridLimit(size: HomeGridSize): number | undefined {
  if (size === 'FOUR') return 4;
  if (size === 'EIGHT') return 8;
  return undefined;
}

function filterPrices(
  prices: Array<number | null>,
  min: number | null,
  max: number | null,
): Array<number | null> {
  if (min == null && max == null) return prices;
  return prices.filter((p) => {
    if (p == null || !Number.isFinite(p) || p <= 0) return false;
    if (min != null && p < min) return false;
    if (max != null && p > max) return false;
    return true;
  });
}

/** Локальный preview рельса главной (base variant price, без tier). */
export function computeHomePreviewCount(input: {
  showOnHome: boolean;
  isActive: boolean;
  homeGridSize: HomeGridSize;
  homeOrderMode: HomeOrderMode;
  homePriceMin: number | null;
  homePriceMax: number | null;
  /** Цены активных товаров в текущем порядке формы. */
  prices: Array<number | null>;
}): number {
  if (!input.showOnHome || !input.isActive) return 0;
  let prices = [...input.prices];
  if (input.homeOrderMode === 'RANDOM') {
    prices = filterPrices(prices, input.homePriceMin, input.homePriceMax);
  }
  const limit = homeGridLimit(input.homeGridSize);
  return limit != null ? Math.min(limit, prices.length) : prices.length;
}

export function parseRubPriceInput(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

export function parseAdminListPrice(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const n = Number(String(raw).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
