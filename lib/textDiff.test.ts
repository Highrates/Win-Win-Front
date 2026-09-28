import { describe, expect, it } from 'vitest';
import { diffLines } from './textDiff';

describe('diffLines', () => {
  it('marks identical text as unchanged', () => {
    expect(diffLines('a\nb', 'a\nb')).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'same', text: 'b' },
    ]);
  });

  it('shows a replaced line as deletion followed by addition', () => {
    expect(diffLines('Привет\n{{cta.button}}\nПока', 'Привет\n{{block.quote}}\n{{cta.button}}\nПока')).toEqual([
      { kind: 'same', text: 'Привет' },
      { kind: 'add', text: '{{block.quote}}' },
      { kind: 'same', text: '{{cta.button}}' },
      { kind: 'same', text: 'Пока' },
    ]);
    expect(diffLines('раз\nдва', 'раз\nтри')).toEqual([
      { kind: 'same', text: 'раз' },
      { kind: 'del', text: 'два' },
      { kind: 'add', text: 'три' },
    ]);
  });

  it('handles empty sides', () => {
    expect(diffLines('', 'x')).toEqual([
      { kind: 'del', text: '' },
      { kind: 'add', text: 'x' },
    ]);
  });
});
