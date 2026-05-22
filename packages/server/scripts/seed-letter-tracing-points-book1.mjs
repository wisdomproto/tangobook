#!/usr/bin/env node
/**
 * 영어 파닉스 Book 1 (en-b1-u01 ~ u08) 알파벳 글자 따라쓰기 점 채우기.
 *
 * 좌표 시스템:
 *   1. 각 글자 점을 **글자 boundbox 0~1** 기준으로 정의 (x: 좌=0, 우=1 / y: 위=0, 아래=1).
 *   2. `mapCap` 으로 SVG viewBox (0~1) 좌표로 변환.
 *
 * SVG 글자 배경: <text x=0.5 y=0.55 fontSize=0.85 textAnchor=middle dominantBaseline=central>
 *   - 측정된 글자 cap boundbox: viewBox 의 (0.27, 0.32) ~ (0.73, 0.78)
 *   - 소문자도 같은 box (글자가 그 안에서 더 작게 그려지지만 점은 box 내 비율로 위치)
 *   - descender (g/j/p/q/y) 는 y > 1 사용 가능 (boundbox 살짝 아래로 벗어남 OK)
 *
 * Stroke order: Zaner-Bloser block letter 표준 (위→아래, 좌→우, 직선 먼저, 곡선 반시계)
 *
 * 사용:
 *   node scripts/seed-letter-tracing-points-book1.mjs            # dry-run
 *   node scripts/seed-letter-tracing-points-book1.mjs --apply
 */
const API_BASE = process.env.API_BASE || 'http://localhost:3500';
const APPLY = process.argv.includes('--apply');

// 글자 boundbox (viewBox 좌표) — fontSize 0.85, central baseline 기준 측정.
const CAP_X_MIN = 0.27;
const CAP_X_MAX = 0.73;
const CAP_Y_MIN = 0.32;
const CAP_Y_MAX = 0.78;
const CAP_W = CAP_X_MAX - CAP_X_MIN;
const CAP_H = CAP_Y_MAX - CAP_Y_MIN;

// 점을 글자 stroke 중심 쪽으로 inset — 외곽선 모서리가 아닌 획 두께 중앙에 점이 오도록.
// INSET = 글자 chunky weight 900 의 stroke 두께 절반 추정 (boundbox 의 ~12%).
const INSET = 0.12;
const EFF_W = CAP_W * (1 - 2 * INSET);
const EFF_H = CAP_H * (1 - 2 * INSET);

/** boundbox 0~1 좌표 → viewBox 0~1 좌표 변환. y > 1 (descender) 허용. INSET 적용해 stroke 중심에 위치. */
function mapCap(p) {
  return {
    x: CAP_X_MIN + CAP_W * INSET + p.x * EFF_W,
    y: CAP_Y_MIN + CAP_H * INSET + p.y * EFF_H,
  };
}

