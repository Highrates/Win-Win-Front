import { describe, expect, it } from 'vitest';
import { PASSWORD_POLICY_MESSAGE, validatePassword } from './validation';

describe('validatePassword (auth policy)', () => {
  it('accepts letters + digits', () => {
    expect(validatePassword('Password1')).toBeNull();
    expect(validatePassword('пароль12')).toBeNull();
  });

  it('rejects weak passwords', () => {
    expect(validatePassword('short')).toBe(PASSWORD_POLICY_MESSAGE);
    expect(validatePassword('password')).toBe(PASSWORD_POLICY_MESSAGE);
    expect(validatePassword('12345678')).toBe(PASSWORD_POLICY_MESSAGE);
  });
});
