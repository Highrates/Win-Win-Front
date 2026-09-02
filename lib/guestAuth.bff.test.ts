/**
 * BFF guest-auth routes — integration-style with mocked upstream Nest.
 * Run: `npm test -w win-win-web -- guestAuth.bff`
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('BFF guest auth (mocked Nest)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('login maps Nest 401 to { message, code: INVALID_CREDENTIALS }', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 }),
    );

    const { POST } = await import('../app/api/login/route');
    const req = new Request('http://localhost/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: 'a@b.com', password: 'wrong' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({
      message: 'Неверный email/телефон или пароль',
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('password-reset/request proxies Nest message envelope on error', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Подтвердите, что вы не робот' }), { status: 400 }),
    );

    const { POST } = await import('../app/api/password-reset/request/route');
    const req = new Request('http://localhost/api/password-reset/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ message: 'Подтвердите, что вы не робот' });
  });

  it('designer-invite/verify maps Nest error to { message }', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ message: 'Приглашение недействительно' }, 400));

    const { POST } = await import('../app/api/auth/designer-invite/verify/route');
    const req = new Request('http://localhost/api/auth/designer-invite/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'bad' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ message: 'Приглашение недействительно' });
  });

  it('register/complete without access_token keeps residual { error }', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ user: { id: 'u1' } }));

    const { POST } = await import('../app/api/register/[...slug]/route');
    const req = new Request('http://localhost/api/register/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completionToken: 't', password: 'Password1' }),
    });
    const res = await POST(req, { params: { slug: ['complete'] } });
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: 'No access_token in response' });
  });
});

describe('BFF OTP → complete → password-reset journey (mocked Nest)', () => {
  const originalFetch = global.fetch;
  const nestCalls: string[] = [];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    nestCalls.length = 0;

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      nestCalls.push(`${init?.method ?? 'GET'} ${url}`);

      if (url.includes('/auth/register/email/start')) {
        return jsonResponse({ message: 'Код отправлен на email' });
      }
      if (url.includes('/auth/register/email/verify')) {
        return jsonResponse({ completionToken: 'completion-jwt-test' });
      }
      if (url.includes('/auth/register/complete')) {
        return jsonResponse({
          access_token: 'access-jwt-test',
          user: {
            id: 'u1',
            email: 'journey@example.com',
            phone: null,
            role: 'USER',
            profile: { profileOnboardingPending: true },
          },
        });
      }
      if (url.includes('/auth/password-reset/request')) {
        return jsonResponse({
          message: 'Если аккаунт существует, мы отправили ссылку на email',
          sent: true,
        });
      }
      if (url.includes('/auth/password-reset/verify')) {
        return jsonResponse({ valid: true, email: 'journey@example.com' });
      }
      if (url.includes('/auth/password-reset/confirm')) {
        return jsonResponse({ ok: true, email: 'journey@example.com' });
      }
      return jsonResponse({ message: `unexpected Nest URL: ${url}` }, 500);
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('proxies start → verify → complete (cookie session) → reset request/verify/confirm', async () => {
    const { POST: registerPost } = await import('../app/api/register/[...slug]/route');
    const { POST: resetRequest } = await import('../app/api/password-reset/request/route');
    const { POST: resetVerify } = await import('../app/api/password-reset/verify/route');
    const { POST: resetConfirm } = await import('../app/api/password-reset/confirm/route');

    const startRes = await registerPost(
      new Request('http://localhost/api/register/email/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'journey@example.com',
          consentPersonalData: true,
          consentSms: false,
        }),
      }),
      { params: { slug: ['email', 'start'] } },
    );
    expect(startRes.status).toBe(200);
    await expect(startRes.json()).resolves.toMatchObject({ message: expect.stringMatching(/код/i) });

    const verifyRes = await registerPost(
      new Request('http://localhost/api/register/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'journey@example.com', code: '424242' }),
      }),
      { params: { slug: ['email', 'verify'] } },
    );
    expect(verifyRes.status).toBe(200);
    await expect(verifyRes.json()).resolves.toEqual({ completionToken: 'completion-jwt-test' });

    const completeRes = await registerPost(
      new Request('http://localhost/api/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completionToken: 'completion-jwt-test',
          password: 'Password1',
        }),
      }),
      { params: { slug: ['complete'] } },
    );
    expect(completeRes.status).toBe(200);
    const completeJson = await completeRes.json();
    expect(completeJson).toMatchObject({
      ok: true,
      user: { id: 'u1', email: 'journey@example.com' },
    });
    expect(completeJson.access_token).toBeUndefined();
    const setCookie = completeRes.headers.get('set-cookie') ?? '';
    expect(setCookie).toMatch(/user_access_token=/);

    const reqRes = await resetRequest(
      new Request('http://localhost/api/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'journey@example.com' }),
      }),
    );
    expect(reqRes.status).toBe(200);
    await expect(reqRes.json()).resolves.toMatchObject({ sent: true });

    const verifyReset = await resetVerify(
      new Request('http://localhost/api/password-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'reset-jwt-test' }),
      }),
    );
    expect(verifyReset.status).toBe(200);
    await expect(verifyReset.json()).resolves.toEqual({
      valid: true,
      email: 'journey@example.com',
    });

    const confirmRes = await resetConfirm(
      new Request('http://localhost/api/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'reset-jwt-test', password: 'NewPass99' }),
      }),
    );
    expect(confirmRes.status).toBe(200);
    await expect(confirmRes.json()).resolves.toEqual({ ok: true, email: 'journey@example.com' });

    expect(nestCalls.some((c) => c.includes('/auth/register/email/start'))).toBe(true);
    expect(nestCalls.some((c) => c.includes('/auth/register/email/verify'))).toBe(true);
    expect(nestCalls.some((c) => c.includes('/auth/register/complete'))).toBe(true);
    expect(nestCalls.some((c) => c.includes('/auth/password-reset/request'))).toBe(true);
    expect(nestCalls.some((c) => c.includes('/auth/password-reset/verify'))).toBe(true);
    expect(nestCalls.some((c) => c.includes('/auth/password-reset/confirm'))).toBe(true);
  });
});
