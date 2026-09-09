// 창작동화 시리즈 폴더 이름 앞에 시리즈 번호를 붙인다 — 「퐁이네 운하 마을」 → 「01. 퐁이네 운하 마을」.
//
// 🔴 왜: editor2 사이드바는 R2 `categoryOrder` 순으로 폴더를 그리는데 창작동화 19개는 거기 없어서
//    권수 desc 로 뒤에 밀려 있었다(50권 열다섯이 뒤엉키고 25권 넷이 그 뒤). 번호가 이름에 있으면
//    이름순 한 번으로 시리즈 순서가 서고, 순서를 R2 설정에 따로 넣어 관리할 필요가 없다.
// 🔴 번호는 `_series-config.mjs` 의 `no` 가 정본이다 — 여기서 다시 적지 않는다.
//
//   node packages/server/scripts/number-changjak-categories.mjs            # dry-run
//   node packages/server/scripts/number-changjak-categories.mjs --apply
//   node packages/server/scripts/number-changjak-categories.mjs --revert   # 번호 떼기
import { SERIES } from '../../client/scripts/_series-config.mjs';

const API = (process.argv.find((a) => a.startsWith('--api='))?.slice(6) ?? 'https://www.tangobook.co.kr').replace(/\/$/, '');
const APPLY = process.argv.includes('--apply');
const REVERT = process.argv.includes('--revert');

/** 시리즈 이름 → 번호 붙인 이름. 정본은 `_series-config.mjs` 의 no. */
const numbered = new Map(Object.values(SERIES).map((s) => [s.title, `${s.no}. ${s.title}`]));
const plain = new Map([...numbered].map(([a, b]) => [b, a]));

const list = await fetch(`${API}/api/storybooks`).then((r) => r.json());
const books = (list.data ?? list).filter((b) => /^changjak-/.test(b.id));

const plan = [];
for (const b of books) {
  const cur = b.category ?? '';
  const next = REVERT ? plain.get(cur) : numbered.get(cur);
  if (next && next !== cur) plan.push({ id: b.id, from: cur, to: next });
}

const by = {};
for (const p of plan) by[`${p.from} → ${p.to}`] = (by[`${p.from} → ${p.to}`] ?? 0) + 1;
console.log(`창작동화 ${books.length}권 · 바꿀 권 ${plan.length}`);
for (const [k, n] of Object.entries(by).sort()) console.log(`  ${k}  (${n}권)`);
if (!plan.length) process.exit(0);
if (!APPLY) {
  console.log('\ndry-run — 실제로 바꾸려면 --apply');
  process.exit(0);
}

let done = 0;
for (const p of plan) {
  const full = await fetch(`${API}/api/storybooks/${p.id}`).then((r) => r.json());
  const sb = full.data ?? full;
  // 🔴 folder 도 같이 바꾼다 — 사이드바는 category 를 쓰지만 두 값이 갈라지면 다음 사람이 헷갈린다.
  const r = await fetch(`${API}/api/storybooks`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ storybook: { ...sb, category: p.to, folder: p.to } }),
  });
  if (!r.ok) { console.error(`  ! ${p.id}: ${r.status}`); continue; }
  if (++done % 50 === 0) console.log(`  … ${done}권`);
}
console.log(`\n✅ ${done}권`);
