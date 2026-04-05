/**
 * Оставляет первое вхождение каждого `id` (защита от дублей при склейке списков:
 * один товар с основной и доп. категорией в одной выдаче).
 */
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}
