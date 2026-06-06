/** Списки: мгновенный возврат при навигации назад, фоновое обновление после staleTime. */
export const ADMIN_QUERY_LIST_STALE_MS = 30_000;

/** Детальные карточки: всегда refetch при mount, но gcTime держит кэш при back. */
export const ADMIN_QUERY_DETAIL_STALE_MS = 0;

export const ADMIN_QUERY_GC_MS = 5 * 60 * 1000;

export type AdminQueryKind = 'list' | 'detail';

export function adminQueryDefaults(kind: AdminQueryKind = 'list') {
  return {
    staleTime: kind === 'list' ? ADMIN_QUERY_LIST_STALE_MS : ADMIN_QUERY_DETAIL_STALE_MS,
    gcTime: ADMIN_QUERY_GC_MS,
  } as const;
}
