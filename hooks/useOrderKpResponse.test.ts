import { describe, expect, it } from 'vitest';
import { humanizeKpDecisionError } from './useOrderKpResponse';

describe('humanizeKpDecisionError', () => {
  it('переводит сырые class-validator сообщения про expectedVersion', () => {
    expect(
      humanizeKpDecisionError(
        'expectedVersion must not be less than 1, expectedVersion must be an integer number, decision must be one of the following values: CHANGES_REQUESTED, REJECTED',
      ),
    ).toMatch(/обновите заказ|верси/i);
  });

  it('оставляет обычные тексты как есть', () => {
    expect(humanizeKpDecisionError('Сеть недоступна')).toBe('Сеть недоступна');
  });
});
