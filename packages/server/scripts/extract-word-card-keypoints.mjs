#!/usr/bin/env node
/**
 * 단어 카드 삽화의 윤곽에서 `keypoints`(낱말 그리기 폴리곤) 자동 추출.
 *
 * 낱말 그리기(ConnectTheDotsPlayer)는 2026-05-25 부터 "점 순서대로 잇기"가 아니라
 * **keypoints 로 만든 폴리곤 안을 색칠**하는 게임이다. 그래서 필요한 건 정확한 점 순서가
 * 아니라 사물 윤곽을 따라가는 폐곡선 하나 — 손으로 찍을 이유가 없다.
 *
 * 🔴 **분할은 rembg(BiRefNet)에 맡긴다.** 손으로 짠 픽셀 임계·배경 물 채우기를 네 번 고쳐
 * 썼지만 매번 다른 카드가 깨졌다 — 크림 배경 위의 흰 사물, 작가가 그린 옅은 그림자,
 * 카드마다 다른 비네팅이 전부 "배경에서 조금 떨어진 값"이라 규칙으로는 안 갈린다.
 * 배경 제거는 이미 풀린 문제이고, 전용 모델이 한 번에 낸다.
 *
 *   rembg 알파 → 낮은 임계로 이진화 → 큰 덩어리들 → 윤곽 추적 → Douglas–Peucker 단순화
 *
 * 준비(최초 1회): `pip install "rembg[cpu,cli]"` — 모델 ~973MB 는 첫 실행 때 받는다.
 *
 * 사용:
 *   node packages/server/scripts/extract-word-card-keypoints.mjs --selftest
 *   node packages/server/scripts/extract-word-card-keypoints.mjs --preview          # 미리보기 PNG 만
 *   node packages/server/scripts/extract-word-card-keypoints.mjs --preview --only=kr-h1-u02
 *   node packages/server/scripts/extract-word-card-keypoints.mjs --apply
 *
 * 🔴 동화책(전래동화·생활동화 등)도 같은 스크립트로 뽑는다:
 *   node ... --category='전래 동화' [--preview|--apply]
 *   파닉스는 카드가 `flashcards[]` 에 있고 동화책은 `keyObjectImages[]` 에 있다 —
 *   읽는 배열만 다르고 마스크·폴리곤 파이프라인은 완전히 같다.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadEnv, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';
import { KOREAN_PHONICS_CURRICULUM, ENGLISH_PHONICS_CURRICULUM } from '@tangobook/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const PREVIEW = args.flags.has('preview');
const ONLY = args.only ? String(args.only) : null;
const CATEGORY = args.category ? String(args.category) : null;
const POINTS = parseInt(args.points ?? '18', 10); // 폴리곤 점 상한
const ALPHA = parseInt(args.alpha ?? '24', 10); // 알파 이진화 임계
const BRIDGE = parseInt(args.bridge ?? '4', 10); // 가까운 덩어리를 잇는 닫힘 반지름
const WORK = 256; // 분석 해상도
const CACHE = path.join(__dirname, '_word-card-cache');
const PREVIEW_DIR = args.out ? String(args.out) : path.join(__dirname, '_preview-keypoints');

// ── 순수 기하 ────────────────────────────────────────────────────────────────

/**
 * 큰 덩어리만 남긴다 — 최대 덩어리와 그 `ratio` 이상인 것들.
 * 🔴 **최대 하나만** 남기면 주인공이 둘인 카드(얘기의 곰+토끼, 눈의 두 눈)에서 한쪽이 통째로
 * 폴리곤 밖으로 나간다. 반대로 전부 남기면 티끌이 폴리곤을 부풀린다.
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
  const keep = new Set([...sizes].filter(([, s]) => s >= best.size * ratio).map(([id]) => id));
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

/** 반지름 r 팽창. 마스크가 물체보다 안쪽으로 밀린 걸 되돌릴 때. */
export function dilate(mask, w, h, r) {
  return morphPass(mask, w, h, r, true);
}

