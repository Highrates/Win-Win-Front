/** После лайка на PDP / в каталоге: при возврате «Назад» сетке нужен повторный bulk. */
export const PRODUCT_LIST_LIKES_INVALIDATION_KEY = 'winwin:invalidate-product-list-likes';

export function markProductListLikesStale(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PRODUCT_LIST_LIKES_INVALIDATION_KEY, '1');
  } catch {
    /* private mode */
  }
}

export function consumeProductListLikesStale(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const v = sessionStorage.getItem(PRODUCT_LIST_LIKES_INVALIDATION_KEY);
    if (!v) return false;
    sessionStorage.removeItem(PRODUCT_LIST_LIKES_INVALIDATION_KEY);
    return true;
  } catch {
    return false;
  }
}
