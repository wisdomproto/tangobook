#!/usr/bin/env node
/**
 * KEEP 된 keyObject 의 한글이 실제로 해당 page text + scene_description 에 등장하는지 검증.
 *
 * 정책 (lenient):
 *   - 한글 단어 그대로 substring 매칭 (활용형도 잡힘)
 *   - text + scene_description + scene_description_en 합쳐서 검사
 *   - 짧은 단어 (1글자) 는 false positive 너무 많으니 별도 표시 (검증 skip)
 *   - 한글 없는 keyObject 는 skip (한글 기준)
 *   - pages[] 가 빈 keyObject 는 별도 표시
 *
 * 사용: node packages/server/scripts/verify-key-object-in-page-text.mjs
 * 출력: packages/server/scripts/_data/key-object-text-mismatch.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.SERVER_URL || 'http://localhost:3500';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '_data', 'key-object-text-mismatch.json');
const CONCURRENCY = 6;

const HANGUL = /[가-힣]/;

function extractKo(ko) {
  const k = (ko.korean || '').trim();
  if (k && HANGUL.test(k)) return k;
  const n = (ko.name || '').trim();
  if (HANGUL.test(n)) return n;
  return '';
}

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return (await r.json()).data;
}

async function verifyBook(book) {
  const issues = [];
  const koList = book.key_objects || [];
  const pageById = new Map();
  for (const p of (book.pages || [])) pageById.set(p.pageNumber, p);

  for (const ko of koList) {
    const word = extractKo(ko);
    if (!word) continue; // 한글 없으면 skip
    const pages = ko.pages || [];
    if (pages.length === 0) {
      issues.push({ word, pages: [], reason: 'no-pages', missingFrom: [] });
      continue;
    }
    if (word.length === 1) {
      issues.push({ word, pages, reason: 'too-short-skip', missingFrom: [] });
      continue;
    }
    const missingFrom = [];
    for (const pn of pages) {
      const p = pageById.get(pn);
      if (!p) {
        missingFrom.push({ page: pn, reason: 'page-missing' });
        continue;
      }
      const haystack = [
        p.text || '',
        p.scene_description || '',
        p.scene_description_en || '',
      ].join('\n');
      if (!haystack.includes(word)) {
        missingFrom.push({
          page: pn,
          reason: 'word-not-in-text',
          textPreview: (p.text || '').slice(0, 80),
        });
      }
    }
    if (missingFrom.length === 0) continue;
    // 한 페이지라도 있으면 partial, 모두 없으면 total
    const reason = missingFrom.length === pages.length ? 'word-in-no-page' : 'word-in-some-pages-missing';
    issues.push({ word, pages, missingFrom, reason });
  }
  return issues;
}

async function main() {
  const books = await fetchJson(`${BASE}/api/storybooks`);
  const storybookList = books.filter(b => (b.type || 'storybook') === 'storybook');
  console.log(`총 동화책: ${storybookList.length}`);

  const allIssues = []; // { bookId, title, category, issues }
  const reasonTotals = {};
  let idx = 0;
  let done = 0;
  async function worker() {
    while (idx < storybookList.length) {
      const i = idx++;
      const meta = storybookList[i];
      try {
        const full = await fetchJson(`${BASE}/api/storybooks/${encodeURIComponent(meta.id)}`);
        const issues = await verifyBook(full);
        if (issues.length > 0) {
          allIssues.push({ bookId: full.id, title: full.title, category: full.category, issues });
          for (const it of issues) {
            reasonTotals[it.reason] = (reasonTotals[it.reason] || 0) + 1;
          }
        }
      } catch (e) {
        allIssues.push({ bookId: meta.id, title: meta.title, error: e.message });
      }
      done++;
      if (done % 30 === 0) console.log(`  ${done}/${storybookList.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // 책별 issue 수 desc 정렬
  allIssues.sort((a, b) => (b.issues?.length || 0) - (a.issues?.length || 0));

  // 단어별 빈도 (word-in-no-page 만)
  const wordCount = {};
  for (const b of allIssues) {
    for (const it of (b.issues || [])) {
      if (it.reason === 'word-in-no-page') {
        wordCount[it.word] = (wordCount[it.word] || 0) + 1;
      }
    }
  }

  console.log(`\n=== 검증 결과 ===`);
  console.log(`문제 있는 책: ${allIssues.length}`);
  console.log(`\n사유 분포:`);
  for (const [k, n] of Object.entries(reasonTotals).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(35)} ${n}`);
  }

  console.log(`\n--- 단어가 어느 페이지 텍스트에도 없음 (word-in-no-page) 상위 30 ---`);
  for (const [w, n] of Object.entries(wordCount).sort((a, b) => b[1] - a[1]).slice(0, 30)) {
    console.log(`  ${w.padEnd(12)} ${n}권`);
  }

  console.log(`\n--- 문제 많은 책 상위 15 ---`);
  for (const b of allIssues.slice(0, 15)) {
    const total = b.issues?.length || 0;
    const noPage = b.issues?.filter(i => i.reason === 'word-in-no-page').length || 0;
    console.log(`  ${(b.title || '').padEnd(40)} 이슈 ${total} (그 중 텍스트 완전 누락 ${noPage})`);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    summary: { booksChecked: storybookList.length, booksWithIssues: allIssues.length, reasonTotals, wordCount },
    books: allIssues,
  }, null, 2), 'utf-8');
  console.log(`\n→ ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