/** 반지름 r 팽창 후 수축 = 닫힘. 가까운 덩어리를 잇고 좁은 틈을 메운다. */
export function close(mask, w, h, r) {
  return morphPass(morphPass(mask, w, h, r, true), w, h, r, false);
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
 * Douglas–Peucker 단순화 — 원래 윤곽에서 **최대 eps 픽셀 이상 벗어나지 않는** 부분집합.
 *
 * 🔴 볼록 껍질을 쓰면 안 된다 — 공과 배트처럼 떨어져 놓인 카드에선 사이의 빈 삼각형을 통째로
 * 삼키고, 하나짜리 사물도 사방으로 붕 뜬다. 호 길이 리샘플도 안 된다 — 점을 임의 위치에 찍어
 * 돌기 끝에 앉히면 스파이크가 생겨 물체를 잘라먹는다. DP 는 편차가 eps 로 묶여 둘 다 없다.
 */
export function simplify(points, eps) {
  if (points.length < 3) return points.slice();
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const len = Math.hypot(bx - ax, by - ay);
    let far = -1;
    let best = eps;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const d =
        len === 0
          ? Math.hypot(px - ax, py - ay)
          : Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len;
      if (d > best) (best = d), (far = i);
    }
    if (far > 0) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** 점 개수가 max 이하가 될 때까지 eps 를 키우며 단순화. */
export function simplifyTo(points, max) {
  let eps = 1;
  let out = simplify(points, eps);
  while (out.length > max && eps < 40) {
    eps *= 1.3;
    out = simplify(points, eps);
  }
  return out;
}

/** rembg 알파 마스크 → keypoints (정규화 x/y + order 1..N). */
export async function keypointsFromMask(maskBuf, { points = POINTS, alpha = ALPHA } = {}) {
  const { data, info } = await sharp(maskBuf)
    .resize(WORK, WORK, { fit: 'inside' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const raw = new Uint8Array(w * h);
  for (let i = 0; i < raw.length; i++) raw[i] = data[i] > alpha ? 1 : 0;
  // 🔴 알파는 가장자리에서 완만히 떨어진다 — 낮게 자르고 1px 부풀려야 윤곽이 물체에 붙는다.
  //    임계를 높이면 폴리곤이 물체 안쪽으로 2~4px 들어가 앉는다.
  const comp = largestComponent(dilate(raw, w, h, 1), w, h);
  if (!comp) return null;
  const contour = traceContour(close(comp.mask, w, h, BRIDGE), w, h);
  if (contour.length < 3) return null;
  return {
    coverage: comp.size / (w * h),
    keypoints: simplifyTo(contour, points).map(([x, y], i) => ({
      x: (x + 0.5) / w,
      y: (y + 0.5) / h,
      order: i + 1,
    })),
  };
}

// ── 실행 ─────────────────────────────────────────────────────────────────────

/**
 * 대상 유닛 = 한글·영어 커리큘럼 전체. 🔴 손으로 적은 목록을 두지 않는다 — 예전엔 한글 32유닛을
 * 배열로 박아둬서, 영어 카드가 들어와도 이 스크립트가 쳐다보지 않았다. 카드 없는 유닛은
 * 아래 루프가 `imageUrl` 없음으로 알아서 건너뛴다.
 */
const UNIT_IDS = [...KOREAN_PHONICS_CURRICULUM, ...ENGLISH_PHONICS_CURRICULUM].flatMap((level) =>
  level.units.map((u) => u.id)
);

/**
 * 동화책 모드 — 카테고리의 모든 책에서 `keyObjectImages[]` 를 카드로 본다.
 * 🔴 게임(`generateConnectTheDots`)이 읽는 자리는 **`keyObjectImages[].keypoints`** 이고
 *    `success !== true` 인 항목은 후보에서 빠진다. 파닉스의 `flashcards[].keypoints` 와 다른 자리다.
 */
async function collectCategoryCards(category, imgDir) {
  const { listStorybookKeys, getJsonByKey } = await import('./translation-core.mjs');
  const keys = await listStorybookKeys();
  const cards = [];
  for (const k of keys) {
    const sb = await getJsonByKey(k).catch(() => null);
    if (!sb || sb.category !== category) continue;
    for (const img of sb.keyObjectImages ?? []) {
      if (!img.imageUrl) continue;
      const word = img.objectName ?? 'obj';
      const name = `${sb.id}__${word}`;
      const stamp = crypto.createHash('sha1').update(img.imageUrl).digest('hex').slice(0, 8);
      const key = `${name}__${stamp}`;
      const file = path.join(imgDir, `${key}.webp`);
      if (!fs.existsSync(file)) {
        const res = await fetch(img.imageUrl);
        if (!res.ok) {
          console.log(`  ⚠️  ${name} 이미지 ${res.status}`);
          continue;
        }
        fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      }
      cards.push({ unitId: sb.id, sb, card: { word, imageUrl: img.imageUrl, target: img }, name, key, file });
    }
  }
  return cards;
}

async function previewPng(srcPath, keypoints, outPath) {
  const SIZE = 480;
  const xy = (k) => [(k.x * SIZE).toFixed(1), (k.y * SIZE).toFixed(1)];
  const pts = keypoints.map((k) => xy(k).join(',')).join(' ');
  const dots = keypoints
    .map((k, i) => {
      const [x, y] = xy(k);
      return `<circle cx="${x}" cy="${y}" r="6" fill="#10b981" stroke="#fff" stroke-width="2"/><text x="${x}" y="${Number(y) + 3}" font-size="8" fill="#fff" text-anchor="middle">${i + 1}</text>`;
    })
    .join('');
  const svg = Buffer.from(
    `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">` +
      `<polygon points="${pts}" fill="rgba(16,185,129,0.30)" stroke="#10b981" stroke-width="3" stroke-dasharray="8 6"/>${dots}</svg>`
  );
  await sharp(srcPath)
    .resize(SIZE, SIZE, { fit: 'fill' })
    .composite([{ input: svg }])
    .png()
    .toFile(outPath);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (args.flags.has('selftest')) {
    const size = 120;
    const mask = Buffer.alloc(size * size, 0);
    for (let y = 30; y < 90; y++) for (let x = 30; x < 90; x++) mask[y * size + x] = 255;
    const png = await sharp(mask, { raw: { width: size, height: size, channels: 1 } })
      .png()
      .toBuffer();
    const { keypoints } = await keypointsFromMask(png, { points: 16 });
    const xs = keypoints.map((k) => k.x);
    const ys = keypoints.map((k) => k.y);
    const near = (a, b) => Math.abs(a - b) < 0.06;
    console.assert(keypoints.length >= 4 && keypoints.length <= 16, `점 개수 ${keypoints.length}`);
    console.assert(
      near(Math.min(...xs), 0.25) && near(Math.max(...xs), 0.75),
      `x ${Math.min(...xs)}~${Math.max(...xs)}`
    );
    console.assert(
      near(Math.min(...ys), 0.25) && near(Math.max(...ys), 0.75),
      `y ${Math.min(...ys)}~${Math.max(...ys)}`
    );
    console.assert(new Set(keypoints.map((k) => k.order)).size === keypoints.length, 'order 유일');
    console.log(`selftest: 사각형(0.25~0.75) → ${keypoints.length}점, 범위 OK`);
    process.exit(0);
  }

  loadEnv();
  const imgDir = path.join(CACHE, 'img');
  const maskDir = path.join(CACHE, 'mask');
  fs.mkdirSync(imgDir, { recursive: true });
  if (PREVIEW) fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  console.log(`Mode: ${APPLY ? '✏️  APPLY' : PREVIEW ? '🖼️  PREVIEW' : '👀 DRY-RUN'}\n`);

  // 1) 카드 이미지 내려받기 (캐시)
  const cards = [];
  if (CATEGORY) {
    cards.push(...(await collectCategoryCards(CATEGORY, imgDir)));
  }
  for (const unitId of CATEGORY ? [] : UNIT_IDS) {
    if (ONLY && unitId !== ONLY) continue;
    const sb = await getStorybook(unitId);
    for (const card of sb.flashcards ?? []) {
      if (!card.imageUrl) continue;
      /**
       * 🔴 **캐시 키에 이미지 URL 을 넣는다.**
       *
       * 예전엔 `{단원}__{단어}` 뿐이라, 카드 그림을 새로 올려 교체해도 **옛 파일을 그대로 써서
       * 옛 그림의 윤곽이 뽑혔다**(모음 4장에서 실제로 겪었다 — 새 니들펠트 카드에 수채화 윤곽이
       * 붙었고, 나는 그 미리보기를 보고 "그림체가 안 맞다"고 잘못 보고까지 했다).
       * 구운 URL 에 원본 해시가 들어가 있으므로 URL 만 섞으면 교체가 저절로 감지된다.
       * ⚠️ 키 규칙을 바꾼 **첫 실행은 516장을 다시 받고 rembg 마스크도 다시 만든다**(장당 ~7초).
       *    한 번만 그렇고 이후엔 바뀐 카드만 다시 돈다.
       */
      const name = `${unitId}__${card.word}`;
      const stamp = crypto.createHash('sha1').update(card.imageUrl).digest('hex').slice(0, 8);
      const key = `${name}__${stamp}`;
      const file = path.join(imgDir, `${key}.webp`);
      if (!fs.existsSync(file)) {
        const res = await fetch(card.imageUrl);
        if (!res.ok) {
          console.log(`  ⚠️  ${name} 이미지 ${res.status}`);
          continue;
        }
        fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      }
      cards.push({ unitId, sb, card, name, key, file });
    }
  }
  console.log(`카드 ${cards.length}장 준비\n`);

  // 2) rembg 로 알파 마스크 일괄 생성 (세션 1회)
  const py = spawnSync('python', [path.join(__dirname, '_rembg_masks.py'), imgDir, maskDir], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  if (py.status !== 0) {
    console.error('rembg 실패 — `pip install "rembg[cpu,cli]"` 확인');
    process.exit(1);
  }

  // 3) 마스크 → keypoints
  let done = 0;
  const failed = [];
  const bySb = new Map();
  for (const { unitId, sb, card, name, key, file } of cards) {
    const maskFile = path.join(maskDir, `${key}.png`);
    if (!fs.existsSync(maskFile)) {
      failed.push(`${unitId}/${card.word} — 마스크 없음`);
      continue;
    }
    const out = await keypointsFromMask(fs.readFileSync(maskFile));
    // 사물이 화면의 3% 미만이거나 92% 초과면 분리가 어긋난 것 — 사람이 봐야 한다.
    if (!out || out.coverage < 0.03 || out.coverage > 0.92) {
      failed.push(
        `${unitId}/${card.word} — 마스크 비율 ${((out?.coverage ?? 0) * 100).toFixed(0)}%`
      );
      continue;
    }
    if (PREVIEW) await previewPng(file, out.keypoints, path.join(PREVIEW_DIR, `${name}.png`));
    // 🔴 동화책은 `keyObjectImages` 항목(`card.target`)에 쓴다 — 게임이 읽는 자리가 거기다.
    //    저작도구 미리보기용 `tracingPoints` 도 같이 채운다(둘이 갈리면 편집기와 게임이 어긋난다).
    const dest = card.target ?? card;
    dest.keypoints = out.keypoints;
    if (card.target) dest.tracingPoints = out.keypoints.map(({ x, y }) => ({ x, y }));
    bySb.set(unitId, sb);
    done++;
  }

  if (APPLY) {
    for (const [unitId, sb] of bySb) {
      sb.updatedAt = new Date().toISOString();
      await putStorybook(unitId, sb);
    }
    console.log(`\n${bySb.size}개 단원 저장`);
  }
  console.log(`\nkeypoints ${done}장`);
  if (failed.length) {
    console.log(`\n⚠️  건너뜀 ${failed.length}건`);
    failed.forEach((f) => console.log('  - ' + f));
  }
  if (PREVIEW) console.log(`\n미리보기: ${PREVIEW_DIR}`);
  if (!APPLY) console.log('\n(반영하려면 --apply)');
}
