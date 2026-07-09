'use client';

import { createContext, useContext } from 'react';
import type { useProductLikesBulk } from '@/hooks/useProductLikesBulk';

type SharedBulk = ReturnType<typeof useProductLikesBulk>;

const ProductLikesBulkContext = createContext<SharedBulk | null>(null);

export function ProductLikesBulkProvider({
  bulk,
  children,
}: {
  bulk: SharedBulk;
  children: React.ReactNode;
}) {
  return <ProductLikesBulkContext.Provider value={bulk}>{children}</ProductLikesBulkContext.Provider>;
}

export function useSharedProductLikesBulk(): SharedBulk | null {
  return useContext(ProductLikesBulkContext);
}
