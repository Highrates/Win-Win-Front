/**
 * Сброс пароля: same-origin POST → Next Route Handler → Nest.
 */
const PREFIX = '/api/password-reset';

async function readApiError(res: Response): Promise<string> {
  const t = await res.text();
  try {
    const j = JSON.parse(t) as { message?: string | string[] };
    if (Array.isArray(j.message)) return j.message.join(', ');
    if (typeof j.message === 'string') return j.message;
  } catch {
    /* not JSON */
  }
  return t.trim() || res.statusText || `Ошибка ${res.status}`;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${PREFIX}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json() as Promise<T>;
}

export async function passwordResetRequest(
  email: string,
): Promise<{ message: string; sent?: boolean; devHint?: string }> {
  return postJson('request', { email: email.trim().toLowerCase() });
}

export async function passwordResetVerify(token: string): Promise<{ valid: boolean; message?: string }> {
  return postJson('verify', { token });
}

export async function passwordResetConfirm(token: string, password: string): Promise<{ ok: boolean }> {
  return postJson('confirm', { token, password });
}
