import { adminBackendJson } from '@/lib/adminBackendFetch';
import type {
  SourcingCommercialProposalApi,
  SourcingCommercialProposalLineDraft,
  SourcingCommercialProposalSummaryApi,
} from '@/lib/sourcingCommercialProposal/types';

function kpBasePath(id: string) {
  return `sourcing-requests/admin/${encodeURIComponent(id)}/commercial-proposals`;
}

export async function fetchSourcingKpSummary(id: string): Promise<SourcingCommercialProposalSummaryApi> {
  return adminBackendJson<SourcingCommercialProposalSummaryApi>(kpBasePath(id));
}

export async function fetchSourcingKpDraft(id: string): Promise<SourcingCommercialProposalApi> {
  return adminBackendJson<SourcingCommercialProposalApi>(`${kpBasePath(id)}/draft`);
}

export async function initSourcingKpDraft(
  id: string,
  fromPublishedProposalId?: string,
): Promise<SourcingCommercialProposalApi> {
  return adminBackendJson<SourcingCommercialProposalApi>(`${kpBasePath(id)}/draft/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fromPublishedProposalId ? { fromPublishedProposalId } : {}),
  });
}

export async function saveSourcingKpDraft(
  id: string,
  lines: SourcingCommercialProposalLineDraft[],
): Promise<SourcingCommercialProposalApi> {
  return adminBackendJson<SourcingCommercialProposalApi>(`${kpBasePath(id)}/draft`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lines }),
  });
}

export async function fetchSourcingKpPublished(
  id: string,
  versionNumber: number,
): Promise<SourcingCommercialProposalApi> {
  return adminBackendJson<SourcingCommercialProposalApi>(
    `${kpBasePath(id)}/published/${versionNumber}`,
  );
}

export async function publishSourcingKpDraft(id: string): Promise<{ versionNumber: number }> {
  return adminBackendJson<{ versionNumber: number }>(`${kpBasePath(id)}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}
