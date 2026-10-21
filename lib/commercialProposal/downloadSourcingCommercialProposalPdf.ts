import { adaptSourcingKpForPdf } from '@/lib/commercialProposal/adaptSourcingKpForPdf';
import {
  downloadCommercialProposalPdf,
  type ExportKpPdfInput,
  type ExportKpPdfResult,
} from '@/lib/commercialProposal/exportCommercialProposalPdf';
import type { SourcingCommercialProposalApi } from '@/lib/sourcingCommercialProposal/types';

export async function downloadSourcingCommercialProposalPdf(input: {
  requestId: string;
  proposal: SourcingCommercialProposalApi;
  onProgress?: ExportKpPdfInput['onProgress'];
  signal?: AbortSignal;
}): Promise<ExportKpPdfResult> {
  return downloadCommercialProposalPdf({
    orderId: input.requestId,
    proposal: adaptSourcingKpForPdf(input.proposal),
    entityKind: 'sourcing',
    onProgress: input.onProgress,
    signal: input.signal,
  });
}