// ─── 대문자 (글자 boundbox 0~1, Zaner-Bloser stroke order) ───
const UPPER = {
  A: [
    // stroke 1: 꼭지점 → 좌하 (좌측 대각선)
    { x: 0.5, y: 0 },
    { x: 0, y: 1 },
    // stroke 2: 꼭지점 (같은 자리) → 우하 (우측 대각선)
    { x: 0.5, y: 0 },
    { x: 1, y: 1 },
    // stroke 3: 가로
    { x: 0.25, y: 0.65 },
    { x: 0.75, y: 0.65 },
  ],
  B: [
    // stroke 1: 수직
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    // stroke 2: 위 곡선
    { x: 0, y: 0 },
    { x: 0.55, y: 0.05 },
    { x: 0.8, y: 0.25 },
    { x: 0.55, y: 0.48 },
    { x: 0, y: 0.5 },
    // stroke 3: 아래 곡선
    { x: 0, y: 0.5 },
    { x: 0.65, y: 0.52 },
    { x: 0.95, y: 0.75 },
    { x: 0.65, y: 0.98 },
    { x: 0, y: 1 },
  ],
  C: [
    { x: 0.95, y: 0.15 },
    { x: 0.55, y: 0 },
    { x: 0.2, y: 0.1 },
    { x: 0, y: 0.4 },
    { x: 0.05, y: 0.75 },
    { x: 0.35, y: 0.95 },
    { x: 0.95, y: 0.85 },
  ],
  D: [
    // 수직
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    // 곡선
    { x: 0, y: 0 },
    { x: 0.55, y: 0.05 },
    { x: 0.9, y: 0.3 },
    { x: 0.95, y: 0.65 },
    { x: 0.6, y: 0.95 },
    { x: 0, y: 1 },
  ],
  E: [
    // 수직 먼저
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    // 위 가로
    { x: 0, y: 0 },
    { x: 0.95, y: 0 },
    // 중 가로
    { x: 0, y: 0.5 },
    { x: 0.8, y: 0.5 },
    // 아래 가로
    { x: 0, y: 1 },
    { x: 0.95, y: 1 },
  ],
  F: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 0 },
    { x: 0.95, y: 0 },
    { x: 0, y: 0.5 },
    { x: 0.8, y: 0.5 },
  ],
  G: [
    { x: 0.95, y: 0.15 },
    { x: 0.55, y: 0 },
    { x: 0.2, y: 0.1 },
    { x: 0, y: 0.4 },
    { x: 0.05, y: 0.75 },
    { x: 0.35, y: 0.95 },
    { x: 0.95, y: 0.85 },
    { x: 0.95, y: 0.55 },
    { x: 0.55, y: 0.55 },
  ],
  H: [
    // 좌 수직
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    // 우 수직
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    // 가로
    { x: 0, y: 0.5 },
    { x: 1, y: 0.5 },
  ],
  I: [
    // 위 가로
    { x: 0.1, y: 0 },
    { x: 0.9, y: 0 },
    // 수직
    { x: 0.5, y: 0 },
    { x: 0.5, y: 1 },
    // 아래 가로
    { x: 0.1, y: 1 },
    { x: 0.9, y: 1 },
  ],
  J: [
    { x: 0.7, y: 0 },
    { x: 0.7, y: 0.75 },
    { x: 0.5, y: 0.95 },
    { x: 0.15, y: 0.85 },
  ],
  K: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    // 우상 → 중
    { x: 1, y: 0 },
    { x: 0.1, y: 0.55 },
    // 중 → 우하
    { x: 1, y: 1 },
  ],
  L: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  M: [
    { x: 0, y: 1 },
    { x: 0, y: 0 },
    { x: 0.5, y: 0.75 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ],
  N: [
    { x: 0, y: 1 },
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 1, y: 0 },
  ],
  O: [
    // "circle back" 반시계 — 위 시작 → 좌 → 하 → 우 → 위
    { x: 0.5, y: 0 },
    { x: 0.15, y: 0.15 },
    { x: 0, y: 0.5 },
    { x: 0.15, y: 0.85 },
    { x: 0.5, y: 1 },
    { x: 0.85, y: 0.85 },
    { x: 1, y: 0.5 },
    { x: 0.85, y: 0.15 },
    { x: 0.5, y: 0 },
  ],
  P: [
    { x: 0, y: 1 },
    { x: 0, y: 0 },
    { x: 0.55, y: 0.05 },
    { x: 0.85, y: 0.25 },
    { x: 0.55, y: 0.48 },
    { x: 0, y: 0.5 },
  ],
  Q: [
    // O + 꼬리
    { x: 0.5, y: 0 },
    { x: 0.15, y: 0.15 },
    { x: 0, y: 0.5 },
    { x: 0.15, y: 0.85 },
    { x: 0.5, y: 1 },
    { x: 0.85, y: 0.85 },
    { x: 1, y: 0.5 },
    { x: 0.85, y: 0.15 },
    { x: 0.5, y: 0 },
    { x: 0.65, y: 0.65 },
    { x: 1.05, y: 1.1 },
  ],
  R: [
    { x: 0, y: 1 },
    { x: 0, y: 0 },
    { x: 0.55, y: 0.05 },
    { x: 0.85, y: 0.25 },
    { x: 0.55, y: 0.48 },
    { x: 0, y: 0.5 },
    // 다리
    { x: 0.4, y: 0.5 },
    { x: 1, y: 1 },
  ],
  S: [
    { x: 0.95, y: 0.15 },
    { x: 0.55, y: 0 },
    { x: 0.15, y: 0.15 },
    { x: 0.15, y: 0.4 },
    { x: 0.5, y: 0.55 },
    { x: 0.85, y: 0.7 },
    { x: 0.85, y: 0.9 },
    { x: 0.5, y: 1 },
    { x: 0.05, y: 0.85 },
  ],
  T: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0.5, y: 0 },
    { x: 0.5, y: 1 },
  ],
  U: [
    { x: 0, y: 0 },
    { x: 0, y: 0.7 },
    { x: 0.2, y: 0.95 },
    { x: 0.8, y: 0.95 },
    { x: 1, y: 0.7 },
    { x: 1, y: 0 },
  ],
  V: [
    { x: 0, y: 0 },
    { x: 0.5, y: 1 },
    { x: 1, y: 0 },
  ],
  W: [
    { x: 0, y: 0 },
    { x: 0.25, y: 1 },
    { x: 0.5, y: 0.4 },
    { x: 0.75, y: 1 },
    { x: 1, y: 0 },
  ],
  X: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ],
  Y: [
    { x: 0, y: 0 },
    { x: 0.5, y: 0.5 },
    { x: 1, y: 0 },
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 1 },
  ],
  Z: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
};

