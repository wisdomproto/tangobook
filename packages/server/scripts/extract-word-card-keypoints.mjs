#!/usr/bin/env node
/**
 * 단어 카드 삽화의 윤곽에서 `keypoints`(낱말 그리기 폴리곤) 자동 추출.
 *
 * 낱말 그리기(ConnectTheDotsPlayer)는 2026-05-25 부터 "점 순서대로 잇기" 가 아니라
 * **keypoints 로 만든 폴리곤 안을 색칠**하는 게임이다. 그래서 필요한 건 정확한 점 순서가
 * 아니라 "사물 실루엣을 감싸는 단순 폐곡선" 하나 — 손으로 찍을 이유가 없다.
 *
 * 카드가 1:1 정사각 + 크림 무지 배경 + 사물 하나라 배경 제거가 쉽다:
 *   테두리 픽셀 중앙값 = 배경색 → 밝기·색감 임계로 마스크 → 최대 연결요소 → 외곽 경계 추적
 *   → 호 길이 균등 리샘플 N점 → 0~1 정규화 + order 1..N
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
  brighter: parseInt(args.brighter ?? '5', 10), // 배경보다 이만큼 밝으면 사물(흰 사물)
  darker: parseInt(args.darker ?? '26', 10), // 배경보다 이만큼 어두워야 사물(옅은 그림자 배제)
  chroma: parseInt(args.chroma ?? '22', 10), // 색감이 이만큼 다르면 사물
  texture: parseFloat(args.texture ?? '4'), // 결(3×3 표준편차)이 이만큼이면 사물 — 흰 사물 구제
};
const WORK = 192; // 분석 해상도 (작을수록 윤곽이 부드럽고 빠름)
const PREVIEW_DIR = args.out ? String(args.out) : path.join(__dirname, '_preview-keypoints');

// ── 순수 기하 ────────────────────────────────────────────────────────────────

const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

/** 3×3 밝기 표준편차. 배경은 완전히 평평하고 니들펠트는 섬유 결이 있어 흰 사물도 잡힌다. */
function localStd(lums, w, h, i) {
  const x = i % w;
  const y = (i / w) | 0;
  if (x === 0 || y === 0 || x === w - 1 || y === h - 1) return 0;
  let sum = 0;
  let sq = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const v = lums[i + dy * w + dx];
      sum += v;
      sq += v * v;
    }
  return Math.sqrt(Math.max(0, sq / 9 - (sum / 9) ** 2));
}

/**
 * 배경(테두리 링 중앙값) 과 다른 픽셀 = 사물.
 *
 * 🔴 단순 색거리 하나로는 **크림 배경 위의 흰 사물**(우유·구름·휴지·컵)과 **옅은 그림자**를
 * 구분할 수 없다 — 둘 다 배경에서 비슷하게 떨어져 있어서, 임계를 올리면 흰 사물이 잘리고
 * 내리면 그림자가 딸려 들어온다. 그래서 밝기는 **비대칭**으로 본다:
 *   - 배경보다 밝으면(흰 사물) 조금만 달라도 사물
 *   - 배경보다 어두우면(그림자) 많이 어두워야 사물
 *   - 색감이 다르면(유채색) 밝기와 무관하게 사물
 * (작가가 그린 유채색 그림자는 여전히 포함된다 — 색으로는 사물과 구분이 안 된다.)
 */
