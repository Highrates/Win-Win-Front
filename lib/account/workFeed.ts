import type { UserOrderListItemApi } from '@/lib/userOrders/types';
import type { UserSourcingRequestListItemApi } from '@/lib/userSourcingRequests/types';

export type WorkFeedItem =
  | { kind: 'order'; order: UserOrderListItemApi }
  | { kind: 'sourcing'; sourcing: UserSourcingRequestListItemApi };

function parseTs(iso: string | null | undefined): number {
  if (!iso?.trim()) return 0;
  const ts = Date.parse(iso);
  return Number.isFinite(ts) ? ts : 0;
}

/**
 * Активность для сортировки ленты: max(updatedAt, kpPublishedAt, createdAt).
 * Так новые сообщения/правки поднимают карточку, не только публикация КП.
 */
export function workFeedTimestamp(entry: WorkFeedItem): number {
  if (entry.kind === 'order') {
    const o = entry.order;
    return Math.max(
      parseTs(o.updatedAt),
      parseTs(o.commercialProposalPublishedAt),
      parseTs(o.createdAt),
    );
  }
  const s = entry.sourcing;
  return Math.max(
    parseTs(s.updatedAt),
    parseTs(s.commercialProposalPublishedAt),
    parseTs(s.createdAt),
  );
}

/** ISO для отладки / тестов: дата, соответствующая workFeedTimestamp. */
export function workFeedActivityIso(entry: WorkFeedItem): string {
  if (entry.kind === 'order') {
    const o = entry.order;
    const candidates = [o.updatedAt, o.commercialProposalPublishedAt, o.createdAt].filter(
      (x): x is string => Boolean(x?.trim()),
    );
    let best = o.createdAt;
    let bestTs = parseTs(best);
    for (const c of candidates) {
      const t = parseTs(c);
      if (t >= bestTs) {
        best = c;
        bestTs = t;
      }
    }
    return best;
  }
  const s = entry.sourcing;
  const candidates = [s.updatedAt, s.commercialProposalPublishedAt, s.createdAt].filter(
    (x): x is string => Boolean(x?.trim()),
  );
  let best = s.createdAt;
  let bestTs = parseTs(best);
  for (const c of candidates) {
    const t = parseTs(c);
    if (t >= bestTs) {
      best = c;
      bestTs = t;
    }
  }
  return best;
}

export function buildWorkFeed(
  orders: UserOrderListItemApi[],
  sourcing: UserSourcingRequestListItemApi[],
): WorkFeedItem[] {
  const items: WorkFeedItem[] = [
    ...orders.map((order) => ({ kind: 'order' as const, order })),
    ...sourcing.map((request) => ({ kind: 'sourcing' as const, sourcing: request })),
  ];
  return items.sort((a, b) => workFeedTimestamp(b) - workFeedTimestamp(a));
}

export function mergeUniqueById<T extends { id: string }>(prev: T[], next: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of prev) map.set(row.id, row);
  for (const row of next) map.set(row.id, row);
  return Array.from(map.values());
}
