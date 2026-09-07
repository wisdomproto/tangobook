// 시리즈 안에서 **문형이 굳은 자리**를 잰다 — 25권을 세로로 놓아야 보이는 겹침.
//
// 🔴 `check-series-draft.mjs` 는 **글자까지 같은 문장**만 잡는다. 편집장이 P1 로 신고한 것은
//    그게 아니라 「p9 도입구가 열몇 권에서 같은 문형」·「p10 애정 동작이 서너 문형에 몰림」·
//    「표정 낱말이 대여섯 권에서 같음」이라, 낱말 하나만 달라도 통과했다. 그래서 **조각(shingle)** 으로 잰다.
// 🔴 **쪽 자리별로** 센다 — 같은 말이라도 p3 과 p9 에 흩어져 있으면 정형구가 아니다.
//    한 자리에 몰린 것만 라이브러리에서 스무 권이 같아 보인다.
// 🔴 **앞 25권과 26~50 은 다른 형식이라 따로 센다**(01~25 = 조용한 단권 · 26~50 = 호리 은행).
// ⚠️ 후렴·시그니처는 설계된 되풀이다 — 이 검사는 **후보만** 낸다. 고칠지는 사람이 정한다.
//
//   node packages/client/scripts/check-series-formula.mjs [시리즈] [--n=3] [--min=5]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBooks } from './_series-parse.mjs';

const DOCS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'changjak-books');
const arg = (k, d) => Number((process.argv.find((a) => a.startsWith(`--${k}=`)) ?? '').split('=')[1] || d);
const N = arg('n', 3);
const MIN = arg('min', 5);
const only = process.argv[2]?.startsWith('--') ? null : process.argv[2];

// 후렴은 그 권이 여러 쪽에서 되풀이하라고 설계된 것 — 권 안 반복은 세지 않고, 권 **사이** 겹침만 센다.
const words = (s) => s.replace(/["'“”‘’]/g, ' ').replace(/[.,!?…·—]/g, ' ').split(/\s+/).filter(Boolean);

/** 한 무리(권 집합)의 한 쪽 자리에서, 여러 권이 공유하는 가장 긴 조각들 */
function formulas(entries) {          // entries: [{id, text}]
  const seen = new Map();             // 조각 → Set(권)
  for (const { id, text } of entries) {
    const w = words(text);
    const own = new Set();
    for (let i = 0; i + N <= w.length; i++) own.add(w.slice(i, i + N).join(' '));
    for (const s of own) (seen.get(s) ?? seen.set(s, new Set()).get(s)).add(id);
  }
  const hot = [...seen].filter(([, b]) => b.size >= MIN);
  // 🔴 이어진 조각은 하나로 합친다 — 한 문형이 조각 넷으로 쪼개져 네 줄로 신고되면 크기를 오판한다.
  const covered = new Set();
  const out = [];
  for (const [s, books] of hot.sort((a, b) => b[1].size - a[1].size || b[0].length - a[0].length)) {
    if (covered.has(s)) continue;
    let phrase = s;
    for (;;) {                        // 오른쪽으로 같은 권 집합을 유지하며 늘린다
      const tail = phrase.split(' ').slice(-(N - 1)).join(' ');
      const next = hot.find(([t, b]) => t.startsWith(tail + ' ') && b.size === books.size && !covered.has(t) && t !== phrase);
      if (!next) break;
      phrase += ' ' + next[0].split(' ').slice(N - 1).join(' ');
      covered.add(next[0]);
    }
    covered.add(s);
    out.push({ phrase, books });
  }
  return out.sort((a, b) => b.books.size - a.books.size);
}

let total = 0;
for (const key of fs.readdirSync(DOCS).filter((k) => (!only || k === only) && !k.startsWith('_'))) {
  const dir = path.join(DOCS, key);
  if (!fs.statSync(dir).isDirectory()) continue;
  const books = parseBooks(dir);
  if (!books.size) continue;

  const groups = books.size > 25
    ? [['01~25', (id) => +id <= 25], ['26~50', (id) => +id >= 26]]
    : [['전 25권', () => true]];

  const lines = [];
  for (const [label, inGroup] of groups) {
    const ids = [...books.keys()].filter(inGroup);
    for (let p = 1; p <= 10; p++) {
      const entries = ids.map((id) => ({ id, text: books.get(id).pages.find((x) => x.n === p)?.ko ?? '' }));
      for (const { phrase, books: bs } of formulas(entries)) {
        lines.push(`  ${label} p${String(p).padStart(2)} ${String(bs.size).padStart(2)}권  「${phrase}」  ${[...bs].sort().join(',')}`);
        total += 1;
      }
    }
  }
  if (lines.length) console.log(`=== ${key} ===\n${lines.join('\n')}`);
}
console.log(`\n조각 ${N}어절 · ${MIN}권 이상 겹친 자리 합계 ${total}`);
