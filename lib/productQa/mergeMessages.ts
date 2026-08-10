import type { ProductQaMessage } from '@/lib/productQa/types';

/** Merge incoming messages into existing list for one topic (dedupe by id, sort asc). */
export function mergeProductQaMessages(
  prev: ProductQaMessage[],
  incoming: ProductQaMessage[],
  topicSlug: string,
): ProductQaMessage[] {
  const byId = new Map<string, ProductQaMessage>();
  for (const m of prev) byId.set(m.id, m);
  for (const m of incoming) {
    if (m.topicSlug === topicSlug) byId.set(m.id, m);
  }
  return Array.from(byId.values())
    .filter((m) => m.topicSlug === topicSlug)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Prepend older page without duplicates. */
export function prependProductQaMessages(
  prev: ProductQaMessage[],
  older: ProductQaMessage[],
): ProductQaMessage[] {
  const seen = new Set(prev.map((m) => m.id));
  return [...older.filter((m) => !seen.has(m.id)), ...prev];
}
