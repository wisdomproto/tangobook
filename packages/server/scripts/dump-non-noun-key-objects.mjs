#!/usr/bin/env node
/**
 * 동화책 keyObject 중 명사가 아닌 후보를 추출.
 * vocab-table-ko.html 의 isNonNoun 로직을 그대로 재사용.
 * vocab-overrides 의 exclusions(이미 제외 처리) / renames(사용자가 다른 단어로 바꿈) 도 반영.
 *
 * 사용: node packages/server/scripts/dump-non-noun-key-objects.mjs
 *   (서버가 localhost:3500 에 떠 있어야 함)
 *
 * 출력:
 *   - console summary
 *   - packages/server/scripts/_data/non-noun-key-objects.json (전체 raw)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.SERVER_URL || 'http://localhost:3500';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '_data', 'non-noun-key-objects.json');

// ----------------------------------------------------------------
// vocab-table-ko.html 의 isNonNoun 로직 그대로 (2026-05-11 기준)
// ----------------------------------------------------------------
const VERB_END = /[가-힯]다$/;
const ADJ_END = /[가-힯](한|운|는|인|던|은|른|픈|쁜|의)$/;
const ADV_END = /[가-힯]히$/;
const MID_PARTICLE = /[가-힯](의|과|와|이|가)[가-힯]/;

const ABSTRACT = new Set([
  '사랑','우정','용기','행복','슬픔','기쁨','분노','희망','꿈','마음','생각','감정',
  '지혜','자유','평화','정의','믿음','신뢰','약속','정성','진심','감사','후회',
  '근심','걱정','외로움','쓸쓸함','두려움','놀라움','놀람','부끄러움','자랑',
  '용서','사고','잘못','실수','평소','보통','마지막','처음','이름',
]);
const PRONOUN = new Set(['그','이','저','이것','그것','저것','나','너','우리','자기','자신']);
const SHORT_ADJ = new Set(['긴','큰','작은','짧은','넓은','좁은','높은','낮은','많은','적은','얇은','두꺼운']);
const NOUN_OK = new Set(['수다','구두','만두','샌드위치','만다라','바다','사다리','다람쥐']);
const PROPER_NOUN = new Set([
  '루벤스','릴리풋','체셔','하이디','클라라','파트라슈','네버랜드','웬디','후크','팅커벨',
  '백설공주','신데렐라','라푼젤','헨젤','그레텔','피노키오','피터팬','알라딘','오즈','앨리스',
  '걸리버','엄지공주','엄지','로빈슨','지킬','하이드','로미오','줄리엣','이상','앨리스','한스',
  '도로시','토토','허수아비','양철나무꾼','겁쟁이사자','마법사','오즈마','글린다',
  '체스','체스터','험프티','덤프티','험프티덤프티',
]);

function classifyNonNoun(key) {
  if (!key) return 'empty';
  if (NOUN_OK.has(key)) return null;
  if (VERB_END.test(key)) return 'verb (~다)';
  if (ADJ_END.test(key)) return 'adj (~한/운/는/인/던/은/른/픈/쁜/의)';
  if (ADV_END.test(key)) return 'adv (~히)';
  if (MID_PARTICLE.test(key)) return 'particle-compound (의/과/와/이/가)';
  if (SHORT_ADJ.has(key)) return 'short-adj';
  if (ABSTRACT.has(key)) return 'abstract';
  if (PRONOUN.has(key)) return 'pronoun';
  if (PROPER_NOUN.has(key)) return 'proper-noun';
  return null;
}

const HANGUL = /[가-힣]/;
const HANGUL_ONLY = /^[가-힣]+$/;
const ENGLISH_PHONICS_ID = /^phonics-en-/i;

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return (await r.json()).data;
}

async function main() {
  console.log(`서버: ${BASE}`);
  const [vocabList, sbList, overrides] = await Promise.all([
    fetchJson(`${BASE}/api/vocabulary-db`),
    fetchJson(`${BASE}/api/storybooks`),
    fetch(`${BASE}/api/vocab-overrides`).then(r => r.json()).then(j => j.data || {}),
  ]);
  console.log(`단어 entry: ${vocabList.length} · 책: ${sbList.length}`);

  const exclusions = new Set(overrides.exclusions || []);
  const renames = new Map(Object.entries(overrides.renames || {}));
  console.log(`overrides: 제외 ${exclusions.size} · rename ${renames.size}`);

  const idToTitle = new Map(sbList.map(s => [s.id, s.title]));
  const idToType = new Map(sbList.map(s => [s.id, s.type || 'storybook']));

  // word → { books: Set<id>, bookTitles: [{id,title}] } (vocab-table 패턴 그대로)
  const wordMap = new Map();
  for (const v of vocabList) {
    const w = (v.word || '').trim();
    const k = (v.korean || '').trim();
    const ko = HANGUL.test(w) ? w : HANGUL.test(k) ? k : '';
    if (!ko) continue;
    if (!HANGUL_ONLY.test(ko)) continue;

    let entry = wordMap.get(ko);
    if (!entry) {
      entry = { word: ko, books: new Set(), bookTitles: [] };
      wordMap.set(ko, entry);
    }

    for (const s of (v.sources || [])) {
      if (s.sourceType === 'storybook-vocabulary') continue; // key_object 만
      const id = s.storybookId;
      if (!id) continue;
      if (ENGLISH_PHONICS_ID.test(id)) continue;
      const isPhonics = idToType.get(id) === 'phonics' || /phonics/i.test(s.sourceType || '');
      if (isPhonics) continue; // 동화책만 (사용자 요청)
      if (!entry.books.has(id)) {
        entry.books.add(id);
        entry.bookTitles.push({ id, title: idToTitle.get(id) || id });
      }
    }
  }

  // 동화책에 등장 + 비명사 → 후보
  const candidates = [];
  for (const [w, e] of wordMap) {
    if (e.books.size === 0) continue;          // 동화책 등장 없으면 skip
    if (exclusions.has(w)) continue;            // 이미 사용자가 제외함
    // rename 의 word 가 다르면 그 새 word 로 평가
    const renamed = renames.get(w);
    const evalWord = (renamed && renamed.word) ? renamed.word : w;
    const reason = classifyNonNoun(evalWord);
    if (!reason) continue;
    candidates.push({
      word: evalWord,
      originalWord: w !== evalWord ? w : undefined,
      reason,
      bookCount: e.books.size,
      bookTitles: e.bookTitles.slice(0, 5).map(b => b.title),
    });
  }

  // 정렬: 등장 책 수 desc, 그다음 사유별
  candidates.sort((a, b) => b.bookCount - a.bookCount || a.reason.localeCompare(b.reason));

  // 사유별 카운트
  const byReason = {};
  for (const c of candidates) byReason[c.reason] = (byReason[c.reason] || 0) + 1;

  console.log(`\n=== 동화책 keyObject 비명사 후보: ${candidates.length} ===`);
  for (const [r, n] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${r.padEnd(50)} ${n}`);
  }
  console.log('\n=== 상위 30 (등장 책 수 desc) ===');
  for (const c of candidates.slice(0, 30)) {
    const orig = c.originalWord ? ` (원: ${c.originalWord})` : '';
    console.log(`  ${c.word.padEnd(10)}${orig.padEnd(15)} ${String(c.bookCount).padStart(3)} 권  [${c.reason}]  ex: ${c.bookTitles.slice(0,2).join(', ')}`);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    summary: { total: candidates.length, byReason },
    candidates,
  }, null, 2), 'utf-8');
  console.log(`\n→ ${path.relative(process.cwd(), OUT)} 저장`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
