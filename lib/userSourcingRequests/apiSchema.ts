import { z } from 'zod';
import {
  sourcingCommercialProposalSchema,
} from '@/lib/sourcingCommercialProposal/schemas';
import type { UserSourcingRequestDetailApi, UserSourcingRequestsListResponse } from './types';

export const sourcingRequestStatusSchema = z.enum([
  'PENDING_REVIEW',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export const sourcingRequestFileSchema = z.object({
  id: z.string(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string().nullable(),
});

const sourcingRequestItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  productLink: z.string().nullable(),
  material: z.string().nullable(),
  color: z.string().nullable(),
  size: z.string().nullable(),
  description: z.string().nullable(),
  quantity: z.number(),
  unit: z.string(),
  expectedBudget: z.string().nullable(),
  referenceImages: z.array(sourcingRequestFileSchema),
});

const sourcingRequestCoreSchema = z.object({
  id: z.string(),
  title: z.string(),
  deliveryCity: z.string().nullable(),
  status: sourcingRequestStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const userListItemSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  referenceImageUrl: z.string().nullable().optional(),
  referenceImageUrls: z.array(z.string()).optional(),
});

const commercialProposalOfferSchema = z
  .object({
    oldTotalRub: z.number(),
    newTotalRub: z.number(),
    avgDiscountPercent: z.number(),
  })
  .nullable()
  .optional();

export const userSourcingRequestDetailSchema = sourcingRequestCoreSchema.extend({
  items: z.array(sourcingRequestItemSchema),
  attachments: z.array(sourcingRequestFileSchema),
  unreadStaffChatCount: z.number().optional(),
  latestCommercialProposal: sourcingCommercialProposalSchema.nullable().optional(),
  publishedCommercialProposals: z.array(sourcingCommercialProposalSchema).optional(),
});

export const userSourcingRequestsListSchema = z.object({
  items: z.array(
    sourcingRequestCoreSchema.extend({
      unreadStaffChatCount: z.number().optional(),
      commercialProposalOffer: commercialProposalOfferSchema,
      commercialProposalDeliveryEta: z.string().nullable().optional(),
      commercialProposalPublishedAt: z.string().nullable().optional(),
      commercialProposalImageUrls: z.array(z.string()).optional(),
      hasUnseenCommercialProposal: z.boolean().optional(),
      hasPublishedCommercialProposal: z.boolean().optional(),
      publishedCommercialProposalVersion: z.number().nullable().optional(),
      items: z.array(userListItemSummarySchema),
    }),
  ),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

const sourcingRequestUserSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  profile: z
    .object({
      firstName: z.string().nullable(),
      lastName: z.string().nullable(),
    })
    .nullable(),
});

export const adminSourcingRequestDetailSchema = sourcingRequestCoreSchema.extend({
  user: sourcingRequestUserSchema,
  items: z.array(sourcingRequestItemSchema),
  attachments: z.array(sourcingRequestFileSchema),
});

export const adminSourcingRequestsListSchema = z.object({
  items: z.array(
    sourcingRequestCoreSchema.extend({
      hasChatMessages: z.boolean().optional(),
      unreadCustomerChatCount: z.number().optional(),
      user: sourcingRequestUserSchema,
      items: z.array(z.object({ id: z.string(), name: z.string() })),
    }),
  ),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const adminSourcingStatusPatchSchema = z.object({
  id: z.string(),
  status: sourcingRequestStatusSchema,
  updatedAt: z.string(),
});

function parseOrThrow<T>(schema: z.ZodType<T>, raw: unknown, label: string): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Некорректный ответ сервера (${label})`);
  }
  return result.data;
}

export function parseUserSourcingRequestDetail(raw: unknown): UserSourcingRequestDetailApi {
  return parseOrThrow(userSourcingRequestDetailSchema, raw, 'заявка') as UserSourcingRequestDetailApi;
}

export function parseUserSourcingRequestsList(raw: unknown): UserSourcingRequestsListResponse {
  const parsed = parseOrThrow(userSourcingRequestsListSchema, raw, 'список заявок');
  return {
    ...parsed,
    items: parsed.items.map((item) => ({
      ...item,
      items: item.items.map((summary) => ({
        ...summary,
        referenceImageUrl: summary.referenceImageUrl ?? null,
        referenceImageUrls: summary.referenceImageUrls ?? [],
      })),
    })),
  };
}

export function parseAdminSourcingRequestDetail(raw: unknown) {
  return parseOrThrow(adminSourcingRequestDetailSchema, raw, 'заявка');
}

export function parseAdminSourcingRequestsList(raw: unknown) {
  return parseOrThrow(adminSourcingRequestsListSchema, raw, 'список заявок');
}

export function parseAdminSourcingStatusPatch(raw: unknown) {
  return parseOrThrow(adminSourcingStatusPatchSchema, raw, 'статус заявки');
}
