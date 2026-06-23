'use client';

import { useCallback, useLayoutEffect, useMemo } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { useProductLikesBulk } from '@/hooks/useProductLikesBulk';
import { buildLikesBulkUiProp } from '@/lib/buildLikesBulkUiProp';
import type { ProductGridItem } from '@/lib/productGridItem';
import {
  primeProductGridLikesFromItems,
  productGridItemsHaveSsrLikes,
} from '@/lib/productGridLikesSsr';
import { markProductListLikesStale } from '@/lib/productListLikesStale';
import gridStyles from './ProductGridWithLikes.module.css';

type Props = {
  items: ProductGridItem[];
  gridClassName: string;
  galleryAdvanceSignal?: number;
};

export function ProductGridWithLikes({ items, gridClassName, galleryAdvanceSignal }: Props) {
  const ssrLikes = useMemo(() => productGridItemsHaveSsrLikes(items), [items]);

  useLayoutEffect(() => {
    primeProductGridLikesFromItems(items);
  }, [items]);

  const productIds = useMemo(
    () => items.map((i) => i.productId).filter(Boolean),
    [items],
  );
  const bulk = useProductLikesBulk(productIds, { skip: ssrLikes });
  const usePageBulk = !ssrLikes && bulk.auth === true && productIds.length > 0;

  const onProductLikedChange = useCallback(
    (id: string, liked: boolean) => {
      bulk.setProductLiked(id, liked);
      markProductListLikesStale();
    },
    [bulk.setProductLiked],
  );

  const productBulkUi = useCallback(
    (productId: string) => buildLikesBulkUiProp(bulk, productId, onProductLikedChange),
    [bulk, onProductLikedChange],
  );

  if (!items.length) return null;

  return (
    <>
      {usePageBulk && bulk.status === 'loading' ? (
        <p className={gridStyles.likesBulkStatus} role="status" aria-live="polite">
          Загружаем лайки…
        </p>
      ) : null}
      <div className={gridClassName}>
        {items.map((item) => {
          const productLikesBulk = usePageBulk ? productBulkUi(item.productId) : undefined;
          const heartActive =
            ssrLikes && typeof item.likedByMe === 'boolean' ? item.likedByMe : undefined;

          return (
            <ProductCard
              key={item.key}
              slug={item.slug}
              name={item.name}
              productId={item.productId}
              variantId={item.variantId}
              price={item.price}
              priceMin={item.priceMin}
              priceMax={item.priceMax}
              imageUrl={item.imageUrl}
              imageUrls={item.imageUrls}
              collections={item.collections ?? 0}
              likes={item.likes ?? 0}
              heartActive={heartActive}
              productLikesBulk={productLikesBulk}
              galleryAdvanceSignal={galleryAdvanceSignal}
            />
          );
        })}
      </div>
      {usePageBulk && bulk.status === 'error' ? (
        <div className={gridStyles.likesBulkRetryWrap} role="status">
          <button type="button" className={gridStyles.likesBulkRetryBtn} onClick={bulk.retry}>
            Повторить загрузку лайков
          </button>
        </div>
      ) : null}
    </>
  );
}
