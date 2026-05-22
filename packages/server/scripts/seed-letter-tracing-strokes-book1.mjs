#!/usr/bin/env node
/**
 * 영어 파닉스 Book 1 (en-b1-u01 ~ u08) 알파벳 글자 따라쓰기 스트로크 채우기.
 * 신모델 (2026-05-22): `letterTracingStrokesUpper/Lower` — stroke 단위 채점.
 *
 * 좌표:
 *   1. 글자 boundbox 0~1 (x: 좌=0, 우=1 / y: 위=0, 아래=1).
 *   2. `mapCap` 으로 viewBox (0~1) 좌표 변환 (INSET=0.12 stroke 중앙 보정).
 *
 * Stroke type:
 *   - line: 2점 (start, end)
 *   - bend: 3점 (start, middle, end) — 꺾이는 곳
 *   - loop: 3+점 (start = last) — 닫힌 곡선
 *
 * A, B, C 만 정밀 정의 (테스트용). 나머지는 저작도구에서 만들 것.
 *
 * 사용:
 *   node scripts/seed-letter-tracing-strokes-book1.mjs            # dry-run
 *   node scripts/seed-letter-tracing-strokes-book1.mjs --apply
 */
const API_BASE = process.env.API_BASE || 'http://localhost:3500';
const APPLY = process.argv.includes('--apply');

// 글자 boundbox — fontSize=0.85, fontWeight=900 측정 (cap height 기준).
// 우측/하단 가장자리는 system-ui 의 캐릭터 advance width 가 글자별로 다르지만 평균치.
const CAP_X_MIN = 0.27;
const CAP_X_MAX = 0.73;
const CAP_Y_MIN = 0.32;
const CAP_Y_MAX = 0.78;
const CAP_W = CAP_X_MAX - CAP_X_MIN;
const CAP_H = CAP_Y_MAX - CAP_Y_MIN;
// 점이 글자 stroke 가운데에 위치하되 boundbox 가장자리 (글자 끝점) 까지 닿도록 INSET 줄임.
// INSET=0.07 ≈ stroke 두께 (≈ 0.07~0.08 of boundbox) 의 절반. 점이 stroke 가운데 + 끝까지 도달.
const INSET = 0.07;
const EFF_W = CAP_W * (1 - 2 * INSET);
const EFF_H = CAP_H * (1 - 2 * INSET);

function mapCap(p) {
  return {
    x: CAP_X_MIN + CAP_W * INSET + p.x * EFF_W,
    y: CAP_Y_MIN + CAP_H * INSET + p.y * EFF_H,
  };
}

function mapStroke(s) {
  return { type: s.type, points: s.points.map(mapCap) };
}

