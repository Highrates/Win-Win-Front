/**
 * Разбор тела JSON-ошибки от Nest/Next API (`message` / `error`, массивы).
 */
export async function readApiErrorMessage(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { message?: string | string[]; error?: string };
    if (Array.isArray(j.message)) return j.message.join(', ');
    if (typeof j.message === 'string' && j.message.trim()) return j.message;
    if (typeof j.error === 'string' && j.error.trim()) return j.error;
  } catch {
    /* empty */
  }
  if (res.status === 429) {
    return 'Слишком много запросов. Подождите и попробуйте снова.';
  }
  return res.statusText || 'Ошибка запроса';
}
