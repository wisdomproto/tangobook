#!/usr/bin/env node
/**
 * 동화책 **핵심단어 이미지**(`keyObjectImages[]`)의 윤곽에서 `keypoints` 자동 추출.
 *
 * 파닉스 카드용 `extract-word-card-keypoints.mjs` 와 **같은 파이프라인**을 쓴다(rembg → 윤곽 →
 * Douglas–Peucker). 여기선 추출 로직을 다시 쓰지 않고 그 모듈을 import 한다 — 다른 건
 * **어디서 읽고 어디에 쓰느냐**뿐이다:
 *
 *   파닉스: storybook.flashcards[].imageUrl        → flashcards[].keypoints
 *   동화책: styleAssets[*].keyObjectImages[] · top-level keyObjectImages[]
 *                                                  → 그 항목의 .keypoints
 *
 * 🔴 **같은 URL 이 여러 책·그림체에 걸쳐 재사용된다**(2,365 슬롯 / 고유 2,030장). 그래서
 *    URL 단위로 한 번만 추출하고 그 결과를 모든 슬롯에 뿌린다 — 안 그러면 rembg 를 중복 호출한다.
 *
 * keypoints 가 있어야 어휘 게임의 **낱말 그리기**(ConnectTheDots)가 그 단어를 낸다
 * (`derive-storybook-unit.ts` → `game-data-adapter.ts`).
 *
 * 준비(최초 1회): `pip install "rembg[cpu,cli]"`
 *
 * 사용:
 *   node packages/server/scripts/extract-keyobject-keypoints.mjs                 # dry-run(대상만)
 *   node packages/server/scripts/extract-keyobject-keypoints.mjs --limit=20 --apply
 *   node packages/server/scripts/extract-keyobject-keypoints.mjs --apply
 *   node packages/server/scripts/extract-keyobject-keypoints.mjs --only=<bookId> --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadEnv, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';
import { keypointsFromMask } from './extract-word-card-keypoints.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const ONLY = args.only ? String(args.only) : null;
const LIMIT = args.limit ? parseInt(args.limit, 10) : Infinity;
const CACHE = path.join(__dirname, '_keyobject-cache');

loadEnv();
const API = process.env.API_BASE || 'http://localhost:3500';

/** 한 책의 keyObjectImages 슬롯 전부 — top-level + 그림체별. 같은 배열 객체를 그대로 넘겨 수정한다. */
function imageSlots(sb) {
  return [
    ...(sb.keyObjectImages ?? []),
    ...Object.values(sb.styleAssets ?? {}).flatMap((a) => a?.keyObjectImages ?? []),
  ].filter((im) => im?.imageUrl);
}

const listRes = await fetch(`${API}/api/storybooks`);
if (!listRes.ok) {
  console.error(`책 목록 실패 ${listRes.status} — 로컬 서버(${API})가 떠 있는지 확인`);
  process.exit(1);
}
const summaries = (await listRes.json()).data ?? [];

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'}`);
console.log(`책 ${summaries.length}권 훑는 중…`);

// 1) 대상 수집 — URL 하나당 한 번만 추출하고, 그 URL 을 쓰는 모든 슬롯에 뿌린다.
const byUrl = new Map(); // url → { slots: [], name }
const books = new Map(); // bookId → sb
for (const s of summaries) {
  if (ONLY && s.id !== ONLY) continue;
  const sb = (await (await fetch(`${API}/api/storybooks/${s.id}`)).json()).data;
  if (!sb) continue;
  let touched = false;
  for (const im of imageSlots(sb)) {
    if (im.keypoints?.length) continue;
    const e = byUrl.get(im.imageUrl) ?? { slots: [], name: im.objectName ?? '?' };
    e.slots.push({ bookId: sb.id, im });
    byUrl.set(im.imageUrl, e);
    touched = true;
  }
  if (touched) books.set(sb.id, sb);
}

const targets = [...byUrl.entries()].slice(0, LIMIT);
const slotCount = targets.reduce((n, [, e]) => n + e.slots.length, 0);
console.log(`keypoints 없는 고유 이미지 ${byUrl.size}장 / 슬롯 ${[...byUrl.values()].reduce((n, e) => n + e.slots.length, 0)}개`);
console.log(`이번 실행 대상: 이미지 ${targets.length}장 · 슬롯 ${slotCount}개 · 책 ${books.size}권\n`);
if (!APPLY) {
  targets.slice(0, 10).forEach(([u, e]) => console.log(`  ${e.name}  ${u.slice(-60)}`));
  console.log('\n(dry-run — 반영하려면 --apply)');
  process.exit(0);
}

// 2) 내려받기 (URL 해시로 파일명 — 한글·공백 파일명 회피)
const imgDir = path.join(CACHE, 'img');
const maskDir = path.join(CACHE, 'mask');
fs.mkdirSync(imgDir, { recursive: true });
const files = [];
for (const [url, e] of targets) {
  const key = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
  const file = path.join(imgDir, `${key}.webp`);
  if (!fs.existsSync(file)) {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`  ⚠️  ${e.name} 이미지 ${res.status}`);
      continue;
    }
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  files.push({ key, file, url, e });
}
console.log(`이미지 ${files.length}장 준비 — rembg 시작\n`);

// 3) rembg 일괄 (세션 1회)
const py = spawnSync('python', [path.join(__dirname, '_rembg_masks.py'), imgDir, maskDir], {
  stdio: ['ignore', 'inherit', 'inherit'],
});
if (py.status !== 0) {
  console.error('rembg 실패 — `pip install "rembg[cpu,cli]"` 확인');
  process.exit(1);
}

// 4) 마스크 → keypoints → 슬롯에 기록
let ok = 0;
const failed = [];
const dirty = new Set();
for (const { key, url, e } of files) {
  const maskPath = path.join(maskDir, `${key}.png`);
  if (!fs.existsSync(maskPath)) {
    failed.push(`${e.name} — 마스크 없음`);
    continue;
  }
  let keypoints;
  try {
    ({ keypoints } = await keypointsFromMask(fs.readFileSync(maskPath)));
  } catch (err) {
    failed.push(`${e.name} — ${err.message}`);
    continue;
  }
  if (!keypoints?.length) {
    failed.push(`${e.name} — 윤곽 못 찾음`);
    continue;
  }
  for (const { bookId, im } of byUrl.get(url).slots) {
    im.keypoints = keypoints;
    dirty.add(bookId);
  }
  ok++;
}

// 5) 저장
for (const bookId of dirty) {
  const sb = books.get(bookId);
  sb.updatedAt = new Date().toISOString();
  await putStorybook(bookId, sb);
}

console.log(`\n추출 ${ok}장 → 책 ${dirty.size}권 저장`);
if (failed.length) {
  console.log(`\n⚠️  실패 ${failed.length}건`);
  failed.slice(0, 20).forEach((f) => console.log('  - ' + f));
}
