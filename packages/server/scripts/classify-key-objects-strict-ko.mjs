#!/usr/bin/env node
/**
 * 한글 기준 strict 분류 — "그릴 수 있는 일반 명사" 만 KEEP, 나머지 모두 DELETE.
 *
 * 정책:
 *   1) 한글 있으면 → 한글로만 판정 (영어 fallback X)
 *   2) 한글 명시적 ABSTRACT/PRONOUN/PROPER_NOUN/SHORT_ADJ 매치 → DELETE
 *   3) 한글 어미 휴리스틱 (~다/~한/~운/~인/~던/~은/~른/~픈/~쁜/~의/~히) → DELETE
 *      (단, 사전이 명확히 Noun 으로 분류한 단어 예외 — "거인", "주인" 등 ~인 명사)
 *   4) Wiktionary 한글 결과:
 *      - Noun ∈ pos AND not Proper-noun-only → KEEP
 *      - 그 외 (Verb/Adj/Adv/Proper noun only) → DELETE
 *      - not found → 휴리스틱 위 적용 결과로 (REVIEW)
 *   5) 한글 없는 entry → 영어 Wiktionary Noun → KEEP, 아니면 DELETE (별도 보고)
 *
 * 사용: node packages/server/scripts/classify-key-objects-strict-ko.mjs
 *   (wiktionary-cache.json 재사용)
 *
 * 출력:
 *   - packages/server/scripts/_data/strict-ko-classify.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.SERVER_URL || 'http://localhost:3500';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '_data', 'strict-ko-classify.json');
const CACHE_FILE = path.join(__dirname, '_data', 'wiktionary-cache.json');

const HANGUL = /[가-힣]/;
const HANGUL_ONLY = /^[가-힣]+$/;
const ENGLISH_WORD = /^[a-zA-Z][a-zA-Z\s'-]*$/;
const ENGLISH_PHONICS_ID = /^phonics-en-/i;

// ----------------------------------------------------------------
// 한글 휴리스틱 (vocab-table-ko.html 기반 + 강화)
// ----------------------------------------------------------------
const VERB_END = /[가-힯]다$/;
const ADJ_END = /[가-힯](한|운|는|던|은|른|픈|쁜)$/;   // ~인/의 빼고 (false positive 많음 — 거인·주인)
const ADV_END = /[가-힯]히$/;

const ABSTRACT = new Set([
  // vocab-table 기존
  '사랑','우정','용기','행복','슬픔','기쁨','분노','희망','꿈','마음','생각','감정',
  '지혜','자유','평화','정의','믿음','신뢰','약속','정성','진심','감사','후회',
  '근심','걱정','외로움','쓸쓸함','두려움','놀라움','놀람','부끄러움','자랑',
  '용서','사고','잘못','실수','평소','보통','마지막','처음','이름',
  // 강화: 자주 추상명사 (사용자 의도)
  '행운','운명','기회','변화','성공','실패','발견','도전','노력','결심','고민',
  '도움','비밀','소원','용감','친절','정직','성실','부지런','겸손','진실','평등',
  '자비','동정','존경','존중','이해','관심','사랑함','미움',
  // 시간/추상 개념
  '시간','시기','순간','오늘','내일','어제','지금','옛날','과거','미래','현재',
  '계절','봄','여름','가을','겨울', // ← 계절은 사실 그리기 가능? 일단 keep 안전쪽
]);
// 봄/여름/가을/겨울 은 사실 그릴 수 있어서 빼자
['봄','여름','가을','겨울','계절'].forEach(w => ABSTRACT.delete(w));

const PRONOUN = new Set([
  '그','이','저',
  '이것','그것','저것',
  '여기','거기','저기',
  '이곳','그곳','저곳',
  '나','너','우리','자기','자신','저희','너희','당신',
  '누구','무엇','어디','언제','어떻게','왜',
  // 지시
  '이런','그런','저런','이렇게','그렇게','저렇게',
]);

const SHORT_ADJ = new Set([
  '긴','큰','작은','짧은','넓은','좁은','높은','낮은','많은','적은','얇은','두꺼운',
  '깊은','얕은','빠른','느린','뜨거운','차가운','새','헌','옛',
]);

// ~인/~의 false positive 예외: 명사 (Wiktionary 가 Noun 으로 분류한 것 보조)
const NOUN_OK = new Set([
  '수다','구두','만두','샌드위치','만다라','바다','사다리','다람쥐',
  '거인','주인','노인','부인','연인','상인','시인','죄인','군인','이방인',
  '의의','회의','수의','정의', // ~의 명사 (회의 = meeting)
]);

// 고유명사 (캐릭터/지명 — 학습어휘 부적합)
const PROPER_NOUN_HEUR = new Set([
  '루벤스','릴리풋','체셔','하이디','클라라','파트라슈','네버랜드','웬디','후크','팅커벨',
  '백설공주','신데렐라','라푼젤','헨젤','그레텔','피노키오','피터팬','알라딘','오즈','앨리스',
  '걸리버','엄지공주','엄지','로빈슨','지킬','하이드','로미오','줄리엣','앨리스','한스',
  '도로시','토토','허수아비','양철나무꾼','겁쟁이사자','마법사','오즈마','글린다',
  '체스','체스터','험프티','덤프티','험프티덤프티','흥부','놀부','콩쥐','팥쥐',
]);

let cache = {};
try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')); } catch {
  console.error('cache 없음 — classify-key-objects-wiktionary.mjs 먼저 실행하세요');
  process.exit(1);
}

function classifyKo(ko) {
  // returns { decision: KEEP|DELETE|REVIEW, reason: string }
  if (!ko) return { decision: 'REVIEW', reason: 'no-ko' };

  // 1) 명시 list
  if (ABSTRACT.has(ko)) return { decision: 'DELETE', reason: 'abstract' };
  if (PRONOUN.has(ko)) return { decision: 'DELETE', reason: 'pronoun-or-deictic' };
  if (PROPER_NOUN_HEUR.has(ko)) return { decision: 'DELETE', reason: 'proper-noun-heur' };
  if (SHORT_ADJ.has(ko)) return { decision: 'DELETE', reason: 'short-adj' };

  // 2) NOUN_OK 우회 (~인 명사 등)
  const inNounOk = NOUN_OK.has(ko);

  // 3) 어미 휴리스틱
  if (!inNounOk) {
    if (VERB_END.test(ko)) return { decision: 'DELETE', reason: 'verb-end (~다)' };
    if (ADJ_END.test(ko)) return { decision: 'DELETE', reason: 'adj-end (~한/운/는/던/은/른/픈/쁜)' };
    if (ADV_END.test(ko)) return { decision: 'DELETE', reason: 'adv-end (~히)' };
  }

  // 4) Wiktionary
  const r = cache[ko];
  if (r && r.found) {
    const pos = r.pos || [];
    const hasNoun = pos.some(p => p === 'Noun');
    const hasProper = pos.some(p => p === 'Proper noun');
    if (hasNoun) return { decision: 'KEEP', reason: 'wikt-noun' };
    if (hasProper && pos.length === 1) return { decision: 'DELETE', reason: 'wikt-proper-noun-only' };
    if (pos.length === 0) return { decision: 'REVIEW', reason: 'wikt-found-no-pos' };
    return { decision: 'DELETE', reason: `wikt-non-noun (${pos.join(',')})` };
  }
  // not found in wiktionary, 휴리스틱 통과 — 보수적 KEEP
  return { decision: 'REVIEW', reason: 'wikt-not-found' };
}

function classifyEn(en) {
  if (!en) return { decision: 'REVIEW', reason: 'no-en' };
  const r = cache[en];
  if (r && r.found) {
    const pos = r.pos || [];
    const hasNoun = pos.some(p => p === 'Noun');
    if (hasNoun) return { decision: 'KEEP', reason: 'wikt-en-noun' };
    return { decision: 'DELETE', reason: `wikt-en-non-noun (${pos.join(',')})` };
  }
  return { decision: 'REVIEW', reason: 'wikt-en-not-found' };
}

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return (await r.json()).data;
}

async function main() {
  const [vocabList, sbList] = await Promise.all([
    fetchJson(`${BASE}/api/vocabulary-db`),
    fetchJson(`${BASE}/api/storybooks`),
  ]);
  console.log(`vocab entry: ${vocabList.length} · 책: ${sbList.length}`);

  const idToTitle = new Map(sbList.map(s => [s.id, s.title]));
  const idToType = new Map(sbList.map(s => [s.id, s.type || 'storybook']));

  const entries = new Map();
  for (const v of vocabList) {
    const w = (v.word || '').trim();
    const k = (v.korean || '').trim();
    const ko = HANGUL.test(w) ? w : HANGUL.test(k) ? k : '';
    const en = HANGUL.test(w) ? (HANGUL.test(k) ? '' : k) : w;
    const koClean = ko && HANGUL_ONLY.test(ko) ? ko : '';
    const enClean = en && ENGLISH_WORD.test(en) ? en.toLowerCase() : '';
    if (!koClean && !enClean) continue;

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

  // 분류
  const decisions = { KEEP: [], DELETE: [], REVIEW: [] };
  for (const e of entries.values()) {
    // 한글 우선
    const result = e.ko ? classifyKo(e.ko) : classifyEn(e.en);
    const item = {
      ko: e.ko,
      en: e.en,
      koPos: e.ko && cache[e.ko]?.pos,
      enPos: e.en && cache[e.en]?.pos,
      reason: result.reason,
      bookCount: e.bookIds.size,
      bookTitles: e.bookTitles.slice(0, 5),
    };
    decisions[result.decision].push(item);
  }

  decisions.DELETE.sort((a, b) => b.bookCount - a.bookCount);
  decisions.REVIEW.sort((a, b) => b.bookCount - a.bookCount);

  // reason 분포
  const reasonCount = {};
  for (const d of decisions.DELETE) reasonCount[d.reason] = (reasonCount[d.reason] || 0) + 1;
  const reviewReasonCount = {};
  for (const d of decisions.REVIEW) reviewReasonCount[d.reason] = (reviewReasonCount[d.reason] || 0) + 1;

  console.log(`\n=== 분류 결과 ===`);
  console.log(`KEEP   (명사):       ${decisions.KEEP.length}`);
  console.log(`DELETE (비명사+추상): ${decisions.DELETE.length}`);
  console.log(`REVIEW (사전없음):    ${decisions.REVIEW.length}`);

  console.log(`\n--- DELETE 사유 분포 ---`);
  for (const [k, n] of Object.entries(reasonCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(50)} ${n}`);
  }

  console.log(`\n--- REVIEW 사유 분포 ---`);
  for (const [k, n] of Object.entries(reviewReasonCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(50)} ${n}`);
  }

  console.log(`\n--- DELETE 상위 50 (책 수 desc) ---`);
  for (const d of decisions.DELETE.slice(0, 50)) {
    console.log(`  ${(d.ko || '-').padEnd(10)} ${(d.en || '-').padEnd(15)} ${String(d.bookCount).padStart(3)}권  [${d.reason}]`);
  }

  console.log(`\n--- REVIEW 상위 30 ---`);
  for (const d of decisions.REVIEW.slice(0, 30)) {
    console.log(`  ${(d.ko || '-').padEnd(10)} ${(d.en || '-').padEnd(15)} ${String(d.bookCount).padStart(3)}권  [${d.reason}]`);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    summary: {
      total: entries.size,
      keep: decisions.KEEP.length,
      delete: decisions.DELETE.length,
      review: decisions.REVIEW.length,
      deleteReasonCount: reasonCount,
      reviewReasonCount,
    },
    delete: decisions.DELETE,
    review: decisions.REVIEW,
  }, null, 2), 'utf-8');
  console.log(`\n→ ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
