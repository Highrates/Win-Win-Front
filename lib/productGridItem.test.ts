import { describe, expect, it, vi } from 'vitest';
import { productGridItemsHaveSsrLikes } from './productGridItem';
import { primeProductGridLikesFromItems } from './productGridLikesSsr';

const setLikedMeBatchCache = vi.fn();
vi.mock('@/lib/likesMeBatch', () => ({
  setLikedMeBatchCache: (...args: unknown[]) => setLikedMeBatchCache(...args),
}));

describe('productGridItemsHaveSsrLikes', () => {
  it('is false for empty list', () => {
    expect(productGridItemsHaveSsrLikes([])).toBe(false);
  });

  it('requires likedByMe on every item', () => {
    expect(
      productGridItemsHaveSsrLikes([
        { key: '1', slug: 'a', name: 'A', productId: '1', price: 1, likedByMe: true },
        { key: '2', slug: 'b', name: 'B', productId: '2', price: 2 },
      ]),
    ).toBe(false);
    expect(
      productGridItemsHaveSsrLikes([
        { key: '1', slug: 'a', name: 'A', productId: '1', price: 1, likedByMe: true },
        { key: '2', slug: 'b', name: 'B', productId: '2', price: 2, likedByMe: false },
      ]),
    ).toBe(true);
  });
});

describe('primeProductGridLikesFromItems', () => {
  it('primes micro-batch cache when SSR likes present', () => {
    setLikedMeBatchCache.mockClear();
    primeProductGridLikesFromItems([
      { key: '1', slug: 'a', name: 'A', productId: 'p1', price: 1, likedByMe: true },
      { key: '2', slug: 'b', name: 'B', productId: 'p2', price: 2, likedByMe: false },
    ]);
    expect(setLikedMeBatchCache).toHaveBeenCalledTimes(2);
    expect(setLikedMeBatchCache).toHaveBeenCalledWith('product', 'p1', true);
    expect(setLikedMeBatchCache).toHaveBeenCalledWith('product', 'p2', false);
  });

  it('skips when SSR likes incomplete', () => {
    setLikedMeBatchCache.mockClear();
    primeProductGridLikesFromItems([
      { key: '1', slug: 'a', name: 'A', productId: 'p1', price: 1, likedByMe: true },
      { key: '2', slug: 'b', name: 'B', productId: 'p2', price: 2 },
    ]);
    expect(setLikedMeBatchCache).not.toHaveBeenCalled();
  });
});
