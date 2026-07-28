#!/usr/bin/env node
/**
 * 책 제목 = 검색 키워드. 카테고리별로 월간 검색량을 재서 캐시한다.
 *
 * 발행 순서를 **검색량 많은 순**으로 잡기 위한 것. 매 발행마다 API 를 두드리지 않도록
 * 결과를 파일로 남긴다(검색량은 자주 안 바뀐다 — 분기에 한 번 다시 돌리면 충분).
 *
 * 산출물 → packages/server/scripts/_data/naver-volumes.json
 *
 * 사용: node packages/server/scripts/measure-book-keywords.mjs --category=nature
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const { NAVER_AD_API_KEY: KEY, NAVER_AD_SECRET_KEY: SEC, NAVER_AD_CUSTOMER_ID: CID } = process.env;
const SB = process.env.SUPABASE_URL;
const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=') || true];
  }),
);
const CATEGORY = String(args.category ?? 'nature');
const DEST = path.join(__dirname, '_data', 'naver-volumes.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (v) => (typeof v === 'number' ? v : parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0);

/** 제목 → 검색 키워드. 괄호·부제를 떼야 실제로 사람들이 치는 말이 된다. */
const toKeyword = (title) =>
  title
    .replace(/\(.*?\)/g, '')
    .replace(/[—–-].*$/, '')
    .trim()
    .replace(/\s+/g, '');

async function fetchBatch(batch, tries = 0) {
  const ts = Date.now();
  const sig = crypto.createHmac('sha256', SEC).update(`${ts}.GET./keywordstool`).digest('base64');
  const url = new URL('https://api.searchad.naver.com/keywordstool');
  url.searchParams.set('hintKeywords', batch.join(','));
  url.searchParams.set('showDetail', '1');
  const res = await fetch(url, {
    headers: { 'X-API-KEY': KEY, 'X-Customer': CID, 'X-Timestamp': String(ts), 'X-Signature': sig },
  });
  if (res.ok) return (await res.json()).keywordList ?? [];
  if (res.status === 429 && tries < 5) {
    await sleep(2000 * 2 ** tries);
    return fetchBatch(batch, tries + 1);
  }
  console.error(`  HTTP ${res.status}`);
  return [];
}

const rows = await (
  await fetch(
    `${SB}/rest/v1/mkt_contents?select=id,title&category=eq.${CATEGORY}&order=title`,
    { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } },
  )
).json();

const keywords = [...new Set(rows.map((r) => toKeyword(r.title)))];
console.log(`${CATEGORY} ${rows.length}편 → 키워드 ${keywords.length}개 조회`);

const vol = new Map();
for (let i = 0; i < keywords.length; i += 5) {
  const batch = keywords.slice(i, i + 5);
  const items = await fetchBatch(batch);
  for (const it of items) {
    const k = String(it.relKeyword).replace(/\s+/g, '');
    if (!vol.has(k)) vol.set(k, { vol: num(it.monthlyPcQcCnt) + num(it.monthlyMobileQcCnt), comp: it.compIdx });
  }
  process.stdout.write(`\r  ${Math.min(i + 5, keywords.length)}/${keywords.length}`);
  await sleep(1100);
}
console.log();

const out = {};
for (const r of rows) {
  const k = toKeyword(r.title);
  const hit = vol.get(k);
  out[r.title] = { keyword: k, vol: hit?.vol ?? 0, comp: hit?.comp ?? null };
}

fs.mkdirSync(path.dirname(DEST), { recursive: true });
const prev = fs.existsSync(DEST) ? JSON.parse(fs.readFileSync(DEST, 'utf-8')) : {};
fs.writeFileSync(DEST, JSON.stringify({ ...prev, [CATEGORY]: out }, null, 2), 'utf-8');

const sorted = Object.entries(out).sort((a, b) => b[1].vol - a[1].vol);
console.log(`\n검색량 TOP 15 (${CATEGORY})`);
sorted.slice(0, 15).forEach(([t, v], i) =>
  console.log(`  ${String(i + 1).padStart(2)}. ${t.padEnd(18)} ${String(v.vol).padStart(7)}  ${v.comp ?? '-'}`),
);
const zero = sorted.filter(([, v]) => !v.vol).length;
console.log(`\n검색량 0(=조회 실패 또는 없음): ${zero}편`);
console.log(`saved → ${path.relative(process.cwd(), DEST)}`);
