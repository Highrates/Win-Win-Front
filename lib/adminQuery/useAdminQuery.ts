'use client';

import {
  keepPreviousData,
  useQuery,
  type QueryKey,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { adminQueryDefaults, type AdminQueryKind } from './defaults';

export type UseAdminQueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, QueryKey>,
  'queryKey' | 'queryFn'
> & {
  kind?: AdminQueryKind;
  /** При смене фильтров держать предыдущие строки (без мигания). */
  keepPrevious?: boolean;
};

export function useAdminQuery<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseAdminQueryOptions<TData>,
) {
  const { kind = 'list', keepPrevious = kind === 'list', ...rest } = options ?? {};
  const defaults = adminQueryDefaults(kind);

  return useQuery({
    queryKey,
    queryFn,
    ...defaults,
    ...(keepPrevious ? { placeholderData: keepPreviousData } : {}),
    ...rest,
  });
}
