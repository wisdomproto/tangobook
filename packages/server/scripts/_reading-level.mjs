// 독서 레벨 판정 — 🔴 이 규칙의 **유일한 사본**이다.
//
// `audit-reading-levels.mjs`(감사표)와 `build-content-status.mjs`(현황판)가 둘 다 이걸 쓴다.
// 🔴 복사해서 쓰지 마라 — 한쪽만 고치면 같은 책이 두 레벨을 갖게 된다.
//
//   L1 씨앗 3~4세 · 1문장/쪽 · 총 ≤50낱말 · 반복 구문
//   L2 새싹 4~6세 · 1~4문장/쪽 · 총 80~350낱말
//   L3 나무 6~7세 · 3~5문장/쪽 · 총 400~700낱말
//
// 낱말 = 한국어 **어절**(공백 분리). 문장 = 종결부호 개수(쪽당 최소 1).
// 경계값(60·380)이 타입 정의(50·350)보다 느슨한 건 실물이 딱 떨어지지 않아서다.

export const LEVELS = ['L1', 'L2', 'L3'];

/** 총 어절 수와 쪽당 문장 수로 레벨을 매긴다. 낱말 수를 먼저 본다(문장 수는 보조). */
export function classify(words, sentPerPage) {
  if (words === 0) return null;
  if (words <= 60 && sentPerPage <= 1.6) return 'L1';
  if (words <= 380) return 'L2';
  return 'L3';
}

/** 본문 쪽에서 어절·문장·글 있는 쪽수를 잰다. */
export function measure(sb) {
  const pages = Array.isArray(sb.pages) ? sb.pages : [];
  let words = 0;
  let sentences = 0;
  let textPages = 0;
  for (const p of pages) {
    const t = p && typeof p.text === 'string' ? p.text.trim() : '';
    if (!t) continue;
    textPages++;
    words += t.split(/\s+/).filter(Boolean).length;
    const marks = (t.match(/[.!?…]|[。！？]/g) || []).length;
    sentences += Math.max(1, marks);
  }
  return { words, textPages, sentPerPage: textPages ? sentences / textPages : 0 };
}
