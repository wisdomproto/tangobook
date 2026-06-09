import { describe, it, expect } from 'vitest';
import { cn, generateId, countWords } from '../utils';

describe('cn', () => {
  it('filters falsy values and joins class names', () => {
    const condition = false;
    expect(cn('a', condition && 'b', 'c')).toBe('a c');
  });

  it('tailwind-merge resolves conflicting classes (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('generateId', () => {
  it('returns a UUID-shaped string without prefix', () => {
    const id = generateId();
    // UUID v4 pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('returns prefixed UUID when prefix is given', () => {
    const id = generateId('test');
    expect(id).toMatch(
      /^test-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 10 }, () => generateId()));
    expect(ids.size).toBe(10);
  });
});

describe('countWords', () => {
  it('counts English words', () => {
    expect(countWords('a b c')).toBe(3);
  });

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('returns 0 for whitespace-only string', () => {
    expect(countWords('   ')).toBe(0);
  });

  it('counts a single word', () => {
    expect(countWords('hello')).toBe(1);
  });

  it('counts Korean characters individually', () => {
    // 3 Korean chars + 0 non-Korean words = 3
    expect(countWords('가나다')).toBe(3);
  });
});
