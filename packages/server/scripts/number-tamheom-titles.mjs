// 세상 탐험 15권(editor2, folder="호리 세상 탐험") 제목 앞에 커리큘럼 번호(T01~T15 → 01~15)를 붙인다.
// 🔴 tamheom 은 파일명이 슬러그(sobangcha…)라 번호는 index label("T01 🚒 소방차")에서 추출.
// book-map 없이 title 로 매칭(link-tamheom 이 title 로 생성). 멱등("NN. " 벗기고 다시 붙임).
//
// 사용:
//   node packages/server/scripts/number-tamheom-titles.mjs            # dry-run
//   node packages/server/scripts/number-tamheom-titles.mjs --apply
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listStorybookKeys, getJsonByKey, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FOLDER = '호리 세상 탐험';
const INDEX = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'public', 'tamheom-index.json'), 'utf-8')
);

const EPS = [];
for (const e of INDEX) {
  if (!e.file || e.file === 'tamheom-plan.html') continue;
  const m = String(e.label || '').match(/T(\d+)/); // label "T01 🚒 소방차"
  EPS.push({ num: m ? Number(m[1]) : null, title: e.title });
}
EPS.sort((a, b) => (a.num ?? 999) - (b.num ?? 999));

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const strip = (s) => String(s ?? '').replace(/^\s*\d+\.\s*/, '');
const pad = (n) => String(n).padStart(2, '0');

async function main() {
  const keys = await listStorybookKeys();
  const byTitle = {};
  for (const key of keys) {
    try {
      const b = await getJsonByKey(key);
      if (b && b.id && b.title && (b.folder === FOLDER || b.category === FOLDER)) byTitle[strip(b.title)] = b.id;
    } catch { /* skip */ }
  }
  console.log(`"${FOLDER}" 책 ${Object.keys(byTitle).length}권.\n`);

  let applied = 0;
  const warn = [];
  for (const ep of EPS) {
    if (ep.num == null) { warn.push(`"${ep.title}": 번호 없음`); continue; }
    const id = byTitle[ep.title];
    if (!id) { warn.push(`"${ep.title}": 매칭 책 없음`); continue; }
    const b = await getStorybook(id);
    if (!b) { warn.push(`"${ep.title}" → ${id}: R2 없음`); continue; }

    const prefix = `${pad(ep.num)}. `;
    b.title = prefix + strip(b.title);
    if (b.titleTranslations) {
      for (const lang of Object.keys(b.titleTranslations)) {
        b.titleTranslations[lang] = prefix + strip(b.titleTranslations[lang]);
      }
    }
    console.log(`${b.title}  (${id})`);
    if (APPLY) { b.updatedAt = new Date().toISOString(); await putStorybook(id, b); applied++; }
  }
  console.log(`\n${APPLY ? '완료' : 'DRY-RUN'} — ${EPS.length}편 · 적용 ${applied}`);
  if (warn.length) { console.log('⚠️ 경고:'); warn.forEach((w) => console.log('  ' + w)); }
  if (!APPLY) console.log('실제 반영: --apply');
}

main().catch((e) => { console.error(e); process.exit(1); });
