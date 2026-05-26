'use client';

import { useLikesBulk, type LikesBulkStatus } from '@/hooks/useLikesBulk';

export type { LikesBulkStatus as ProductLikesBulkStatus };

export function useProductLikesBulk(productIds: string[], options?: { skip?: boolean }) {
  const bulk = useLikesBulk('product', productIds, options);
  return {
    auth: bulk.auth,
    status: bulk.status,
    likedById: bulk.likedById,
    setProductLiked: bulk.setLiked,
    retry: bulk.retry,
  };
}
