import { describe, expect, it } from 'vitest';
import { fixRussianHangingPrepositions } from './fixRussianHangingPrepositions';

describe('fixRussianHangingPrepositions', () => {
  it('glues short prepositions to the next word with NBSP', () => {
    expect(fixRussianHangingPrepositions('Туры в Китай')).toBe('Туры в\u00A0Китай');
    expect(fixRussianHangingPrepositions('мебель и фабрики')).toBe('мебель и\u00A0фабрики');
    expect(fixRussianHangingPrepositions('поездка на выставку')).toBe('поездка на\u00A0выставку');
  });

  it('handles multiple occurrences', () => {
    expect(fixRussianHangingPrepositions('в Китай и на фабрики')).toBe(
      'в\u00A0Китай и\u00A0на\u00A0фабрики',
    );
  });

  it('leaves empty / short strings alone', () => {
    expect(fixRussianHangingPrepositions('')).toBe('');
    expect(fixRussianHangingPrepositions('WUPAPA')).toBe('WUPAPA');
  });
});
