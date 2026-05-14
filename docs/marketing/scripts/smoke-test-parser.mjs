#!/usr/bin/env node
/**
 * ContentFlow의 strategy-html-parser가 우리 템플릿을 정상 파싱하는지 검증.
 * parser는 cheerio + JS regex를 쓰므로 동일하게 시뮬레이션.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TPL_PATH = path.resolve(
  __dirname, '..', '..', '..', '..', 'contentflow1', 'contentflow', 'public', 'strategy-templates', 'tangobook-strategy.html'
);

const html = fs.readFileSync(TPL_PATH, 'utf-8');

// === 1. 메타 추출 (templates API 시뮬레이션) ===
const head = html.slice(0, 4000);
const titleM = head.match(/<meta\s+name=["']title["']\s+content=["']([^"']+)["']/i);
const descM = head.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
console.log('=== 메타 ===');
console.log('title:', titleM?.[1]);
console.log('description:', descM?.[1]);
console.log('size:', (Buffer.byteLength(html) / 1024).toFixed(1), 'KB');

// === 2. kwData 추출 (parser 시뮬레이션) ===
const kwMatch = html.match(/const\s+kwData\s*=\s*(\[[\s\S]*?\]);/);
let kwData = [];
if (kwMatch) {
  try { kwData = JSON.parse(kwMatch[1]); } catch (e) { console.error('kwData parse error:', e.message); }
}
console.log('\n=== kwData ===');
console.log('개수:', kwData.length);
const gold = kwData.filter((r) => String(r[5]).includes('gold'));
console.log('골드:', gold.length);
console.log('샘플 (TOP 5):');
kwData.slice(0, 5).forEach((r) => {
  console.log(`  ${r[0]} | 총 ${r[3]} | ${r[4]} | tag="${r[5]}"`);
});

// === 3. topics 추출 ===
const tpMatch = html.match(/const\s+topics\s*=\s*(\[[\s\S]*?\]);/);
let topics = [];
if (tpMatch) {
  try { topics = JSON.parse(tpMatch[1]); } catch (e) { console.error('topics parse error:', e.message); }
}
console.log('\n=== topics ===');
console.log('개수:', topics.length);
const byCat = {};
for (const t of topics) {
  byCat[t[1]] = (byCat[t[1]] || 0) + 1;
}
console.log('카테고리별:', byCat);
console.log('샘플 (TOP 3):');
topics.slice(0, 3).forEach((t) => console.log(`  [${t[0]}] (${t[1]}) ${t[2]}`));

// === 4. cycle-item 추출 (정규식) ===
const cycleMatches = [...html.matchAll(/<div class="cycle-item">[\s\S]*?<\/div>\s*<\/div>/g)];
console.log('\n=== cycle-item ===');
console.log('카테고리 수:', cycleMatches.length);

// === 5. 검증 ===
const ok = (titleM && descM && kwData.length > 0 && topics.length > 0 && cycleMatches.length >= 6);
console.log('\n=== 결과 ===');
console.log(ok ? '✅ ContentFlow 파서 호환 OK' : '❌ 검증 실패');
process.exit(ok ? 0 : 1);
