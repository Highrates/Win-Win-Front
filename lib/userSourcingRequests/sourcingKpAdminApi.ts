import { adminBackendJson } from '@/lib/adminBackendFetch';
import {
  parseSourcingCommercialProposal,
  parseSourcingCommercialProposalSummary,
  parseSourcingKpPublishResult,
  type SourcingCommercialProposalLineDraft,
} from '@/lib/sourcingCommercialProposal/schemas';

function kpBasePath(id: string) {
  return `sourcing-requests/admin/${encodeURIComponent(id)}/commercial-proposals`;
}

export async function fetchSourcingKpSummary(id: string) {
  const raw = await adminBackendJson<unknown>(kpBasePath(id));
  return parseSourcingCommercialProposalSummary(raw);
}

export async function fetchSourcingKpDraft(id: string) {
  const raw = await adminBackendJson<unknown>(`${kpBasePath(id)}/draft`);
  return parseSourcingCommercialProposal(raw);
}

export async function initSourcingKpDraft(id: string, fromPublishedProposalId?: string) {
  const raw = await adminBackendJson<unknown>(`${kpBasePath(id)}/draft/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fromPublishedProposalId ? { fromPublishedProposalId } : {}),
  });
  return parseSourcingCommercialProposal(raw);
}

export async function saveSourcingKpDraft(id: string, lines: SourcingCommercialProposalLineDraft[]) {
  const raw = await adminBackendJson<unknown>(`${kpBasePath(id)}/draft`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lines }),
  });
  return parseSourcingCommercialProposal(raw);
}

export async function fetchSourcingKpPublished(id: string, versionNumber: number) {
  const raw = await adminBackendJson<unknown>(`${kpBasePath(id)}/published/${versionNumber}`);
  return parseSourcingCommercialProposal(raw);
}

export async function publishSourcingKpDraft(id: string) {
  const raw = await adminBackendJson<unknown>(`${kpBasePath(id)}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return parseSourcingKpPublishResult(raw);
}
