import { describe, expect, it } from 'vitest';
import {
  formatRubMoneyInputDisplay,
  formatRubMoneyInputTyping,
  parseRubMoneyInput,
} from './adminRubMoneyInput';

describe('adminRubMoneyInput', () => {
  it('formatRubMoneyInputDisplay: разделители и ₽', () => {
    expect(formatRubMoneyInputDisplay(4_000_000)).toBe('4\u00a0000\u00a0000 ₽');
    expect(formatRubMoneyInputDisplay(0)).toBe('0 ₽');
  });

  it('parseRubMoneyInput: из форматированной строки', () => {
    expect(parseRubMoneyInput('4 000 000 ₽')).toBe(4_000_000);
    expect(parseRubMoneyInput('')).toBe(0);
  });

  it('formatRubMoneyInputTyping: при наборе', () => {
    expect(formatRubMoneyInputTyping('4000000')).toBe('4\u00a0000\u00a0000 ₽');
  });
});
