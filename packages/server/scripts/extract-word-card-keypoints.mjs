#!/usr/bin/env node
/**
 * 단어 카드 삽화의 윤곽에서 `keypoints`(낱말 그리기 폴리곤) 자동 추출.
 *
 * 낱말 그리기(ConnectTheDotsPlayer)는 2026-05-25 부터 "점 순서대로 잇기" 가 아니라
 * **keypoints 로 만든 폴리곤 안을 색칠**하는 게임이다. 그래서 필요한 건 정확한 점 순서가
 * 아니라 "사물 실루엣을 감싸는 단순 폐곡선" 하나 — 손으로 찍을 이유가 없다.
 *
 * 분할 = **테두리에서 배경을 흘려보내(flood) 지우기**. 픽셀마다 "배경색과 얼마나 다른가"로
 * 재는 방식은 이 카드들에 안 맞는다(흰 사물·옅은 그림자·비네팅이 전부 같은 거리에 있어
 * 임계를 만질 때마다 다른 카드가 깨졌다). 배경의 진짜 성질은 색이 아니라 **액자에 닿아 있고
 * 평평하다**는 것이다.
 *
 *   물 흘리기(평평 ∧ 배경색 ∧ 테두리 연결) → 남은 게 사물 → 열림(김·수염 제거)
 *   → 큰 덩어리들 → 볼록 껍질 → 호 길이 균등 N점 → 0~1 정규화 + order 1..N
 *
 * 사용:
 *   node packages/server/scripts/extract-word-card-keypoints.mjs --selftest
 *   node packages/server/scripts/extract-word-card-keypoints.mjs --preview        # 미리보기 PNG 만 생성
 *   node packages/server/scripts/extract-word-card-keypoints.mjs --preview --only=kr-h4-u03
 *   node packages/server/scripts/extract-word-card-keypoints.mjs --apply
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const PREVIEW = args.flags.has('preview');
const ONLY = args.only ? String(args.only) : null;
const POINTS = parseInt(args.points ?? '18', 10);
const THRESH = {
  edge: parseFloat(args.edge ?? '12'), // 배경 물이 넘지 못하는 기울기 (분할의 유일한 손잡이)
  open: parseInt(args.open ?? '3', 10), // 이 반지름의 열림으로 폭 2r 이하 실오라기 제거(김·수염)
};
const WORK = 192; // 분석 해상도 (작을수록 윤곽이 부드럽고 빠름)
const PREVIEW_DIR = args.out ? String(args.out) : path.join(__dirname, '_preview-keypoints');

// ── 순수 기하 ────────────────────────────────────────────────────────────────

const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

/**
 * 배경을 **테두리에서 흘려보내(flood) 지우는** 분할.
 *
 * 🔴 픽셀마다 "배경색과 얼마나 다른가"로 판정하는 방식은 이 카드들에 맞지 않는다 —
 * 크림 배경 위의 흰 사물, 작가가 그린 옅은 그림자, 카드마다 다른 비네팅이 전부
 * "배경에서 조금 떨어진 값"이라 임계 하나로 갈라지지 않고, 임계를 만질 때마다 다른 카드가
 * 깨진다(밝기 비대칭·결·모서리 보정을 차례로 붙였지만 매번 새 실패가 나왔다).
 *
 * 배경이 가진 진짜 성질은 색이 아니라 **연결성과 평탄함**이다: 배경은 액자에 닿아 있고
 * 기울기가 없다. 그래서 테두리에서 시작해 **기울기가 낮은 곳으로만** 물을 흘리면,
 * 물이 닿지 않은 곳이 사물이다. 비네팅은 기울기가 완만해 그냥 통과하고, 흰 사물도
 * 실루엣 경계에 기울기 마루가 서므로 물이 못 넘어온다. 손잡이는 `edge` 하나뿐이다.
 */
