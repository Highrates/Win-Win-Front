import { describe, expect, it, vi } from 'vitest';
import { buildLikesBulkUiProp } from './buildLikesBulkUiProp';

describe('buildLikesBulkUiProp', () => {
  const bulkBase = {
    auth: true as const,
    likedById: { p1: true, p2: false },
  };

  it('returns undefined when not authenticated', () => {
    expect(
      buildLikesBulkUiProp({ ...bulkBase, auth: false, status: 'ready' }, 'p1', vi.fn()),
    ).toBeUndefined();
  });

  it('returns undefined without entity id', () => {
    expect(buildLikesBulkUiProp({ ...bulkBase, status: 'ready' }, '', vi.fn())).toBeUndefined();
  });

  it('returns ready state with liked flag and callback', () => {
    const onLikedChange = vi.fn();
    const ui = buildLikesBulkUiProp({ ...bulkBase, status: 'ready' }, 'p1', onLikedChange);
    expect(ui).toEqual({
      status: 'ready',
      liked: true,
      onLikedChange: expect.any(Function),
    });
    if (ui?.status !== 'ready') throw new Error('expected ready state');
    ui.onLikedChange(false);
    expect(onLikedChange).toHaveBeenCalledWith('p1', false);
  });

  it('returns loading and error shells', () => {
    expect(buildLikesBulkUiProp({ ...bulkBase, status: 'loading' }, 'p1', vi.fn())).toEqual({
      status: 'loading',
    });
    expect(buildLikesBulkUiProp({ ...bulkBase, status: 'error' }, 'p1', vi.fn())).toEqual({
      status: 'error',
    });
  });

  it('returns undefined for idle status', () => {
    expect(buildLikesBulkUiProp({ ...bulkBase, status: 'idle' }, 'p1', vi.fn())).toBeUndefined();
  });
});
