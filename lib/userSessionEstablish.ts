import { NextResponse } from 'next/server';
import { getServerApiBase } from './serverApiBase';
import { setUserAccessTokenCookie } from './userAuth';

export type EstablishUserSessionOptions = {
  /** Включить `access_token` в JSON (login/register). По умолчанию true. */
  includeTokenInJson?: boolean;
  /** Доп. поля ответа (напр. `referralWarning` после register/complete). */
  extraBody?: Record<string, unknown>;
};

/** Проверка JWT и профиль пользователя (для login/register/session POST). */
export async function fetchAuthMeWithToken(accessToken: string): Promise<unknown | null> {
  try {
    const meRes = await fetch(`${getServerApiBase()}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (meRes.ok) {
      return await meRes.json();
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Единая точка: httpOnly cookie `user_access_token` + JSON `{ ok, user[, access_token] }`
 * после login, register/complete, contact verify и POST /api/user/session.
 */
export async function establishUserSessionResponse(
  request: Request,
  accessToken: string,
  user?: unknown | null,
  opts?: EstablishUserSessionOptions,
): Promise<NextResponse> {
  const token = accessToken.trim();
  if (!token) {
    return NextResponse.json({ error: 'No access_token' }, { status: 502 });
  }

  let resolvedUser: unknown | null = user ?? null;
  if (resolvedUser == null) {
    resolvedUser = await fetchAuthMeWithToken(token);
  }

  const includeToken = opts?.includeTokenInJson !== false;
  const payload = {
    ok: true as const,
    ...(includeToken ? { access_token: token } : {}),
    user: resolvedUser,
    ...(opts?.extraBody ?? {}),
  };

  const response = NextResponse.json(payload);
  setUserAccessTokenCookie(response, request, token);
  return response;
}

/** Разбор JSON Nest `{ access_token, user? }` и установка сессии (register/complete, contact verify). */
export async function establishUserSessionFromAuthJson(
  request: Request,
  jsonText: string,
  opts?: EstablishUserSessionOptions,
): Promise<NextResponse> {
  let parsed: { access_token?: string; user?: unknown; referralWarning?: string };
  try {
    parsed = JSON.parse(jsonText) as { access_token?: string; user?: unknown; referralWarning?: string };
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 502 });
  }

  const token = parsed.access_token?.trim();
  if (!token) {
    return NextResponse.json({ message: 'No access_token in response' }, { status: 502 });
  }

  const extraBody: Record<string, unknown> = {};
  if (typeof parsed.referralWarning === 'string' && parsed.referralWarning.trim()) {
    extraBody.referralWarning = parsed.referralWarning.trim();
  }

  return establishUserSessionResponse(request, token, parsed.user ?? null, {
    ...opts,
    extraBody: Object.keys(extraBody).length > 0 ? extraBody : opts?.extraBody,
  });
}