// ─── 대문자 (Zaner-Bloser block letter stroke order) ──────────────
const UPPER_STROKES = {
  A: [
    { type: 'line', points: [{ x: 0.5, y: 0 }, { x: 0, y: 1 }] },
    { type: 'line', points: [{ x: 0.5, y: 0 }, { x: 1, y: 1 }] },
    { type: 'line', points: [{ x: 0.25, y: 0.65 }, { x: 0.75, y: 0.65 }] },
  ],
  B: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'bend', points: [{ x: 0, y: 0 }, { x: 0.9, y: 0.2 }, { x: 0, y: 0.45 }] },
    { type: 'bend', points: [{ x: 0, y: 0.55 }, { x: 1.0, y: 0.75 }, { x: 0, y: 1 }] },
  ],
  C: [
    { type: 'bend', points: [{ x: 0.95, y: 0.15 }, { x: 0, y: 0.5 }, { x: 0.95, y: 0.85 }] },
  ],
  D: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'bend', points: [{ x: 0, y: 0 }, { x: 1, y: 0.5 }, { x: 0, y: 1 }] },
  ],
  E: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0.9, y: 0 }] },
    { type: 'line', points: [{ x: 0, y: 0.5 }, { x: 0.75, y: 0.5 }] },
    { type: 'line', points: [{ x: 0, y: 1 }, { x: 0.9, y: 1 }] },
  ],
  F: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0.9, y: 0 }] },
    { type: 'line', points: [{ x: 0, y: 0.5 }, { x: 0.75, y: 0.5 }] },
  ],
  G: [
    { type: 'bend', points: [{ x: 0.95, y: 0.15 }, { x: 0, y: 0.5 }, { x: 0.95, y: 0.85 }] },
    { type: 'line', points: [{ x: 0.95, y: 0.6 }, { x: 0.55, y: 0.6 }] },
  ],
  H: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'line', points: [{ x: 1, y: 0 }, { x: 1, y: 1 }] },
    { type: 'line', points: [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }] },
  ],
  I: [
    { type: 'line', points: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }] },
  ],
  J: [
    { type: 'bend', points: [{ x: 0.95, y: 0 }, { x: 0.95, y: 0.8 }, { x: 0.15, y: 0.95 }] },
  ],
  K: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'line', points: [{ x: 0.9, y: 0 }, { x: 0, y: 0.55 }] },
    { type: 'line', points: [{ x: 0, y: 0.55 }, { x: 0.95, y: 1 }] },
  ],
  L: [
    { type: 'bend', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0.95, y: 1 }] },
  ],
  M: [
    { type: 'line', points: [{ x: 0, y: 1 }, { x: 0, y: 0 }] },
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0.5, y: 0.7 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.7 }, { x: 1, y: 0 }] },
    { type: 'line', points: [{ x: 1, y: 0 }, { x: 1, y: 1 }] },
  ],
  N: [
    { type: 'line', points: [{ x: 0, y: 1 }, { x: 0, y: 0 }] },
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
    { type: 'line', points: [{ x: 1, y: 1 }, { x: 1, y: 0 }] },
  ],
  O: [
    {
      type: 'loop',
      points: [
        { x: 0.5, y: 0 },
        { x: 0, y: 0.5 },
        { x: 0.5, y: 1 },
        { x: 1, y: 0.5 },
        { x: 0.5, y: 0 },
      ],
    },
  ],
  P: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'bend', points: [{ x: 0, y: 0 }, { x: 0.95, y: 0.25 }, { x: 0, y: 0.5 }] },
  ],
  Q: [
    {
      type: 'loop',
      points: [
        { x: 0.5, y: 0 },
        { x: 0, y: 0.5 },
        { x: 0.5, y: 1 },
        { x: 1, y: 0.5 },
        { x: 0.5, y: 0 },
      ],
    },
    { type: 'line', points: [{ x: 0.65, y: 0.7 }, { x: 1, y: 1.05 }] },
  ],
  R: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'bend', points: [{ x: 0, y: 0 }, { x: 0.95, y: 0.25 }, { x: 0, y: 0.5 }] },
    { type: 'line', points: [{ x: 0, y: 0.5 }, { x: 1, y: 1 }] },
  ],
  S: [
    { type: 'bend', points: [{ x: 0.9, y: 0.1 }, { x: 0.1, y: 0.35 }, { x: 0.9, y: 0.5 }] },
    { type: 'bend', points: [{ x: 0.9, y: 0.5 }, { x: 0.1, y: 0.65 }, { x: 0.9, y: 0.9 }] },
  ],
  T: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
    { type: 'line', points: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }] },
  ],
  U: [
    { type: 'bend', points: [{ x: 0, y: 0 }, { x: 0.5, y: 1 }, { x: 1, y: 0 }] },
  ],
  V: [
    { type: 'bend', points: [{ x: 0, y: 0 }, { x: 0.5, y: 1 }, { x: 1, y: 0 }] },
  ],
  W: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0.3, y: 1 }] },
    { type: 'line', points: [{ x: 0.3, y: 1 }, { x: 0.5, y: 0.4 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.4 }, { x: 0.7, y: 1 }] },
    { type: 'line', points: [{ x: 0.7, y: 1 }, { x: 1, y: 0 }] },
  ],
  X: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
    { type: 'line', points: [{ x: 1, y: 0 }, { x: 0, y: 1 }] },
  ],
  Y: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0.5, y: 0.5 }] },
    { type: 'line', points: [{ x: 1, y: 0 }, { x: 0.5, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.5 }, { x: 0.5, y: 1 }] },
  ],
  Z: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
    { type: 'line', points: [{ x: 1, y: 0 }, { x: 0, y: 1 }] },
    { type: 'line', points: [{ x: 0, y: 1 }, { x: 1, y: 1 }] },
  ],
};

