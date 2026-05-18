/**
 * 한글 음절 → phonics-library 7종성 대표 음절 매핑.
 *
 * `phonics-library/mod_korean/` 에는 ㄱ/ㄴ/ㄷ/ㄹ/ㅁ/ㅂ/ㅇ 받침 음절만 보유 (3232 음절 = 399×7 + 자모).
 * 한국어 종성 발음 변동에 따라 다른 받침은 대표음으로 중화 — 같은 음원 재사용으로 라이브러리 용량 절약.
 *
 * 매핑 (jongseong index 기준):
 *   ㄲ ㄳ ㄺ ㅋ → ㄱ(1)   /  ㄵ ㄶ → ㄴ(4)   /  ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ → ㄷ(7)
 *   ㄼ ㄽ ㄾ ㅀ → ㄹ(8)   /  ㄻ → ㅁ(16)    /  ㄿ ㅄ ㅍ → ㅂ(17)
 *
 * 예: 꽃(받침 ㅊ=27) → 꼳(받침 ㄷ=7), 앞(받침 ㅍ=26) → 압(받침 ㅂ=17), 밧(받침 ㅅ=19) → 받(ㄷ).
 *
 * 단일 source — `usePhonicsMap.addKoreanFinalAliases` (client) 와
 * `phonics-library.service.downloadSound` (server) 양쪽에서 import.
 */

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

export const KOREAN_FINAL_TO_REPRESENTATIVE: Record<number, number> = {
  2: 1, // ㄲ → ㄱ
  3: 1, // ㄳ → ㄱ
  9: 1, // ㄺ → ㄱ
  24: 1, // ㅋ → ㄱ
  5: 4, // ㄵ → ㄴ
  6: 4, // ㄶ → ㄴ
  19: 7, // ㅅ → ㄷ
  20: 7, // ㅆ → ㄷ
  22: 7, // ㅈ → ㄷ
  23: 7, // ㅊ → ㄷ
  25: 7, // ㅌ → ㄷ
  27: 7, // ㅎ → ㄷ
  11: 8, // ㄼ → ㄹ
  12: 8, // ㄽ → ㄹ
  13: 8, // ㄾ → ㄹ
  15: 8, // ㅀ → ㄹ
  10: 16, // ㄻ → ㅁ
  14: 17, // ㄿ → ㅂ
  18: 17, // ㅄ → ㅂ
  26: 17, // ㅍ → ㅂ
};

/**
 * 한글 음절 1개의 받침을 phonics-library 가 보유한 대표 종성으로 중화.
 * 변환이 필요 없거나 한글 음절이 아니면 null.
 *
 * @example
 *   neutralizeKoreanFinal('꽃') // → '꼳'
 *   neutralizeKoreanFinal('앞') // → '압'
 *   neutralizeKoreanFinal('가') // → null (받침 없음)
 *   neutralizeKoreanFinal('각') // → null (이미 대표 종성 ㄱ)
 *   neutralizeKoreanFinal('a')  // → null (한글 아님)
 */
export function neutralizeKoreanFinal(syllable: string): string | null {
  if (syllable.length !== 1) return null;
  const code = syllable.charCodeAt(0);
  if (code < HANGUL_START || code > HANGUL_END) return null;
  const offset = code - HANGUL_START;
  const jong = offset % 28;
  const aliasJong = KOREAN_FINAL_TO_REPRESENTATIVE[jong];
  if (aliasJong === undefined) return null;
  return String.fromCharCode(HANGUL_START + offset - jong + aliasJong);
}

/**
 * 대표 종성 음절(예: 갇)을 입력받아 그 음원으로 재사용 가능한 alias 음절 list 를 반환.
 * client `usePhonicsMap` 가 mod_korean 로드 후 map 에 alias key 추가할 때 사용.
 *
 * @example
 *   expandKoreanFinalAliases('갇') // → ['갓','갗','갖','같','갛']
 *   expandKoreanFinalAliases('가') // → [] (받침 없음, alias 대상 X)
 */
const REVERSE_FINAL_MAP: Record<number, number[]> = (() => {
  const reverse: Record<number, number[]> = {};
  for (const [from, to] of Object.entries(KOREAN_FINAL_TO_REPRESENTATIVE)) {
    const f = Number(from);
    if (!reverse[to]) reverse[to] = [];
    reverse[to].push(f);
  }
  return reverse;
})();

export function expandKoreanFinalAliases(representativeSyllable: string): string[] {
  if (representativeSyllable.length !== 1) return [];
  const code = representativeSyllable.charCodeAt(0);
  if (code < HANGUL_START || code > HANGUL_END) return [];
  const offset = code - HANGUL_START;
  const jong = offset % 28;
  const aliases = REVERSE_FINAL_MAP[jong];
  if (!aliases) return [];
  return aliases.map((aliasJong) => String.fromCharCode(HANGUL_START + offset - jong + aliasJong));
}
