'use client';

import type { QueryKey } from '@tanstack/react-query';
import {
  ADMIN_LIST_DEFAULT_LIMIT,
  adminBackendList,
  adminListParams,
  adminSkipTakeParams,
  type AdminListResponse,
} from '../adminListResponse';
import { adminQueryErrorFromBackend, adminQueryInitialLoading } from './utils';
import { useAdminQuery } from './useAdminQuery';

export type AdminListParamsMode = 'pageLimit' | 'skipTake';

export type UseAdminListOptions<T, TData extends AdminListResponse<T> = AdminListResponse<T>> = {
  queryKey: QueryKey;
  path?: string;
  page: number;
  q?: string;
  limit?: number;
  paramsMode?: AdminListParamsMode;
  extraParams?: Record<string, string | undefined>;
  queryFn?: () => Promise<TData>;
  errorFallback: string;
  loginRequired?: string;
  enabled?: boolean;
};

export function useAdminList<T, TData extends AdminListResponse<T> = AdminListResponse<T>>(
  opts: UseAdminListOptions<T, TData>,
) {
  const limit = opts.limit ?? ADMIN_LIST_DEFAULT_LIMIT;

  const { data, isLoading, isFetching, error: queryError, refetch } = useAdminQuery<TData>(
    opts.queryKey,
    (opts.queryFn ??
      (() => {
        if (!opts.path) throw new Error('useAdminList: укажите path или queryFn');
        const params =
          opts.paramsMode === 'skipTake'
            ? adminSkipTakeParams({ page: opts.page, q: opts.q, limit })
            : adminListParams({ page: opts.page, q: opts.q, limit });
        if (opts.extraParams) {
          for (const [key, value] of Object.entries(opts.extraParams)) {
            if (value !== undefined && value !== '') params.set(key, value);
          }
        }
        return adminBackendList<T>(opts.path, params) as Promise<TData>;
      })) as () => Promise<TData>,
    { enabled: opts.enabled },
  );

  const loading = adminQueryInitialLoading(isLoading, data);
  const error = queryError
    ? adminQueryErrorFromBackend(queryError, opts.errorFallback, opts.loginRequired)
    : null;

  return {
    data,
    rows: data?.items ?? [],
    total: data?.total ?? 0,
    limit: data?.limit ?? limit,
    loading,
    isFetching,
    error,
    queryError,
    refetch,
  };
}
