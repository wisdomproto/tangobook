// 시리즈 원고 기계 검수 — comic-editor 에게 넘기기 전에 돌린다.
//
// 🔴 이 라인에서 **사람이 읽어서는 계속 놓친** 것만 넣었다. 판단이 필요한 것(탈이 겹치나 ·
//    어른이 바보로 보이나 · 아이가 그림에서 뭘 아나)은 여기 없고 편집장 몫이다.
//
//   node packages/client/scripts/check-series-draft.mjs bung
//   node packages/client/scripts/check-series-draft.mjs            # 있는 시리즈 전부
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBooks } from './_series-parse.mjs';

const DOCS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'changjak-books');

// 🔴 **호리·전래 규격을 여기 들이대지 마라** (2026-08-13 실측). CLAUDE.md §문체 의
//    「쪽당 40~95자 · 대사 13~15개」는 호리 45 + 유치원 20 + 전래 40 에서 잰 값인데,
//    창작 시리즈는 **이미 나간 퐁이·메이까지 포함해 한 권도 그 근처에 간 적이 없다.**
//
//      전래 40권   쪽당 97자 · 권당 대사 15.9
//      유치원 20권 쪽당 78자 · 권당 대사 13.7
//      한글나무 32권 쪽당 51자 · 권당 대사 10.3
//      창작 시리즈  쪽당 ~28자 · 권당 대사 ~3      ← 퐁이 3.1 · 메이 3.0 · 붕이 2.1 · 딩딩 5.1
//
//    하한을 켜 두면 **나간 원고 100%가 경고**라 신호가 안 된다. 그래서 하한을 뺐다.
//    이게 라인의 성격인지 결함인지는 숫자가 못 정한다 — 사람이 정할 일이라 §요약에 띄운다.
const PAGE_MAX = 95;                   // 🔴 상한만 남긴다 — 「문장을 압축하지 마라」의 반대편
const WEIGHT_MAX = 100;                // 원함+착지 글자수 — 넘으면 「겹이 많다」 징후

const quoted = (s) => s.match(/"[^"]*"/g) ?? [];

/** 앞머리 메타 줄에서 라벨 하나를 꺼낸다: `**원함** … · **탈** …` */
function metaField(meta, label) {
  const m = meta.match(new RegExp(`\\*\\*${label}\\*\\*\\s*([^·]*)`));
  return m ? m[1].trim() : '';
}

