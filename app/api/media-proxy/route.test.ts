import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/serverApiBase', () => ({
  getServerApiBase: () => 'http://127.0.0.1:3001/api/v1',
  normalizeApiV1Base: (u: string) => u.replace(/\/?$/, ''),
}));

describe('media-proxy allowlist', () => {
  afterEach(() => {
    delete process.env.MEDIA_PROXY_ALLOWED_HOST_SUFFIXES;
    vi.resetModules();
  });

  it('allows API origin, AWS and expanded CDN suffixes', async () => {
    const { isAllowedMediaProxyTarget } = await import('./route');
    expect(isAllowedMediaProxyTarget(new URL('http://127.0.0.1:3001/uploads/a.jpg'))).toBe(true);
    expect(isAllowedMediaProxyTarget(new URL('https://bucket.s3.eu-central-1.amazonaws.com/x.jpg'))).toBe(
      true,
    );
    expect(isAllowedMediaProxyTarget(new URL('https://d123.cloudfront.net/a.jpg'))).toBe(true);
    expect(isAllowedMediaProxyTarget(new URL('https://storage.yandexcloud.net/bucket/a.jpg'))).toBe(
      true,
    );
    expect(isAllowedMediaProxyTarget(new URL('https://res.cloudinary.com/demo/image.jpg'))).toBe(true);
  });

  it('denies unknown hosts unless env allowlist expands them', async () => {
    const { isAllowedMediaProxyTarget } = await import('./route');
    expect(isAllowedMediaProxyTarget(new URL('https://evil.example/a.jpg'))).toBe(false);

    process.env.MEDIA_PROXY_ALLOWED_HOST_SUFFIXES = 'evil.example, .cdn.partner.test';
    vi.resetModules();
    const { isAllowedMediaProxyTarget: again } = await import('./route');
    expect(again(new URL('https://evil.example/a.jpg'))).toBe(true);
    expect(again(new URL('https://img.cdn.partner.test/a.jpg'))).toBe(true);
  });

  it('fetchMediaWithAllowedRedirects: 302 на чужой host → denied (не follow вслепую)', async () => {
    const {
      fetchMediaWithAllowedRedirects,
      MediaProxyRedirectDeniedError,
    } = await import('./route');
    const fetchImpl = vi.fn(async () =>
      new Response(null, {
        status: 302,
        headers: { Location: 'https://evil.example/steal' },
      }),
    );
    await expect(
      fetchMediaWithAllowedRedirects(
        new URL('http://127.0.0.1:3001/uploads/a.jpg'),
        { headers: { Accept: 'image/*' } },
        { fetchImpl: fetchImpl as unknown as typeof fetch },
      ),
    ).rejects.toBeInstanceOf(MediaProxyRedirectDeniedError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('fetchMediaWithAllowedRedirects: 302 на allowed host → follow', async () => {
    const { fetchMediaWithAllowedRedirects } = await import('./route');
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: 'http://127.0.0.1:3001/uploads/b.jpg' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { 'content-type': 'image/jpeg' },
        }),
      );
    const res = await fetchMediaWithAllowedRedirects(
      new URL('http://127.0.0.1:3001/uploads/a.jpg'),
      {},
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    );
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(fetchImpl.mock.calls[0]?.[1]?.redirect)).toBe('manual');
  });
});