export function buildMaskByFlood(rgba, w, h, { edge = 6 } = {}) {
  const lums = new Float32Array(w * h);
  for (let i = 0, p = 0; i < lums.length; i++, p += 4) lums[i] = lum(rgba[p], rgba[p + 1], rgba[p + 2]);
  // 3×3 평균으로 jpeg 잡음을 죽인다 — 안 하면 평평한 배경에도 기울기가 서서 물이 막힌다.
  const sm = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          sum += lums[ny * w + nx];
          n++;
        }
      sm[y * w + x] = sum / n;
    }
  // Sobel 기울기 크기 + 색감 기울기(회색 사물이 회색 배경 위에 있을 때 대비)
  const at = (x, y) => sm[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  const chromaAt = (x, y) => {
    const p = (Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))) * 4;
    return [rgba[p] - rgba[p + 2], rgba[p + 1] - rgba[p + 2]]; // R-B, G-B
  };
  const grad = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const gx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
      const gy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
      const c0 = chromaAt(x - 1, y);
      const c1 = chromaAt(x + 1, y);
      const c2 = chromaAt(x, y - 1);
      const c3 = chromaAt(x, y + 1);
      const gc = Math.abs(c1[0] - c0[0]) + Math.abs(c1[1] - c0[1]) + Math.abs(c3[0] - c2[0]) + Math.abs(c3[1] - c2[1]);
      grad[y * w + x] = Math.hypot(gx, gy) / 4 + gc;
    }
  // 🔴 물을 아무 테두리 픽셀에서나 시작하면, **액자에 닿은 사물**(프레임 위까지 올라온 토끼)
  // 안쪽에서 물이 터져 사물을 통째로 먹는다. 시작점은 모서리 배경색과 닮은 테두리 픽셀만.
  const cornerBg = (() => {
    const box = Math.max(4, Math.round(Math.min(w, h) * 0.12));
    const idx = [];
    for (const [ox, oy] of [[0, 0], [w - box, 0], [0, h - box], [w - box, h - box]])
      for (let y = oy; y < oy + box; y++) for (let x = ox; x < ox + box; x++) idx.push((y * w + x) * 4);
    const med = (vals) => vals.sort((a, b) => a - b)[vals.length >> 1];
    return [0, 1, 2].map((c) => med(idx.map((i) => rgba[i + c])));
  })();
  const looksLikeBg = (i) => {
    const p = i * 4;
    return (
      Math.abs(rgba[p] - cornerBg[0]) +
        Math.abs(rgba[p + 1] - cornerBg[1]) +
        Math.abs(rgba[p + 2] - cornerBg[2]) <
      30
    );
  };
  const bgFlood = new Uint8Array(w * h);
  const stack = [];
  // 물이 흐르는 조건 = **평평하고(기울기) 배경색이고(색) 테두리에서 이어져 있을 것(연결성)**.
  // 셋 중 하나만 쓰면 각각 실패한다: 색만 보면 흰 사물이 배경이 되고, 기울기만 보면
  // 경계가 흐린 흰 사물(토끼 머리) 위로 물이 넘어가며, 연결성이 없으면 사물 안쪽 구멍이 뚫린다.
  const grow = (i) => {
    if (!bgFlood[i] && grad[i] <= edge && looksLikeBg(i)) {
      bgFlood[i] = 1;
      stack.push(i);
    }
  };
  const seed = grow;
  for (let x = 0; x < w; x++) (seed(x), seed((h - 1) * w + x));
  for (let y = 0; y < h; y++) (seed(y * w), seed(y * w + w - 1));
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) grow(i - 1);
    if (x < w - 1) grow(i + 1);
    if (y > 0) grow(i - w);
    if (y < h - 1) grow(i + w);
  }
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = bgFlood[i] ? 0 : 1;
  return { mask };
}

/**
 * 큰 덩어리만 남긴다 — 최대 덩어리와 그 `ratio` 이상인 것들.
 * 🔴 **최대 하나만** 남기면 주인공이 둘인 카드(얘기의 곰+토끼, 눈의 두 눈)에서 한쪽이 통째로
 * 폴리곤 밖으로 나간다. 반대로 전부 남기면 티끌·얼룩이 껍질을 부풀린다.
 */