// ─── 소문자 (사용자 a 패턴: line + bend 분리) ──────────────
const LOWER_STROKES = {
  a: [
    // 우측 수직선
    { type: 'line', points: [{ x: 0.85, y: 0.3 }, { x: 0.85, y: 1 }] },
    // 둥근 부분 (bend 3점)
    { type: 'bend', points: [{ x: 0.85, y: 0.4 }, { x: 0.15, y: 0.65 }, { x: 0.85, y: 0.9 }] },
  ],
  b: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    {
      type: 'loop',
      points: [
        { x: 0, y: 0.5 },
        { x: 0.9, y: 0.55 },
        { x: 0.9, y: 0.9 },
        { x: 0, y: 0.95 },
        { x: 0, y: 0.5 },
      ],
    },
  ],
  c: [
    { type: 'bend', points: [{ x: 0.9, y: 0.45 }, { x: 0, y: 0.7 }, { x: 0.9, y: 0.95 }] },
  ],
  d: [
    { type: 'line', points: [{ x: 0.9, y: 0 }, { x: 0.9, y: 1 }] },
    { type: 'bend', points: [{ x: 0.9, y: 0.5 }, { x: 0.05, y: 0.7 }, { x: 0.9, y: 0.95 }] },
  ],
  e: [
    { type: 'bend', points: [{ x: 0.95, y: 0.55 }, { x: 0, y: 0.7 }, { x: 0.95, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.2, y: 0.65 }, { x: 0.85, y: 0.65 }] },
  ],
  f: [
    { type: 'bend', points: [{ x: 0.85, y: 0.1 }, { x: 0.3, y: 0.1 }, { x: 0.3, y: 1 }] },
    { type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.6, y: 0.5 }] },
  ],
  g: [
    {
      type: 'loop',
      points: [
        { x: 0.95, y: 0.5 },
        { x: 0.1, y: 0.6 },
        { x: 0.1, y: 0.85 },
        { x: 0.95, y: 0.95 },
        { x: 0.95, y: 0.5 },
      ],
    },
    { type: 'bend', points: [{ x: 0.95, y: 0.5 }, { x: 0.95, y: 1.1 }, { x: 0.1, y: 1.2 }] },
  ],
  h: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'bend', points: [{ x: 0, y: 0.55 }, { x: 0.85, y: 0.6 }, { x: 0.85, y: 1 }] },
  ],
  i: [
    { type: 'line', points: [{ x: 0.5, y: 0.4 }, { x: 0.5, y: 1 }] },
    // 점 (짧은 line 으로 표현)
    { type: 'line', points: [{ x: 0.5, y: 0.15 }, { x: 0.5, y: 0.22 }] },
  ],
  j: [
    { type: 'bend', points: [{ x: 0.7, y: 0.4 }, { x: 0.7, y: 1.05 }, { x: 0.05, y: 1.2 }] },
    // 점
    { type: 'line', points: [{ x: 0.7, y: 0.15 }, { x: 0.7, y: 0.22 }] },
  ],
  k: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'line', points: [{ x: 0.85, y: 0.5 }, { x: 0, y: 0.75 }] },
    { type: 'line', points: [{ x: 0, y: 0.75 }, { x: 0.9, y: 1 }] },
  ],
  l: [
    { type: 'line', points: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }] },
  ],
  m: [
    { type: 'line', points: [{ x: 0, y: 1 }, { x: 0, y: 0.5 }] },
    { type: 'bend', points: [{ x: 0, y: 0.5 }, { x: 0.5, y: 0.45 }, { x: 0.5, y: 1 }] },
    { type: 'bend', points: [{ x: 0.5, y: 0.5 }, { x: 1, y: 0.45 }, { x: 1, y: 1 }] },
  ],
  n: [
    { type: 'line', points: [{ x: 0, y: 1 }, { x: 0, y: 0.5 }] },
    { type: 'bend', points: [{ x: 0, y: 0.5 }, { x: 0.9, y: 0.45 }, { x: 0.9, y: 1 }] },
  ],
  o: [
    {
      type: 'loop',
      points: [
        { x: 0.5, y: 0.4 },
        { x: 0.05, y: 0.7 },
        { x: 0.5, y: 0.95 },
        { x: 0.95, y: 0.7 },
        { x: 0.5, y: 0.4 },
      ],
    },
  ],
  p: [
    { type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.05, y: 1.15 }] },
    {
      type: 'loop',
      points: [
        { x: 0.05, y: 0.5 },
        { x: 0.9, y: 0.55 },
        { x: 0.9, y: 0.85 },
        { x: 0.05, y: 0.9 },
        { x: 0.05, y: 0.5 },
      ],
    },
  ],
  q: [
    {
      type: 'loop',
      points: [
        { x: 0.95, y: 0.5 },
        { x: 0.1, y: 0.55 },
        { x: 0.1, y: 0.85 },
        { x: 0.95, y: 0.9 },
        { x: 0.95, y: 0.5 },
      ],
    },
    { type: 'line', points: [{ x: 0.95, y: 0.5 }, { x: 0.95, y: 1.15 }] },
  ],
  r: [
    { type: 'line', points: [{ x: 0, y: 0.5 }, { x: 0, y: 1 }] },
    { type: 'bend', points: [{ x: 0, y: 0.55 }, { x: 0.5, y: 0.45 }, { x: 0.85, y: 0.55 }] },
  ],
  s: [
    { type: 'bend', points: [{ x: 0.85, y: 0.5 }, { x: 0.15, y: 0.6 }, { x: 0.85, y: 0.75 }] },
    { type: 'bend', points: [{ x: 0.85, y: 0.75 }, { x: 0.15, y: 0.85 }, { x: 0.15, y: 0.95 }] },
  ],
  t: [
    { type: 'bend', points: [{ x: 0.5, y: 0.2 }, { x: 0.5, y: 0.95 }, { x: 0.85, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.15, y: 0.4 }, { x: 0.85, y: 0.4 }] },
  ],
  u: [
    { type: 'bend', points: [{ x: 0.15, y: 0.5 }, { x: 0.5, y: 1 }, { x: 0.85, y: 0.65 }] },
    { type: 'line', points: [{ x: 0.85, y: 0.5 }, { x: 0.85, y: 1 }] },
  ],
  v: [
    { type: 'bend', points: [{ x: 0.15, y: 0.5 }, { x: 0.5, y: 1 }, { x: 0.85, y: 0.5 }] },
  ],
  w: [
    { type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.3, y: 1 }] },
    { type: 'line', points: [{ x: 0.3, y: 1 }, { x: 0.5, y: 0.65 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.65 }, { x: 0.7, y: 1 }] },
    { type: 'line', points: [{ x: 0.7, y: 1 }, { x: 0.95, y: 0.5 }] },
  ],
  x: [
    { type: 'line', points: [{ x: 0.15, y: 0.5 }, { x: 0.85, y: 1 }] },
    { type: 'line', points: [{ x: 0.85, y: 0.5 }, { x: 0.15, y: 1 }] },
  ],
  y: [
    { type: 'line', points: [{ x: 0.15, y: 0.5 }, { x: 0.5, y: 0.9 }] },
    { type: 'bend', points: [{ x: 0.85, y: 0.5 }, { x: 0.5, y: 0.9 }, { x: 0.05, y: 1.2 }] },
  ],
  z: [
    { type: 'line', points: [{ x: 0.15, y: 0.5 }, { x: 0.85, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.85, y: 0.5 }, { x: 0.15, y: 1 }] },
    { type: 'line', points: [{ x: 0.15, y: 1 }, { x: 0.85, y: 1 }] },
  ],
};

