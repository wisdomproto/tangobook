#!/usr/bin/env node
/**
 * 페이지 텍스트 기반 keyObject 재분류.
 *
 * 정책:
 *   1) 각 책의 모든 page.text (한글) 를 한국어 토큰으로 나눔 (조사 strip).
 *   2) Wiktionary 에서 Noun 인 토큰만 후보 명사로.
 *   3) 책별:
 *      - KEEP    : 기존 keyObject 의 한글이 후보 명사 set 에 있음 + page 매핑도 text 에 등장
 *      - DELETE  : 기존 keyObject 의 한글이 어느 페이지 텍스트에도 안 나옴
 *      - ADD     : 후보 명사 중 기존 keyObject 에 없는 새 단어 (페이지별 등장)
 *
 * 사용: node packages/server/scripts/classify-by-page-text.mjs
 * 출력: packages/server/scripts/_data/text-based-classify.json
 *      + packages/client/public/_analysis/text-based-classify.json (에디터 용)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.SERVER_URL || 'http://localhost:3500';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '_data', 'text-based-classify.json');
const OUT_PUBLIC = path.join(__dirname, '..', '..', 'client', 'public', '_analysis', 'text-based-classify.json');
const CACHE_FILE = path.join(__dirname, '_data', 'wiktionary-cache.json');
const UA = 'TangoBookTextNounExtractor/1.0 (https://tangobook.co.kr)';
const CONCURRENCY_LOOKUP = 3;
const CONCURRENCY_BOOK = 6;

// ============================================================
// 한국어 토큰화
// ============================================================
const HANGUL = /[가-힣]/;
const HANGUL_RUN = /[가-힣]+/g;

// 조사 (긴 것 먼저 — greedy 매칭 위해)
const POSTPOS_LONG = ['에서는','에서도','에서를','에서까지','로부터','이라고','이라는','입니다','였습니다','였어요'];
const POSTPOS_MED  = ['에서','에게','에는','에도','에를','이나','이며','에다','부터','까지','보다','만큼','처럼','이라','이고','이면','이지','이야','예요','였다','였어'];
const POSTPOS_SHORT = ['은','는','이','가','을','를','의','에','로','와','과','도','만','들','랑','요','네','다','죠','꼭'];

function stripPostpos(tok) {
  // 긴 조사 우선
  for (const p of POSTPOS_LONG) if (tok.endsWith(p) && tok.length > p.length + 1) return tok.slice(0, -p.length);
  for (const p of POSTPOS_MED)  if (tok.endsWith(p) && tok.length > p.length + 1) return tok.slice(0, -p.length);
  for (const p of POSTPOS_SHORT) if (tok.endsWith(p) && tok.length >= 2) {
    // 2글자 토큰이면 strip 후 1글자 남아서 별 의미 X — 조심
    const stripped = tok.slice(0, -p.length);
    if (stripped.length >= 2) return stripped;
  }
  return tok;
}

function tokenizeKorean(text) {
  if (!text) return [];
  const tokens = [];
  for (const m of text.match(HANGUL_RUN) || []) {
    if (m.length < 2) continue;
    const stripped = stripPostpos(m);
    if (stripped.length >= 2) tokens.push(stripped);
    // strip 안 한 원본도 후보 (조사 없이 그대로 명사로 쓰인 경우)
    if (stripped !== m && m.length >= 2) tokens.push(m);
  }
  return tokens;
}

// ============================================================
// Wiktionary lookup (cache 활용)
// ============================================================
let cache = {};
try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')); } catch {}
let cacheDirty = false;
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
        cacheDirty = true;
        return cache[key];
      }
      if (r.status === 429 || r.status >= 500) {
        await new Promise(rs => setTimeout(rs, 600 * attempt));
        continue;
      }
      if (!r.ok) throw new Error(`status ${r.status}`);
      const data = await r.json();
      const pos = new Set();
      for (const arr of Object.values(data)) {
        if (!Array.isArray(arr)) continue;
        for (const s of arr) if (s.partOfSpeech) pos.add(s.partOfSpeech);
      }
      cache[key] = { found: true, pos: [...pos] };
      cacheDirty = true;
      return cache[key];
    } catch (e) {
      if (!firstErrLogged) { console.log(`  [debug] err on "${key}": ${e.message}`); firstErrLogged = true; }
      if (attempt === 4) return { found: false, error: e.message };
      await new Promise(rs => setTimeout(rs, 600 * attempt));
    }
  }
  return { found: false };
}

async function lookupAll(words) {
  const arr = [...words];
  let idx = 0;
  let done = 0;
  let lastSave = Date.now();
  async function worker() {
    while (idx < arr.length) {
      const i = idx++;
      await lookup(arr[i]);
      done++;
      if (done % 100 === 0) {
        console.log(`    lookup ${done}/${arr.length}`);
        if (Date.now() - lastSave > 5000 && cacheDirty) {
          fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8');
          cacheDirty = false;
          lastSave = Date.now();
        }
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY_LOOKUP }, worker));
  if (cacheDirty) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8');
    cacheDirty = false;
  }
}

// ============================================================
// 명시 비명사 (Wiktionary 결과 위에 강제 적용)
// ============================================================
const FORCE_NON_NOUN = new Set([
  // 대명사·지시명사·위치명사 (Wiktionary 가 Noun 으로 잡아도 강제 비명사)
  '여기','거기','저기','이것','그것','저것','이곳','그곳','저곳',
  '우리','자기','자신','저희','너희','당신','누구','무엇','어디','언제',
  '이런','그런','저런','이렇게','그렇게','저렇게','오늘','내일','어제','지금','옛날',
  '처음','마지막','보통','평소','잘못','실수','때문','경우','동안','만큼','정도',
  // 추상명사
  '사랑','우정','용기','행복','슬픔','기쁨','분노','희망','꿈','마음','생각','감정',
  '지혜','자유','평화','정의','믿음','신뢰','약속','정성','진심','감사','후회',
  '근심','걱정','외로움','두려움','놀라움','놀람','부끄러움','자랑','용서',
  '행운','운명','기회','변화','성공','실패','발견','도전','노력','결심','고민',
  '도움','비밀','소원','용감','친절','정직','성실','겸손','진실','평등',
  '자비','동정','존경','존중','이해','관심','미움','시간','시기','순간',
  // 인사·감탄
  '안녕','정말','그래','네네','아니','맞아','좋아','싫어','진짜',
]);

function isNoun(word, posInfo) {
  if (FORCE_NON_NOUN.has(word)) return false;
  if (!posInfo || !posInfo.found) return false;
  const pos = posInfo.pos || [];
  if (!pos.includes('Noun')) return false;
  // Proper noun only 면 X
  if (pos.length === 1 && pos[0] === 'Proper noun') return false;
  return true;
}

// ============================================================
// 책별 분석
// ============================================================
function extractKo(ko) {
  const k = (ko.korean || '').trim();
  if (k && HANGUL.test(k)) return k;
  const n = (ko.name || '').trim();
  if (HANGUL.test(n)) return n;
  return '';
}

function extractEn(ko) {
  const en = (ko.nameEn || '').trim();
  if (en) return en;
  const n = (ko.name || '').trim();
  return HANGUL.test(n) ? '' : n;
}

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return (await r.json()).data;
}

async function main() {
  const books = await fetchJson(`${BASE}/api/storybooks`);
  const storybookList = books.filter(b => (b.type || 'storybook') === 'storybook');
  console.log(`총 동화책: ${storybookList.length}`);

  // pass 1: 모든 책의 텍스트에서 토큰 모으기
  console.log(`\n[pass 1] 페이지 텍스트 토큰 수집...`);
  const allTokens = new Set();
  const bookPageTokens = new Map(); // bookId → Map<pageNumber, Set<token>>
  const fullBooks = new Map(); // bookId → full storybook (캐시)

  let idx = 0;
  let done = 0;
  async function fetchWorker() {
    while (idx < storybookList.length) {
      const i = idx++;
      const meta = storybookList[i];
      try {
        const full = await fetchJson(`${BASE}/api/storybooks/${encodeURIComponent(meta.id)}`);
        fullBooks.set(full.id, full);
        const pageToks = new Map();
        for (const p of (full.pages || [])) {
          const toks = new Set(tokenizeKorean(p.text || ''));
          pageToks.set(p.pageNumber, toks);
          for (const t of toks) allTokens.add(t);
        }
        bookPageTokens.set(full.id, pageToks);
      } catch (e) {
        console.warn(`  fetch fail ${meta.id}: ${e.message}`);
      }
      done++;
      if (done % 30 === 0) console.log(`  fetch ${done}/${storybookList.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY_BOOK }, fetchWorker));
  console.log(`unique 토큰: ${allTokens.size} (cache: ${Object.keys(cache).length})`);

  // pass 2: Wiktionary lookup
  const need = [...allTokens].filter(t => !cache[t]);
  console.log(`\n[pass 2] Wiktionary lookup: ${need.length} 새 토큰...`);
  await lookupAll(need);

  // pass 3: 책별 분류
  console.log(`\n[pass 3] 책별 분류...`);
  const result = [];
  for (const meta of storybookList) {
    const book = fullBooks.get(meta.id);
    if (!book) continue;
    const pageToks = bookPageTokens.get(book.id) || new Map();

    // 1) 책 전체 텍스트 등장 명사 set
    const allBookTokens = new Set();
    const tokenToPages = new Map(); // token → Set<pageNumber>
    for (const [pn, toks] of pageToks) {
      for (const t of toks) {
        allBookTokens.add(t);
        if (!tokenToPages.has(t)) tokenToPages.set(t, new Set());
        tokenToPages.get(t).add(pn);
      }
    }
    const bookNouns = [...allBookTokens].filter(t => isNoun(t, cache[t]));

    // 2) 기존 keyObject 분류
    const existing = book.key_objects || [];
    const keep = [];
    const del = [];
    for (const ko of existing) {
      const word = extractKo(ko);
      if (!word) {
        // 한글 없으면 그대로 KEEP (한글 기준 외)
        keep.push({ word: extractEn(ko) || '-', en: extractEn(ko), reason: 'no-korean', pages: ko.pages || [] });
        continue;
      }
      if (allBookTokens.has(word)) {
        keep.push({ word, en: extractEn(ko), pages: ko.pages || [] });
      } else {
        del.push({ word, en: extractEn(ko), pages: ko.pages || [], reason: 'not-in-text' });
      }
    }

    // 3) ADD 후보 — 텍스트에 있고 명사인데 기존 keyObject 에 없는 것
    const existingWords = new Set(existing.map(extractKo).filter(Boolean));
    const add = [];
    for (const t of bookNouns) {
      if (existingWords.has(t)) continue;
      add.push({ word: t, pages: [...(tokenToPages.get(t) || [])].sort((a, b) => a - b) });
    }
    add.sort((a, b) => b.pages.length - a.pages.length);

    result.push({
      bookId: book.id,
      title: book.title,
      category: book.category,
      stats: { keep: keep.length, delete: del.length, add: add.length },
      keep, delete: del, add,
    });
  }

  // 요약
  const totalStats = result.reduce((acc, b) => {
    acc.keep += b.stats.keep;
    acc.delete += b.stats.delete;
    acc.add += b.stats.add;
    return acc;
  }, { keep: 0, delete: 0, add: 0 });

  console.log(`\n=== 요약 ===`);
  console.log(`책: ${result.length}`);
  console.log(`KEEP   (텍스트에 있음):  ${totalStats.keep}`);
  console.log(`DELETE (텍스트에 없음):  ${totalStats.delete}`);
  console.log(`ADD    (텍스트에 새로 발견된 명사): ${totalStats.add}`);

  console.log(`\n--- ADD 후보 많은 책 상위 15 ---`);
  result.sort((a, b) => b.stats.add - a.stats.add);
  for (const b of result.slice(0, 15)) {
    console.log(`  ${(b.title || '').padEnd(40)} ADD ${String(b.stats.add).padStart(3)} · DEL ${String(b.stats.delete).padStart(3)} · KEEP ${String(b.stats.keep).padStart(3)}`);
  }

  console.log(`\n--- DELETE 후보 많은 책 상위 15 ---`);
  result.sort((a, b) => b.stats.delete - a.stats.delete);
  for (const b of result.slice(0, 15)) {
    console.log(`  ${(b.title || '').padEnd(40)} DEL ${String(b.stats.delete).padStart(3)} · ADD ${String(b.stats.add).padStart(3)} · KEEP ${String(b.stats.keep).padStart(3)}`);
  }

  // 다시 title 정렬해서 저장
  result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  const payload = {
    summary: { books: result.length, ...totalStats, generatedAt: new Date().toISOString() },
    books: result,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf-8');
  fs.mkdirSync(path.dirname(OUT_PUBLIC), { recursive: true });
  fs.writeFileSync(OUT_PUBLIC, JSON.stringify(payload), 'utf-8');
  console.log(`\n→ ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
  console.log(`→ ${path.relative(process.cwd(), OUT_PUBLIC)} (에디터 용)`);
}

main().catch(e => { console.error(e); process.exit(1); });
