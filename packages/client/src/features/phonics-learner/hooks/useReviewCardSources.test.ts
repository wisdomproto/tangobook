import { describe, it, expect } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { pickWord } from './useReviewCardSources';
import type { ReviewCard } from '../lib/korean-phonics-units';

/** ㄱ 단원(kr-h1-u02)의 실제 낱말 — 넷 다 그림이 있다. */
const 기역단원 = {
  flashcards: [
    { word: '고기', imageUrl: 'a' },
    { word: '가구', imageUrl: 'b' },
    { word: '아기', imageUrl: 'c' },
    { word: '야구', imageUrl: 'd' },
  ],
} as unknown as Storybook;

const card = (letter: string): ReviewCard => ({
  unitId: 'kr-h1-u02',
  letter,
  syllable: letter,
  sound: letter,
  matchPosition: 'cho',
});

describe('pickWord', () => {
  /**
   * 🔴 예전엔 최고점 하나를 `score > bestScore` 로 뽑아 **동점이면 늘 앞엣것**이 이겼고,
   *    복습에 몇 번을 들어가도 낱말 4개가 그대로였다(사용자 지적).
   */
  it('동점 후보 중에서 무작위로 뽑는다', () => {
    const 뽑힌것 = new Set<string>();
    for (let i = 0; i < 20; i++) {
      뽑힌것.add(pickWord(기역단원, card('ㄱ'), [], () => i / 20).word);
    }
    // ㄱ 으로 **시작하는** 둘이 +3 동점이라 둘 다 나와야 한다.
    expect(뽑힌것).toEqual(new Set(['고기', '가구']));
  });

  it('점수는 여전히 자격 요건이다 — 그 글자를 안 보여주는 낱말은 안 뽑는다', () => {
    // ㄱ 이 첫 음절에 있는 낱말이 있으면, 둘째 음절에만 있는 것(아기·야구)은 후보에서 빠진다.
    for (let i = 0; i < 20; i++) {
      expect(['고기', '가구']).toContain(pickWord(기역단원, card('ㄱ'), [], () => i / 20).word);
    }
  });

  it('같은 화면의 다른 카드와 첫 글자가 겹치면 피한다', () => {
    // 옆에 ㅇ 카드가 있으면 `아기`(첫소리 ㅇ)는 정답이 두 개로 보이므로 −4 → `모기`만 남는다.
    // (둘 다 ㄱ 은 둘째 음절이라 +1 로 같다 — 갈리는 건 첫소리 겹침뿐이다.)
    const 둘째음절만 = {
      flashcards: [
        { word: '아기', imageUrl: 'a' },
        { word: '모기', imageUrl: 'b' },
      ],
    } as unknown as Storybook;
    for (let i = 0; i < 20; i++) {
      expect(pickWord(둘째음절만, card('ㄱ'), ['ㅇ'], () => i / 20).word).toBe('모기');
    }
  });
});
