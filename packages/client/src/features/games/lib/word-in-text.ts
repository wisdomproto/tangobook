/**
 * 본문에서 낱말을 **낱말로** 찾는다 — 글자 조각으로 찾으면 「공」이 「공주」에 걸린다.
 *
 * 🔴 2026-09-14 색칠 리빌에서 「공」을 칠했더니 「막내 [공]주가 살았어요」가 떴다(개구리 왕자는 14쪽이
 *    전부 「공주」라 조각 매칭으론 어느 쪽이든 걸린다). 한 글자 낱말이면 늘 생긴다.
 * 규칙: 앞이 글자가 아니고, 뒤가 글자가 아니거나 **조사**(한글)·복수 어미(영어)면 낱말이다.
 * 호출부는 이걸 먼저 보고, 하나도 없을 때만 예전 조각 매칭으로 물러난다(「사과했어요」류를 잃지 않게).
 */
const LETTER = /[가-힣a-z]/i;
const KO_PARTICLE =
  /^(에서|에게|한테|으로|이랑|처럼|보다|까지|부터|이에요|예요|이야|을|를|이|가|은|는|도|의|에|와|과|랑|로|만|야|아)(?![가-힣])/;
const EN_SUFFIX = /^(es|s)(?![a-z])/i;

export function wordIndices(text: string, word: string): number[] {
  if (!text || !word) return [];
  const t = text.toLowerCase();
  const w = word.toLowerCase();
  const hangul = /[가-힣]/.test(w);
  const out: number[] = [];
  for (let i = t.indexOf(w); i !== -1; i = t.indexOf(w, i + 1)) {
    const before = t[i - 1];
    const after = t.slice(i + w.length);
    if (before && LETTER.test(before)) continue;
    if (after && LETTER.test(after[0]) && !(hangul ? KO_PARTICLE : EN_SUFFIX).test(after)) continue;
    out.push(i);
  }
  return out;
}

export const hasWord = (text: string | undefined, word: string) =>
  !!text && wordIndices(text, word).length > 0;
