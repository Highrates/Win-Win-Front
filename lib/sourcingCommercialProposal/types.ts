export type SourcingCommercialProposalLineApi = {
  id: string;
  sourceSourcingRequestItemId: string | null;
  sortOrder: number;
  productName: string;
  description: string | null;
  imageUrls: string[];
  quantity: number;
  unit: string;
  offerUnitPrice: number;
  deliveryEta: string | null;
};

export type SourcingCommercialProposalApi = {
  id: string;
  sourcingRequestId: string;
  versionNumber: number;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  publishedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  lines: SourcingCommercialProposalLineApi[];
};

export type SourcingCommercialProposalSummaryApi = {
  draft: null | { id: string; lineCount: number; updatedAt: string };
  published: Array<{
    id: string;
    versionNumber: number;
    publishedAt: string | null;
    lineCount: number;
  }>;
};

export type SourcingCommercialProposalLineDraft = Omit<SourcingCommercialProposalLineApi, 'id'> & {
  id?: string;
};
