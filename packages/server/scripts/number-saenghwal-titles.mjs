// 생활동화 책 제목 앞에 커리큘럼 번호(zero-pad)를 붙여 제목 정렬 = 커리큘럼 순서.
//   "골고루 먹으면 무지개 힘!" → "01. 골고루 먹으면 무지개 힘!"
// 번호 = saenghwal-index.json 의 회차 번호 (매핑표 saenghwal-book-map.json 경유). 멱등.
//   --orphans=N  : 매핑 없는(구 커리큘럼) 책도 N번부터 순번 부여. 미지정 시 무시(제목 그대로).
//
//   node packages/server/scripts/number-saenghwal-titles.mjs            # dry-run
//   node packages/server/scripts/number-saenghwal-titles.mjs --apply
//   node packages/server/scripts/number-saenghwal-titles.mjs --apply --orphans=46
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listStorybookKeys, getJsonByKey, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'client', 'public');
const CATEGORY = '생활동화';

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
// 나머지(슬롯 못 채운) orphan 순번 시작. 기본 46 (커리큘럼 최대 45 다음).
const ORPHAN_START = args.orphans ? Number(args.orphans) : 46;

// orphan → 빈 커리큘럼 슬롯 번호 (제목 번호만; 콘텐츠 연동표와 별개).
// 도메인이 맞는 orphan 을 비어있는 회차 번호에 표시용으로 배정.
const ORPHAN_SLOT = {
  '1782864518693': 14, // 안녕하세요, 꾸벅 인사!  → 어른 먼저(예절)
  '1782864313099': 29, // 물에선 조심조심, 어른이랑! → 물 놀이
  '1782864311771': 30, // 갖고 싶어도 꾹, 참으면 대단해! → 기다림(참기)
  '1782864312459': 37, // 척척 도와요, 나는 도우미! → 협동(돕기)
};

const stripPrefix = (t) => String(t).replace(/^\s*\d+\.\s*/, '');
const pad = (n) => String(n).padStart(2, '0');

// index.json: docId → 회차 번호
const index = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'saenghwal-index.json'), 'utf-8'));
const docNum = {};
for (const e of index) {
  if (!e.file || e.file === 'saenghwal-plan.html') continue;
  const docId = e.file.replace(/^saenghwal-/, '').replace(/\.html$/, '');
  const m = String(e.label ?? '').match(/(\d+)/);
  if (m) docNum[docId] = Number(m[1]);
}
// map: bookId → 회차 번호
const rawMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'saenghwal-book-map.json'), 'utf-8'));
const bookNum = {};
for (const [docId, bookId] of Object.entries(rawMap)) {
  if (docId.startsWith('_')) continue;
  if (docNum[docId] != null) bookNum[bookId] = docNum[docId];
}

const keys = await listStorybookKeys();
const books = [];
for (const k of keys) {
  try {
    const b = await getJsonByKey(k);
    if (b && b.id && b.title && b.category === CATEGORY) books.push({ id: b.id, title: b.title });
  } catch {
    /* skip */
  }
}

const numbered = []; // 커리큘럼 회차 번호
const slotted = []; // orphan → 빈 슬롯 번호
const rest = []; // 나머지 orphan → 46~
for (const b of books) {
  if (bookNum[b.id] != null) numbered.push({ ...b, num: bookNum[b.id] });
  else if (ORPHAN_SLOT[b.id] != null) slotted.push({ ...b, num: ORPHAN_SLOT[b.id] });
  else rest.push(b);
}
numbered.sort((a, b) => a.num - b.num);
slotted.sort((a, b) => a.num - b.num);
rest.sort((a, b) => stripPrefix(a.title).localeCompare(stripPrefix(b.title), 'ko'));

const plan = [];
for (const b of [...numbered, ...slotted]) plan.push({ id: b.id, num: b.num, base: stripPrefix(b.title), orphan: ORPHAN_SLOT[b.id] != null });
let n = ORPHAN_START;
for (const b of rest) plan.push({ id: b.id, num: n++, base: stripPrefix(b.title), orphan: true });
plan.sort((a, b) => a.num - b.num);

console.log(`생활동화 ${books.length}권 · 커리큘럼 ${numbered.length} · 슬롯 orphan ${slotted.length} · 뒤번호 orphan ${rest.length}\n` + '='.repeat(64));
let applied = 0;
for (const p of plan) {
  const newTitle = `${pad(p.num)}. ${p.base}`;
  console.log(`${pad(p.num)}. ${p.base}${p.orphan ? '   (orphan)' : ''}  [${p.id}]`);
  if (!APPLY) continue;
  const book = await getStorybook(p.id);
  if (book.title === newTitle) continue;
  book.title = newTitle;
  book.updatedAt = new Date().toISOString();
  await putStorybook(p.id, book);
  applied++;
}
console.log('='.repeat(64));
console.log(APPLY ? `\n완료. ${applied}권 제목 변경.` : `\nDry-run. 확인 후 --apply.`);
