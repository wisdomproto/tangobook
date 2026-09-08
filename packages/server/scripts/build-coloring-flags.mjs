#!/usr/bin/env node
/**
 * 잰 값(`check-coloring-sheets.mjs` · `check-coloring-colors.mjs`)을 **두 곳이 읽을 딱지**로 굽는다.
 *
 * - `client/public/coloring-plan-flags.json` — 작업판이 왼쪽 목록·줄에 표시할 것
 * - `server/scripts/_data/coloring-skip.json` — 게임 목록에서 뺄 것(칠할 칸이 없는 도안)
 *
 * 🔴 **기준은 여기 한 곳에만 적는다.** 작업판·게임·검사기가 각자 숫자를 들고 있으면
 *    한 곳만 고쳤을 때 같은 도안을 두고 서로 다른 말을 한다.
 *
 * 사용: node packages/server/scripts/build-coloring-flags.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..', '..');
const MEASURED = path.join(ROOT, 'coloring-check.json');
const COLORS = path.join(ROOT, 'coloring-colors.json');
const FLAGS = path.join(__dirname, '..', '..', 'client', 'public', 'coloring-plan-flags.json');
const SKIP = path.join(__dirname, '_data', 'coloring-skip.json');

/**
 * 무엇을 흠으로 볼지. 순서가 곧 심각도다 — 앞의 것이 그 도안의 대표 흠이 된다.
 *
 * `bad` 는 다시 뽑아야 하는 것, `warn` 은 칠할 수는 있는데 규칙에서 벗어난 것이다.
 * 🔴 정사각이 아닌 것·칸이 2~3개인 것은 **흠이 아니다** — 눈으로 확인했다. 플레이어가 도안
 *    원본 크기로 칸을 나눠서 안 늘어나고, 나뭇잎·접시는 칸이 정말 두세 개다.
 */
const RULES = [
  /**
   * 🔴 **칸이 하나인 것과 칠할 게 없는 것은 다르다.** 눈으로 스물두 장을 보고 고쳤다 —
   *    하트·별·숟가락·뼈는 닫힌 덩어리 하나라 **한 번 탭하면 칠해진다**(게임은 멀쩡히 돈다).
   *    진짜 못 칠하는 건 선이 테두리로 열려 안팎이 이어진 것뿐이고, 그건 남는 칸이 티끌이다
   *    (물개 「귀」 0.5% · 「강」 0개 · 거미 「그물」 2%).
   *
   * 🔴 「가장 큰 칸이 5% 미만」만으로는 안 된다 — 칸이 스무 개인 빽빽한 그림도 걸려 314장이
   *    잡혔다. **칸 수까지 봐야** 「그릴 게 없다」와 「잘게 나뉘었다」가 갈린다. 칸이 셋이면
   *    작아도 탭할 게 셋이다(「하늘」 = 해·구름·달).
   */
  { id: 'empty', level: 'bad', why: '칠할 칸이 없다 — 선이 테두리로 열렸다 · 게임에서 뺐다',
    hit: (m) => m.regions === 0 || (m.regions <= 2 && m.biggest < 0.05) },
  { id: 'onetap', level: 'warn', why: '칸이 하나뿐 — 한 번 탭하면 끝난다',
    hit: (m) => m.regions === 1 && !(m.biggest < 0.05) },
  { id: 'notlineart', level: 'bad', why: '도안이 아니다 — 색·회색이 남았다',
    hit: (m) => m.sat > 0.005 || m.mid > 0.05 },
  { id: 'blackfill', level: 'bad', why: '검게 칠한 면이 있다 — 검정은 벽이라 못 칠한다',
    hit: (m) => m.blob > 0.12 },
  { id: 'halfregion', level: 'warn', why: '한 칸이 그림의 절반 이상 — 팔·다리가 몸에 열려 있다',
    hit: (m) => m.biggest > 0.45 },
  { id: 'thin', level: 'warn', why: '못 짚을 만큼 가는 칸이 3개 이상',
    hit: (m) => m.thin >= 3 },
  { id: 'busy', level: 'warn', why: '칸이 25개 넘는다 — 네 살이 못 끝낸다',
    hit: (m) => m.regions >= 25 },
  /**
   * 🔴 이건 **그림의 흠이 아니라 짝이 안 맞는 것**이라 따로 센다. 도안이 원본과 다른 것을
   *    그렸거나(라푼젤 원본은 금발 땋은 머리인데 도안은 공주 얼굴 전체) 크기가 너무 달라
   *    칸 색이 배경에서 읽힌다. 다시 그린다고 반드시 낫지 않으니 위 흠들과 섞지 않는다.
   */
  { id: 'washed', level: 'color', why: '원본에서 색을 못 읽는다 — 칸 절반 이상이 배경색',
    hit: (m) => (m.bgRatio ?? 0) >= 0.5 },
];

const measured = JSON.parse(fs.readFileSync(MEASURED, 'utf8'));
const washed = fs.existsSync(COLORS)
  ? new Map(JSON.parse(fs.readFileSync(COLORS, 'utf8')).filter((x) => !x.error).map((x) => [x.key, x.bgRatio]))
  : new Map();
if (!washed.size) console.warn('⚠️ coloring-colors.json 이 없다 — 색 흠은 안 붙는다.');

const flags = {};
const skip = {};
for (const m of measured) {
  if (m.error) {
    flags[m.key] = { level: 'bad', why: '내려받기 실패: ' + m.error, word: m.word };
    skip[m.key] = '내려받기 실패';
    continue;
  }
  const hits = RULES.filter((r) => r.hit({ ...m, bgRatio: washed.get(m.key) }));
  if (!hits.length) continue;
  const level = hits.some((r) => r.level === 'bad')
    ? 'bad'
    : hits.some((r) => r.level === 'warn')
      ? 'warn'
      : 'color';
  flags[m.key] = {
    level,
    why: hits.map((r) => r.why).join(' · '),
    word: m.word,
  };
  if (hits.some((r) => r.id === 'empty'))
    skip[m.key] = `칠할 칸이 없다 (칸 ${m.regions}개 · 가장 큰 칸 ${(m.biggest * 100).toFixed(0)}%) — ${m.word}`;
}

fs.writeFileSync(FLAGS, JSON.stringify(flags));
fs.writeFileSync(SKIP, JSON.stringify(skip, null, 1));
const by = {};
for (const k of Object.keys(flags)) by[flags[k].level] = (by[flags[k].level] ?? 0) + 1;
console.log(
  `흠 ${Object.keys(flags).length}장 (다시 뽑을 것 ${by.bad ?? 0} · 살펴볼 것 ${by.warn ?? 0} · 색이 안 맞는 것 ${by.color ?? 0}) → ${FLAGS}`
);
console.log(`게임에서 뺄 것 ${Object.keys(skip).length}장 → ${SKIP}`);
for (const r of RULES) {
  const n = measured.filter((m) => !m.error && r.hit({ ...m, bgRatio: washed.get(m.key) })).length;
  console.log(`  ${r.id.padEnd(11)} ${String(n).padStart(4)}장  ${r.why}`);
}
