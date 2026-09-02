import { afterEach, describe, expect, it } from 'vitest';
import { getUserTokenMaxAgeSec, parseJwtExpiresInToSeconds } from './userTokenMaxAge';

describe('parseJwtExpiresInToSeconds', () => {
  it('parses 7d', () => {
    expect(parseJwtExpiresInToSeconds('7d')).toBe(7 * 86_400);
  });

  it('parses 12h / 30m / 45s', () => {
    expect(parseJwtExpiresInToSeconds('12h')).toBe(12 * 3_600);
    expect(parseJwtExpiresInToSeconds('30m')).toBe(30 * 60);
    expect(parseJwtExpiresInToSeconds('45s')).toBe(45);
  });

  it('parses plain seconds', () => {
    expect(parseJwtExpiresInToSeconds('3600')).toBe(3600);
  });

  it('returns null for garbage', () => {
    expect(parseJwtExpiresInToSeconds('week')).toBeNull();
    expect(parseJwtExpiresInToSeconds('')).toBeNull();
  });
});

describe('getUserTokenMaxAgeSec', () => {
  const prevSec = process.env.USER_TOKEN_MAX_AGE_SEC;
  const prevDur = process.env.USER_JWT_EXPIRES_IN;

  afterEach(() => {
    if (prevSec === undefined) delete process.env.USER_TOKEN_MAX_AGE_SEC;
    else process.env.USER_TOKEN_MAX_AGE_SEC = prevSec;
    if (prevDur === undefined) delete process.env.USER_JWT_EXPIRES_IN;
    else process.env.USER_JWT_EXPIRES_IN = prevDur;
  });

  it('defaults to 7 days when env unset', () => {
    delete process.env.USER_TOKEN_MAX_AGE_SEC;
    delete process.env.USER_JWT_EXPIRES_IN;
    expect(getUserTokenMaxAgeSec()).toBe(7 * 86_400);
  });

  it('prefers USER_TOKEN_MAX_AGE_SEC', () => {
    process.env.USER_TOKEN_MAX_AGE_SEC = '1200';
    process.env.USER_JWT_EXPIRES_IN = '7d';
    expect(getUserTokenMaxAgeSec()).toBe(1200);
  });

  it('falls back to USER_JWT_EXPIRES_IN', () => {
    delete process.env.USER_TOKEN_MAX_AGE_SEC;
    process.env.USER_JWT_EXPIRES_IN = '2d';
    expect(getUserTokenMaxAgeSec()).toBe(2 * 86_400);
  });
});
