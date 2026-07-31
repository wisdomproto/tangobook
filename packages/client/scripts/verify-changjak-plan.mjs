/**
 * 창작동화 기획서 §5 전수 검증
 *
 *   node packages/client/scripts/verify-changjak-plan.mjs
 *
 * 🔴 각 에이전트는 **자기 주제군 안에서만** (엔진 × 무대) 중복을 봤다.
 *    1000권을 가로지르는 검증은 여기서 한 번 더 한다 — 규칙은 「같은 조합 두 번 금지」다.
 * 🔴 주제군이 다르면 (엔진 × 무대) 가 같아도 **다른 조합**이다(3축이 주제군·엔진·무대라서).
 *    그래서 중복 판정 키는 `주제군|엔진|무대` 세 개다.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const plan = readFileSync(resolve(here, '../public/changjak-plan.html'), 'utf8').replace(/\r\n/g, '\n');

const ENGINES = [
  '누적·반복', '오해와 반전', '여정과 귀환', '소원의 대가',
  '규칙 깨기', '교환·연쇄', '관찰과 성장', '옛이야기 비틀기',
];

const books = [];
for (const grp of plan.split('<div class="grp">').slice(1)) {
  const g = grp.match(/<h3>(.*?)<\/h3>/)?.[1] ?? '?';
  const target = Number(grp.match(/class="cnt">(\d+)권/)?.[1] ?? 0);
  const rows = [
    ...grp.matchAll(
      /<tr><td>(\d+)<\/td><td><b>(.*?)<\/b><\/td><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><\/tr>/gs
    ),
  ];
  for (const [, no, title, summary, engine, stage] of rows) {
    books.push({ group: g, target, no: +no, title, summary, engine: engine.trim(), stage: stage.trim() });
  }
}

const fail = [];
const warn = [];

// 1. 권수
const byGroup = new Map();
for (const b of books) {
  if (!byGroup.has(b.group)) byGroup.set(b.group, { target: b.target, rows: [] });
  byGroup.get(b.group).rows.push(b);
}
console.log(`총 ${books.length}권\n`);
for (const [g, { target, rows }] of byGroup) {
  const nums = rows.map((r) => r.no).sort((a, b) => a - b);
  const gaps = nums.filter((n, i) => i && n !== nums[i - 1] + 1);
  const dupNo = nums.filter((n, i) => i && n === nums[i - 1]);
  console.log(`  ${g.padEnd(22)} ${String(rows.length).padStart(3)}/${target}${rows.length === target ? '' : '  ← 부족'}`);
  if (rows.length !== target) fail.push(`${g}: ${rows.length}/${target}권`);
  if (dupNo.length) fail.push(`${g}: 번호 중복 ${dupNo.join(',')}`);
  if (gaps.length) warn.push(`${g}: 번호 끊김 (${gaps.slice(0, 5).join(',')} 앞)`);
}

// 2. 🔴 조합 중복 — 3축 전부가 같을 때만 중복
const combo = new Map();
for (const b of books) {
  const key = `${b.group}|${b.engine}|${b.stage}`;
  (combo.get(key) ?? combo.set(key, []).get(key)).push(b);
}
const dupCombo = [...combo.entries()].filter(([, v]) => v.length > 1);
console.log(`\n조합 (주제군 × 엔진 × 무대): ${combo.size}개 · 중복 ${dupCombo.length}개`);
for (const [key, v] of dupCombo.slice(0, 20)) {
  fail.push(`조합 중복 [${key}] → ${v.map((b) => `#${b.no} ${b.title}`).join(' / ')}`);
}
if (dupCombo.length > 20) fail.push(`…조합 중복 ${dupCombo.length - 20}건 더`);

// 3. 제목 중복 (전 1000권)
const titles = new Map();
for (const b of books) (titles.get(b.title) ?? titles.set(b.title, []).get(b.title)).push(b);
const dupTitle = [...titles.entries()].filter(([, v]) => v.length > 1);
console.log(`제목: ${titles.size}개 · 중복 ${dupTitle.length}개`);
for (const [t, v] of dupTitle.slice(0, 15)) {
  warn.push(`제목 중복 「${t}」 → ${v.map((b) => `${b.group.slice(0, 1)}-${b.no}`).join(' / ')}`);
}

// 4. 엔진 이름이 목록 밖이면 오타 (B-1 이 주제군명을 엔진 칸에 넣은 전례)
const badEngine = books.filter((b) => !ENGINES.includes(b.engine));
if (badEngine.length) {
  for (const b of badEngine.slice(0, 10)) fail.push(`엔진칸 오류 ${b.group.slice(0, 1)}-${b.no}: "${b.engine}"`);
}

// 5. 엔진 분포 — 편중은 실패가 아니라 다음 배정의 지침
const eng = new Map();
for (const b of books) eng.set(b.engine, (eng.get(b.engine) ?? 0) + 1);
console.log('\n엔진 분포');
for (const e of ENGINES) {
  const n = eng.get(e) ?? 0;
  console.log(`  ${e.padEnd(14)} ${String(n).padStart(4)}  ${(n / books.length * 100).toFixed(1)}%`);
}
const stages = new Set(books.map((b) => b.stage));
console.log(`\n무대 ${stages.size}개 · 조합 공간 ${byGroup.size}×${ENGINES.length}×${stages.size} = ${byGroup.size * ENGINES.length * stages.size}`);

// 6. 교훈 문장 금지(§1) — 착지가 교훈이면 생활동화와 같아진다.
//    🔴 「배운다」 자체는 금지어가 아니다 — G군(용기·두려움)의 착지 규칙이
//    「두려움은 안 사라지고 다루는 법만 는다」라, 배우는 대상이 **기술**이면 정상이다.
//    금지 대상은 배우는 대상이 **덕목**일 때뿐이라 추상 명사로 좁힌다.
const MORAL = /(소중함|고마움|중요함|참을성|정직|우정|배려)[을를]?\s*(느낀다|배운다|알게)|교훈|반성한다/;
for (const b of books.filter((b) => MORAL.test(b.summary))) {
  warn.push(`교훈 착지 의심 ${b.group.slice(0, 1)}-${b.no} 「${b.title}」`);
}

// 7. 🔴 주제군이 달라도 제목+엔진+무대가 같으면 읽는 사람에겐 같은 책이다.
//    (B-64 / G-86 이 후렴까지 같은 채로 조합 검사를 통과한 전례)
const near = new Map();
for (const b of books) {
  const k = `${b.title}|${b.engine}|${b.stage}`;
  (near.get(k) ?? near.set(k, []).get(k)).push(b);
}
for (const [k, v] of [...near.entries()].filter(([, v]) => v.length > 1)) {
  fail.push(`같은 책으로 읽힘 [${k}] → ${v.map((b) => `${b.group.slice(0, 1)}-${b.no}`).join(' / ')}`);
}

console.log('');
if (warn.length) console.log(`⚠️  경고 ${warn.length}건\n` + warn.slice(0, 25).map((w) => '   ' + w).join('\n'));
if (fail.length) {
  console.log(`\n❌ 실패 ${fail.length}건\n` + fail.slice(0, 30).map((f) => '   ' + f).join('\n'));
  process.exit(1);
}
console.log('\n✅ 전수 검증 통과');