function checkSeries(key) {
  const books = parseBooks(path.join(DOCS, key));
  if (!books.size) return null;
  const fail = [], warn = [];

  if (books.size !== 25) fail.push(`권수 ${books.size} (25 여야 한다)`);

  let talkTotal = 0, charTotal = 0, pageTotal = 0;
  for (const [id, bk] of [...books].sort((a, b) => a[0].localeCompare(b[0]))) {
    const at = (msg) => `${id}. ${bk.title} — ${msg}`;

    if (bk.pages.length !== 10) fail.push(at(`쪽수 ${bk.pages.length}`));

    const nums = bk.pages.map((p) => p.n);
    if (nums.some((n, i) => n !== i + 1)) fail.push(at(`쪽 번호가 어긋난다 [${nums}]`));

    // 🔴 p1 을 대사로 열지 않는다 — 산문 규칙으로만 뒀더니 93권 중 44권이 어겼다
    const p1 = bk.pages.find((p) => p.n === 1);
    if (p1 && /^["「]/.test(p1.ko)) fail.push(at('p1 이 대사로 열린다'));

    // 🔴 종결 「~았다/었다」 0% — 105편 실측. **서술에만 걸린다.**
    //    대사 안은 세지 마라 — 아이가 "다 뽑았다!" 하는 건 정상이고, 전래동화 40권도
    //    서술 0건 / 대사 안 1건이다. 안 빼면 멀쩡한 대사가 결함으로 잡힌다(yuki 12권).
    for (const p of bk.pages) {
      const past = p.ko.replace(/"[^"]*"/g, '').match(/[가-힣]{1,4}(?:았|었|였)다[.!?]/g);
      if (past) fail.push(at(`p${p.n} 종결이 「~았다」 (${past.join(' ')})`));
      const n = p.ko.replace(/\s/g, '').length;
      charTotal += n; pageTotal++;
      if (n > PAGE_MAX) warn.push(at(`p${p.n} ${n}자 (상한 ${PAGE_MAX})`));
    }

    // 🔴 대사 0 은 결함이다 — 열 쪽 내내 아무도 말을 안 하면 누가 뭘 원하는지 글에 안 남는다
    const talk = bk.pages.reduce((a, p) => a + quoted(p.ko).length, 0);
    talkTotal += talk;
    if (talk === 0) fail.push(at('대사가 한 마디도 없다'));

    // 🔴 한 권 = 규칙 하나. 글자수가 규칙이 아니라 **징후**다
    const weight = (metaField(bk.meta, '원함') + metaField(bk.meta, '착지')).replace(/\s/g, '').length;
    if (weight > WEIGHT_MAX) warn.push(at(`원함+착지 ${weight}자 — 겹을 세어 볼 것`));
  }

  // 🔴 **권끼리 글자까지 같은 문장** — 2026-08-13 검수에서 다섯 시리즈 중 넷이 이걸로 걸렸다.
  //    붕이 02·07 「또리가 고개를 홱 돌려요」 · 타로 01·06 「무무가 귀를 쫑긋 세웠어요」 ·
  //    유키 03·10 「두 손이 꽉 찼어요」 · 미나 06·15 원함·착지가 통째로.
  //    작가는 「탈 동사」를 갈라 놓고도 여기서 겹친다 — 주인공 동사를 세는 그물에 상대의 반응·
  //    감각·시간 표현이 안 걸리기 때문이다. **사람이 다섯 번 놓친 것이고 기계는 한 번에 잡는다.**
  const seen = new Map();
  for (const [id, bk] of books) {
    for (const p of bk.pages) {
      for (const s of p.ko.split(/(?<=[.!?])\s+/)) {
        const t = s.trim();
        // 🔴 걸러야 할 것 둘 — 안 거르면 소음에 신호가 묻힌다(실측: 나간 시리즈에서 검출 33건 중 21건이 소음).
        //   ① 짧은 감탄·의성어 ② **대사 표지**(「엄마가 말했어요」) — 그림책에서 반복이 정상이다.
        //      잡고 싶은 건 「또리가 고개를 홱 돌려요」처럼 **그 권의 사건을 이루는 문장**이다.
        if (t.replace(/\s/g, '').length < 10) continue;
        if (/^[가-힣 ]{1,14}(말했어요|물었어요|불렀어요|대답했어요|외쳤어요)\.$/.test(t)) continue;
        if (!seen.has(t)) seen.set(t, new Set());
        seen.get(t).add(id);
      }
    }
  }
  const dup = [...seen].filter(([, ids]) => ids.size >= 2)
    .map(([s, ids]) => `${[...ids].sort().join('·')}권이 같은 문장 — 「${s}」`);
  // 🔴 **한 권 안의 반복은 일부러 안 센다**(2026-08-13 실측). 375권을 재 보니 6건뿐이고 그중 넷이
  //    의도한 후렴이었다(「개굴개굴, 개굴개굴」·「틀은 틀 자리에, 컵은 컵 자리에」). 진짜 사고는 둘 =
  //    0.5%. 넣으면 후렴을 매번 경고해서 신호 대 소음이 뒤집힌다 — 이건 사람이 읽다 잡는 게 맞다
  //    (딩딩 06 의 p1↔p9 중복도 작가가 읽다 찾았다).

  // 문형 쏠림 — 실패가 아니라 **징후**로 띄운다(수치 목표를 세우지 않는 것이 이 라인 방침이다)
  const want = [...books.values()]
    .map((b) => b.pages.find((p) => p.n === 2)?.ko ?? '')
    .filter((s) => /싶어요|싶었어요/.test(s)).length;

  return {
    key, books: books.size,
    talkAvg: (talkTotal / books.size).toFixed(1),
    pageAvg: (charTotal / pageTotal).toFixed(0),
    wantForm: want,
    dup, fail, warn,
  };
}

const targets = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const keys = targets.length
  ? targets
  : fs.readdirSync(DOCS).filter((d) => fs.existsSync(path.join(DOCS, d, '01-03.md')));

let bad = 0;
for (const key of keys) {
  const r = checkSeries(key);
  if (!r) { console.log(`${key} — 원고 없음`); continue; }
  console.log(`\n=== ${r.key} · ${r.books}권 · 쪽당 ${r.pageAvg}자 · 권당 대사 ${r.talkAvg}개 ===`);
  console.log('    (견줄 것 — 전래 97자/15.9 · 유치원 78자/13.7 · 한글나무 51자/10.3)');
  console.log(`    p2 원함이 「~고 싶어요」인 권 ${r.wantForm}/${r.books} — 몸으로 세운 권을 섞었나`);
  for (const f of r.fail) console.log(`  ❌ ${f}`);
  for (const d of r.dup) console.log(`  🔁 ${d}`);
  const shown = r.warn.slice(0, 12);
  for (const w of shown) console.log(`  ⚠️  ${w}`);
  if (r.warn.length > shown.length) console.log(`  ⚠️  … 외 ${r.warn.length - shown.length}건`);
  if (!r.fail.length && !r.warn.length && !r.dup.length) console.log('  ✅ 깨끗');
  bad += r.fail.length;
}
process.exit(bad ? 1 : 0);
