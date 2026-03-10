/**
 * API-клиент для Win-Win backend (NestJS).
 * BASE_URL задаётся через NEXT_PUBLIC_API_URL (для SSR и клиента).
 */
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function getApiUrl(path: string, searchParams?: Record<string, string>): string {
  const url = new URL(path, BASE);
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { params?: Record<string, string> }
): Promise<T> {
  const url = getApiUrl(path, options?.params);
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
