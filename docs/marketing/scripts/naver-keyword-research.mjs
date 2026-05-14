#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');

const API_KEY = process.env.NAVER_AD_API_KEY;
const SECRET = process.env.NAVER_AD_SECRET_KEY;
const CUSTOMER_ID = process.env.NAVER_AD_CUSTOMER_ID;

if (!API_KEY || !SECRET || !CUSTOMER_ID) {
  console.error('환경변수 누락: NAVER_AD_API_KEY / NAVER_AD_SECRET_KEY / NAVER_AD_CUSTOMER_ID');
  console.error('예: NAVER_AD_API_KEY=... NAVER_AD_SECRET_KEY=... NAVER_AD_CUSTOMER_ID=... node naver-keyword-research.mjs');
  process.exit(1);
}

const BATCH_SIZE = 5;
const URI = '/keywordstool';

function sign(timestamp, method, uri) {
  const message = `${timestamp}.${method}.${uri}`;
  return crypto.createHmac('sha256', SECRET).update(message).digest('base64');
}

function parseCount(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

async function fetchBatch(batch, includeHint) {
  const timestamp = Date.now();
  const signature = sign(timestamp, 'GET', URI);

  // Naver API doesn't accept internal spaces in keywords
  const cleaned = batch.map((k) => k.replace(/\s+/g, ''));

  const url = new URL(`https://api.searchad.naver.com${URI}`);
  url.searchParams.set('hintKeywords', cleaned.join(','));
  url.searchParams.set('showDetail', '1');
  url.searchParams.set('includeHintKeywords', includeHint ? '1' : '0');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-API-KEY': API_KEY,
      'X-Customer': CUSTOMER_ID,
      'X-Timestamp': String(timestamp),
      'X-Signature': signature,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[ERROR] ${res.status} ${res.statusText} on batch [${batch.join(', ')}]: ${body}`);
    return [];
  }

  const data = await res.json();
  const list = data.keywordList ?? [];
  for (const item of list) {
    item.monthlyPcQcCnt = parseCount(item.monthlyPcQcCnt);
    item.monthlyMobileQcCnt = parseCount(item.monthlyMobileQcCnt);
  }
  return list;
}

async function searchKeywords(seeds, includeHint = false) {
  const results = [];
  for (let i = 0; i < seeds.length; i += BATCH_SIZE) {
    const batch = seeds.slice(i, i + BATCH_SIZE);
    process.stdout.write(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(seeds.length / BATCH_SIZE)}: [${batch.join(', ')}]... `);
    const items = await fetchBatch(batch, includeHint);
    console.log(`${items.length} keywords`);
    results.push(...items);
    await new Promise((r) => setTimeout(r, 300));
  }
  const seen = new Set();
  return results.filter((it) => {
    if (seen.has(it.relKeyword)) return false;
    seen.add(it.relKeyword);
    return true;
  });
}

// ========================================
// SEED KEYWORDS — direct lookup (includeHint=false)
// ========================================
const DIRECT_KEYWORDS = [
  // A. 유아 영어 학습
  '유아 영어', '어린이 영어', '유아 영어 앱', '유아 영어 추천', '유아 영어 공부',
  '5세 영어', '6세 영어', '7세 영어', '엄마표 영어', '아이 영어',
  '유아 영어 학습지', '어린이 영어 앱', '영어 시작 시기', '유아 영어 사이트',

  // B. 파닉스
  '파닉스', '영어 파닉스', '파닉스 앱', '파닉스 추천', '파닉스 책',
  '파닉스 순서', '파닉스 단계', '파닉스 학습지', '파닉스 사이트', '파닉스 학원',
  '파닉스 교재', '한글 파닉스', '파닉스 공부법',

  // C. 한글 학습
  '한글 떼기', '한글 공부', '한글 학습지', '한글 앱', '유아 한글',
  '한글 떼는 시기', '한글 책', '한글 교재', '아이 한글',

  // D. 동화책
  '유아 동화책', '어린이 동화책', '동화책 추천', 'AI 동화책', '영어 동화책',
  '잠자기 전 동화', '동화책 앱', '오디오북', '그림책 추천', '유아 그림책',

  // E. 육아/홈스쿨링
  '홈스쿨링', '엄마표 학습', '자기주도 학습', '유아 교육', '유아 학습지',
  '독서 교육', '문해력', '영재 교육',

  // F. 경쟁사 브랜드
  '호두잉글리시', '핑크퐁', '리딩게이트', '야미야미잉글리시', '똑똑한 하루 파닉스',
  '윙크', '리딩앤', 'ABC마우스', '리딩에그', '레노버 키즈',

  // G. 롱테일/문제해결
  '파닉스 vs 사이트워드', '영어 학습지 vs 앱', '5세 영어 시작', '아이 영어 시작 시기',
  '읽기 독립', '엄마표 영어 시작', '유아 영어 무료', '유아 영어 게임',
];

// Seeds for related keyword discovery (includeHint=true — broader search)
const HINT_SEEDS = [
  '파닉스', '유아 영어', '한글 떼기', '동화책 추천', '엄마표 영어',
  '5세 영어', '유아 학습지',
];

async function main() {
  console.log('========================================');
  console.log('1단계: 직접 키워드 조회 (정확 매칭)');
  console.log(`총 ${DIRECT_KEYWORDS.length}개 키워드, ${Math.ceil(DIRECT_KEYWORDS.length / BATCH_SIZE)}배치`);
  console.log('========================================\n');

  const directResults = await searchKeywords(DIRECT_KEYWORDS, false);
  console.log(`\n→ 직접 조회 완료: ${directResults.length}개 결과\n`);

  console.log('========================================');
  console.log('2단계: 관련 키워드 발굴 (includeHint=true)');
  console.log(`시드 ${HINT_SEEDS.length}개`);
  console.log('========================================\n');

  const hintResults = await searchKeywords(HINT_SEEDS, true);
  console.log(`\n→ 관련 키워드 발굴 완료: ${hintResults.length}개 결과\n`);

  // Merge (dedupe by relKeyword), prefer direct results
  const merged = new Map();
  for (const it of hintResults) merged.set(it.relKeyword, { ...it, source: 'hint' });
  for (const it of directResults) merged.set(it.relKeyword, { ...it, source: 'direct' });

  const all = [...merged.values()].map((it) => ({
    keyword: it.relKeyword,
    pcVolume: it.monthlyPcQcCnt,
    mobileVolume: it.monthlyMobileQcCnt,
    totalVolume: it.monthlyPcQcCnt + it.monthlyMobileQcCnt,
    competition: it.compIdx,
    pcCtr: it.monthlyAvePcCtr,
    mobileCtr: it.monthlyAveMobileCtr,
    plAvgDepth: it.plAvgDepth,
    source: it.source,
  }));

  all.sort((a, b) => b.totalVolume - a.totalVolume);

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const outPath = path.join(DATA_DIR, 'naver-keywords-raw.json');
  fs.writeFileSync(outPath, JSON.stringify(all, null, 2), 'utf-8');
  console.log(`\n✅ Saved ${all.length} unique keywords to ${path.relative(process.cwd(), outPath)}`);

  // Quick console summary: top 30 by volume
  console.log('\n========================================');
  console.log('TOP 30 by total volume:');
  console.log('========================================');
  console.log('keyword | pc | mobile | total | comp | source');
  for (const it of all.slice(0, 30)) {
    console.log(`${it.keyword} | ${it.pcVolume} | ${it.mobileVolume} | ${it.totalVolume} | ${it.competition} | ${it.source}`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
