// 유치원동화 20권(editor2, folder="호리 유치원") 제목 앞에 커리큘럼 번호(Y01~Y20 → 01~20)를 붙인다.
// book-map 없이 title 로 매칭(link-yuchiwon 이 title 로 생성). ko 제목 + titleTranslations 전부에 "NN. " 프리픽스.
// 멱등(기존 "NN. " 벗기고 다시 붙임).
//
// 사용:
//   node packages/server/scripts/number-yuchiwon-titles.mjs            # dry-run
//   node packages/server/scripts/number-yuchiwon-titles.mjs --apply
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listStorybookKeys, getJsonByKey, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FOLDER = '호리 유치원';
const INDEX = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'public', 'yuchiwon-index.json'), 'utf-8')
);

// 번호순 메타: 파일명 Yxx → num, index title
const EPS = [];
for (const e of INDEX) {
  if (!e.file || e.file === 'yuchiwon-plan.html') continue;
  const m = e.file.match(/Y(\d+)/);
  EPS.push({ num: m ? Number(m[1]) : null, title: e.title });
}
EPS.sort((a, b) => (a.num ?? 999) - (b.num ?? 999));

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const strip = (s) => String(s ?? '').replace(/^\s*\d+\.\s*/, '');
const pad = (n) => String(n).padStart(2, '0');

async function main() {
  // folder="호리 유치원" 책을 bare title → id 로 인덱싱
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
    console.log(`${b.title}  (${id}) · 번역 ${Object.keys(b.titleTranslations ?? {}).length}개`);
    if (APPLY) { b.updatedAt = new Date().toISOString(); await putStorybook(id, b); applied++; }
  }
  console.log(`\n${APPLY ? '완료' : 'DRY-RUN'} — ${EPS.length}편 · 적용 ${applied}`);
  if (warn.length) { console.log('⚠️ 경고:'); warn.forEach((w) => console.log('  ' + w)); }
  if (!APPLY) console.log('실제 반영: --apply');
}

main().catch((e) => { console.error(e); process.exit(1); });
