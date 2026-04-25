// v1 storybook의 누락 readingLevel을 derive하여 채움.
//
// 룰 (위에서 아래 순):
//   1. 이미 readingLevel 있음 → skip
//   2. id 접미사 `__L1`/`__L2`/`__L3`/`__L4` → 그 레벨 사용
//   3. type === 'phonics':
//        phonicsConfig.level
//          - hangul1 → L1
//          - hangul2 → L2
//          - hangul3 → L3
//          - hangul4 → L4
//          - book1 → L1
//          - book2 → L2
//          - book3 → L3
//          - book4, book5 → L4
//   4. curriculum-master.html에 bid 또는 title 매칭 → launch level
//   5. category에 '명작' 포함 → L3 (명작 기본 launch가 L3)
//   6. 그 외 → L3 default
//
// 실행:
//   node scripts/fill-reading-level.mjs              # dry-run
//   node scripts/fill-reading-level.mjs --apply

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const API = 'http://localhost:3500/api';
const HTML_PATH = resolve('docs/books/curriculum-master.html');
const APPLY = process.argv.includes('--apply');
const CONCURRENCY = 6;

const PHONICS_LEVEL_MAP = {
  hangul1: 'L1', hangul2: 'L2', hangul3: 'L3', hangul4: 'L4',
  book1: 'L1', book2: 'L2', book3: 'L3', book4: 'L4', book5: 'L4',
};

async function loadHtmlBookMap() {
  let html;
  try { html = await readFile(HTML_PATH, 'utf-8'); }
  catch (e) { console.warn(`⚠️  ${HTML_PATH} 못 읽음: ${e.message}`); return { byBid: new Map(), byTitle: new Map() }; }

  const byBid = new Map();   // bid → launch
  const byTitle = new Map(); // title → launch
  // CLASSIC_RAW pattern: { no:1, t:'잭과 콩나무', ..., launch:'L3', ..., bid:'1772510956605' }
  const re = /\{no:\d+,\s*t:'([^']+)',[^}]*?launch:'(L[1-4])'(?:,[^}]*?bid:'(\d+)')?/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const title = m[1];
    const launch = m[2];
    const bid = m[3];
    byTitle.set(title, launch);
    if (bid) byBid.set(bid, launch);
  }
  return { byBid, byTitle };
}

function bidPattern(id) {
  const m = String(id ?? '').match(/^(\d+)__(L[1-4])$/);
  if (m) return { base: m[1], level: m[2] };
  return { base: id, level: null };
}

function deriveLevel(book, htmlMap) {
  if (book.readingLevel) return { level: book.readingLevel, reason: 'already-set' };

  const pat = bidPattern(book.id);
  if (pat.level) return { level: pat.level, reason: 'id-suffix' };

  if (book.type === 'phonics') {
    const pl = book.phonicsConfig?.level;
    if (pl && PHONICS_LEVEL_MAP[pl]) return { level: PHONICS_LEVEL_MAP[pl], reason: `phonics:${pl}` };
    return { level: 'L2', reason: 'phonics-default' };
  }

  if (htmlMap.byBid.has(book.id)) return { level: htmlMap.byBid.get(book.id), reason: 'html-bid' };
  // base bid lookup (suffixed bid → base)
  if (htmlMap.byBid.has(pat.base)) return { level: htmlMap.byBid.get(pat.base), reason: 'html-bid-base' };
  if (htmlMap.byTitle.has(book.title)) return { level: htmlMap.byTitle.get(book.title), reason: 'html-title' };

  if (book.category && /명작|classic/i.test(book.category)) {
    return { level: 'L3', reason: 'classic-default' };
  }

  return { level: 'L3', reason: 'fallback-L3' };
}

async function apiJson(path, init) {
  const res = await fetch(`${API}${path}`, init);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`${res.status} ${path}: ${text.slice(0, 200)}`); }
  if (!res.ok || json.success === false) {
    throw new Error(`${res.status} ${path}: ${json?.error ?? text.slice(0, 200)}`);
  }
  return json.data;
}

