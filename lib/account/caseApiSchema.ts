import { z } from 'zod';

/** Ответ Nest `Case` (JSON): даты строками, Json-поля как unknown. */
export const apiCaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  shortDescription: z.string().nullable(),
  location: z.string().nullable(),
  year: z.number().nullable(),
  budget: z.string().nullable(),
  descriptionHtml: z.string().nullable(),
  coverLayout: z.string().nullable(),
  coverImageUrls: z.unknown(),
  roomTypes: z.unknown(),
  productIds: z.unknown(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ApiCase = z.infer<typeof apiCaseSchema>;

export function parseApiCaseRow(raw: unknown): ApiCase | null {
  const r = apiCaseSchema.safeParse(raw);
  return r.success ? r.data : null;
}

export function parseApiCaseList(raw: unknown): ApiCase[] {
  if (!Array.isArray(raw)) return [];
  const out: ApiCase[] = [];
  for (const row of raw) {
    const c = parseApiCaseRow(row);
    if (c) out.push(c);
  }
  return out;
}

export function stringArrayFromUnknown(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
    .slice(0, max);
}

export function coverUrlsFromUnknown(v: unknown, max: number): string[] {
  return stringArrayFromUnknown(v, max);
}

export function roomTypesCommaSeparated(v: unknown, max = 8): string {
  const list = stringArrayFromUnknown(v, max);
  return list.length ? list.join(', ') : '';
}
