import type { CommercialProposalApi, CommercialProposalLineApi } from '@/lib/commercialProposal/types';
import type { SourcingCommercialProposalApi } from '@/lib/sourcingCommercialProposal/types';

/** Привести КП заявки на подбор к форме заказа для общего PDF-экспортёра. */
export function adaptSourcingKpForPdf(proposal: SourcingCommercialProposalApi): CommercialProposalApi {
  const lines: CommercialProposalLineApi[] = (proposal.lines ?? []).map((line, index) => ({
    id: line.id,
    sourceOrderItemId: line.sourceSourcingRequestItemId,
    sortOrder: line.sortOrder ?? index,
    productId: '',
    productVariantId: null,
    quantity: line.quantity,
    unit: line.unit || 'шт',
    snapshot: {
      productName: line.productName,
      imageUrls: line.imageUrls ?? [],
      ...(line.description?.trim() ? { description: line.description.trim() } : {}),
    },
    offerUnitPrice: line.offerUnitPrice,
    discountPercent: null,
    deliveryEta: line.deliveryEta,
    lineNote: line.description,
  }));

  return {
    id: proposal.id,
    orderId: proposal.sourcingRequestId,
    versionNumber: proposal.versionNumber,
    status: proposal.status,
    publishedAt: proposal.publishedAt,
    publishedByUserId: proposal.publishedByUserId,
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
    lines,
  };
}