export function largestComponent(mask, w, h, ratio = 0.25) {
  const label = new Int32Array(w * h).fill(-1);
  const sizes = new Map();
  let best = null;
  const stack = [];
  for (let s = 0; s < mask.length; s++) {
    if (!mask[s] || label[s] !== -1) continue;
    const id = s;
    let size = 0;
    stack.push(s);
    label[s] = id;
    while (stack.length) {
      const i = stack.pop();
      size++;
      const x = i % w;
      const y = (i / w) | 0;
      if (x > 0 && mask[i - 1] && label[i - 1] === -1) (label[i - 1] = id), stack.push(i - 1);
      if (x < w - 1 && mask[i + 1] && label[i + 1] === -1) (label[i + 1] = id), stack.push(i + 1);
      if (y > 0 && mask[i - w] && label[i - w] === -1) (label[i - w] = id), stack.push(i - w);
      if (y < h - 1 && mask[i + w] && label[i + w] === -1) (label[i + w] = id), stack.push(i + w);
    }
    sizes.set(id, size);
    if (!best || size > best.size) best = { id, size };
  }
  if (!best) return null;
  const keep = new Set(
    [...sizes].filter(([, size]) => size >= best.size * ratio).map(([id]) => id)
  );
  const out = new Uint8Array(w * h);
  let total = 0;
  for (let i = 0; i < out.length; i++)
    if (label[i] !== -1 && keep.has(label[i])) (out[i] = 1), total++;
  return { mask: out, size: total };
}

function morphPass(mask, w, h, r, grow) {
  const dst = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let hit = 0;
      for (let dy = -r; dy <= r && !hit; dy++)
        for (let dx = -r; dx <= r && !hit; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          const v = nx < 0 || ny < 0 || nx >= w || ny >= h ? 0 : mask[ny * w + nx];
          if (grow ? v : !v) hit = 1;
        }
      dst[y * w + x] = grow ? hit : hit ? 0 : 1;
    }
  return dst;
}

/** 반지름 r 팽창 후 수축 = 닫힘. 좁은 틈을 메운다. */
export function close(mask, w, h, r) {
  return morphPass(morphPass(mask, w, h, r, true), w, h, r, false);
}

/**
 * 반지름 r 수축 후 팽창 = 열림. **폭 2r 이하의 가느다란 것을 지운다.**
 * 🔴 이게 없으면 김(연기)·수염 같은 실오라기가 마스크에 남고, 뒤이은 닫힘이 그걸 몸통에
 * 이어붙여 폴리곤이 빈 배경까지 부풀어 오른다(고기 카드가 그랬다). 닫힘보다 **먼저** 돌 것.
 */
export function open(mask, w, h, r) {
  return morphPass(morphPass(mask, w, h, r, false), w, h, r, true);
}

/** Moore 이웃 경계 추적 — 외곽 폐곡선 픽셀열. */
export function traceContour(mask, w, h) {
  let start = -1;
  for (let i = 0; i < mask.length && start < 0; i++) if (mask[i]) start = i;
  if (start < 0) return [];
  const N8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const solid = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : mask[y * w + x]);
  const sx = start % w;
  const sy = (start / w) | 0;
  const contour = [[sx, sy]];
  let cx = sx;
  let cy = sy;
  let dir = 0;
  for (let guard = 0; guard < 8 * w * h; guard++) {
    let moved = false;
    for (let k = 0; k < 8; k++) {
      const d = (dir + 6 + k) % 8; // 이전 진행방향 기준 오른쪽부터 훑기
      const nx = cx + N8[d][0];
      const ny = cy + N8[d][1];
      if (solid(nx, ny)) {
        cx = nx;
        cy = ny;
        dir = d;
        contour.push([cx, cy]);
        moved = true;
        break;
      }
    }
    if (!moved) break;
    if (cx === sx && cy === sy) break;
  }
  return contour;
}

/**
 * 볼록 껍질(monotone chain).
 *
 * 🔴 윤곽을 그대로 18점으로 줄이면 **점이 돌기 끝에 앉아 뾰족한 스파이크**가 생기고,
 * 그 반작용으로 폴리곤이 물체를 잘라먹는다(너·누나·기도 카드가 그랬다). 색칠 게임에서
 * 물체가 잘리는 건 배경이 조금 넘치는 것보다 나쁘다 — 껍질은 **항상 물체 전체를 담고**
 * 스파이크가 원리적으로 없다. 오목한 사물(가위·두 마리)은 그만큼 배경을 품는 게 대가다.
 */
