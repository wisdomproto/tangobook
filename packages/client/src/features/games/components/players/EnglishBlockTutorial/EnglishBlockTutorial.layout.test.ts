import { describe, it, expect } from 'vitest';
import { planEnglishTutorialLayout } from './EnglishBlockTutorial.layout';

describe('planEnglishTutorialLayout', () => {
  it('cat — 3글자', () => {
    expect(planEnglishTutorialLayout('cat')).toEqual([
      { letter: 'c', slot: 0 },
      { letter: 'a', slot: 1 },
      { letter: 't', slot: 2 },
    ]);
  });

  it('대소문자 — 소문자로 변환', () => {
    expect(planEnglishTutorialLayout('DOG')).toEqual([
      { letter: 'd', slot: 0 },
      { letter: 'o', slot: 1 },
      { letter: 'g', slot: 2 },
    ]);
  });

  it('빈 문자열', () => {
    expect(planEnglishTutorialLayout('')).toEqual([]);
  });

  it('단일 글자', () => {
    expect(planEnglishTutorialLayout('a')).toEqual([{ letter: 'a', slot: 0 }]);
  });
});
