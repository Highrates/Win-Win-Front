import { describe, expect, it } from 'vitest';
import { guestAuthError } from './guestAuthResponse';

describe('guestAuthError', () => {
  it('returns { message } envelope', async () => {
    const res = guestAuthError('Неверный пароль', 401, 'INVALID_CREDENTIALS');
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      message: 'Неверный пароль',
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('omits code when not provided', async () => {
    const res = guestAuthError('Bad Request', 400);
    await expect(res.json()).resolves.toEqual({ message: 'Bad Request' });
  });
});
