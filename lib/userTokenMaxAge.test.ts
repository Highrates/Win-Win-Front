import { describe, expect, it } from 'vitest';
import { getUserTokenMaxAgeSec, parseJwtExpiresInToSeconds } from './userTokenMaxAge';

describe('parseJwtExpiresInToSeconds', () => {
  it('parses 7d', () => {
    expect(parseJwtExpiresInToSeconds('7d')).toBe(7 * 86_400);
  });

  it('parses plain seconds', () => {
    expect(parseJwtExpiresInToSeconds('3600')).toBe(3600);
  });

  it('returns null for garbage', () => {
    expect(parseJwtExpiresInToSeconds('week')).toBeNull();
  });
});

describe('getUserTokenMaxAgeSec', () => {
  it('defaults to 7 days when env unset', () => {
    const prevSec = process.env.USER_TOKEN_MAX_AGE_SEC;
    const prevDur = process.env.USER_JWT_EXPIRES_IN;
    delete process.env.USER_TOKEN_MAX_AGE_SEC;
    delete process.env.USER_JWT_EXPIRES_IN;
    expect(getUserTokenMaxAgeSec()).toBe(7 * 86_400);
    if (prevSec !== undefined) process.env.USER_TOKEN_MAX_AGE_SEC = prevSec;
    if (prevDur !== undefined) process.env.USER_JWT_EXPIRES_IN = prevDur;
  });
});
