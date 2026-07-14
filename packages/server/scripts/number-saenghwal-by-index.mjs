// 생활동화 45권 제목 앞에 기획서 커리큘럼 번호(saenghwal-index.json label 의 1~45)를 붙인다.
// ko 제목 + 모든 titleTranslations[lang] 에 "NN. " (2자리 zero-pad) 프리픽스 → 전 언어에서 커리큘럼 순 정렬.
// 매핑(saenghwal-book-map.json)이 docId↔bookId authoritative. 멱등(기존 "NN. " 프리픽스 벗기고 다시 붙임).
//
// 사용:
//   node packages/server/scripts/number-saenghwal-by-index.mjs            # dry-run
//   node packages/server/scripts/number-saenghwal-by-index.mjs --apply
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAP = Object.fromEntries(
  Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname, 'saenghwal-book-map.json'), 'utf-8')))
    .filter(([k]) => !k.startsWith('_'))
);
const INDEX = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'public', 'saenghwal-index.json'), 'utf-8')
);
// docId → { num, title }
const META = {};
for (const e of INDEX) {
  if (!e.file || e.file === 'saenghwal-plan.html') continue;
  const doc = e.file.replace(/^saenghwal-/, '').replace(/\.html$/, '');
  const m = String(e.label || '').match(/^\s*(\d+)/);
  META[doc] = { num: m ? Number(m[1]) : null, title: e.title };
}

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const strip = (s) => String(s ?? '').replace(/^\s*\d+\.\s*/, '');
const pad = (n) => String(n).padStart(2, '0');

async function main() {
  // docId 를 번호순 정렬해 출력
  const docs = Object.keys(MAP).sort((a, b) => (META[a]?.num ?? 999) - (META[b]?.num ?? 999));
  let applied = 0, warn = [];
  for (const doc of docs) {
    const meta = META[doc];
    const bookId = MAP[doc];
    if (!meta || meta.num == null) { warn.push(`${doc}: index 번호 없음`); continue; }
    const b = await getStorybook(bookId);
    if (!b) { warn.push(`${doc} → ${bookId}: R2 없음`); continue; }

    // 매핑 검증: 책 ko 제목(번호 제거) 이 index title 과 일치해야 함
    const bare = strip(b.title);
    if (meta.title && bare !== meta.title) warn.push(`${doc}: 제목 불일치 book="${bare}" ≠ index="${meta.title}"`);

    const prefix = `${pad(meta.num)}. `;
    b.title = prefix + strip(b.title);
    if (b.titleTranslations) {
      for (const lang of Object.keys(b.titleTranslations)) {
        b.titleTranslations[lang] = prefix + strip(b.titleTranslations[lang]);
      }
    }
    console.log(`${prefix}${strip(b.title)}  (${doc} → ${bookId}) · 번역 ${Object.keys(b.titleTranslations ?? {}).length}개`);
    if (APPLY) { b.updatedAt = new Date().toISOString(); await putStorybook(bookId, b); applied++; }
  }
  console.log(`\n${APPLY ? '완료' : 'DRY-RUN'} — ${docs.length}권 · 적용 ${applied}`);
  if (warn.length) { console.log('⚠️ 경고:'); warn.forEach((w) => console.log('  ' + w)); }
  if (!APPLY) console.log('실제 반영: --apply');
}

main().catch((e) => { console.error(e); process.exit(1); });
