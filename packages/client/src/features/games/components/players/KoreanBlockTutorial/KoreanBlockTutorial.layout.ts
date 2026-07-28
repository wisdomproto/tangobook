import { decomposeWord, isVerticalVowel } from '@tangobook/shared';

export interface TutorialSyllable {
  cho: string;
  jung: string;
  choCell: [number, number];
  jungCell: [number, number];
  isVertical: boolean;
}

/**
 * 쉬움 레벨 단어 (CV, 받침 X) 의 정답 자모-셀 매핑 생성.
 * 좌→우 진행, 수직 모음 (ㅗㅛㅜㅠㅡ) 시 row 2 사용.
 * row 1 베이스 — 0행은 비워두고 시각 가운데.
 */
export function planTutorialLayout(word: string): TutorialSyllable[] {
  const syllables = decomposeWord(word);
  const plan: TutorialSyllable[] = [];
  let col = 0;
  for (const syl of syllables) {
    if (!syl.cho || !syl.jung) continue;
    const isVertical = isVerticalVowel(syl.jung);
    if (isVertical) {
      plan.push({
        cho: syl.cho,
        jung: syl.jung,
        choCell: [1, col],
        jungCell: [2, col],
        isVertical: true,
      });
      col += 1;
    } else {
      plan.push({
        cho: syl.cho,
        jung: syl.jung,
        choCell: [1, col],
        jungCell: [1, col + 1],
        isVertical: false,
      });
      col += 2;
    }
  }
  return plan;
}
