import { describe, expect, it } from 'vitest';
import { hasWord, wordIndices } from './word-in-text';

describe('wordIndices', () => {
  it('does not match a word inside a longer word', () => {
    expect(hasWord('옛날 어느 나라에 막내 공주가 살았어요.', '공')).toBe(false);
    expect(hasWord('pineapple pie', 'apple')).toBe(false);
  });
  it('matches a word followed by a particle or plural', () => {
    expect(hasWord('반짝반짝 빛나는 황금 공을 굴렸어요.', '공')).toBe(true);
    expect(hasWord('공, 마차, 왕관', '공')).toBe(true);
    expect(hasWord('I like apples.', 'apple')).toBe(true);
  });
  it('returns every whole-word position', () => {
    expect(wordIndices('공주가 공을 던졌고 공이 굴렀다', '공')).toEqual([4, 11]);
  });
});
