import { adminBackendJson } from '@/lib/adminBackendFetch';
import {
  parseAdminSourcingRequestDetail,
  parseAdminSourcingRequestsList,
  parseAdminSourcingStatusPatch,
} from './apiSchema';
import type {
  AdminSourcingBucket,
  AdminSourcingRequestDetailApi,
  AdminSourcingRequestsListResponse,
  AdminSourcingStatusPatchResponse,
  SourcingRequestStatus,
} from './types';

export type FetchAdminSourcingListParams = {
  page: number;
  limit: number;
  bucket: AdminSourcingBucket;
  q?: string;
};

export async function fetchAdminSourcingRequestsList(
  params: FetchAdminSourcingListParams,
): Promise<AdminSourcingRequestsListResponse> {
  const qs = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    bucket: params.bucket,
  });
  if (params.q?.trim()) qs.set('q', params.q.trim());
  const raw = await adminBackendJson<unknown>(`sourcing-requests/admin?${qs}`);
  return parseAdminSourcingRequestsList(raw);
}

export async function fetchAdminSourcingRequest(id: string): Promise<AdminSourcingRequestDetailApi> {
  const raw = await adminBackendJson<unknown>(`sourcing-requests/admin/${id}`);
  return parseAdminSourcingRequestDetail(raw);
}

export async function patchAdminSourcingRequestStatus(
  id: string,
  status: SourcingRequestStatus,
): Promise<AdminSourcingStatusPatchResponse> {
  const raw = await adminBackendJson<unknown>(`sourcing-requests/admin/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return parseAdminSourcingStatusPatch(raw);
}

export async function deleteAdminSourcingRequest(id: string): Promise<void> {
  await adminBackendJson<void>(`sourcing-requests/admin/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
