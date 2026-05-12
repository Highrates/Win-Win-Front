/** Разбор тела ошибки Nest/Next: `{ message: string | string[] }`. */
export async function readUpstreamJsonErrorMessage(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { message?: unknown };
    if (typeof j?.message === 'string') return j.message;
    if (Array.isArray(j?.message)) return j.message.map(String).join(', ');
  } catch {
    /* ignore */
  }
  return res.statusText || `Ошибка ${res.status}`;
}
