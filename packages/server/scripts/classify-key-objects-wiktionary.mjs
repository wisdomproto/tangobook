#!/usr/bin/env node
/**
 * Wiktionary REST API 로 한글+영어 keyObject 단어 모두 분류.
 * en.wiktionary.org 가 한국어/영어 entry 모두 보유 — endpoint 통일.
 *
 * 분류 정책 (lenient):
 *   - 한영 쌍에서 **한쪽이라도** Noun 1개 이상 → KEEP (명사)
 *   - 양쪽 모두 명사 의미 0 + 다른 POS 있음 → DELETE (비명사 — 동사/형용사/부사)
 *   - 한쪽 not found, 다른 쪽 명사 → KEEP
 *   - 양쪽 모두 not found → REVIEW (사람 검토)
 *
 * 사용:
 *   node packages/server/scripts/classify-key-objects-wiktionary.mjs
 *   node packages/server/scripts/classify-key-objects-wiktionary.mjs --limit 50  (테스트)
 *
 * 출력:
 *   - console summary
 *   - packages/server/scripts/_data/wiktionary-classify.json  (전체)
 *   - packages/server/scripts/_data/wiktionary-cache.json     (재실행용 cache)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.SERVER_URL || 'http://localhost:3500';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '_data', 'wiktionary-classify.json');
const CACHE_FILE = path.join(__dirname, '_data', 'wiktionary-cache.json');
const UA = 'TangoBookKeyObjectClassifier/1.0 (https://tangobook.co.kr; kil210@tangobook.co.kr)';
const CONCURRENCY = 3;

const args = new Map();
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--limit') args.set('limit', Number(process.argv[++i]));
}
const LIMIT = args.get('limit') || Infinity;

const HANGUL = /[가-힣]/;
const HANGUL_ONLY = /^[가-힣]+$/;
const ENGLISH_WORD = /^[a-zA-Z][a-zA-Z\s'-]*$/;
const ENGLISH_PHONICS_ID = /^phonics-en-/i;

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return (await r.json()).data;
}

let cache = {};
try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')); } catch {}
let firstErrLogged = false;

async function lookup(word) {
  const key = word.trim();
  if (!key) return { found: false };
  if (cache[key]) return cache[key];
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(
        `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(key)}`,
        { headers: { 'User-Agent': UA, 'Accept': 'application/json' } }
      );
      if (r.status === 404) {
        cache[key] = { found: false };
        return cache[key];
      }
      if (r.status === 429 || r.status >= 500) {
        await new Promise(rs => setTimeout(rs, 600 * attempt));
        continue;
      }
      if (!r.ok) throw new Error(`status ${r.status}`);
      const data = await r.json();
      const pos = new Set();
      // data: { ko: [{ partOfSpeech, language, definitions }], en: [...] }
      for (const arr of Object.values(data)) {
        if (!Array.isArray(arr)) continue;
        for (const s of arr) {
          if (s.partOfSpeech) pos.add(s.partOfSpeech);
        }
      }
      cache[key] = { found: true, pos: [...pos] };
      return cache[key];
    } catch (e) {
      if (!firstErrLogged) {
        console.log(`  [debug] first error on "${key}" attempt ${attempt}: ${e.message}`);
        firstErrLogged = true;
      }
      if (attempt === 4) return { found: false, error: e.message };
      await new Promise(rs => setTimeout(rs, 600 * attempt));
    }
  }
  return { found: false };
}

async function lookupAll(words) {
  const results = new Map();
  let idx = 0;
  let done = 0;
  const start = Date.now();
  async function worker() {
    while (idx < words.length) {
      const i = idx++;
      const w = words[i];
      results.set(w, await lookup(w));
      done++;
      if (done % 50 === 0) {
        const el = ((Date.now() - start) / 1000).toFixed(0);
        console.log(`  ${done}/${words.length}  (${el}s)`);
        fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8');
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8');
  return results;
}

function isNounPos(pos) {
  // Wiktionary partOfSpeech 명사형: "Noun", "Proper noun"
  return pos.some(p => /^(Noun|Proper noun)$/i.test(p));
}

async function main() {
  console.log(`서버: ${BASE}`);
  const [vocabList, sbList] = await Promise.all([
    fetchJson(`${BASE}/api/vocabulary-db`),
    fetchJson(`${BASE}/api/storybooks`),
  ]);
  console.log(`vocab entry: ${vocabList.length} · 책: ${sbList.length}`);

  const idToTitle = new Map(sbList.map(s => [s.id, s.title]));
  const idToType = new Map(sbList.map(s => [s.id, s.type || 'storybook']));

  // 동화책 (key_object source) 단어만
  // map key = `${ko}|${en}` (한영 쌍)
  const entries = new Map();
  for (const v of vocabList) {
    const w = (v.word || '').trim();
    const k = (v.korean || '').trim();
    const ko = HANGUL.test(w) ? w : HANGUL.test(k) ? k : '';
    const en = HANGUL.test(w) ? (HANGUL.test(k) ? '' : k) : w;
    const koClean = ko && HANGUL_ONLY.test(ko) ? ko : '';
    const enClean = en && ENGLISH_WORD.test(en) ? en.toLowerCase() : '';
    if (!koClean && !enClean) continue;

    // 동화책 등장 book ids 모음
    const bookIds = new Set();
    for (const s of (v.sources || [])) {
      if (s.sourceType === 'storybook-vocabulary') continue;
      const id = s.storybookId;
      if (!id) continue;
      if (ENGLISH_PHONICS_ID.test(id)) continue;
      const isPhonics = idToType.get(id) === 'phonics' || /phonics/i.test(s.sourceType || '');
      if (isPhonics) continue;
      bookIds.add(id);
    }
    if (bookIds.size === 0) continue;

    const key = `${koClean}|${enClean}`;
    let entry = entries.get(key);
    if (!entry) {
      entry = { ko: koClean, en: enClean, bookIds: new Set(), bookTitles: [] };
      entries.set(key, entry);
    }
    for (const id of bookIds) {
      if (!entry.bookIds.has(id)) {
        entry.bookIds.add(id);
        entry.bookTitles.push(idToTitle.get(id) || id);
      }
    }
  }
  console.log(`동화책 등장 한영쌍 entry: ${entries.size}`);

  // lookup 대상 단어 set (한+영)
  const words = new Set();
  for (const e of entries.values()) {
    if (e.ko) words.add(e.ko);
    if (e.en) words.add(e.en);
  }
  let wordList = [...words].sort();
  if (wordList.length > LIMIT) wordList = wordList.slice(0, LIMIT);
  console.log(`lookup 대상 단어: ${wordList.length} (cache: ${Object.keys(cache).length})`);

  const results = await lookupAll(wordList);
  console.log(`lookup 완료`);

  // 분류
  const decisions = { KEEP: [], DELETE: [], REVIEW: [] };
  for (const e of entries.values()) {
    const koR = e.ko ? results.get(e.ko) : null;
    const enR = e.en ? results.get(e.en) : null;
    const koPos = (koR && koR.found) ? koR.pos : null;
    const enPos = (enR && enR.found) ? enR.pos : null;
    const item = {
      ko: e.ko, en: e.en,
      koPos, enPos,
      bookCount: e.bookIds.size,
      bookTitles: e.bookTitles.slice(0, 3),
    };
    const koNoun = koPos ? isNounPos(koPos) : false;
    const enNoun = enPos ? isNounPos(enPos) : false;
    const koFound = !!koPos;
    const enFound = !!enPos;
    if (koNoun || enNoun) {
      decisions.KEEP.push(item);
    } else if (!koFound && !enFound) {
      decisions.REVIEW.push(item);
    } else {
      // 한쪽 이상 found, 명사 없음 → 비명사
      decisions.DELETE.push(item);
    }
  }

  decisions.DELETE.sort((a, b) => b.bookCount - a.bookCount);
  decisions.REVIEW.sort((a, b) => b.bookCount - a.bookCount);

  // DELETE 사유별 분포
  const reasonCount = {};
  for (const d of decisions.DELETE) {
    const allPos = [...(d.koPos || []), ...(d.enPos || [])].filter(p => p);
    const key = allPos.length ? [...new Set(allPos)].sort().join('+') : '(none)';
    reasonCount[key] = (reasonCount[key] || 0) + 1;
  }

  console.log(`\n=== 분류 결과 ===`);
  console.log(`KEEP   (명사):       ${decisions.KEEP.length}`);
  console.log(`DELETE (비명사):     ${decisions.DELETE.length}`);
  console.log(`REVIEW (사전없음):   ${decisions.REVIEW.length}`);

  console.log(`\n--- DELETE POS 분포 ---`);
  for (const [k, n] of Object.entries(reasonCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(40)} ${n}`);
  }

  console.log(`\n--- DELETE 상위 30 (등장 책 수 desc) ---`);
  for (const d of decisions.DELETE.slice(0, 30)) {
    const pos = [...new Set([...(d.koPos || []), ...(d.enPos || [])])].join(',') || '?';
    console.log(`  ${(d.ko || '-').padEnd(10)} ${(d.en || '-').padEnd(15)} ${String(d.bookCount).padStart(3)}권  [${pos}]`);
  }

  console.log(`\n--- REVIEW 상위 30 (사전 둘 다 없음, 책 수 desc) ---`);
  for (const d of decisions.REVIEW.slice(0, 30)) {
    console.log(`  ${(d.ko || '-').padEnd(10)} ${(d.en || '-').padEnd(15)} ${String(d.bookCount).padStart(3)}권`);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    summary: {
      total: entries.size,
      keep: decisions.KEEP.length,
      delete: decisions.DELETE.length,
      review: decisions.REVIEW.length,
      deleteReasonCount: reasonCount,
    },
    delete: decisions.DELETE,
    review: decisions.REVIEW,
    keep: decisions.KEEP, // 참고용 — 큼
  }, null, 2), 'utf-8');
  console.log(`\n→ ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
