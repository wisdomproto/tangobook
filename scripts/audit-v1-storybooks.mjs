// v1 storybook 211권 메타 audit — 마이그 진입 전 갭 점검.
//
// 점검 항목:
//   - artStyle 누락/빈값
//   - readingLevel 누락 (bid 접미사로 derive 가능 여부 포함)
//   - key_objects 빈 배열
//   - pages 누락 / pages[].text 빈값
//   - educational_content.vocabulary 분포
//   - localText/localTtsUrl 언어 분포
//   - parentGuide 유무
//   - bid 패턴 (base vs `__L1` 접미사)
//   - artStyle / category / type / folder 분포
//
// 추가: docs/books/curriculum-master.html과 sync 점검
//   - HTML에 bid 있는데 R2 없음 → orphan in HTML
//   - R2에 있는데 명작 카테고리이면서 HTML에 매칭 없음 → orphan in R2
//
// 서버(localhost:3500) 필요.
// 실행: node scripts/audit-v1-storybooks.mjs
//   결과: audit-report.json + 콘솔 요약

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const API = 'http://localhost:3500/api';
const HTML_PATH = resolve('docs/books/curriculum-master.html');
const REPORT_PATH = resolve('audit-report.json');
const CONCURRENCY = 8;

async function apiJson(path) {
  const res = await fetch(`${API}${path}`);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${res.status} ${path}: ${text.slice(0, 200)}`);
  }
  if (!res.ok || json.success === false) {
    throw new Error(`${res.status} ${path}: ${json?.error ?? text.slice(0, 200)}`);
  }
  return json.data;
}

// curriculum-master.html에서 bid 추출 (CLASSIC_RAW 영역)
async function loadHtmlBids() {
  let html;
  try {
    html = await readFile(HTML_PATH, 'utf-8');
  } catch (e) {
    console.warn(`⚠️  ${HTML_PATH} 못 읽음 — sync 점검 skip:`, e.message);
    return new Map();
  }
  const bidMap = new Map(); // bid → { no, t }
  const re = /\{no:(\d+),\s*t:'([^']+)',[^}]*?bid:'(\d+)'/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    bidMap.set(m[3], { no: Number(m[1]), title: m[2] });
  }
  return bidMap;
}

// 동시 매핑
async function mapWithConcurrency(items, fn, n) {
  const out = new Array(items.length);
  let cursor = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        try {
          out[i] = await fn(items[i], i);
        } catch (e) {
          out[i] = { __error: e.message ?? String(e) };
        }
        done++;
        if (done % 20 === 0 || done === items.length) {
          process.stdout.write(`\r  fetched ${done}/${items.length}    `);
        }
      }
    }),
  );
  process.stdout.write('\n');
  return out;
}

function inc(map, key, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

function bidPatternOf(id) {
  const m = id.match(/^(\d+)__(L[1-4])$/);
  if (m) return { base: m[1], level: m[2], suffixed: true };
  return { base: id, level: null, suffixed: false };
}

async function main() {
  console.log(`audit 시작 — API=${API}\n`);

  const list = await apiJson('/storybooks');
  console.log(`라이브러리 ${list.length}권 발견. 개별 fetch...`);

  const htmlBids = await loadHtmlBids();
  console.log(`curriculum-master.html: ${htmlBids.size} bid 추출\n`);

  const books = await mapWithConcurrency(
    list,
    (summary) => apiJson(`/storybooks/${summary.id}`),
    CONCURRENCY,
  );

  // 통계
  const total = books.length;
  const fetchFailed = books.filter((b) => b?.__error).length;

  const artStyleMissing = [];
  const readingLevelMissing = []; // bid 접미사로도 derive 불가
  const readingLevelDerivable = []; // 누락이지만 bid 접미사로 가능
  const noKeyObjects = [];
  const noPages = [];
  const emptyPageText = []; // 페이지 중 text 빈 게 있는 책
  const noVocab = [];
  const noParentGuideClassic = []; // 명작인데 parentGuide 없음

  const styleDist = new Map();
  const levelDist = new Map();
  const typeDist = new Map();
  const folderDist = new Map();
  const categoryDist = new Map();
  const langDist = new Map();
  langDist.set('ko', 0); // 기본
  const baseBids = new Set();
  const suffixedBids = new Set();

  for (const b of books) {
    if (!b || b.__error) continue;
    const id = b.id ?? '(no-id)';
    const pat = bidPatternOf(id);
    if (pat.suffixed) suffixedBids.add(id);
    else baseBids.add(id);

    if (!b.artStyle || String(b.artStyle).trim() === '') {
      artStyleMissing.push(id);
    } else {
      inc(styleDist, b.artStyle);
    }

    if (!b.readingLevel) {
      if (pat.level) {
        readingLevelDerivable.push({ id, derived: pat.level });
        inc(levelDist, pat.level + ' (derived)');
      } else {
        readingLevelMissing.push(id);
        inc(levelDist, '(missing)');
      }
    } else {
      inc(levelDist, b.readingLevel);
    }

    inc(typeDist, b.type ?? 'storybook');
    inc(folderDist, b.folder ?? '(none)');
    inc(categoryDist, b.category ?? '(none)');

    const ko = (b.key_objects ?? []).length;
    if (ko === 0) noKeyObjects.push(id);

    const pages = b.pages ?? [];
    if (pages.length === 0) noPages.push(id);
    else {
      const emptyN = pages.filter((p) => !p?.text || String(p.text).trim() === '').length;
      if (emptyN > 0) emptyPageText.push({ id, emptyCount: emptyN, total: pages.length });
    }

    // 언어 분포: pages[].localText 키
    inc(langDist, 'ko', pages.length); // 기본 ko 페이지 수
    for (const p of pages) {
      if (p?.localText && typeof p.localText === 'object') {
        for (const lang of Object.keys(p.localText)) {
          if (p.localText[lang]?.trim?.()) inc(langDist, lang);
        }
      }
    }

    const vocab = b.educational_content?.vocabulary ?? [];
    if (vocab.length === 0) noVocab.push(id);

    if (!b.parentGuide && b.category && /명작|classic/i.test(b.category)) {
      noParentGuideClassic.push(id);
    }
  }

  // sync 점검
  const r2BidsBase = new Set([...baseBids]); // 명작 bid는 보통 base 형태
  const orphanInHtml = []; // HTML 명시 bid인데 R2에 없음
  const matchedHtmlBids = [];
  for (const [bid, meta] of htmlBids.entries()) {
    if (r2BidsBase.has(bid)) matchedHtmlBids.push({ bid, ...meta });
    else orphanInHtml.push({ bid, ...meta });
  }
  // R2에는 있지만 HTML에 없는 명작? — category로 추정
  const orphanInR2Classic = [];
  for (const b of books) {
    if (!b || b.__error) continue;
    if (!/명작|classic/i.test(String(b.category ?? ''))) continue;
    const pat = bidPatternOf(b.id);
    if (pat.suffixed) continue; // L1/L2 variation은 base bid가 HTML에 있으면 OK
    if (!htmlBids.has(b.id)) {
      orphanInR2Classic.push({ id: b.id, title: b.title });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    counts: {
      total,
      fetchFailed,
      baseBids: baseBids.size,
      suffixedBids: suffixedBids.size,
      htmlBids: htmlBids.size,
    },
    distributions: {
      artStyle: Object.fromEntries(styleDist),
      readingLevel: Object.fromEntries(levelDist),
      type: Object.fromEntries(typeDist),
      folder: Object.fromEntries(folderDist),
      category: Object.fromEntries(categoryDist),
      language: Object.fromEntries(langDist),
    },
    gaps: {
      artStyleMissing,
      readingLevelMissing,
      readingLevelDerivable,
      noKeyObjects,
      noPages,
      emptyPageText,
      noVocab,
      noParentGuideClassic,
    },
    sync: {
      matchedHtmlBids: matchedHtmlBids.length,
      orphanInHtml,
      orphanInR2Classic,
    },
  };

  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');

  // 콘솔 요약
  console.log('─'.repeat(60));
  console.log(`총 ${total}권 (fetch 실패 ${fetchFailed})`);
  console.log(`  base bid ${baseBids.size}  ·  __Lx 접미사 ${suffixedBids.size}`);
  console.log('');
  console.log('artStyle 분포:');
  for (const [k, v] of [...styleDist].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(22)} ${v}`);
  }
  console.log('');
  console.log('readingLevel 분포:');
  for (const [k, v] of [...levelDist].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(22)} ${v}`);
  }
  console.log('');
  console.log('type 분포:');
  for (const [k, v] of typeDist) console.log(`  ${k.padEnd(22)} ${v}`);
  console.log('');
  console.log('language 분포 (ko 카운트는 페이지 수 합):');
  for (const [k, v] of [...langDist].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(22)} ${v}`);
  }
  console.log('');
  console.log('갭:');
  console.log(`  artStyle 빈값:                    ${artStyleMissing.length}`);
  console.log(`  readingLevel 누락 (derive 불가):  ${readingLevelMissing.length}`);
  console.log(`  readingLevel 누락 (bid로 derive): ${readingLevelDerivable.length}`);
  console.log(`  key_objects 빈배열:               ${noKeyObjects.length}`);
  console.log(`  pages 빈배열:                     ${noPages.length}`);
  console.log(`  pages.text 일부 빈값:             ${emptyPageText.length}`);
  console.log(`  vocabulary 없음:                  ${noVocab.length}`);
  console.log(`  명작 parentGuide 없음:            ${noParentGuideClassic.length}`);
  console.log('');
  console.log('curriculum-master.html sync:');
  console.log(`  HTML→R2 매칭:                     ${matchedHtmlBids.length}`);
  console.log(`  HTML에 bid 있으나 R2 없음:        ${orphanInHtml.length}`);
  console.log(`  R2 명작인데 HTML 매칭 없음:        ${orphanInR2Classic.length}`);
  if (orphanInHtml.length) {
    console.log('  → orphan in HTML (앞 5개):');
    for (const o of orphanInHtml.slice(0, 5)) {
      console.log(`     bid=${o.bid} no.${o.no} ${o.title}`);
    }
  }
  if (orphanInR2Classic.length) {
    console.log('  → orphan in R2 (앞 5개):');
    for (const o of orphanInR2Classic.slice(0, 5)) {
      console.log(`     id=${o.id} ${o.title}`);
    }
  }
  console.log('─'.repeat(60));
  console.log(`\n✅ 상세 리포트: ${REPORT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
