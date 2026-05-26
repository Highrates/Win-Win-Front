import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchLikesBulkByIds,
  isRetryableLikesBulkStatus,
  LikesBulkHttpError,
  LIKES_BULK_MAX_IDS,
} from './likesBulkHttp';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('isRetryableLikesBulkStatus', () => {
  it('treats 429 and 5xx as retryable', () => {
    expect(isRetryableLikesBulkStatus(429)).toBe(true);
    expect(isRetryableLikesBulkStatus(500)).toBe(true);
    expect(isRetryableLikesBulkStatus(503)).toBe(true);
  });

  it('does not retry 401 or 404', () => {
    expect(isRetryableLikesBulkStatus(401)).toBe(false);
    expect(isRetryableLikesBulkStatus(404)).toBe(false);
  });
});

describe('fetchLikesBulkByIds', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty object for no ids', async () => {
    const fetchImpl = vi.fn();
    const result = await fetchLikesBulkByIds('product', [], { fetchImpl });
    expect(result).toEqual({});
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('dedupes ids and maps liked flags', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        byId: {
          a: { liked: true },
          b: { liked: false },
        },
      }),
    );

    const result = await fetchLikesBulkByIds('product', ['a', 'a', 'b'], { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe('/api/user/likes/products/me/bulk');
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as { productIds: string[] };
    expect(body.productIds).toEqual(['a', 'b']);
    expect(result).toEqual({ a: true, b: false });
  });

  it('retries on 429 then succeeds', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(jsonResponse({ byId: { x: { liked: true } } }));

    const sleepMs = vi.fn().mockResolvedValue(undefined);
    const promise = fetchLikesBulkByIds('case', ['x'], { fetchImpl, sleepMs, maxAttempts: 2 });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleepMs).toHaveBeenCalledWith(500);
    expect(result).toEqual({ x: true });
  });

  it('throws immediately on 401 without retry', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    const sleepMs = vi.fn().mockResolvedValue(undefined);

    await expect(
      fetchLikesBulkByIds('designer', ['d1'], { fetchImpl, sleepMs, maxAttempts: 3 }),
    ).rejects.toMatchObject({ status: 401 });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleepMs).not.toHaveBeenCalled();
  });

  it('throws LikesBulkHttpError after exhausting retries on 503', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    const sleepMs = vi.fn().mockResolvedValue(undefined);

    const promise = fetchLikesBulkByIds('product', ['p1'], { fetchImpl, sleepMs, maxAttempts: 2 });
    const assertPromise = expect(promise).rejects.toBeInstanceOf(LikesBulkHttpError);
    await vi.runAllTimersAsync();
    await assertPromise;

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('splits ids into chunks of LIKES_BULK_MAX_IDS', async () => {
    const ids = Array.from({ length: LIKES_BULK_MAX_IDS + 3 }, (_, i) => `id-${i}`);
    const fetchImpl = vi.fn().mockImplementation(async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as { productIds: string[] };
      const byId: Record<string, { liked: boolean }> = {};
      for (const id of body.productIds) byId[id] = { liked: true };
      return jsonResponse({ byId });
    });

    const result = await fetchLikesBulkByIds('product', ids, { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(Object.keys(result)).toHaveLength(ids.length);
  });
});
