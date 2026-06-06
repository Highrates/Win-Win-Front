import { AdminBackendRequestError } from '../adminBackendFetch';

/** Показывать «Загрузка…» только при первом запросе без кэша. */
export function adminQueryInitialLoading(isLoading: boolean, data: unknown): boolean {
  return isLoading && data === undefined;
}

export function adminQueryErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** Сообщение об ошибке query/mutation с единым разбором 401 от adminBackendJson. */
export function adminQueryErrorFromBackend(
  error: unknown,
  fallback: string,
  loginRequired?: string,
): string {
  if (error instanceof AdminBackendRequestError && error.status === 401 && loginRequired) {
    return loginRequired;
  }
  return adminQueryErrorMessage(error, fallback);
}

/** Ошибка detail/mutation: 401 → loginRequired, 404 → notFound, иначе errStatus или message. */
export function adminDetailErrorFromBackend(
  error: unknown,
  opts: {
    fallback: string;
    notFound?: string;
    loginRequired?: string;
    errStatus?: (status: number) => string;
  },
): string {
  if (error instanceof AdminBackendRequestError) {
    if (error.status === 401 && opts.loginRequired) return opts.loginRequired;
    if (error.status === 404 && opts.notFound) return opts.notFound;
    if (opts.errStatus) return opts.errStatus(error.status);
  }
  return adminQueryErrorMessage(error, opts.fallback);
}
