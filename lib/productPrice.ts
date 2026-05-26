export function productPriceToNumber(price: unknown): number {
  if (typeof price === 'number' && !Number.isNaN(price)) return price;
  if (typeof price === 'string') {
    const n = parseFloat(price);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}
