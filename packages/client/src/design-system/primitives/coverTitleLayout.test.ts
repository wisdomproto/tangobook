import { describe, expect, it } from 'vitest';
import { coverTitleLayout } from './coverTitleLayout';

const measure = (text: string) => text.length * 20;
describe('cover title line layout', () => {
  it('keeps a short title on one line', () => {
    expect(coverTitleLayout('신데렐라', 220, 30, measure, 'ko').lines).toEqual(['신데렐라']);
  });
  it('uses meaningful phrase boundaries for long story names', () => {
    const result = coverTitleLayout('좁쌀 한 톨로 장가든 총각', 220, 30, measure, 'ko');
    expect(result.lines).toEqual(['좁쌀 한 톨로', '장가든 총각']);
    expect(result.lines.join(' ')).toBe('좁쌀 한 톨로 장가든 총각');
  });
  it('never splits a single Korean word and fits its size instead', () => {
    const result = coverTitleLayout('파키케팔로사우루스', 140, 30, measure, 'ko');
    expect(result.lines).toEqual(['파키케팔로사우루스']);
    expect(result.fontSize).toBeLessThan(30);
  });
  it('keeps the condition and result of a numbered title together', () => {
    expect(coverTitleLayout('01. 골고루 먹으면 무지개 힘!', 220, 30, measure, 'ko').lines).toEqual([
      '01. 골고루 먹으면',
      '무지개 힘!',
    ]);
  });
  it('keeps the series number attached to the title', () => {
    const result = coverTitleLayout('15. 나만 미워하는 것 같아', 180, 30, measure, 'ko');
    expect(result.lines.length).toBe(2);
    expect(result.lines[0]).not.toBe('15.');
    expect(result.lines.join(' ')).toBe('15. 나만 미워하는 것 같아');
  });
  it('preserves English words and avoids leaving an article at the line end', () => {
    const result = coverTitleLayout(
      'The princess and the wonderful castle',
      220,
      30,
      measure,
      'en'
    );
    expect(result.lines.join(' ')).toBe('The princess and the wonderful castle');
    expect(result.lines[0]).not.toMatch(/\b(?:the|and)$/i);
  });
});
