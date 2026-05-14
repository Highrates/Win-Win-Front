export type CommercialProposalLineApi = {
  id: string;
  sourceOrderItemId: string | null;
  sortOrder: number;
  productId: string;
  productVariantId: string | null;
  quantity: number;
  unit: string;
  snapshot: Record<string, unknown> | null;
  offerUnitPrice: number;
  discountPercent: number | null;
  deliveryEta: string | null;
  lineNote: string | null;
};

export type CommercialProposalApi = {
  id: string;
  orderId: string;
  versionNumber: number;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  publishedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  lines: CommercialProposalLineApi[];
};

export type CommercialProposalSummaryApi = {
  draft: { id: string; lineCount: number; updatedAt: string } | null;
  published: { id: string; versionNumber: number; publishedAt: string | null; lineCount: number }[];
};
