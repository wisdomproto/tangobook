import type { Storybook, KoreanCharacterMatchingData, LineMatchingItem } from '@tangobook/shared';

/** 카드 3장 미만이면 짝짓기가 성립하지 않는다(둘이면 눈 감고도 맞다). */
const MIN_ITEMS = 3;
const MAX_ITEMS = 4;

/**
 * `characters[].name` 은 **저작 식별자**라 아이에게 그대로 보여줄 수 없다.
 * 전래·명작 420명 실측: 괄호 상태표기 20(`새선비(구렁이)`) · 숫자 접미 15(`난쟁이1`).
 * 괄호·숫자를 떼면 **같은 인물이 여러 항목**으로 남으므로(변신 캐릭터는 상태별 레퍼런스가 규칙),
 * 정규화 후 중복은 첫 레퍼런스만 남긴다 — 안 그러면 이름이 같은 카드 두 장이 나와 짝을 못 짓는다.
 */
export function displayCharacterName(raw: string): string {
  return raw
    .replace(/[（(].*$/, '')
    .replace(/\s*\d+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 동화책 → 「인물 짝 찾기」 데이터 (한국어).
 * 낱말·낱말 카드가 아니라 등장인물 레퍼런스 그림에서 나오므로, `key_objects` 가 얇은 책에서도 뜬다.
 */
export function buildCharacterMatchingData(
  book: Storybook | undefined
): KoreanCharacterMatchingData | null {
  if (!book) return null;
  const seen = new Set<string>();
  const items: LineMatchingItem[] = [];
  for (const c of book.characters ?? []) {
    if (!c.referenceImage || !c.name) continue;
    const word = displayCharacterName(c.name);
    // 한글 이름만 — 정규화 후 빈 문자열이거나 숫자·영문만 남은 항목은 카드가 못 된다.
    if (!word || !/[가-힣]/.test(word) || seen.has(word)) continue;
    seen.add(word);
    items.push({ word, imageUrl: c.referenceImage });
  }
  if (items.length < MIN_ITEMS) return null;
  return { type: 'korean-character-matching', items: shuffle(items).slice(0, MAX_ITEMS) };
}
