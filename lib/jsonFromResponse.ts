/**
 * Парсинг тела fetch-ответа без падения при пустом теле / не-JSON (сборка без API, 204, обрыв).
 */
export async function jsonFromResponse<T>(res: Response, fallback: T): Promise<T> {
  const text = await res.text();
  if (!text.trim()) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}
