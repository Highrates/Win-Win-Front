/**
 * Короткий человекочитаемый номер заказа для UI (полный id остаётся в API и title).
 * Берём буквенно-цифровые символы: первые 4 + последние 4, нап. `CMJ0-X7KQ`.
 */
export function formatOrderDisplayId(fullId: string): string {
  const clean = fullId.replace(/[^a-z0-9]/gi, '');
  if (clean.length <= 8) return clean.toUpperCase();
  return `${clean.slice(0, 4).toUpperCase()}-${clean.slice(-4).toUpperCase()}`;
}
