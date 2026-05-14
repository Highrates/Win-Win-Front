import type { DesignerProjectLineApi } from '@/lib/designerProjects/apiTypes';
import type { AddOrderPreparationLineBody } from './types';

/** Перенос строки проекта в теле POST `/orders/preparation/lines`. */
export function designerProjectLineToAddOrderBody(line: DesignerProjectLineApi): AddOrderPreparationLineBody {
  const snap =
    line.snapshot && typeof line.snapshot === 'object' && !Array.isArray(line.snapshot)
      ? { ...(line.snapshot as Record<string, unknown>) }
      : ({} as Record<string, unknown>);
  const nameFromSnap = typeof snap.productName === 'string' ? snap.productName.trim() : '';
  snap.productName = nameFromSnap || line.productSlug || 'Товар';
  snap.productSlug = line.productSlug;
  if (snap.imageUrl == null && line.resolvedImageUrl) {
    snap.imageUrl = line.resolvedImageUrl;
  }
  return {
    productId: line.productId,
    productVariantId: line.productVariantId,
    quantity: line.quantity,
    unit: line.unit?.trim() || 'шт',
    snapshot: snap,
  };
}
