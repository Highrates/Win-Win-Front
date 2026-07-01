import { z } from 'zod';

export const sourcingCommercialProposalLineSchema = z.object({
  id: z.string(),
  sourceSourcingRequestItemId: z.string().nullable(),
  sortOrder: z.number(),
  productName: z.string(),
  description: z.string().nullable(),
  imageUrls: z.array(z.string()),
  quantity: z.number(),
  unit: z.string(),
  costPriceCny: z.number(),
  grossWeightKg: z.number().nullable(),
  volumeM3: z.number().nullable(),
  offerUnitPrice: z.number(),
  deliveryEta: z.string().nullable(),
});

export const sourcingCommercialProposalSchema = z.object({
  id: z.string(),
  sourcingRequestId: z.string(),
  versionNumber: z.number(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  publishedAt: z.string().nullable(),
  publishedByUserId: z.string().nullable(),
  pricingProfileUpdatedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lines: z.array(sourcingCommercialProposalLineSchema),
});

export const sourcingCommercialProposalSummarySchema = z.object({
  draft: z
    .object({
      id: z.string(),
      lineCount: z.number(),
      updatedAt: z.string(),
    })
    .nullable(),
  published: z.array(
    z.object({
      id: z.string(),
      versionNumber: z.number(),
      publishedAt: z.string().nullable(),
      lineCount: z.number(),
    }),
  ),
});

export const sourcingKpPublishResultSchema = z.object({
  versionNumber: z.number(),
  warnings: z.array(z.string()).optional(),
});

export type SourcingCommercialProposalLineApi = z.output<typeof sourcingCommercialProposalLineSchema>;
export type SourcingCommercialProposalApi = z.output<typeof sourcingCommercialProposalSchema>;
export type SourcingCommercialProposalSummaryApi = z.output<typeof sourcingCommercialProposalSummarySchema>;

export type SourcingCommercialProposalLineDraft = Omit<
  SourcingCommercialProposalLineApi,
  'id' | 'offerUnitPrice'
> & {
  id?: string;
};

function parseOrThrow<T>(schema: z.ZodType<T>, raw: unknown, label: string): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Некорректный ответ сервера (${label})`);
  }
  return result.data;
}

export function parseSourcingCommercialProposal(raw: unknown) {
  return parseOrThrow(sourcingCommercialProposalSchema, raw, 'КП');
}

export function parseSourcingCommercialProposalSummary(raw: unknown) {
  return parseOrThrow(sourcingCommercialProposalSummarySchema, raw, 'сводка КП');
}

export function parseSourcingKpPublishResult(raw: unknown) {
  return parseOrThrow(sourcingKpPublishResultSchema, raw, 'публикация КП');
}
