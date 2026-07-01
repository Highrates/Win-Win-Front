import { adminBackendJson } from '@/lib/adminBackendFetch';

export type PricingReversePreviewResult =
  | {
      ok: true;
      costPriceCny: number;
      mskRub: number;
      retailRub: number;
      retailAtDims: number;
      fitsBudget: boolean;
      shareS: number;
      weightKg: number;
      volumeM3: number;
      typicalWeightKg: number;
      typicalVolumeM3: number;
    }
  | { ok: false; error: 'NO_PROFILE' | 'INVALID_INPUT' | 'NEGATIVE_CNY' };

export type PricingForwardDefaultPreviewResult =
  | { ok: true; retailRub: number; mskRub: number; shareS: number }
  | { ok: false; error: 'NO_PROFILE' | 'INVALID_INPUT' };

export type PricingForwardDefaultPreviewBatchResult =
  | {
      ok: true;
      results: Array<
        | { ok: true; retailRub: number; mskRub: number; shareS: number }
        | { ok: false; error: 'INVALID_INPUT' }
      >;
    }
  | { ok: false; error: 'NO_PROFILE' };

export async function fetchPricingReversePreview(body: {
  retailRub: number;
  weightKg?: number;
  volumeM3?: number;
}): Promise<PricingReversePreviewResult> {
  return adminBackendJson<PricingReversePreviewResult>('catalog/admin/pricing-reverse-preview', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchPricingForwardDefaultPreview(body: {
  costPriceCny: number;
  weightKg: number;
  volumeM3: number;
}): Promise<PricingForwardDefaultPreviewResult> {
  return adminBackendJson<PricingForwardDefaultPreviewResult>(
    'catalog/admin/pricing-forward-default-preview',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export async function fetchPricingForwardDefaultPreviewBatch(body: {
  lines: Array<{ costPriceCny: number; weightKg: number; volumeM3: number }>;
}): Promise<PricingForwardDefaultPreviewBatchResult> {
  return adminBackendJson<PricingForwardDefaultPreviewBatchResult>(
    'catalog/admin/pricing-forward-default-preview-batch',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export {
  TYPICAL_SOURCING_VOLUME_M3,
  TYPICAL_SOURCING_WEIGHT_KG,
} from '@win-win/sourcing-request';
