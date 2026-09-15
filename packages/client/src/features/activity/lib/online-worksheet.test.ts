import { describe, expect, it } from 'vitest';
import { worksheetCells } from './online-worksheet';

const bySection = (track: 'korean' | 'english', id: string) => {
  const m = new Map<string, string[]>();
  for (const c of worksheetCells(track, id))
    m.set(c.section, [...(m.get(c.section) ?? []), c.write]);
  return Object.fromEntries(m);
};

describe('worksheetCells', () => {
  it('consonant unit: letter → syllables → words', () => {
    const s = bySection('korean', 'kr-h1-u02');
    expect(s['글자 쓰기']).toEqual(['ㄱ']);
    expect(s['글자 만들기']).toEqual(['가', '갸', '거', '겨', '고', '교', '구', '규', '그', '기']);
    expect(s['낱말 쓰기']).toEqual(['고기', '가구', '아기', '야구']);
  });
  it('Korean letters and syllables are written 3 times, words once; English once', () => {
    const cells = worksheetCells('korean', 'kr-h1-u02');
    expect(cells.find((c) => c.write === 'ㄱ')?.reps).toBe(3);
    expect(cells.find((c) => c.write === '가')?.reps).toBe(3);
    expect(cells.find((c) => c.write === '고기')?.reps).toBeUndefined();
    expect(worksheetCells('english', 'en-b2-u01').every((c) => !c.reps)).toBe(true);
  });
  it('coda unit never writes the coda alone', () => {
    const s = bySection('korean', 'kr-h2-u01');
    expect(s['글자 쓰기']).toBeUndefined();
    expect(s['글자 만들기'][0]).toBe('강');
  });
  it('basic vowels have no combo table; complex vowels combine with 14 consonants', () => {
    expect(bySection('korean', 'kr-h1-u01')['글자 만들기']).toBeUndefined();
    const cells = worksheetCells('korean', 'kr-h4-u01');
    expect(cells.find((c) => c.write === 'ㅐ')?.sound).toBe('애');
    expect(cells.filter((c) => c.section === '글자 만들기')).toHaveLength(28);
    expect(cells.some((c) => c.write === '개')).toBe(true);
  });
  it('English Book 1 writes upper+lower and only the first letter of words', () => {
    const cells = worksheetCells('english', 'en-b1-u01');
    expect(cells.slice(0, 2).map((c) => [c.write, c.wordSlot])).toEqual([
      ['A', 0],
      ['a', 1],
    ]);
    const apple = cells.find((c) => c.reveal === 'apple');
    expect(apple).toMatchObject({ write: 'a', sound: 'apple', section: 'Aa' });
    // 글자마다 한 묶음: A · a · a 낱말 → B
    expect(cells.slice(0, 6).map((c) => c.reveal ?? c.write)).toEqual([
      'A',
      'a',
      'alligator',
      'ant',
      'apple',
      'B',
    ]);
    // 첫 글자가 단원 글자가 아니면 들어 있는 글자로(box 의 x)
    expect(worksheetCells('english', 'en-b1-u08').find((c) => c.reveal === 'box')).toMatchObject({
      write: 'x',
      section: 'Xx',
    });
  });
  it('English Book 2 writes patterns then words, pattern first', () => {
    const cells = worksheetCells('english', 'en-b2-u01');
    expect(cells.slice(0, 2).map((c) => c.write)).toEqual(['an', 'at']);
    expect(cells.find((c) => c.write === 'can')?.order).toEqual([1, 2, 0]);
  });
});