// ─── 소문자 (boundbox 0~1. x-height 글자는 y 0.4~1, ascender 0~1, descender 0.4~1.3) ───
const LOWER = {
  a: [
    // 원 (반시계, x-height area)
    { x: 0.85, y: 0.5 },
    { x: 0.5, y: 0.4 },
    { x: 0.15, y: 0.5 },
    { x: 0.05, y: 0.7 },
    { x: 0.15, y: 0.95 },
    { x: 0.55, y: 1 },
    { x: 0.85, y: 0.9 },
    { x: 0.85, y: 0.5 },
    // 수직 stroke (꼬리)
    { x: 0.85, y: 1 },
  ],
  b: [
    // 수직 (ascender)
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    // 곡선 (x-height area)
    { x: 0, y: 0.55 },
    { x: 0.4, y: 0.45 },
    { x: 0.75, y: 0.55 },
    { x: 0.85, y: 0.75 },
    { x: 0.75, y: 0.95 },
    { x: 0.4, y: 1 },
    { x: 0, y: 0.92 },
  ],
  c: [
    { x: 0.85, y: 0.55 },
    { x: 0.55, y: 0.4 },
    { x: 0.2, y: 0.5 },
    { x: 0.05, y: 0.75 },
    { x: 0.2, y: 0.95 },
    { x: 0.55, y: 1 },
    { x: 0.95, y: 0.9 },
  ],
  d: [
    // 곡선 먼저 (a 와 같은 원)
    { x: 0.85, y: 0.55 },
    { x: 0.5, y: 0.4 },
    { x: 0.15, y: 0.5 },
    { x: 0.05, y: 0.7 },
    { x: 0.15, y: 0.95 },
    { x: 0.5, y: 1 },
    { x: 0.85, y: 0.95 },
    // 수직 (ascender)
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ],
  e: [
    // 가로 stroke (e 의 특징)
    { x: 0.1, y: 0.72 },
    { x: 0.85, y: 0.72 },
    // 곡선
    { x: 0.85, y: 0.55 },
    { x: 0.55, y: 0.4 },
    { x: 0.2, y: 0.5 },
    { x: 0.05, y: 0.75 },
    { x: 0.2, y: 0.95 },
    { x: 0.55, y: 1 },
    { x: 0.95, y: 0.9 },
  ],
  f: [
    // 위 곡선
    { x: 0.8, y: 0.1 },
    { x: 0.4, y: 0 },
    { x: 0.2, y: 0.15 },
    // 수직
    { x: 0.2, y: 1 },
    // 가로
    { x: 0, y: 0.5 },
    { x: 0.6, y: 0.5 },
  ],
  g: [
    // 원
    { x: 0.85, y: 0.55 },
    { x: 0.5, y: 0.4 },
    { x: 0.15, y: 0.5 },
    { x: 0.1, y: 0.7 },
    { x: 0.5, y: 0.95 },
    { x: 0.85, y: 0.85 },
    { x: 0.85, y: 0.5 },
    // descender
    { x: 0.85, y: 1.1 },
    { x: 0.55, y: 1.3 },
    { x: 0.15, y: 1.25 },
  ],
  h: [
    // 수직 (ascender)
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    // 곡선
    { x: 0, y: 0.6 },
    { x: 0.4, y: 0.45 },
    { x: 0.75, y: 0.55 },
    { x: 0.95, y: 0.75 },
    { x: 0.95, y: 1 },
  ],
  i: [
    // 점
    { x: 0.5, y: 0.15 },
    // 수직
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 1 },
  ],
  j: [
    // 점
    { x: 0.6, y: 0.15 },
    // 수직 + descender
    { x: 0.6, y: 0.55 },
    { x: 0.6, y: 1.15 },
    { x: 0.4, y: 1.3 },
    { x: 0.05, y: 1.25 },
  ],
  k: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0.95, y: 0.5 },
    { x: 0.15, y: 0.75 },
    { x: 0.95, y: 1 },
  ],
  l: [
    { x: 0.5, y: 0 },
    { x: 0.5, y: 1 },
  ],
  m: [
    { x: 0, y: 1 },
    { x: 0, y: 0.5 },
    { x: 0.15, y: 0.4 },
    { x: 0.4, y: 0.55 },
    { x: 0.4, y: 1 },
    { x: 0.4, y: 0.5 },
    { x: 0.6, y: 0.4 },
    { x: 0.85, y: 0.55 },
    { x: 0.85, y: 1 },
  ],
  n: [
    { x: 0, y: 1 },
    { x: 0, y: 0.5 },
    { x: 0.3, y: 0.4 },
    { x: 0.7, y: 0.5 },
    { x: 0.95, y: 0.7 },
    { x: 0.95, y: 1 },
  ],
  o: [
    // 반시계
    { x: 0.5, y: 0.4 },
    { x: 0.15, y: 0.5 },
    { x: 0, y: 0.7 },
    { x: 0.15, y: 0.95 },
    { x: 0.5, y: 1.02 },
    { x: 0.85, y: 0.95 },
    { x: 1, y: 0.7 },
    { x: 0.85, y: 0.5 },
    { x: 0.5, y: 0.4 },
  ],
  p: [
    // 수직 + descender
    { x: 0, y: 0.4 },
    { x: 0, y: 1.25 },
    { x: 0, y: 1 },
    // 곡선
    { x: 0, y: 0.5 },
    { x: 0.4, y: 0.4 },
    { x: 0.8, y: 0.5 },
    { x: 0.95, y: 0.7 },
    { x: 0.8, y: 0.9 },
    { x: 0.4, y: 1 },
    { x: 0, y: 0.92 },
  ],
  q: [
    // 원 (반시계)
    { x: 0.85, y: 0.55 },
    { x: 0.5, y: 0.4 },
    { x: 0.15, y: 0.5 },
    { x: 0, y: 0.7 },
    { x: 0.15, y: 0.95 },
    { x: 0.5, y: 1 },
    { x: 0.85, y: 0.95 },
    // 수직 + descender
    { x: 1, y: 0.5 },
    { x: 1, y: 1.25 },
  ],
  r: [
    { x: 0.1, y: 1 },
    { x: 0.1, y: 0.5 },
    { x: 0.1, y: 0.55 },
    { x: 0.4, y: 0.4 },
    { x: 0.85, y: 0.45 },
  ],
  s: [
    { x: 0.85, y: 0.55 },
    { x: 0.55, y: 0.4 },
    { x: 0.15, y: 0.5 },
    { x: 0.2, y: 0.65 },
    { x: 0.5, y: 0.7 },
    { x: 0.85, y: 0.8 },
    { x: 0.85, y: 0.95 },
    { x: 0.45, y: 1 },
    { x: 0.05, y: 0.85 },
  ],
  t: [
    // 수직 (ascender 일부 — y=0.2 부터)
    { x: 0.5, y: 0.2 },
    { x: 0.5, y: 0.9 },
    { x: 0.7, y: 1 },
    // 가로
    { x: 0.15, y: 0.5 },
    { x: 0.85, y: 0.5 },
  ],
  u: [
    { x: 0, y: 0.5 },
    { x: 0, y: 0.85 },
    { x: 0.2, y: 1 },
    { x: 0.8, y: 1 },
    { x: 1, y: 0.85 },
    { x: 1, y: 0.5 },
    { x: 1, y: 1 },
  ],
  v: [
    { x: 0, y: 0.5 },
    { x: 0.5, y: 1 },
    { x: 1, y: 0.5 },
  ],
  w: [
    { x: 0, y: 0.5 },
    { x: 0.25, y: 1 },
    { x: 0.5, y: 0.7 },
    { x: 0.75, y: 1 },
    { x: 1, y: 0.5 },
  ],
  x: [
    { x: 0, y: 0.5 },
    { x: 1, y: 1 },
    { x: 1, y: 0.5 },
    { x: 0, y: 1 },
  ],
  y: [
    { x: 0, y: 0.5 },
    { x: 0.5, y: 0.95 },
    { x: 1, y: 0.5 },
    { x: 0.5, y: 0.95 },
    { x: 0.15, y: 1.3 },
  ],
  z: [
    { x: 0, y: 0.5 },
    { x: 1, y: 0.5 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
};

const UNIT_IDS = [
  'en-b1-u01', 'en-b1-u02', 'en-b1-u03', 'en-b1-u04',
  'en-b1-u05', 'en-b1-u06', 'en-b1-u07', 'en-b1-u08',
];

async function getBook(id) {
  const r = await fetch(`${API_BASE}/api/storybooks/${id}`);
  if (!r.ok) throw new Error(`GET ${id}: ${r.status}`);
  return (await r.json()).data;
}
async function putBook(sb) {
  const r = await fetch(`${API_BASE}/api/storybooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storybook: sb }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`PUT ${sb.id}: ${r.status} ${t}`);
  }
}

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'}`);
console.log(`Cap boundbox: x=[${CAP_X_MIN},${CAP_X_MAX}] y=[${CAP_Y_MIN},${CAP_Y_MAX}]\n`);

let totalLetters = 0;
let totalPoints = 0;

for (const id of UNIT_IDS) {
  const sb = await getBook(id);
  const blending = sb.phonicsLesson?.blending ?? [];
  console.log(`[${id}]`);
  for (let i = 0; i < blending.length; i++) {
    const b = blending[i];
    const U = (b.vowel ?? '').toUpperCase();
    const L = (b.consonant ?? b.vowel ?? '').toLowerCase();
    const upperLocal = UPPER[U];
    const lowerLocal = LOWER[L];
    if (!upperLocal || !lowerLocal) {
      console.log(`  ⚠ [${i}] ${U}${L}: 매핑 없음 (skip)`);
      continue;
    }
    b.letterTracingPointsUpper = upperLocal.map(mapCap);
    b.letterTracingPointsLower = lowerLocal.map(mapCap);
    totalLetters++;
    totalPoints += upperLocal.length + lowerLocal.length;
    console.log(`  ✓ [${i}] ${U}${L}: 대문자 ${upperLocal.length}점 / 소문자 ${lowerLocal.length}점`);
  }
  if (APPLY) {
    sb.updatedAt = new Date().toISOString();
    try {
      await putBook(sb);
      console.log(`  💾 저장 완료\n`);
    } catch (e) {
      console.error(`  ✗ 저장 실패: ${e.message}\n`);
    }
  } else {
    console.log();
  }
}

console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`총 ${totalLetters} 글자 / ${totalPoints} 점`);
if (!APPLY) console.log(`👀 DRY-RUN 종료. 실 적용은 \`--apply\``);
