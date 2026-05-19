#!/usr/bin/env node
/**
 * 영어 번역 안 된 keyObject 스캔.
 * 출력: packages/server/scripts/_data/untranslated-keyobjects.json
 *   { books: [{ id, title, missing: [{ ko, pages: number[], pageTexts: string[] }] }] }
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.SERVER_URL || 'http://localhost:3500';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '_data', 'untranslated-keyobjects.json');

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const j = await res.json();
  return j.data ?? j;
}

function extractKo(k) {
  return (k.korean || k.kor || k.name || '').trim();
}
function extractEn(k) {
  return (k.nameEn || k.eng || k.english || '').trim();
}
function needsTranslation(k) {
  const en = extractEn(k);
  const ko = extractKo(k);
  if (!ko) return false;
  // EN 비어있거나, EN 이 한글이거나, EN === KO 면 번역 필요
  if (!en) return true;
  if (/[가-힣]/.test(en)) return true;
  if (en === ko) return true;
  return false;
}

async function main() {
  console.log(`[scan] ${BASE}/api/storybooks`);
  const list = await getJSON(`${BASE}/api/storybooks`);
  console.log(`총 책: ${list.length}`);

  const results = [];
  let totalMissing = 0;
  const failedIds = [];
  for (let i = 0; i < list.length; i++) {
    if ((i + 1) % 30 === 0) console.log(`  ${i + 1}/${list.length}`);
    let book;
    try {
      book = await getJSON(`${BASE}/api/storybooks/${list[i].id}`);
    } catch (e) {
      failedIds.push({ id: list[i].id, title: list[i].title, err: String(e.message) });
      continue;
    }
    const keyObjs = book.key_objects || book.keyObjects || [];
    const missing = [];
    for (const k of keyObjs) {
      if (!needsTranslation(k)) continue;
      const ko = extractKo(k);
      const pages = Array.isArray(k.pages) ? k.pages : [];
      // 페이지 텍스트 (없으면 빈 array)
      const pageTexts = pages
        .map((pn) => {
          const p = (book.pages || []).find((pp) => pp.pageNumber === pn);
          return p ? (p.text || '').slice(0, 300) : '';
        })
        .filter(Boolean);
      missing.push({ ko, pages, pageTexts });
    }
    if (missing.length) {
      results.push({
        id: book.id,
        title: book.title,
        category: book.category,
        missing,
      });
      totalMissing += missing.length;
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify({ totalBooks: results.length, totalMissing, failedIds, books: results }, null, 2),
    'utf-8'
  );
  console.log(`\n=== 결과 ===`);
  console.log(`번역 필요한 책: ${results.length}`);
  console.log(`번역 필요한 단어 총: ${totalMissing}`);
  console.log(`로드 실패 책: ${failedIds.length}`);
  console.log(`→ ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
