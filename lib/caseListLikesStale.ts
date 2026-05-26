/** После лайка кейса: при возврате на /projects или профиль дизайнера — повторный bulk. */
export const CASE_LIST_LIKES_INVALIDATION_KEY = 'winwin:invalidate-case-list-likes';

export function markCaseListLikesStale(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(CASE_LIST_LIKES_INVALIDATION_KEY, '1');
  } catch {
    /* private mode */
  }
}

export function consumeCaseListLikesStale(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const v = sessionStorage.getItem(CASE_LIST_LIKES_INVALIDATION_KEY);
    if (!v) return false;
    sessionStorage.removeItem(CASE_LIST_LIKES_INVALIDATION_KEY);
    return true;
  } catch {
    return false;
  }
}
