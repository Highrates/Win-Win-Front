import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const token = vi.fn<() => string | null>();
vi.mock('@/lib/userSessionServer', () => ({ getUserAccessTokenFromCookies: () => token() }));
vi.mock('@/lib/serverApiBase', () => ({ getServerApiBase: () => 'http://api.test/api/v1' }));

import { GET } from './route';

const FILE_URL = 'http://localhost:3000/api/user/files/chat%3Aa1';
const navigation = { 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document', accept: 'text/html' };
const xhr = { 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty', accept: '*/*' };

function call(headers: Record<string, string>) {
  return GET(new NextRequest(FILE_URL, { headers }), { params: { ref: 'chat:a1' } });
}

describe('GET /api/user/files/[ref]', () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    token.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('no session: navigation goes to login and comes back to the file', async () => {
    token.mockReturnValue(null);
    const res = await call(navigation);
    expect(res.status).toBe(303);
    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/login/email');
    expect(location.searchParams.get('callbackUrl')).toBe('/api/user/files/chat%3Aa1');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('no session: fetch and download requests get a text 401', async () => {
    token.mockReturnValue(null);
    const res = await call(xhr);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe('Войдите в аккаунт, чтобы открыть файл');
  });

  it('expired session (backend 401) is treated the same way', async () => {
    token.mockReturnValue('expired');
    fetchMock.mockResolvedValue(new Response('Unauthorized', { status: 401 }));
    expect((await call(navigation)).status).toBe(303);
    expect((await call(xhr)).status).toBe(401);
  });

  it('without Sec-Fetch headers falls back to Accept', async () => {
    token.mockReturnValue(null);
    expect((await call({ accept: 'text/html,application/xhtml+xml' })).status).toBe(303);
    expect((await call({ accept: 'application/json' })).status).toBe(401);
  });

  it('streams the file for a valid session', async () => {
    token.mockReturnValue('ok');
    fetchMock.mockResolvedValue(
      new Response('%PDF', { status: 200, headers: { 'content-type': 'application/pdf' } }),
    );
    const res = await call(navigation);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(fetchMock.mock.calls[0]![0]).toBe('http://api.test/api/v1/files/chat%3Aa1');
  });
});
