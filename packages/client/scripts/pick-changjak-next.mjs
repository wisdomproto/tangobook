/**
 * 창작동화 1000 — 다음에 쓸 책을 고른다
 *
 *   node packages/client/scripts/pick-changjak-next.mjs [--n 4] [--json]
 *
 * 🔴 왜 스크립트인가. 20권까지는 내가 눈으로 골랐고, 그래서 주제군이 A5 B1 C3 D1 E4 F2 G3 H1 로
 *    기울었다. 목표 비율(A180 B150 C150 D120 E120 F110 G90 H80)과 전혀 다른 모양이다.
 *    사람이 매번 판단하면 재현이 안 되고, 1000권에서는 그 기울기가 그대로 굳는다.
 *
 * 고르는 규칙 (순서대로)
 *   ① 주제군 = **충족률(쓴 권수 / 목표 권수)이 가장 낮은 군**부터. 한 배치 안에서도 한 권 뽑을 때마다
 *      다시 계산하므로 자연히 여러 군에 흩어진다.
 *   ② 엔진 = **검증된 것만**(누적·반복 · 오해와 반전). 나머지는 그 엔진으로 한 권 통과시킨 뒤 연다.
 *   ③ 은유 함정 제외 — 감정을 몸/사물의 변형으로 그리는 요약은 이 라인에서 죽었다(a01).
 *   ④ 무대 중복 회피 — 이미 쓴 책과 같은 무대는 뒤로 민다(그림체까지 닮는다).
 *   ⑤ 같은 조건이면 번호 오름차순 — 🔴 무작위를 쓰지 않는다. 같은 상태면 같은 답이 나와야 한다.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const PLAN = resolve(here, '../public/changjak-plan.html');
const BOOKS = resolve(here, '../../../docs/changjak-books');

const args = process.argv.slice(2);
const N = Number(args[args.indexOf('--n') + 1]) || 4;
const asJson = args.includes('--json');

const VERIFIED = new Set(['누적·반복', '오해와 반전']);

// 🔴 은유 함정 — 「감정이 몸·사물을 바꾼다」는 요약. a01(부끄러우면 털이 빨개져)이 이 병으로 죽었다.
//    4~6세는 그 치환을 못 읽는다. 규칙 깨기 엔진과 함께 이 라인의 두 실패 원인이다.
const METAPHOR = /(화[가날]|서운|부끄|질투|미움|외로).{0,24}(빨개|초록|커지|자라|무거워|금이|쌓이|늘어)/;

const strip = (h) => h.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// ── 목표 권수 ──────────────────────────────────────────────
const plan = readFileSync(PLAN, 'utf8');
const target = {};
for (const [, g, , n] of plan.matchAll(/<tr><td><b>([A-H])\s+([^<]+)<\/b><\/td><td>(\d+)<\/td>/g)) {
  target[g] = Number(n);
}

// ── 이미 쓴 책 ─────────────────────────────────────────────
const writtenTitles = new Set();
const writtenStages = new Set();
const written = {};
for (const f of readdirSync(BOOKS).filter((f) => /^[a-h]\d+\.md$/.test(f))) {
  const g = f[0].toUpperCase();
  written[g] = (written[g] || 0) + 1;
  const md = readFileSync(join(BOOKS, f), 'utf8');
  const fm = md.split('---')[1] || '';
  const pick = (k) => (fm.match(new RegExp(`^${k}:\\s*(.+)`, 'm')) || [, ''])[1].trim();
  if (pick('title')) writtenTitles.add(pick('title'));
  // 무대는 「콘월 해변 (바위 조수웅덩이)」처럼 괄호가 붙으므로 앞부분만 본다
  if (pick('stage')) writtenStages.add(pick('stage').split(/[(（]/)[0].trim());
}

// ── 후보 ───────────────────────────────────────────────────
const pool = [];
for (const sec of plan.split(/(?=<h3[^>]*>)/)) {
  const h = sec.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
  if (!h) continue;
  const g = strip(h[1])[0];
  if (!'ABCDEFGH'.includes(g)) continue;
  for (const [, row] of sec.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const td = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => strip(m[1]));
    if (td.length !== 5 || !/^\d+$/.test(td[0])) continue;
    const [no, title, summary, engine, stage] = td;
    if (!VERIFIED.has(engine)) continue;
    if (writtenTitles.has(title)) continue;
    if (METAPHOR.test(summary)) continue;
    pool.push({ group: g, no: Number(no), title, summary, engine, stage });
  }
}

// ── 뽑기 ───────────────────────────────────────────────────
const counts = { ...written };
const takenStages = new Set(writtenStages);
const chosen = [];

for (let i = 0; i < N; i++) {
  // ① 충족률이 가장 낮은 군부터. 뽑을 때마다 다시 센다.
  const order = 'ABCDEFGH'
    .split('')
    .filter((g) => pool.some((c) => c.group === g))
    .sort((a, b) => {
      const ra = (counts[a] || 0) / target[a];
      const rb = (counts[b] || 0) / target[b];
      return ra - rb || target[b] - target[a] || a.localeCompare(b);
    });
  if (!order.length) break;

  let got = null;
  for (const g of order) {
    const inGroup = pool.filter((c) => c.group === g).sort((a, b) => a.no - b.no);
    // ④ 무대가 겹치지 않는 것 우선, 없으면 겹쳐도 받는다
    got = inGroup.find((c) => !takenStages.has(c.stage.split(/[(（]/)[0].trim())) || inGroup[0];
    if (got) break;
  }
  if (!got) break;

  chosen.push(got);
  pool.splice(pool.indexOf(got), 1);
  counts[got.group] = (counts[got.group] || 0) + 1;
  takenStages.add(got.stage.split(/[(（]/)[0].trim());
}

// ── 출력 ───────────────────────────────────────────────────
if (asJson) {
  console.log(JSON.stringify(chosen, null, 2));
} else {
  console.log('현재 충족률 (쓴 권수 / 목표)');
  for (const g of 'ABCDEFGH') {
    const w = written[g] || 0;
    const pct = ((w / target[g]) * 100).toFixed(1);
    console.log(`  ${g}  ${String(w).padStart(3)} / ${String(target[g]).padStart(3)}  ${pct}%`);
  }
  console.log(`\n검증 엔진 후보 ${pool.length + chosen.length}권 → 다음 ${chosen.length}권\n`);
  for (const c of chosen) {
    const id = c.group.toLowerCase() + String(c.no).padStart(2, '0');
    console.log(`  ${id}  ${c.title}`);
    console.log(`       ${c.engine} · ${c.stage}`);
    console.log(`       ${c.summary.slice(0, 88)}`);
  }
}
