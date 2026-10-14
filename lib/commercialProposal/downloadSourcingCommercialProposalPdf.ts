import { adaptSourcingKpForPdf } from '@/lib/commercialProposal/adaptSourcingKpForPdf';
import { downloadCommercialProposalPdf } from '@/lib/commercialProposal/exportCommercialProposalPdf';
import type { SourcingCommercialProposalApi } from '@/lib/sourcingCommercialProposal/types';

export async function downloadSourcingCommercialProposalPdf(input: {
  requestId: string;
  proposal: SourcingCommercialProposalApi;
}): Promise<void> {
  await downloadCommercialProposalPdf({
    orderId: input.requestId,
    proposal: adaptSourcingKpForPdf(input.proposal),
    entityKind: 'sourcing',
  });
}
