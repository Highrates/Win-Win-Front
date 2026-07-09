'use client';

import { useLayoutEffect, useMemo } from 'react';
import { ProductLikesBulkProvider } from '@/components/ProductGridWithLikes/ProductLikesBulkContext';
import gridStyles from '@/components/ProductGridWithLikes/ProductGridWithLikes.module.css';
import { useProductLikesBulk } from '@/hooks/useProductLikesBulk';
import { recommendationItemsToProductGridItems } from '@/lib/productGridItem';
import {
  primeProductGridLikesFromItems,
  productGridItemsHaveSsrLikes,
} from '@/lib/productGridLikesSsr';
import type { RecommendationsStaticItem } from './Recommendations/recommendationsStaticItem';

type Props = {
  items: RecommendationsStaticItem[];
  children: React.ReactNode;
};

/** Один bulk-запрос лайков на все product-секции главной. */
export function HomeProductLikesScope({ items, children }: Props) {
  const gridItems = useMemo(() => recommendationItemsToProductGridItems(items), [items]);
  const ssrLikes = useMemo(() => productGridItemsHaveSsrLikes(gridItems), [gridItems]);

  useLayoutEffect(() => {
    primeProductGridLikesFromItems(gridItems);
  }, [gridItems]);

  const productIds = useMemo(
    () => gridItems.map((i) => i.productId).filter(Boolean),
    [gridItems],
  );
  const bulk = useProductLikesBulk(productIds, { skip: ssrLikes || productIds.length === 0 });
  const shouldShareBulk = !ssrLikes && productIds.length > 0;
  const showBulkStatus = shouldShareBulk && bulk.auth === true;

  if (!shouldShareBulk) {
    return <>{children}</>;
  }

  return (
    <ProductLikesBulkProvider bulk={bulk}>
      {children}
      {showBulkStatus && bulk.status === 'error' ? (
        <div className={gridStyles.likesBulkRetryWrap} role="status">
          <button type="button" className={gridStyles.likesBulkRetryBtn} onClick={bulk.retry}>
            Повторить загрузку лайков
          </button>
        </div>
      ) : null}
    </ProductLikesBulkProvider>
  );
}
