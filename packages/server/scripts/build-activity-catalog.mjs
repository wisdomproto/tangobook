#!/usr/bin/env node
/**
 * 활동 모음(`/activity`) 원천 JSON 굽기 — R2 → `packages/client/public/activity-data/`.
 *
 * - `coloring.json`: 게임 목록(`public/coloring/manifest.json`)에서 중국어(dev-only)를 빼고,
 *   동화책 도안(`bk-*`)은 **살아 있는 공개 책**만 남긴다(그림체 분할 뒤 옛 id 가 남아 있을 수 있다).
 * - `hidden-object.json`: **공개 책의 top-level `hiddenObjectScenes`** 중 찾을 낱말(이름 중복 제거) 2개 이상.
 *   🔴 `hidden-object-hotspots.json`·작업판은 안 쓴다 — 원본 책 id 로 적혀 있어 쪼갠 책을 못 가리킨다.
 * 🔴 먼저 `pnpm --filter shared build` (shared/dist 를 import 한다).
 * 🔴 재생성: 도안을 붙이거나 숨은그림을 링크하거나 책을 공개한 뒤.
 *
 * 사용: node packages/server/scripts/build-activity-catalog.mjs [--apply]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, listStorybookKeys, getJsonByKey } from './translation-core.mjs';
import {
  bookDisplayTitle,
  hiddenObjectLabelOf,
  playableHiddenWords,
} from '../../shared/dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(__dirname, '..', '..', 'client', 'public');
const OUT = path.join(PUB, 'activity-data');
const APPLY = process.argv.includes('--apply');
const SCENE_KEY = /^(ho|jr|nt)-\d{4}$/;
loadEnv();

const keys = await listStorybookKeys();
const books = [];
let cursor = 0;
let fetchFailed = 0;
await Promise.all(
  Array.from({ length: 16 }, async () => {
    while (cursor < keys.length) {
      const k = keys[cursor++];
      const sb = await getJsonByKey(k).catch(() => null);
      if (sb) books.push(sb);
      else fetchFailed++;
    }
  })
);
const publicBooks = new Map(books.filter((b) => b.isPublic !== false).map((b) => [String(b.id), b]));
console.log(`책 ${books.length}권(R2 실패 ${fetchFailed}) · 공개 ${publicBooks.size}권`);

// ── 색칠
const manifest = JSON.parse(fs.readFileSync(path.join(PUB, 'coloring', 'manifest.json'), 'utf8'));
const dropped = { zh: 0, privateOrMissingBook: 0 };
const coloring = [];
for (const it of manifest) {
  if (it.language === 'zh') { dropped.zh++; continue; }
  const base = {
    key: it.key, group: it.group, section: it.section, word: it.word,
    language: it.language, lineartUrl: it.lineartUrl,
    originalUrl: it.originalUrl ?? null, answerUrl: it.answerUrl ?? null,
  };
  if (it.key.startsWith('bk-')) {
    const book = publicBooks.get(String(it.unitId));
    if (!book) { dropped.privateOrMissingBook++; continue; }
    const ko = (book.key_objects ?? []).find((k) => (k.korean ?? '').trim() === it.word);
    coloring.push({
      ...base, bookId: String(book.id), bookTitle: bookDisplayTitle(book),
      ...(ko?.description ? { blurb: String(ko.description).slice(0, 160) } : {}),
    });
  } else {
    coloring.push({ ...base, unitId: it.unitId });
  }
}
coloring.sort((a, b) => a.key.localeCompare(b.key));

// ── 숨은그림
const hidden = [];
const hdrop = { badKey: 0, tooFew: 0 };
for (const book of publicBooks.values()) {
  for (const scene of book.hiddenObjectScenes ?? []) {
    const key = String(scene.id ?? '').replace(/^hobj_/, '');
    if (!SCENE_KEY.test(key) || !scene.sceneImageUrl) { hdrop.badKey++; continue; }
    const words = playableHiddenWords({ hotspots: scene.hotspots ?? [] }).map((n) => hiddenObjectLabelOf(book.key_objects, n));
    if (words.length < 2) { hdrop.tooFew++; continue; }
    hidden.push({
      key, bookId: String(book.id), bookTitle: bookDisplayTitle(book),
      category: book.category ?? '기타', sceneImageUrl: scene.sceneImageUrl, words,
      ...(book.parentGuide?.overview ? { blurb: String(book.parentGuide.overview).slice(0, 120) } : {}),
    });
  }
}
hidden.sort((a, b) => a.key.localeCompare(b.key));

console.log(`색칠 ${coloring.length}장 (manifest ${manifest.length} · 뺀 것 중국어 ${dropped.zh} · 비공개/없는 책 ${dropped.privateOrMissingBook})`);
console.log(`숨은그림 ${hidden.length}장 (뺀 것 키 형식 ${hdrop.badKey} · 낱말 2개 미만 ${hdrop.tooFew})`);

if (APPLY && fetchFailed > 0) {
  console.error(`R2 조회 실패 ${fetchFailed}건 — 쓰지 않음`);
  process.exit(1);
}

if (APPLY) {
  const summaryPath = path.join(OUT, 'summary.json');
  if (fs.existsSync(summaryPath)) {
    const prev = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    console.log(`색칠 이전 ${prev.coloring?.count ?? '?'} → 지금 ${coloring.length}`);
    console.log(`숨은그림 이전 ${prev['hidden-object']?.count ?? '?'} → 지금 ${hidden.length}`);
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'coloring.json'), JSON.stringify(coloring));
  fs.writeFileSync(path.join(OUT, 'hidden-object.json'), JSON.stringify(hidden));
  // 허브·종류 탭이 900KB 목록을 받지 않고 개수와 첫 키만 알 수 있게.
  fs.writeFileSync(
    summaryPath,
    JSON.stringify({
      coloring: { count: coloring.length, firstKey: coloring[0]?.key ?? null },
      'hidden-object': { count: hidden.length, firstKey: hidden[0]?.key ?? null },
    })
  );
  console.log(`쓰기 → ${OUT}`);
} else {
  console.log('dry-run. 쓰려면 --apply');
}
