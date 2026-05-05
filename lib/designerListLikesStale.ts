/** Флаг после лайка на profile/slug дизайнера: списку нужен повторный bulk. Считывается на /designers. */
export const DESIGNERS_LIST_LIKES_INVALIDATION_KEY = 'winwin:invalidate-designers-list-likes';

export function markDesignerListLikeStateStale(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(DESIGNERS_LIST_LIKES_INVALIDATION_KEY, '1');
  } catch {
    /* private mode и т.п. */
  }
}

export function consumeDesignerListLikeStateStale(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const v = sessionStorage.getItem(DESIGNERS_LIST_LIKES_INVALIDATION_KEY);
    if (!v) return false;
    sessionStorage.removeItem(DESIGNERS_LIST_LIKES_INVALIDATION_KEY);
    return true;
  } catch {
    return false;
  }
}