async function mapWithConcurrency(items, fn, n) {
  const out = new Array(items.length);
  let cursor = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        try { out[i] = await fn(items[i], i); } catch (e) { out[i] = { __error: e.message }; }
        done++;
        if (done % 20 === 0 || done === items.length) {
          process.stdout.write(`\r  ${done}/${items.length}    `);
        }
      }
    }),
  );
  process.stdout.write('\n');
  return out;
}

async function main() {
  console.log(`mode: ${APPLY ? '🔥 APPLY' : 'DRY-RUN'}\n`);
  const list = await apiJson('/storybooks');
  const htmlMap = await loadHtmlBookMap();
  console.log(`HTML: ${htmlMap.byBid.size} bid + ${htmlMap.byTitle.size} title 매칭 가능`);
  console.log(`라이브러리 ${list.length}권. 개별 fetch...\n`);

  const books = await mapWithConcurrency(list, (s) => apiJson(`/storybooks/${s.id}`), CONCURRENCY);

  const reasonCount = new Map();
  const levelCount = new Map();
  const willUpdate = [];
  let alreadySet = 0;
  let errors = 0;

  for (const b of books) {
    if (!b || b.__error) { errors++; continue; }
    const out = deriveLevel(b, htmlMap);
    reasonCount.set(out.reason, (reasonCount.get(out.reason) ?? 0) + 1);
    levelCount.set(out.level, (levelCount.get(out.level) ?? 0) + 1);
    if (out.reason === 'already-set' || out.reason === 'id-suffix') {
      alreadySet++;
      continue;
    }
    willUpdate.push({ book: b, level: out.level, reason: out.reason });
  }

  console.log('─'.repeat(70));
  console.log('reason 분포:');
  for (const [r, n] of [...reasonCount].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${r.padEnd(22)} ${n}`);
  }
  console.log('\nlevel 분포 (전체):');
  for (const [l, n] of [...levelCount].sort()) {
    console.log(`  ${l.padEnd(22)} ${n}`);
  }
  console.log('\n업데이트 대상:');
  console.log(`  이미 명시 (skip):       ${alreadySet}`);
  console.log(`  새로 채울 책:          ${willUpdate.length}`);
  console.log(`  errors:                ${errors}`);

  // reason별 샘플 5권
  console.log('\nreason별 샘플:');
  const samplesByReason = new Map();
  for (const u of willUpdate) {
    if (!samplesByReason.has(u.reason)) samplesByReason.set(u.reason, []);
    if (samplesByReason.get(u.reason).length < 5) {
      samplesByReason.get(u.reason).push(`    ${u.book.id} ${u.level} ${u.book.title?.slice(0, 30) ?? ''}`);
    }
  }
  for (const [r, samples] of samplesByReason) {
    console.log(`  ${r}:`);
    for (const s of samples) console.log(s);
  }

  if (!APPLY) {
    console.log(`\n💡 위 매핑 OK면 \`node scripts/fill-reading-level.mjs --apply\` 로 실제 업데이트.`);
    return;
  }

  // === APPLY ===
  console.log('\n🔥 APPLY 모드 — 실제 업데이트 시작\n');
  let updated = 0; let failed = 0;
  for (let i = 0; i < willUpdate.length; i++) {
    const { book: b, level } = willUpdate[i];
    try {
      const next = { ...b, readingLevel: level };
      await apiJson('/storybooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storybook: next }),
      });
      updated++;
      if (updated % 20 === 0) process.stdout.write(`\r  updated ${updated}    `);
    } catch (e) {
      failed++;
      if (failed <= 5) console.log(`  ${b.id} FAILED: ${e.message}`);
    }
  }
  process.stdout.write('\n');
  console.log(`\n━━ 완료 ━━\nupdated: ${updated}\nfailed:  ${failed}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
