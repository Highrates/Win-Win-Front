import { coverUrlsFromUnknown, stringArrayFromUnknown } from '@/lib/account/caseApiSchema';
import { parseBudgetDigits } from '@/lib/formatBudgetRub';
import {
  brandCaseFormToBody,
  isNearAspect9x16,
  type BrandCaseFormState,
} from '@/lib/brandCaseForm';
import { formatBudgetDigitsGrouped } from '@/lib/formatBudgetRub';

export type BrandCaseRow = {
  id: string;
  title: string;
  shortDescription: string | null;
  location: string | null;
  year: number | null;
  budget: string | null;
  descriptionHtml: string | null;
  coverLayout: string | null;
  coverImageUrls: unknown;
  roomTypes: unknown;
  productIds: unknown;
  isPublished?: boolean;
  createdAt: string;
};

export type BrandProjectFormState = {
  title: string;
  shortDescription: string;
  location: string;
  year: string;
  budgetDigits: string;
  descriptionHtml: string;
  coverUrl: string;
  selectedRooms: string[];
  products: Array<{ id: string; slug: string; name: string }>;
  isPublished: boolean;
};

export const EMPTY_BRAND_PROJECT_FORM: BrandProjectFormState = {
  title: '',
  shortDescription: '',
  location: '',
  year: '',
  budgetDigits: '',
  descriptionHtml: '',
  coverUrl: '',
  selectedRooms: [],
  products: [],
  isPublished: true,
};

export function brandCaseRowToForm(row: BrandCaseRow): BrandProjectFormState {
  const covers = coverUrlsFromUnknown(row.coverImageUrls, 2);
  const pids = stringArrayFromUnknown(row.productIds, 80);
  return {
    title: row.title ?? '',
    shortDescription: row.shortDescription ?? '',
    location: row.location ?? '',
    year: row.year != null ? String(row.year) : '',
    budgetDigits: parseBudgetDigits(row.budget ?? ''),
    descriptionHtml: row.descriptionHtml ?? '',
    coverUrl: covers[0] ?? '',
    selectedRooms: stringArrayFromUnknown(row.roomTypes, 64),
    products: pids.map((id) => ({ id, slug: '', name: id })),
    isPublished: row.isPublished !== false,
  };
}

export function brandProjectFormSnapshot(form: BrandProjectFormState): string {
  return JSON.stringify({
    ...form,
    products: form.products.map((p) => p.id).sort(),
  });
}

export function brandProjectFormToWriteBody(form: BrandProjectFormState) {
  const state: BrandCaseFormState = {
    title: form.title,
    shortDescription: form.shortDescription,
    location: form.location,
    year: form.year,
    budgetDigits: form.budgetDigits,
    descriptionHtml: form.descriptionHtml,
    coverUrl: form.coverUrl,
    selectedRooms: form.selectedRooms,
    productIds: form.products.map((p) => p.id),
    isPublished: form.isPublished,
  };
  return brandCaseFormToBody(state, formatBudgetDigitsGrouped);
}

export function checkCoverAspect9x16(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(isNearAspect9x16(img.naturalWidth, img.naturalHeight));
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
