/**
 * Разбор тела JSON-ошибки от Nest/Next API (`message` / `error` / `code`, массивы).
 */

export type ApiErrorBody = {
  message: string;
  code?: string;
};

export class ApiRequestError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
  }
}

export function parseApiErrorJson(j: unknown): ApiErrorBody | null {
  if (!j || typeof j !== 'object') return null;
  const body = j as { message?: unknown; error?: unknown; code?: unknown };
  const code = typeof body.code === 'string' && body.code.trim() ? body.code.trim() : undefined;
  if (Array.isArray(body.message)) {
    const message = body.message.map(String).join(', ').trim();
    if (message) return { message, code };
  }
  if (typeof body.message === 'string' && body.message.trim()) {
    return { message: body.message.trim(), code };
  }
  if (typeof body.error === 'string' && body.error.trim()) {
    return { message: body.error.trim(), code };
  }
  return code ? { message: 'Ошибка запроса', code } : null;
}

export async function readApiError(res: Response): Promise<ApiErrorBody> {
  try {
    const j = await res.json();
    const parsed = parseApiErrorJson(j);
    if (parsed) return parsed;
  } catch {
    /* empty */
  }
  if (res.status === 429) {
    return { message: 'Слишком много запросов. Подождите и попробуйте снова.' };
  }
  return { message: res.statusText || 'Ошибка запроса' };
}

export async function readApiErrorMessage(res: Response): Promise<string> {
  return (await readApiError(res)).message;
}
