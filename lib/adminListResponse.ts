import { adminBackendJson } from './adminBackendFetch';

export type AdminListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export const ADMIN_LIST_DEFAULT_LIMIT = 20;
export const ADMIN_LIST_PICKER_LIMIT = 500;

export function adminListParams(
  opts: { page?: number; limit?: number; q?: string } = {},
): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set('page', String(opts.page ?? 1));
  sp.set('limit', String(opts.limit ?? ADMIN_LIST_DEFAULT_LIMIT));
  const q = opts.q?.trim();
  if (q) sp.set('q', q);
  return sp;
}

/** users/admin и partner-applications: skip/take вместо page/limit. */
export function adminSkipTakeParams(
  opts: { page?: number; limit?: number; q?: string } = {},
): URLSearchParams {
  const limit = opts.limit ?? ADMIN_LIST_DEFAULT_LIMIT;
  const page = opts.page ?? 1;
  const sp = new URLSearchParams();
  sp.set('skip', String((page - 1) * limit));
  sp.set('take', String(limit));
  const q = opts.q?.trim();
  if (q) sp.set('q', q);
  return sp;
}

export async function adminBackendList<T>(
  path: string,
  params?: URLSearchParams,
): Promise<AdminListResponse<T>> {
  const qs = params?.toString();
  return adminBackendJson<AdminListResponse<T>>(`${path}${qs ? `?${qs}` : ''}`);
}

/** Для селектов/пикеров — одна «страница» с большим limit. */
export async function adminBackendListAll<T>(
  path: string,
  q?: string,
  limit = ADMIN_LIST_PICKER_LIMIT,
): Promise<T[]> {
  const res = await adminBackendList<T>(path, adminListParams({ page: 1, limit, q }));
  return res.items;
}

export function isAdminListResponse<T>(data: unknown): data is AdminListResponse<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as AdminListResponse<T>).items) &&
    typeof (data as AdminListResponse<T>).total === 'number'
  );
}

/** Категории без q — массив для DnD; с q — paginated wrapper. */
export function normalizeCategoriesListResponse<T>(
  data: T[] | AdminListResponse<T>,
): { rows: T[]; total: number; page: number; limit: number; paginated: boolean } {
  if (isAdminListResponse<T>(data)) {
    return {
      rows: data.items,
      total: data.total,
      page: data.page,
      limit: data.limit,
      paginated: true,
    };
  }
  return {
    rows: data,
    total: data.length,
    page: 1,
    limit: data.length || ADMIN_LIST_DEFAULT_LIMIT,
    paginated: false,
  };
}
