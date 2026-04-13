/**
 * Регистрация: same-origin POST → Next Route Handler → Nest (`/api/register/...`).
 */
const PREFIX = '/api/register';

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

export async function registerPhoneStart(body: {
  phone: string;
  consentPersonalData: boolean;
  consentSms: boolean;
}): Promise<{ message: string }> {
  return postJson('phone/start', body);
}

export async function registerPhoneVerify(body: {
  phone: string;
  code: string;
}): Promise<{ completionToken: string }> {
  return postJson('phone/verify', body);
}

export async function registerEmailStart(body: {
  email: string;
  consentPersonalData: boolean;
  consentSms: boolean;
}): Promise<{ message: string }> {
  return postJson('email/start', body);
}

export async function registerEmailVerify(body: {
  email: string;
  code: string;
}): Promise<{ completionToken: string }> {
  return postJson('email/verify', body);
}

export async function registerComplete(body: {
  completionToken: string;
  password: string;
}): Promise<{ access_token: string; user: { id: string; email: string | null; phone: string | null; role: string } }> {
  return postJson('complete', body);
}