export function convexHull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (src) => {
    const out = [];
    for (const p of src) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    return out;
  };
  const lower = half(pts);
  const upper = half([...pts].reverse());
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** 폐곡선을 호 길이 균등 n 점으로 리샘플. */
export function resample(poly, n) {
  if (poly.length <= n) return poly.slice();
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const cum = [0];
  for (let i = 1; i <= poly.length; i++) cum.push(cum[i - 1] + dist(poly[i - 1], poly[i % poly.length]));
  const total = cum[poly.length];
  const out = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const target = (total * k) / n;
    while (j < poly.length - 1 && cum[j + 1] < target) j++;
    // 🔴 꼭짓점으로 스냅하지 말고 **변 위를 보간**한다. 껍질처럼 꼭짓점이 듬성한 다각형에서
    // 스냅하면 변이 통째로 건너뛰어져 큰 현이 생기고, 그 현이 물체를 잘라먹는다
    // (미소·두부·휴지 카드가 그랬다). 보간하면 점이 늘 껍질 위에 있어 모양이 안 변한다.
    const seg = cum[j + 1] - cum[j];
    const t = seg > 0 ? (target - cum[j]) / seg : 0;
    const a = poly[j];
    const b = poly[(j + 1) % poly.length];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

/** 이미지 버퍼 → keypoints (정규화 x/y + order 1..N). */
export async function extractKeypoints(buf, { points = POINTS, thresh = THRESH } = {}) {
  const { data, info } = await sharp(buf)
    .resize({ width: WORK, height: WORK, fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const { mask } = buildMaskByFlood(data, w, h, thresh);
  // 열림(가는 것 제거) → 최대 연결요소 → 닫힘(틈 메움) 순서. 열림이 먼저여야 김·수염이
  // 몸통에 붙기 전에 사라진다.
  const comp = largestComponent(open(mask, w, h, thresh.open), w, h);
  if (!comp) return null;
  const coverage = comp.size / (w * h);
  const contour = traceContour(close(comp.mask, w, h, 2), w, h);
  if (contour.length < 3) return null;
  const hull = convexHull(contour);
  const poly = hull.length > points ? resample(hull, points) : hull;
  const keypoints = poly.map(([x, y], i) => ({
    x: (x + 0.5) / w,
    y: (y + 0.5) / h,
    order: i + 1,
  }));
  return { keypoints, coverage };
}

// ── 자가 점검 (합성 도형으로 기하 검증) ─────────────────────────────────────

if (args.flags.has('selftest')) {
  const size = 120;
  const raw = Buffer.alloc(size * size * 3, 240); // 크림 배경
  for (let y = 30; y < 90; y++)
    for (let x = 30; x < 90; x++) {
      const p = (y * size + x) * 3;
      raw[p] = 20;
      raw[p + 1] = 20;
      raw[p + 2] = 20;
    }
  const png = await sharp(raw, { raw: { width: size, height: size, channels: 3 } }).png().toBuffer();
  const { keypoints } = await extractKeypoints(png, { points: 16 });
  const xs = keypoints.map((k) => k.x);
  const ys = keypoints.map((k) => k.y);
  const near = (a, b) => Math.abs(a - b) < 0.06;
  // 껍질이 모양을 정하므로 점 개수는 고정이 아니다. 대신 **볼록성**을 본다 —
  // 회전 방향이 한 번이라도 뒤집히면 껍질이 깨진 것이고, 그게 스파이크의 정의다.
  const turns = keypoints.map((p1, i) => {
    const p2 = keypoints[(i + 1) % keypoints.length];
    const p3 = keypoints[(i + 2) % keypoints.length];
    return Math.sign((p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x));
  });
  console.assert(new Set(turns.filter(Boolean)).size === 1, `볼록하지 않음: ${turns.join(',')}`);
  console.assert(keypoints.length >= 4 && keypoints.length <= 16, `점 개수 ${keypoints.length}`);
  console.assert(near(Math.min(...xs), 0.25) && near(Math.max(...xs), 0.75), `x 범위 ${Math.min(...xs)}~${Math.max(...xs)}`);
  console.assert(near(Math.min(...ys), 0.25) && near(Math.max(...ys), 0.75), `y 범위 ${Math.min(...ys)}~${Math.max(...ys)}`);
  console.assert(new Set(keypoints.map((k) => k.order)).size === keypoints.length, 'order 유일');
  console.log(`selftest: 사각형(30~90/120 = 0.25~0.75) 볼록 껍질 ${keypoints.length}점 · 볼록성 OK`);
  process.exit(0);
}

// ── 실행 ─────────────────────────────────────────────────────────────────────

loadEnv();

const UNIT_IDS = [
  ...Array.from({ length: 15 }, (_, i) => `kr-h1-u${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 7 }, (_, i) => `kr-h2-u${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 5 }, (_, i) => `kr-h3-u${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 5 }, (_, i) => `kr-h4-u${String(i + 1).padStart(2, '0')}`),
];

async function previewPng(buf, keypoints, outPath) {
  const SIZE = 400;
  const pts = keypoints.map((k) => `${(k.x * SIZE).toFixed(1)},${(k.y * SIZE).toFixed(1)}`).join(' ');
  const dots = keypoints
    .map((k) => `<circle cx="${(k.x * SIZE).toFixed(1)}" cy="${(k.y * SIZE).toFixed(1)}" r="5" fill="#FF6F61" stroke="#fff" stroke-width="2"/>`)
    .join('');
  const svg = Buffer.from(
    `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">` +
      `<polygon points="${pts}" fill="rgba(16,185,129,0.35)" stroke="#FF6F61" stroke-width="3"/>${dots}</svg>`
  );
  await sharp(buf)
    .resize(SIZE, SIZE, { fit: 'fill' })
    .composite([{ input: svg }])
    .png()
    .toFile(outPath);
}

if (PREVIEW) fs.mkdirSync(PREVIEW_DIR, { recursive: true });
console.log(`Mode: ${APPLY ? '✏️  APPLY' : PREVIEW ? '🖼️  PREVIEW' : '👀 DRY-RUN'} (points=${POINTS}, ${JSON.stringify(THRESH)})\n`);

let done = 0;
const failed = [];
for (const unitId of UNIT_IDS) {
  if (ONLY && unitId !== ONLY) continue;
  const sb = await getStorybook(unitId);
  let changed = 0;
  for (const card of sb.flashcards ?? []) {
    if (!card.imageUrl) continue;
    const res = await fetch(card.imageUrl);
    if (!res.ok) {
      failed.push(`${unitId}/${card.word} — 이미지 ${res.status}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const out = await extractKeypoints(buf);
    if (!out) {
      failed.push(`${unitId}/${card.word} — 윤곽 추출 실패`);
      continue;
    }
    // 사물이 화면의 5% 미만이거나 90% 초과면 배경 분리가 어긋난 것 — 사람이 봐야 한다.
    if (out.coverage < 0.05 || out.coverage > 0.9) {
      failed.push(`${unitId}/${card.word} — 마스크 비율 ${(out.coverage * 100).toFixed(0)}% (의심)`);
      continue;
    }
    if (PREVIEW) await previewPng(buf, out.keypoints, path.join(PREVIEW_DIR, `${unitId}-${card.word}.png`));
    card.keypoints = out.keypoints;
    changed++;
    done++;
  }
  console.log(`[${unitId}] ${changed}장`);
  if (changed && APPLY) {
    sb.updatedAt = new Date().toISOString();
    await putStorybook(unitId, sb);
  }
}

console.log(`\nkeypoints ${done}장`);
if (failed.length) {
  console.log(`\n⚠️  건너뜀 ${failed.length}건`);
  failed.forEach((f) => console.log('  - ' + f));
}
if (PREVIEW) console.log(`\n미리보기: ${PREVIEW_DIR}`);
if (!APPLY) console.log('\n(반영하려면 --apply)');
