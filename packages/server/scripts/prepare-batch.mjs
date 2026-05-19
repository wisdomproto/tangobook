#!/usr/bin/env node
/**
 * untranslated-keyobjects.json 에서 첫 N권 추출, 기존 사전 reuse 후 남은 단어 출력.
 * 출력:
 *   _data/batch-50-auto.json     : 사전 reuse 로 자동 채워진 책별 tr
 *   _data/batch-50-manual.json   : 수동 번역 필요한 단어 list (책 + ko + ctx)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IN = path.join(__dirname, '_data', 'untranslated-keyobjects.json');
const PREV = path.join(__dirname, '_data', 'classics-translations.json');
const OUT_AUTO = path.join(__dirname, '_data', 'batch-50-auto.json');
const OUT_MANUAL = path.join(__dirname, '_data', 'batch-50-manual.json');

const data = JSON.parse(fs.readFileSync(IN, 'utf-8'));
const prev = JSON.parse(fs.readFileSync(PREV, 'utf-8'));

// 글로벌 사전: 같은 ko → en (가장 흔한 매핑) — 다중 의미 있으면 첫 매핑 사용
const dict = new Map();
for (const id of Object.keys(prev)) {
  for (const [ko, en] of Object.entries(prev[id].tr)) {
    if (!dict.has(ko)) dict.set(ko, en);
  }
}
console.log(`reuse 사전 크기: ${dict.size} 단어`);

const N = parseInt(process.argv[2] || '50', 10);
const target = data.books.slice(0, N);
console.log(`대상: ${target.length} 책`);

const autoMap = {};
const manual = [];
let totalReused = 0;
let totalManual = 0;
for (const book of target) {
  const tr = {};
  for (const m of book.missing) {
    if (dict.has(m.ko)) {
      tr[m.ko] = dict.get(m.ko);
      totalReused++;
    } else {
      manual.push({
        bookId: book.id,
        title: book.title,
        category: book.category,
        ko: m.ko,
        pages: m.pages,
        pageTexts: m.pageTexts,
      });
      totalManual++;
    }
  }
  if (Object.keys(tr).length) {
    autoMap[book.id] = { title: book.title, tr };
  }
}

fs.writeFileSync(OUT_AUTO, JSON.stringify(autoMap, null, 2), 'utf-8');
fs.writeFileSync(OUT_MANUAL, JSON.stringify(manual, null, 2), 'utf-8');
console.log(`\nreuse 자동: ${totalReused} 단어 / ${Object.keys(autoMap).length} 책`);
console.log(`수동 필요: ${totalManual} 단어`);
console.log(`→ ${path.relative(process.cwd(), OUT_AUTO)}`);
console.log(`→ ${path.relative(process.cwd(), OUT_MANUAL)}`);
