import { describe, expect, it } from 'vitest';
import { formatAccountDocDateHeader, formatAccountDocShortDate } from './formatAccountDocDate';

const NOW = new Date(2026, 8, 28, 15, 0);

describe('formatAccountDocDateHeader', () => {
  it('uses relative labels for today and yesterday', () => {
    expect(formatAccountDocDateHeader('2026-09-28', NOW)).toBe('Сегодня');
    expect(formatAccountDocDateHeader('2026-09-27', NOW)).toBe('Вчера');
  });

  it('omits the year for the current year, lowercase month, no comma before year', () => {
    expect(formatAccountDocDateHeader('2026-06-18', NOW)).toBe('Четверг, 18 июня');
    expect(formatAccountDocDateHeader('2025-06-20', NOW)).toBe('Пятница, 20 июня 2025');
  });

  it('handles yesterday across a year boundary', () => {
    expect(formatAccountDocDateHeader('2025-12-31', new Date(2026, 0, 1, 9))).toBe('Вчера');
  });

  it('returns the input for malformed dates', () => {
    expect(formatAccountDocDateHeader('bad', NOW)).toBe('bad');
  });
});

describe('formatAccountDocShortDate', () => {
  it('drops the year for the current year and «г.» otherwise', () => {
    expect(formatAccountDocShortDate(new Date(2026, 5, 18).toISOString(), NOW)).toBe('18 июня');
    expect(formatAccountDocShortDate(new Date(2025, 5, 20).toISOString(), NOW)).toBe('20 июня 2025');
  });
});
