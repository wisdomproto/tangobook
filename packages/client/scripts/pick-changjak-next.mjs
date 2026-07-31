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
 *   ④ 무대·주인공 동물 중복 회피 — 같은 무대는 그림체까지 닮고, 같은 짐승이 몰리면 한 시리즈로 보인다.
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
// 🔴 막힌 엔진을 열려면 그 엔진으로 한 권을 통과시켜야 하는데, 기본 필터가 그 엔진을 빼 버려서
//    후보를 볼 방법이 없었다. --engine 은 **그 한 권을 고르는 용도**다 — 통과하기 전엔 표를 고치지 마라.
const engineArg = (args.find((a) => a.startsWith('--engine=')) || '').slice(9);

// 🔴 열린 엔진은 **CLAUDE.md 의 엔진 표에서 읽는다**. 예전엔 여기 두 개를 손으로 박아 뒀는데,
//    그 뒤 다섯 개가 더 열렸는데도(관찰과 성장·여정과 귀환·소원의 대가·교환·연쇄·옛이야기 비틀기)
//    스크립트는 계속 두 개만 보고 있었다 — 후보가 227권으로 잡혀 **열린 엔진의 3/4 가 통째로
//    안 보였다.** 표에 상태(✅ 열림 / ❌ 금지)가 이미 있으니 그걸 그대로 쓴다.
const OPEN = new Set(
  [...readFileSync(resolve(BOOKS, 'CLAUDE.md'), 'utf8').matchAll(/^\|\s*\*\*([^*|]+)\*\*\s*\|[^|]*\|\s*([^|]*)\|/gm)]
    .filter((m) => m[2].includes('열림'))
    .map((m) => m[1].trim())
);
const VERIFIED = engineArg ? new Set([engineArg]) : OPEN;

// 🔴 은유 함정 — 「감정이 몸·사물을 바꾼다」는 요약. a01(부끄러우면 털이 빨개져)이 이 병으로 죽었다.
//    4~6세는 그 치환을 못 읽는다. 규칙 깨기 엔진과 함께 이 라인의 두 실패 원인이다.
const METAPHOR = [
  /(화[가날]|서운|부끄|질투|미움|외로).{0,24}(빨개|초록|커지|자라|자란|무거워|금이|쌓이|늘어)/,
  // 🔴 감정을 이름으로 안 부르고 상황으로만 써도 같은 병이다 — a06「친구가 상을 받은 날부터
  //    털이 자꾸 초록으로 자란다」가 첫 필터를 그냥 통과했다. 판정 기준은 감정 단어가 아니라
  //    **몸이 마음 때문에 변하나**이므로, 몸 + 색·크기 변화를 그 자체로 잡는다.
  // 🔴 「자라」로는 「자란다」가 안 잡힌다 — 한글은 음절이 합쳐져 있어 자란다 ⊅ 자라. 어간을 둘 다 적는다.
  /(털|몸|얼굴|귀|코|그림자|꼬리)[이가은는]?.{0,12}(빨개|파래|초록|노래|커지|작아|자라|자란|무거워)/,
  // 🔴 세 번째 얼굴 — 눈에 안 보이는 것(말·비밀·걱정)이 물건이 되어 쌓이거나 무거워진다.
  //    a07「못 한 말들이 주머니에 하나씩 쌓여 걸을 수 없을 만큼 무거워진다」. 몸이 안 변할 뿐
  //    아이가 외워야 할 설정이 있다는 점은 a01 과 같다.
  /(말|비밀|생각|걱정|미안|거짓말)(들)?[이가은는]?.{0,16}(쌓여|쌓이|무거워|커지|넘쳐)/,
  // 🔴 네 번째 얼굴 — **감정어 + 「~때마다」 + 물리 변화**. 앞의 셋은 변화의 *결과*를 열거해서
  //    잡았고, 그래서 새 표현이 나올 때마다 뚫렸다(a15 가방에 돌을 넣는다 · a68 물속으로 한 뼘씩
  //    내려간다 → 셋 다 통과). 열거로는 못 막는다. 이 함정의 골격은 결과가 아니라 **환산**이고,
  //    환산의 표시가 「때마다」다 — 감정 하나 = 변화 하나를 외워야 읽힌다는 뜻이라서.
  //    한 문장 안에 감정어와 「때마다」가 같이 있으면 뺀다. 과하게 걸러도 후보가 248권이라 싸다.
  //    (감정어에 「울음·눈물」을 넣는 이유 = a69「참은 울음이 소금 알갱이가 된다」. 참은 감정을
  //     세는 것이라 몸이 안 변해도 같은 환산이다.)
  /(서운|화[가나]|속상|질투|미움|부끄|외로|슬픔|걱정|미안|샘[이나]|울음|눈물)[\s\S]{0,60}때\s*마다|때마다[\s\S]{0,60}(서운|속상|질투|미움|부끄|외로|울음|눈물)/,
];
const isMetaphor = (s) => METAPHOR.some((re) => re.test(s));

// 🔴 정규식이 못 잡는 것은 사람이 판정해 `_REJECTED.md` 에 적는다. 필터를 네 번 늘렸는데
//    그때마다 새 표현으로 뚫렸다(가방에 돌 → 물속 한 뼘 → 소금 알갱이 → 파도 한 층).
//    같은 병인데 결과가 매번 달라서, 결과를 열거하는 방식으로는 끝나지 않는다.
const REJECTED = new Set(
  (readFileSync(resolve(BOOKS, '_REJECTED.md'), 'utf8').match(/^([a-h]\d+)\s+—/gm) || []).map((s) => s.split(/\s/)[0])
);

