import type { ProductGridItem } from '@/lib/productGridItem';
import { productGridItemsHaveSsrLikes } from '@/lib/productGridItem';
import { setLikedMeBatchCache } from '@/lib/likesMeBatch';

export { productGridItemsHaveSsrLikes };

/** Прогрев micro-batch кэша до mount карточек. */
export function primeProductGridLikesFromItems(items: ProductGridItem[]): void {
  if (!productGridItemsHaveSsrLikes(items)) return;
  for (const item of items) {
    if (!item.productId) continue;
    setLikedMeBatchCache('product', item.productId, item.likedByMe === true);
  }
}
