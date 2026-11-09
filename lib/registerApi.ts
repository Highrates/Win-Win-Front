/**
 * Регистрация: same-origin POST → Next Route Handler → Nest (`/api/register/...`).
 */
import { ApiRequestError, parseApiErrorJson } from '@/lib/readApiErrorMessage';

const PREFIX = '/api/register';

async function readRegisterApiError(res: Response): Promise<ApiRequestError> {
  if (res.status === 429) {
    return new ApiRequestError('Слишком много попыток. Подождите минуту и попробуйте снова.');
  }
  const t = await res.text();
  try {
    const parsed = parseApiErrorJson(JSON.parse(t) as unknown);
    if (parsed) return new ApiRequestError(parsed.message, parsed.code);
  } catch {
    /* not JSON */
  }
  return new ApiRequestError(t.trim() || res.statusText || `Ошибка ${res.status}`);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${PREFIX}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  });
  if (!res.ok) throw await readRegisterApiError(res);
  return res.json() as Promise<T>;
}

export async function registerPhoneStart(body: {
  phone: string;
  consentPersonalData: boolean;
  consentSms: boolean;
  turnstileToken?: string | null;
}): Promise<{ message: string }> {
  return postJson('phone/start', {
    phone: body.phone,
    consentPersonalData: body.consentPersonalData,
    consentSms: body.consentSms,
    ...(body.turnstileToken?.trim() ? { turnstileToken: body.turnstileToken.trim() } : {}),
  });
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
  turnstileToken?: string | null;
}): Promise<{ message: string }> {
  return postJson('email/start', {
    email: body.email,
    consentPersonalData: body.consentPersonalData,
    consentSms: body.consentSms,
    ...(body.turnstileToken?.trim() ? { turnstileToken: body.turnstileToken.trim() } : {}),
  });
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
  /** Публичный реф. номер Wupapa из ?ref= */
  referralCode?: string;
  /** JWT приглашения дизайнера — из ?designerInvite= (invite wins over URL ref на бэкенде) */
  designerInviteToken?: string;
}): Promise<{
  ok: boolean;
  referralWarning?: string;
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    role: string;
    profile?: { profileOnboardingPending?: boolean } | null;
  } | null;
}> {
  return postJson('complete', body);
}