// Book 1 의 8 unit 별 letter 매핑 (각 unit 의 blending[i] 와 매칭)
const UNIT_LETTERS = {
  'en-b1-u01': ['A', 'B', 'C'],
  'en-b1-u02': ['D', 'E', 'F'],
  'en-b1-u03': ['G', 'H', 'I'],
  'en-b1-u04': ['J', 'K', 'L'],
  'en-b1-u05': ['M', 'N', 'O'],
  'en-b1-u06': ['P', 'Q', 'R'],
  'en-b1-u07': ['S', 'T', 'U', 'V'],
  'en-b1-u08': ['W', 'X', 'Y', 'Z'],
};

async function fetchBook(id) {
  const r = await fetch(`${API_BASE}/api/storybooks/${id}`);
  if (!r.ok) throw new Error(`fetch ${id} failed: ${r.status}`);
  const j = await r.json();
  return j.data ?? j;
}

async function saveBook(storybook) {
  const r = await fetch(`${API_BASE}/api/storybooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storybook }),
  });
  if (!r.ok) throw new Error(`save ${storybook.id} failed: ${r.status} ${await r.text()}`);
}

async function processUnit(unitId, letters) {
  const book = await fetchBook(unitId);
  if (!book.phonicsLesson?.blending) {
    console.log(`  ${unitId}: no blending — skip`);
    return 0;
  }
  const blending = book.phonicsLesson.blending;
  let touched = 0;

  for (let i = 0; i < letters.length && i < blending.length; i++) {
    const letter = letters[i];
    const upper = UPPER_STROKES[letter];
    const lower = LOWER_STROKES[letter.toLowerCase()];

    const b = blending[i];
    if (upper) {
      b.letterTracingUpper = { strokes: upper.map(mapStroke), enforceOrder: true };
      touched++;
    }
    if (lower) {
      b.letterTracingLower = { strokes: lower.map(mapStroke), enforceOrder: true };
      touched++;
    }
  }

  console.log(`  ${unitId} (${letters.join('')}): ${touched} updates`);
  if (APPLY && touched > 0) {
    await saveBook(book);
  }
  return touched;
}

async function main() {
  console.log(APPLY ? 'APPLY mode' : 'DRY-RUN mode (use --apply to save)');
  let total = 0;
  for (const [unitId, letters] of Object.entries(UNIT_LETTERS)) {
    try {
      total += await processUnit(unitId, letters);
    } catch (e) {
      console.error(`  ${unitId}: ERROR ${e.message}`);
    }
  }
  console.log(`\nTotal updates: ${total} ${APPLY ? '(saved to R2)' : '(dry-run)'}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
