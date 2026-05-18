#!/usr/bin/env node
// Naver 검색광고 API — 같은 콘텐츠 단위 시드(KR)로 네이버 측 실데이터 확보.
// dataforseo-keyword-research.mjs 와 동일한 시드를 사용 → Naver vs Google 교차검증 가능.
// 출력: data/naver-content-raw.json

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KR_SEEDS } from './content-seeds.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');

const API_KEY = process.env.NAVER_AD_API_KEY;
const SECRET = process.env.NAVER_AD_SECRET_KEY;
const CUSTOMER_ID = process.env.NAVER_AD_CUSTOMER_ID;

if (!API_KEY || !SECRET || !CUSTOMER_ID) {
  console.error('환경변수 누락: NAVER_AD_API_KEY / NAVER_AD_SECRET_KEY / NAVER_AD_CUSTOMER_ID');
  console.error('예: NAVER_AD_API_KEY=... NAVER_AD_SECRET_KEY=... NAVER_AD_CUSTOMER_ID=... node naver-content-keyword-research.mjs');
  process.exit(1);
}

const BATCH_SIZE = 5; // Naver API: 최대 5개/요청
const URI = '/keywordstool';
const DELAY_MS = 1100; // ~0.9 req/sec — Naver 검색광고 API 권장 안전선
const MAX_RETRIES = 5;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sign(timestamp, method, uri) {
  const message = `${timestamp}.${method}.${uri}`;
  return crypto.createHmac('sha256', SECRET).update(message).digest('base64');
}

function parseCount(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseInt(v.replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

async function fetchBatchOnce(batch) {
  const timestamp = Date.now();
  const signature = sign(timestamp, 'GET', URI);

  // Naver API doesn't accept internal spaces
  const cleaned = batch.map((k) => k.replace(/\s+/g, ''));

  const url = new URL(`https://api.searchad.naver.com${URI}`);
  url.searchParams.set('hintKeywords', cleaned.join(','));
  url.searchParams.set('showDetail', '1');
  url.searchParams.set('includeHintKeywords', '0');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-API-KEY': API_KEY,
      'X-Customer': CUSTOMER_ID,
      'X-Timestamp': String(timestamp),
      'X-Signature': signature,
    },
  });

  return res;
}

async function fetchBatch(batch) {
  let waitMs = 2000;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetchBatchOnce(batch);
    if (res.ok) {
      const data = await res.json();
      const list = data.keywordList ?? [];
      for (const item of list) {
        item.monthlyPcQcCnt = parseCount(item.monthlyPcQcCnt);
        item.monthlyMobileQcCnt = parseCount(item.monthlyMobileQcCnt);
      }
      return list;
    }
    if (res.status === 429 && attempt < MAX_RETRIES) {
      process.stdout.write(`[429 wait ${waitMs}ms] `);
      await sleep(waitMs);
      waitMs = Math.min(waitMs * 2, 30000);
      continue;
    }
    console.error(`\n[ERROR] HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
    return [];
  }
  return [];
}

async function searchKeywords(seeds) {
  const results = [];
  for (let i = 0; i < seeds.length; i += BATCH_SIZE) {
    const batch = seeds.slice(i, i + BATCH_SIZE);
    process.stdout.write(
      `Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(seeds.length / BATCH_SIZE)}: [${batch.join(', ')}]... `,
    );
    const items = await fetchBatch(batch);
    console.log(`${items.length} keywords`);
    results.push(...items);
    await sleep(DELAY_MS);
  }
  return results;
}

async function main() {
  console.log('========================================');
  console.log('Naver 검색광고 API - 콘텐츠 단위 키워드 조회');
  console.log(`시드: ${KR_SEEDS.length}개`);
  console.log('========================================\n');

  const items = await searchKeywords(KR_SEEDS);

  // Dedupe by relKeyword
  const merged = new Map();
  for (const it of items) merged.set(it.relKeyword, it);

  const all = [...merged.values()].map((it) => ({
    keyword: it.relKeyword,
    pcVolume: it.monthlyPcQcCnt,
    mobileVolume: it.monthlyMobileQcCnt,
    totalVolume: it.monthlyPcQcCnt + it.monthlyMobileQcCnt,
    competition: it.compIdx,
    pcCtr: it.monthlyAvePcCtr,
    mobileCtr: it.monthlyAveMobileCtr,
    plAvgDepth: it.plAvgDepth,
  }));
  all.sort((a, b) => b.totalVolume - a.totalVolume);

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const outPath = path.join(DATA_DIR, 'naver-content-raw.json');
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        meta: {
          source: 'Naver 검색광고 API /keywordstool (direct seed query)',
          fetchedAt: new Date().toISOString(),
          seedCount: KR_SEEDS.length,
          resultCount: all.length,
        },
        keywords: all,
      },
      null,
      2,
    ),
    'utf-8',
  );
  console.log(`\n✅ Saved ${all.length} keywords → ${path.relative(process.cwd(), outPath)}`);

  console.log('\nTOP 20 by total volume:');
  console.log('rank | keyword | pc | mobile | total | comp');
  all.slice(0, 20).forEach((it, i) => {
    console.log(
      `${String(i + 1).padStart(2)} | ${it.keyword.padEnd(20)} | ${String(it.pcVolume).padStart(7)} | ${String(it.mobileVolume).padStart(7)} | ${String(it.totalVolume).padStart(8)} | ${it.competition}`,
    );
  });
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
