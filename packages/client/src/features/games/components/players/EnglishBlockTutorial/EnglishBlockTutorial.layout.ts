export interface EnglishTutorialStep {
  letter: string;
  /** slot index — `data-slot` 와 매칭 */
  slot: number;
}

/**
 * 영어 단어 → 각 글자 → 슬롯 매핑.
 * EnglishBlockPlayer 의 cell key 는 슬롯 인덱스 문자열 (`'0'`, `'1'`, ...).
 */
export function planEnglishTutorialLayout(word: string): EnglishTutorialStep[] {
  const lower = word.toLowerCase();
  const plan: EnglishTutorialStep[] = [];
  for (let i = 0; i < lower.length; i++) {
    plan.push({ letter: lower[i], slot: i });
  }
  return plan;
}
