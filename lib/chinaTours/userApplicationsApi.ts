import { z } from 'zod';
import type { ChinaTourMyApplicationListItem } from './types';

const applicationStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'REJECTED']);
const reviewStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const chinaTourMyApplicationListItemSchema = z.object({
  id: z.string(),
  status: applicationStatusSchema,
  comment: z.string().nullable(),
  createdAt: z.string(),
  canReview: z.boolean(),
  hasReview: z.boolean(),
  reviewStatus: reviewStatusSchema.nullable(),
  tour: z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    startsAt: z.string(),
    endsAt: z.string(),
    isPublished: z.boolean(),
    seatsTotal: z.number(),
    seatsTaken: z.number(),
    cardPrimaryUrl: z.string().nullable(),
  }),
});

export const chinaTourMyApplicationsListSchema = z.array(chinaTourMyApplicationListItemSchema);

function parseOrThrow<T>(schema: z.ZodType<T>, raw: unknown, label: string): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Некорректный ответ сервера (${label})`);
  }
  return result.data;
}

export function parseChinaTourMyApplicationsList(raw: unknown): ChinaTourMyApplicationListItem[] {
  return parseOrThrow(chinaTourMyApplicationsListSchema, raw, 'заявки на туры');
}

async function readApiError(res: Response): Promise<string> {
  let msg = res.statusText;
  try {
    const j = (await res.json()) as { message?: unknown };
    if (typeof j?.message === 'string') msg = j.message;
    else if (Array.isArray(j?.message)) msg = j.message.map(String).join(', ');
  } catch {
    /* ignore */
  }
  return msg || `HTTP ${res.status}`;
}

/** Список заявок текущего пользователя (ЛК). */
export async function fetchMyChinaTourApplications(): Promise<ChinaTourMyApplicationListItem[]> {
  const res = await fetch('/api/user/china-tours/applications', {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Нужна авторизация');
    throw new Error(await readApiError(res));
  }
  return parseChinaTourMyApplicationsList(await res.json());
}
