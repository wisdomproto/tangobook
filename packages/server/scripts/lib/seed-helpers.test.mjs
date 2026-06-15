import { describe, it, expect } from 'vitest';
import {
  classifyByPageCount,
  wordCount,
  storybookMemoTag,
  parseStorybookMemoTag,
  htmlToPlainText,
} from './seed-helpers.mjs';

describe('classifyByPageCount', () => {
  it('<=17 pages → classic', () => {
    expect(classifyByPageCount(15)).toBe('classic');
    expect(classifyByPageCount(17)).toBe('classic');
  });
  it('>=18 pages → nature', () => {
    expect(classifyByPageCount(18)).toBe('nature');
    expect(classifyByPageCount(19)).toBe('nature');
  });
});

describe('wordCount', () => {
  it('counts whitespace-separated tokens', () => {
    expect(wordCount('가나 다라 마바')).toBe(3);
  });
  it('empty/nullish → 0', () => {
    expect(wordCount('')).toBe(0);
    expect(wordCount(null)).toBe(0);
  });
});

describe('storybook memo tag', () => {
  it('round-trips an id', () => {
    expect(storybookMemoTag('1772510956605')).toBe('storybook:1772510956605');
    expect(parseStorybookMemoTag('storybook:1772510956605')).toBe('1772510956605');
  });
  it('returns null for non-matching memo', () => {
    expect(parseStorybookMemoTag('random note')).toBeNull();
    expect(parseStorybookMemoTag(null)).toBeNull();
  });
});

describe('htmlToPlainText', () => {
  it('strips tags and inserts newlines on block boundaries', () => {
    const out = htmlToPlainText('<h2>제목</h2><p>본문 한 줄</p>');
    expect(out).toContain('제목');
    expect(out).toContain('본문 한 줄');
    expect(out).not.toContain('<');
  });
});
