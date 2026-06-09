import { describe, it, expect } from 'vitest';
import { wrapLines } from '../canvas-export';

// measure = 1px per character (deterministic, no Canvas needed)
const onePxPerChar = (s: string) => s.length;

describe('wrapLines', () => {
  it('keeps a short line on one row', () => {
    expect(wrapLines(onePxPerChar, 'abc', 10)).toEqual(['abc']);
  });

  it('honors explicit \\n breaks', () => {
    expect(wrapLines(onePxPerChar, 'ab\ncd', 100)).toEqual(['ab', 'cd']);
  });

  it('wraps when a line exceeds maxW (greedy char pack)', () => {
    // maxW=3 → "abc" fits (measure("abc")=3, 3>3 is false), 4th char overflows
    expect(wrapLines(onePxPerChar, 'abcdef', 3)).toEqual(['abc', 'def']);
  });

  it('emits an empty line for a leading \\n', () => {
    expect(wrapLines(onePxPerChar, '\nabc', 100)).toEqual(['', 'abc']);
  });

  it('returns [] for empty text', () => {
    expect(wrapLines(onePxPerChar, '', 100)).toEqual([]);
  });
});