const strip = (h) => h.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// ── 목표 권수 ──────────────────────────────────────────────
const plan = readFileSync(PLAN, 'utf8');
const target = {};
for (const [, g, , n] of plan.matchAll(/<tr><td><b>([A-H])\s+([^<]+)<\/b><\/td><td>(\d+)<\/td>/g)) {
  target[g] = Number(n);
}

// 🔴 주인공 동물도 무대와 같은 축이다. 무대만 피하고 동물은 안 봤더니 **새끼 염소가 셋 · 오소리가
//    다섯**이 됐고, 배정 단계에서야 드러났다(그때는 원고가 이미 다 쓰여 못 되돌린다).
//    이 라인은 「주인공은 동물」이 규칙이라 같은 짐승이 몰리면 라이브러리에서 한 시리즈로 보인다.
const ANIMALS =
  '다람쥐 토끼 여우 곰 늑대 사슴 고양이 강아지 개 생쥐 쥐 두더지 오소리 고슴도치 염소 양 소 말 돼지 닭 오리 거위 까치 까마귀 참새 제비 부엉이 올빼미 갈매기 백조 개구리 거북 달팽이 개미 나비 마멋 수달 비버 순록 박쥐 도마뱀 멧돼지 가마우지 도요새 황새 판다 늑대'
    .split(' ');
// 🔴 `includes` 로 세면 안 된다 — 「소」가 **소리·장소**를, 「개」가 **개구리·몇 개**를, 「쥐」가
//    **생쥐·다람쥐**를 센다. 첫 계측에서 소 20 · 쥐 12 · 개 9 가 나왔고 전부 헛것이었다.
//    한글은 띄어쓰기로 낱말이 안 갈리므로 **앞은 한글이 아니고 뒤는 조사**인 자리만 인정한다.
// 🔴 조사만으로도 부족하다 — 「개」 6건 중 셋이 **열 개·네 개·여섯 개**(세는 단위)였고
//    「말」 3건은 전부 **말(speech)** 이었다. 세는 말이 앞에 오면 짐승이 아니다.
const COUNT_BEFORE = /(\d|[한두세네]|다섯|여섯|일곱|여덟|아홉|열|몇)\s*$/;
const animalsIn = (str) =>
  ANIMALS.filter((a) => {
    const re = new RegExp(`(^|[^가-힣])(${a})(들)?[이가은는을를도의와과에게,.\s]`, 'g');
    for (let m; (m = re.exec(str)); ) if (!COUNT_BEFORE.test(str.slice(0, m.index + m[1].length))) return true;
    return false;
  });
// 🔴 「말」은 뺐다 — 이 라인의 요약에서 말(馬)로 쓰인 적이 한 번도 없고 전부 말(speech)이다.
const DROP = new Set(['말']);

// ── 이미 쓴 책 ─────────────────────────────────────────────
const writtenTitles = new Set();
const writtenStages = new Set();
const animalUse = {};
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
  // 주인공 동물은 전용 필드가 없다 — 줄거리 필드 셋에 이름이 나온다
  for (const a of animalsIn([pick('sub'), pick('premise'), pick('resolution')].join(' ')))
    animalUse[a] = (animalUse[a] || 0) + 1;
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
    if (isMetaphor(summary)) continue;
    if (REJECTED.has(g.toLowerCase() + String(no).padStart(2, '0'))) continue;
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
    // ④ 무대·주인공 동물이 겹치지 않는 것 우선 → 무대만이라도 → 없으면 겹쳐도 받는다
    // 🔴 무대는 **부분 일치**로 본다. 완전 일치만 보다가 a42(「영국 해안 등대」)가 a09(「영국 해안
    //    등대 꼭대기 등롱실 한 칸」)를 못 보고 통과했다 — 기획서 무대는 짧고 원고 frontmatter 는
    //    쪽 배치까지 적어 늘어나므로 두 문자열이 같을 일이 애초에 드물다. 둘 다 고슴도치에 등대라
    //    사실상 같은 책이 될 뻔했다.
    const freshStage = (c) => {
      const k = c.stage.split(/[(（]/)[0].trim();
      return ![...takenStages].some((t) => t.includes(k) || k.includes(t));
    };
    // 🔴 3권을 넘긴 동물만 피한다. 곰·토끼는 유럽 그림책의 기본 배역이라 0 으로 막으면 후보가 말라붙는다
    const freshAnimal = (c) => animalsIn(c.title + ' ' + c.summary).every((a) => (animalUse[a] || 0) < 3);
    got =
      inGroup.find((c) => freshStage(c) && freshAnimal(c)) ||
      inGroup.find(freshStage) ||
      inGroup[0];
    if (got) break;
  }
  if (!got) break;

  chosen.push(got);
  pool.splice(pool.indexOf(got), 1);
  counts[got.group] = (counts[got.group] || 0) + 1;
  takenStages.add(got.stage.split(/[(（]/)[0].trim());
  for (const a of animalsIn(got.title + ' ' + got.summary)) animalUse[a] = (animalUse[a] || 0) + 1;
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
