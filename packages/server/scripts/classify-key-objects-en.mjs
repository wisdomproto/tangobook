#!/usr/bin/env node
/**
 * 동화책 keyObject 의 **영어** 단어를 dictionaryapi.dev 로 품사 판정.
 * 명사 의미가 1개라도 있으면 명사 OK (lenient).
 * 명사 의미 0 인 단어 → 비명사 후보 (한영 쌍 같이 출력).
 *
 * 사용: node packages/server/scripts/classify-key-objects-en.mjs [--limit N]
 *   (서버 localhost:3500 가동 필요)
 *
 * 출력:
 *   - console summary
 *   - packages/server/scripts/_data/non-noun-en.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.SERVER_URL || 'http://localhost:3500';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '_data', 'non-noun-en.json');
const CACHE_FILE = path.join(__dirname, '_data', 'dict-cache.json');

const args = new Map();
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--limit') args.set('limit', Number(process.argv[++i]));
}
const LIMIT = args.get('limit') || Infinity;

const HANGUL = /[가-힣]/;
const ENGLISH_PHONICS_ID = /^phonics-en-/i;
const ENGLISH_WORD = /^[a-zA-Z][a-zA-Z\s'-]*$/;

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return (await r.json()).data;
}

// 사전 cache 로드 (재실행 시 API 호출 최소화)
let cache = {};
try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')); } catch {}

let firstErrLogged = false;
async function lookup(word) {
  const key = word.toLowerCase().trim();
  if (cache[key]) return cache[key];
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`);
      if (r.status === 404) {
        cache[key] = { found: false };
        return cache[key];
      }
      if (r.status === 429 || r.status >= 500) {
        await new Promise(rs => setTimeout(rs, 500 * attempt));
        continue;
      }
      if (!r.ok) throw new Error(`status ${r.status}`);
      const arr = await r.json();
      const pos = new Set();
      for (const entry of arr) {
        for (const m of (entry.meanings || [])) {
          if (m.partOfSpeech) pos.add(m.partOfSpeech);
        }
      }
      cache[key] = { found: true, pos: [...pos] };
      return cache[key];
    } catch (e) {
      if (!firstErrLogged) { console.log(`  [debug] first error on "${key}" attempt ${attempt}: ${e.message}`); firstErrLogged = true; }
      if (attempt === 4) {
        // 4회 실패 — error 로 cache (skip 됨, 재실행 시 retry 위해 cache 안 함이 더 나음? 일단 안 함)
        return { found: false, error: e.message };
      }
      await new Promise(rs => setTimeout(rs, 500 * attempt));
    }
  }
  return { found: false, error: 'unreachable' };
}

// 병렬 lookup with concurrency
async function lookupAll(words, concurrency = 8) {
  const results = new Map();
  let idx = 0;
  let done = 0;
  async function worker() {
    while (idx < words.length) {
      const i = idx++;
      const w = words[i];
      results.set(w, await lookup(w));
      done++;
      if (done % 50 === 0) {
        console.log(`  ${done}/${words.length}`);
        // 주기적 cache 저장
        fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8');
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8');
  return results;
}

async function main() {
  console.log(`서버: ${BASE}`);
  const [vocabList, sbList] = await Promise.all([
    fetchJson(`${BASE}/api/vocabulary-db`),
    fetchJson(`${BASE}/api/storybooks`),
  ]);
  console.log(`단어 entry: ${vocabList.length} · 책: ${sbList.length}`);

  const idToTitle = new Map(sbList.map(s => [s.id, s.title]));
  const idToType = new Map(sbList.map(s => [s.id, s.type || 'storybook']));

  // 한영 쌍 + 동화책 등장 entry 만
  // map: enWord(lower) → { en, koSet, bookCount, bookTitles }
  const enMap = new Map();
  for (const v of vocabList) {
    const w = (v.word || '').trim();
    const k = (v.korean || '').trim();
    const en = HANGUL.test(w) ? (HANGUL.test(k) ? '' : k) : w;
    const ko = HANGUL.test(w) ? w : HANGUL.test(k) ? k : '';
    if (!en || !ENGLISH_WORD.test(en)) continue;
    // 동화책 (key_object) source 만
    const bookIds = new Set();
    const titles = [];
    for (const s of (v.sources || [])) {
      if (s.sourceType === 'storybook-vocabulary') continue;
      const id = s.storybookId;
      if (!id) continue;
      if (ENGLISH_PHONICS_ID.test(id)) continue;
      const isPhonics = idToType.get(id) === 'phonics' || /phonics/i.test(s.sourceType || '');
      if (isPhonics) continue;
      if (!bookIds.has(id)) {
        bookIds.add(id);
        titles.push(idToTitle.get(id) || id);
      }
    }
    if (bookIds.size === 0) continue;
    const lower = en.toLowerCase();
    let entry = enMap.get(lower);
    if (!entry) {
      entry = { en: lower, koSet: new Set(), bookIds: new Set(), bookTitles: [] };
      enMap.set(lower, entry);
    }
    if (ko) entry.koSet.add(ko);
    for (const id of bookIds) {
      if (!entry.bookIds.has(id)) {
        entry.bookIds.add(id);
        entry.bookTitles.push(idToTitle.get(id) || id);
      }
    }
  }

  let allWords = [...enMap.keys()].sort();
  if (allWords.length > LIMIT) allWords = allWords.slice(0, LIMIT);
  console.log(`사전 lookup 대상: ${allWords.length} 영어 단어 (cache: ${Object.keys(cache).length})`);

  const results = await lookupAll(allWords, 3);

  // 비명사 후보 추출
  const nonNoun = [];
  const notFound = [];
  const compoundSpace = [];
  for (const en of allWords) {
    const e = enMap.get(en);
    const r = results.get(en);
    const item = {
      en,
      ko: [...e.koSet],
      bookCount: e.bookIds.size,
      bookTitles: e.bookTitles.slice(0, 3),
      pos: r.pos || [],
    };
    if (en.includes(' ') || en.includes('-')) {
      compoundSpace.push(item);
      continue;
    }
    if (!r.found) { notFound.push(item); continue; }
    if (!r.pos.includes('noun')) nonNoun.push(item);
  }

  nonNoun.sort((a, b) => b.bookCount - a.bookCount);

  // POS 분포
  const posCount = {};
  for (const n of nonNoun) {
    const key = n.pos.length ? n.pos.join('+') : '(empty)';
    posCount[key] = (posCount[key] || 0) + 1;
  }

  console.log(`\n=== 비명사 후보: ${nonNoun.length} / ${allWords.length} ===`);
  console.log(`사전에 없는 단어: ${notFound.length} (보통 고유명사·복합어·오타)`);
  console.log(`복합어/공백 포함: ${compoundSpace.length} (사전 lookup skip)`);

  console.log('\n--- POS 분포 (비명사) ---');
  for (const [k, n] of Object.entries(posCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(30)} ${n}`);
  }

  console.log('\n--- 상위 30 (등장 책 수 desc) ---');
  for (const c of nonNoun.slice(0, 30)) {
    console.log(`  ${c.en.padEnd(15)} ${c.ko.join(',').padEnd(15)} ${String(c.bookCount).padStart(3)}권  [${c.pos.join(',') || '?'}]`);
  }

  if (notFound.length) {
    console.log(`\n--- 사전에 없는 상위 15 (수동 검토 필요) ---`);
    notFound.sort((a, b) => b.bookCount - a.bookCount);
    for (const c of notFound.slice(0, 15)) {
      console.log(`  ${c.en.padEnd(15)} ${c.ko.join(',').padEnd(15)} ${String(c.bookCount).padStart(3)}권`);
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    summary: {
      totalEn: allWords.length,
      nonNoun: nonNoun.length,
      notFound: notFound.length,
      compoundSpace: compoundSpace.length,
      posCount,
    },
    nonNoun,
    notFound,
    compoundSpace,
  }, null, 2), 'utf-8');
  console.log(`\n→ ${path.relative(process.cwd(), OUT)} 저장`);
}

main().catch((e) => { console.error(e); process.exit(1); });
