import { describe, expect, it } from 'vitest';
import {
  computeHomePreviewCount,
  parseAdminListPrice,
  parseRubPriceInput,
} from './computeHomePreviewCount';

describe('computeHomePreviewCount', () => {
  it('returns 0 when not on home', () => {
    expect(
      computeHomePreviewCount({
        showOnHome: false,
        isActive: true,
        homeGridSize: 'FOUR',
        homeOrderMode: 'FIXED',
        homePriceMin: null,
        homePriceMax: null,
        prices: [100, 200],
      }),
    ).toBe(0);
  });

  it('applies FIXED grid limit without price filter', () => {
    expect(
      computeHomePreviewCount({
        showOnHome: true,
        isActive: true,
        homeGridSize: 'FOUR',
        homeOrderMode: 'FIXED',
        homePriceMin: 9999,
        homePriceMax: 99999,
        prices: [1, 2, 3, 4, 5],
      }),
    ).toBe(4);
  });

  it('applies RANDOM price filter then limit', () => {
    expect(
      computeHomePreviewCount({
        showOnHome: true,
        isActive: true,
        homeGridSize: 'EIGHT',
        homeOrderMode: 'RANDOM',
        homePriceMin: 100,
        homePriceMax: 300,
        prices: [50, 150, 250, 350, null],
      }),
    ).toBe(2);
  });
});

describe('parse helpers', () => {
  it('parseRubPriceInput', () => {
    expect(parseRubPriceInput('')).toBeNull();
    expect(parseRubPriceInput(' 12 ')).toBe(12);
    expect(parseRubPriceInput('x')).toBeNull();
  });

  it('parseAdminListPrice', () => {
    expect(parseAdminListPrice('1 234,5')).toBe(1234.5);
    expect(parseAdminListPrice(99)).toBe(99);
    expect(parseAdminListPrice(null)).toBeNull();
  });
});
