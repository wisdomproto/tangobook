// 생활동화 책에 기획서 자산(삽화·제목·캐릭터 레퍼런스)만 안전하게 주입.
// link-saenghwal-illustrations.mjs 는 pages[] 를 통째로 재생성해 translations/ttsUrl 을 날리므로,
// 이미 번역·TTS 가 들어간 책은 이 스크립트로 링크만 갱신한다.
//
// 갱신 대상 (나머지 text/translations/ttsUrl/scene 은 전부 보존):
//   1) page.illustrationUrl  ← comic-assets/saenghwal-{docId}/p{n}  (확장자 무관, API가 실제 URL 반환)
//   2) book.title            ← saenghwal-index.json 의 title
//   3) characters[].referenceImage ← comic-assets/saenghwal-plan/{key} (고정 캐스트) 매칭
//
// 사용:
//   node packages/server/scripts/link-saenghwal-illos-only.mjs            # dry-run
//   node packages/server/scripts/link-saenghwal-illos-only.mjs --apply
//   node packages/server/scripts/link-saenghwal-illos-only.mjs --docs=hwa,sagwa --apply
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

loadEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAP_RAW = JSON.parse(fs.readFileSync(path.join(__dirname, 'saenghwal-book-map.json'), 'utf-8'));
const MAP = Object.fromEntries(Object.entries(MAP_RAW).filter(([k]) => !k.startsWith('_')));
const INDEX = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'public', 'saenghwal-index.json'), 'utf-8')
);
// docId(base, saenghwal- 접두사 제외) → 기획서 title
const TITLE_BY_DOC = {};
for (const e of INDEX) {
  if (!e.file || !e.title) continue;
  const doc = e.file.replace(/^saenghwal-/, '').replace(/\.html$/, '');
  TITLE_BY_DOC[doc] = e.title;
}

const API = process.env.TTS_API_ORIGIN || 'http://localhost:3500';

// 고정 캐스트 이름 → saenghwal-plan 자산 key
const CAST_KEY = {
  호리: 'hori',
  엄마: 'mom',
  아빠: 'dad',
  호야: 'hoya',
  토토: 'toto',
  보리: 'bori',
  콩이: 'kongi',
  두부: 'dubu',
};

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const DOCS = args.docs
  ? String(args.docs).split(',').map((s) => s.trim()).filter(Boolean)
  : Object.keys(MAP);

async function fetchAssets(docId) {
  const res = await fetch(`${API}/api/comic-assets/${docId}`);
  if (!res.ok) return {};
  const j = await res.json();
  return j.data ?? {};
}

async function main() {
  const planAssets = await fetchAssets('saenghwal-plan');
  console.log(`plan 캐릭터 자산: ${Object.keys(planAssets).join(', ') || '(없음)'}\n`);

  let totLinked = 0, totTitle = 0, totChar = 0, missingBooks = [], noAssets = [];
  for (const docId of DOCS) {
    const bookId = MAP[docId];
    if (!bookId) { console.log(`✖ ${docId}: 매핑 없음`); continue; }
    const book = await getStorybook(bookId);
    if (!book) { missingBooks.push(docId); console.log(`✖ ${docId} → ${bookId}: R2 없음`); continue; }

    const assets = await fetchAssets(`saenghwal-${docId}`);
    const pageAssets = Object.fromEntries(Object.entries(assets).filter(([k]) => /^p\d+$/.test(k)));
    if (Object.keys(pageAssets).length === 0) noAssets.push(docId);

    // 1) 페이지 삽화
    let linked = 0;
    for (const p of book.pages ?? []) {
      const url = pageAssets[`p${p.pageNumber}`];
      if (url && p.illustrationUrl !== url) { if (APPLY) p.illustrationUrl = url; linked++; }
    }

    // 2) 제목 (기획서 index)
    const newTitle = TITLE_BY_DOC[docId];
    const titleChanged = newTitle && newTitle !== book.title;
    if (titleChanged && APPLY) book.title = newTitle;

    // 3) 캐릭터 레퍼런스 (고정 캐스트 → plan 자산)
    let charSet = 0;
    for (const c of book.characters ?? []) {
      const key = CAST_KEY[c.name];
      const ref = key ? planAssets[key] : undefined;
      if (ref && c.referenceImage !== ref) { if (APPLY) c.referenceImage = ref; charSet++; }
    }

    console.log(
      `[${docId}] ${book.title}${titleChanged ? ` → "${newTitle}"` : ''} (${bookId})\n` +
      `   삽화 ${linked}장 · 제목 ${titleChanged ? '변경' : '유지'} · 캐릭터ref ${charSet}개` +
      (Object.keys(pageAssets).length === 0 ? '  ⚠️ 삽화 자산 없음' : '')
    );

    if (APPLY && (linked || titleChanged || charSet)) {
      book.updatedAt = new Date().toISOString();
      await putStorybook(bookId, book);
    }
    totLinked += linked; totTitle += titleChanged ? 1 : 0; totChar += charSet;
  }

  console.log(`\n${APPLY ? '완료' : 'DRY-RUN'} — ${DOCS.length}권 · 삽화 ${totLinked}장 · 제목 ${totTitle}권 · 캐릭터ref ${totChar}개`);
  if (noAssets.length) console.log(`⚠️ 삽화 자산 없는 회차(${noAssets.length}): ${noAssets.join(', ')}`);
  if (missingBooks.length) console.log(`⚠️ 책 없는 회차: ${missingBooks.join(', ')}`);
  if (!APPLY) console.log('실제 반영: --apply');
}

main().catch((e) => { console.error(e); process.exit(1); });
