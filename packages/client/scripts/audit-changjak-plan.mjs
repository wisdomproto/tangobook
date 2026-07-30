/**
 * 창작동화 1000 — 요약 1000권을 전수 채점해 「쓸 수 있는 것」부터 줄 세운다
 *
 *   node packages/client/scripts/audit-changjak-plan.mjs [--json] [--top 40] [--group A]
 *
 * 🔴 왜 필요한가. 엔진 라벨로만 막으면 두 가지를 다 놓친다 —
 *    막힌 엔진(730권) 안에도 멀쩡한 요약이 있고, 열린 엔진 안에도 못 쓸 요약이 있다.
 *    실제로 a06·a07 이 열린 엔진(누적·반복)이면서 a01 과 같은 은유 함정이었다.
 *    그래서 판정 단위를 **엔진이 아니라 요약 한 줄**로 내린다.
 *
 * 결함은 전부 이 라인이 실제로 죽인 원고에서 나왔다 (docs/changjak-books/CLAUDE.md).
 *   은유    감정이 몸·사물을 바꾼다 …………… a01 이 이 병으로 스무 번 고치다 폐기
 *   설정    아이가 규칙을 외워야 굴러간다 …… 통과 조건 「외울 설정이 없다」와 정면 충돌
 *   추론    원인·대가·연쇄를 머리로 따라가야 … 소원의 대가·교환·연쇄를 보류한 이유
 *   원작    아는 이야기여야 비틀림이 읽힌다 … 옛이야기 비틀기를 보류한 이유
 *   추상    사건이 아니라 상태·기분만 있다 …… 그릴 자세가 없다(몸동작 한 줄 규칙)
 *   무대    무대가 물리 조건이 아니라 장식 …… 「장식 지명은 조합을 안 늘린다」
 *
 * 등급 = 결함 0 이면 A, 1 이면 B, 2 이상이면 C.
 * 우선순위 = A 먼저, 그 안에서 **주제군 충족률이 낮은 순**(목표 비율 A180…H80 을 맞춘다),
 *            같으면 번호 오름차순. 🔴 무작위 없음 — 같은 상태면 같은 답.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const PLAN = resolve(here, '../public/changjak-plan.html');
const BOOKS = resolve(here, '../../../docs/changjak-books');

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const TOP = Number((args.find((a) => a.startsWith('--top')) || '').split(/[= ]/)[1] || args[args.indexOf('--top') + 1]) || 40;
const onlyGroup = (args.find((a) => a.startsWith('--group=')) || '').slice(8).toUpperCase();

// ── 결함 판정 ──────────────────────────────────────────────
// 각 항목: [코드, 설명, 정규식들]. 하나라도 걸리면 그 결함 1개.
const FLAGS = [
  ['은유', '감정이 몸·사물을 바꾼다', [
    /(화[가날]|서운|부끄|질투|미움|외로|슬프|무서)\S{0,20}.{0,12}(빨개|파래|초록|노래|커지|작아|자라|자란|무거워|금이|쌓이|늘어|사라)/,
    // 🔴 「자라」로는 「자란다」가 안 잡힌다 — 한글은 음절이 합쳐져 있다. 어간을 둘 다 적는다.
    /(털|몸|얼굴|귀|코|그림자|꼬리|발자국)[이가은는]?.{0,12}(빨개|파래|초록|노래|커지|작아|자라|자란|무거워|투명)/,
    /(말|비밀|생각|걱정|미안|거짓말|기억|꿈)(들)?[이가은는]?.{0,16}(쌓여|쌓이|무거워|커지|넘쳐|굳어)/,
    // 🔴 세 번째로 새어 나온 얼굴 — 감정이 **물건으로 치환**된다(a15「서운한 일이 생길 때마다
    //    가방에 돌을 넣는다」). 몸도 안 변하고 「쌓인다」는 말도 없어 앞 두 줄이 다 비켜 갔다.
    /(서운|화[가날]|슬프|미운|억울|속상|무서)\S{0,14}.{0,24}(돌|물건|가방|주머니|상자|구슬)[을를]?.{0,8}(넣|담|모으|모아)/,
  ]],
  // ⚠️ 「~할 때마다」와 「세 번」은 뺐다. 반복은 이 라인의 열린 엔진(누적·반복) 자체이고,
  //    「열세 번째에 파도가 먼저 온다」가 「세 번」에 걸려 좋은 요약이 B 로 내려갔다.
  //    외워야 할 것은 **횟수**가 아니라 **세계의 규칙**이므로 규칙 낱말만 본다.
  ['설정', '아이가 규칙을 외워야 굴러간다', [
    /(규칙|약속|주문|마법|저주)[이가은는을를]?\s*\S{0,4}(있|생기|깨|어기|외우|풀)/,
    /(절대 .{0,8}면 안|반드시 .{0,8}해야|해야만 .{0,6}(할 수|된다))/,
  ]],
  // ⚠️ 「대신」 단독은 뺐다 — 「목소리 대신 다른 것으로 말한다」처럼 흔한 말이라
  //    대가 구조가 아닌 권을 무더기로 끌어왔다. 대가는 **잃는다는 말**이 붙을 때만 대가다.
  ['추론', '원인·대가·연쇄를 머리로 따라가야 한다', [
    /(그 대가로|대가를|대가가|잃는다|잃게 된다|내주어야|내놓아야)/,
    /(하나씩 건너|차례로 옮겨|돌고 돌아|거슬러 올라|되짚)/,
    /(왜 그런지 알아|이유를 알아내|알아채야|추리|비밀을 밝)/,
  ]],
  ['원작', '아는 이야기여야 비틀림이 읽힌다', [
    /(빨간 모자|늑대와 일곱|아기 돼지 삼|신데렐라|백설|잠자는 숲|피리 부는|황금 거위|브레멘|성냥팔이|미운 오리|피노키오|헨젤|그레텔|라푼젤)/,
    /(우리가 아는|알려진 것과 달리|사실은 .{0,8}이야기)/,
  ]],
  ['추상', '사건이 아니라 상태·기분만 있다', [
    /^[^.]{0,40}(마음|기분|느낌|생각)[이가은는을를].{0,30}$/,
    /(이란 무엇|무엇일까|어떤 것일까|배운다|알게 된다|깨닫)/,
  ]],
  // 🔴 「설정」의 쌍둥이 — 규칙을 외우게 하는 대신 **세계가 현실과 다르게 굴러간다**.
  //    아이는 그 세계법을 먼저 받아들여야 이야기를 따라갈 수 있고, 그게 a01 이 죽은 자리다.
  //    ⚠️ 말하는 동물은 여기 해당 없다 — 이 라인의 주인공은 원래 동물이고 그건 규격이다.
  ['판타지', '세계가 현실과 다르게 작동한다', [
    /(벽지|무늬|글씨|숫자|그림|인형|장난감|의자|계단|지도|간판)[이가은는].{0,12}(자란|자라|움직이|걸어|살아나|말을 걸)/,
    /(하늘로 올라|거꾸로 내리|시간이 (거꾸로|멈)|뒤로 흐르)/,
    // 🔴 `\S` 로 쓰면 공백을 못 건너 「달빛을 **한 통씩** 배달하는」이 통과한다(b10 이 그렇게 새어 나왔다).
    /(달빛|별빛|별|바람|소리|노래|냄새|꿈|그림자|어둠)[을를].{0,10}(담|모아|모으|배달|판다|팔아|병에|주머니에|나눠 주)/,
    /(투명해|투명하게)/,
    // 소원이 「이루어지는」 세계 — h08 이 소원의 대가 엔진을 연 방식(대가를 물리로)과 정반대다.
    /(소원|바람)[이가]\s*이루어|소원을 들어[주준]/,
    // 사람이 아닌 것이 사람처럼 군다. ⚠️ 동물은 이 라인의 규격이라 뺀다.
    /(바람|해|달|구름|파도|눈|비)[가은는이]\s*\S{0,8}(재밌|심술|화가|말했|웃|삐)/,
  ]],
];

const strip = (h) => h.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

function scoreOf(b) {
  const hits = [];
  for (const [code, , res] of FLAGS) {
    if (!res) continue;
    if (res.some((re) => re.test(b.summary))) hits.push(code);
  }
  return hits;
}

// ── 계획서 읽기 ────────────────────────────────────────────
const plan = readFileSync(PLAN, 'utf8');
const target = {};
for (const [, g, , n] of plan.matchAll(/<tr><td><b>([A-H])\s+([^<]+)<\/b><\/td><td>(\d+)<\/td>/g)) {
  target[g] = Number(n);
}

const writtenTitles = new Set();
const written = {};
for (const f of readdirSync(BOOKS).filter((f) => /^[a-h]\d+\.md$/.test(f))) {
  const g = f[0].toUpperCase();
  written[g] = (written[g] || 0) + 1;
  const fm = readFileSync(join(BOOKS, f), 'utf8').split('---')[1] || '';
  const t = (fm.match(/^title:\s*(.+)/m) || [, ''])[1].trim();
  if (t) writtenTitles.add(t);
}

const all = [];
for (const sec of plan.split(/(?=<h3[^>]*>)/)) {
  const h = sec.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
  if (!h) continue;
  const g = strip(h[1])[0];
  if (!'ABCDEFGH'.includes(g)) continue;
  for (const [, row] of sec.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const td = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => strip(m[1]));
    if (td.length !== 5 || !/^\d+$/.test(td[0])) continue;
    const [no, title, summary, engine, stage] = td;
    const b = { group: g, no: Number(no), id: g.toLowerCase() + String(no).padStart(2, '0'), title, summary, engine, stage };
    b.flags = scoreOf(b);
    b.grade = b.flags.length === 0 ? 'A' : b.flags.length === 1 ? 'B' : 'C';
    b.done = writtenTitles.has(title);
    all.push(b);
  }
}

// ── 집계 ───────────────────────────────────────────────────
const byGrade = { A: 0, B: 0, C: 0 };
const byFlag = {};
const gradeByGroup = {};
for (const b of all) {
  byGrade[b.grade]++;
  for (const f of b.flags) byFlag[f] = (byFlag[f] || 0) + 1;
  gradeByGroup[b.group] ??= { A: 0, B: 0, C: 0 };
  gradeByGroup[b.group][b.grade]++;
}

// ── 우선순위 ───────────────────────────────────────────────
// A 먼저. 같은 등급 안에서는 충족률이 낮은 주제군부터 — 한 권 넣을 때마다 다시 계산한다.
const queue = [];
const pool = all.filter((b) => !b.done && b.grade !== 'C');
const counts = { ...written };
const rate = (g) => (counts[g] || 0) / (target[g] || 1);
while (pool.length) {
  let best = null;
  for (const b of pool) {
    if (!best) { best = b; continue; }
    const ka = [b.grade, rate(b.group), b.group, b.no];
    const kb = [best.grade, rate(best.group), best.group, best.no];
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] === kb[i]) continue;
      if (ka[i] < kb[i]) best = b;
      break;
    }
  }
  queue.push(best);
  counts[best.group] = (counts[best.group] || 0) + 1;
  pool.splice(pool.indexOf(best), 1);
}

if (asJson) {
  console.log(JSON.stringify({ byGrade, byFlag, gradeByGroup, queue }, null, 2));
} else {
  console.log(`\n1000권 전수 채점 — A ${byGrade.A} · B ${byGrade.B} · C ${byGrade.C}\n`);
  console.log('결함별 (중복 포함)');
  for (const [f, n] of Object.entries(byFlag).sort((a, b) => b[1] - a[1])) {
    const desc = (FLAGS.find((x) => x[0] === f) || [, ''])[1];
    console.log(`  ${f}  ${String(n).padStart(4)}   ${desc}`);
  }
  console.log('\n주제군별 (A / B / C · 목표)');
  for (const g of 'ABCDEFGH') {
    const r = gradeByGroup[g] || { A: 0, B: 0, C: 0 };
    console.log(`  ${g}   ${String(r.A).padStart(3)} / ${String(r.B).padStart(3)} / ${String(r.C).padStart(3)}   목표 ${target[g]}`);
  }
  console.log(`\n집필 대기열 ${queue.length}권 — 앞 ${TOP}권\n`);
  for (const b of queue.slice(0, TOP)) {
    if (onlyGroup && b.group !== onlyGroup) continue;
    console.log(`  ${b.grade} ${b.id.padEnd(5)} ${b.title}`);
    console.log(`      ${b.engine} · ${b.stage}${b.flags.length ? '   ⚠️ ' + b.flags.join(',') : ''}`);
  }
}