export function buildMask(rgba, w, h, { brighter = 5, darker = 26, chroma = 22, texture = 4 } = {}) {
  // 배경 표본 = 네 모서리 사각형. 테두리 한 줄 전체를 쓰면 화면을 꽉 채운 사물(쫑긋 토끼처럼
  // 프레임에 닿는 그림)이 표본을 오염시켜 배경색 자체가 틀어진다. 모서리는 셋만 성해도 중앙값이 산다.
  const box = Math.max(4, Math.round(Math.min(w, h) * 0.12));
  const corner = [];
  for (const [ox, oy] of [[0, 0], [w - box, 0], [0, h - box], [w - box, h - box]])
    for (let y = oy; y < oy + box; y++)
      for (let x = ox; x < ox + box; x++) corner.push((y * w + x) * 4);
  const med = (vals) => vals.sort((a, b) => a - b)[vals.length >> 1];
  const bg = [0, 1, 2].map((c) => med(corner.map((i) => rgba[i + c])));
  const bgLum = lum(bg[0], bg[1], bg[2]);
  const lums = new Float32Array(w * h);
  for (let i = 0, p = 0; i < lums.length; i++, p += 4) lums[i] = lum(rgba[p], rgba[p + 1], rgba[p + 2]);
  const mask = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    const l = lums[i];
    const dLum = l - bgLum;
    // 밝기를 맞춘 뒤 남는 차이 = 색감 차이
    const dChroma =
      Math.abs(rgba[p] - l - (bg[0] - bgLum)) +
      Math.abs(rgba[p + 1] - l - (bg[1] - bgLum)) +
      Math.abs(rgba[p + 2] - l - (bg[2] - bgLum));
    mask[i] =
      dChroma > chroma || dLum > brighter || dLum < -darker || localStd(lums, w, h, i) > texture
        ? 1
        : 0;
  }
  return { mask, bg };
}

/** 가장 큰 연결요소만 남긴다 (그림자 얼룩·티끌 제거). */
export function largestComponent(mask, w, h) {
  const label = new Int32Array(w * h).fill(-1);
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
    if (!best || size > best.size) best = { id, size };
  }
  if (!best) return null;
  const out = new Uint8Array(w * h);
  for (let i = 0; i < out.length; i++) out[i] = label[i] === best.id ? 1 : 0;
  return { mask: out, size: best.size };
}

/** 반지름 r 팽창 후 수축 = 닫힘. 삐죽한 노이즈와 좁은 틈을 메운다. */
export function close(mask, w, h, r) {
  const pass = (src, grow) => {
    const dst = new Uint8Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let hit = 0;
        for (let dy = -r; dy <= r && !hit; dy++)
          for (let dx = -r; dx <= r && !hit; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            const v = nx < 0 || ny < 0 || nx >= w || ny >= h ? 0 : src[ny * w + nx];
            if (grow ? v : !v) hit = 1;
          }
        dst[y * w + x] = grow ? hit : hit ? 0 : 1;
      }
    return dst;
  };
  return pass(pass(mask, true), false);
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

/** 폐곡선을 호 길이 균등 n 점으로 리샘플. */
export function resample(contour, n) {
  if (contour.length < n) return contour.slice();
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const cum = [0];
  for (let i = 1; i < contour.length; i++) cum.push(cum[i - 1] + dist(contour[i - 1], contour[i]));
  const total = cum[cum.length - 1] + dist(contour[contour.length - 1], contour[0]);
  const out = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const target = (total * k) / n;
    while (j < cum.length - 1 && cum[j + 1] < target) j++;
    out.push(contour[j]);
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
  const { mask } = buildMask(data, w, h, thresh);
  const comp = largestComponent(mask, w, h);
  if (!comp) return null;
  const coverage = comp.size / (w * h);
  const contour = traceContour(close(comp.mask, w, h, 2), w, h);
  if (contour.length < points) return null;
  const keypoints = resample(contour, points).map(([x, y], i) => ({
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
  console.assert(keypoints.length === 16, '점 개수');
  console.assert(near(Math.min(...xs), 0.25) && near(Math.max(...xs), 0.75), `x 범위 ${Math.min(...xs)}~${Math.max(...xs)}`);
  console.assert(near(Math.min(...ys), 0.25) && near(Math.max(...ys), 0.75), `y 범위 ${Math.min(...ys)}~${Math.max(...ys)}`);
  console.assert(new Set(keypoints.map((k) => k.order)).size === 16, 'order 유일');
  console.log('selftest: 사각형(30~90/120 = 0.25~0.75) 윤곽 16점 추출 OK');
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
