/**
 * 4×4 길 잇기 문제 생성기 — 기획서 §13 · §22.5.
 *
 *   npx tsx scripts/generate-road-challenges.mts > src/features/puzzle/data/road-challenges.ts
 *
 * 배치를 무작위로 뽑아 solver 로 풀어 보고, **유일해인 것만** 남긴다. 조각 수로 난이도를
 * 나눠 고르게 담는다. 🔴 문제를 손으로 짜지 않는 이유 = 손으로 짠 것은 유일해인지 알 수 없고,
 * 알 수 없는 문제는 힌트도 채점도 못 믿는다.
 */
import { solve, type Challenge, type Dir, type Placement } from '../src/features/puzzle/lib/puzzle';
import { ROAD_PIECES } from '../src/features/puzzle/data/road-pieces';

const SIZE = 4;
const DIRS: Dir[] = ['N', 'E', 'S', 'W'];
const ALL = Object.keys(ROAD_PIECES);

/** 재현 가능한 난수 — 돌릴 때마다 다른 문제가 나오면 검증이 안 된다 */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const cells = Array.from({ length: SIZE * SIZE }, (_, i) => ({ x: i % SIZE, y: Math.floor(i / SIZE) }));

function base(
  start: { x: number; y: number },
  goal: { x: number; y: number },
  door: Dir,
  trees: Array<{ x: number; y: number }>,
  inventory: Record<string, number>
): Challenge {
  return {
    id: 'tmp',
    title: '',
    prompt: '',
    width: SIZE,
    height: SIZE,
    allowFlip: false,
    start: { ...start, label: '빨간모자' },
    goal: { ...goal, port: door, label: '할머니 집' },
    blocked: trees.map((t) => ({ ...t, label: '나무' })),
    inventory,
    book: { id: '', title: '' },
  };
}

const used = (sol: Placement[]) =>
  sol.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.defId]: (acc[p.defId] ?? 0) + 1 }), {});

const rand = rng(20260909);
const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];

type Found = { ch: Challenge; sol: Placement[]; pieces: number };
const byPieces = new Map<number, Found[]>();

for (let attempt = 0; attempt < 250000; attempt++) {
  const start = pick(cells);
  // 🔴 출발과 도착이 붙어 있으면 「길을 낸다」가 아니라 「빈틈을 메운다」가 된다.
  //    두 칸 이상 떨어뜨려야 아이 눈에 여정으로 보인다.
  const goal = pick(cells.filter((c) => Math.abs(c.x - start.x) + Math.abs(c.y - start.y) >= 2));
  const door = pick(DIRS);
  const treeCount = 1 + Math.floor(rand() * 3);
  const free = cells.filter(
    (c) => (c.x !== start.x || c.y !== start.y) && (c.x !== goal.x || c.y !== goal.y)
  );
  const trees: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < treeCount; i++) {
    const t = pick(free.filter((c) => !trees.some((p) => p.x === c.x && p.y === c.y)));
    if (t) trees.push(t);
  }

  // 세트 전부를 쥐여 준 상태에서 먼저 풀어 본다
  const full = Object.fromEntries(ALL.map((id) => [id, 1]));
  const [sol] = solve(base(start, goal, door, trees, full), ROAD_PIECES, [], 1);
  if (!sol || sol.length === 0) continue;

  // 실제로 쓴 조각만 재고로 주고(실물의 「꽃 표시」와 같다) 그때 해가 하나뿐인지 본다
  const inv = used(sol);
  const ch = base(start, goal, door, trees, inv);
  const sols = solve(ch, ROAD_PIECES, [], 2);
  if (sols.length !== 1) continue;

  const n = sol.length;
  const bucket = byPieces.get(n) ?? [];
  // 시작·도착이 겹치는 문제는 한 번만 — 비슷한 문제가 몰리면 지루하다
  if (bucket.some((f) => f.ch.start.x === start.x && f.ch.start.y === start.y && f.ch.goal.x === goal.x && f.ch.goal.y === goal.y))
    continue;
  bucket.push({ ch, sol, pieces: n });
  byPieces.set(n, bucket);
}

// 원본 부클릿과 같은 48문제 — 조각 수로 난이도가 갈린다
const wanted: Array<[number, number]> = [
  [1, 12],
  [2, 12],
  [3, 12],
  [4, 8],
  [5, 4],
];
const chosen: Found[] = [];
for (const [pieces, count] of wanted) {
  const bucket = byPieces.get(pieces) ?? [];
  chosen.push(...bucket.slice(0, count));
  console.error(`조각 ${pieces}개: 후보 ${bucket.length}개 → ${Math.min(count, bucket.length)}개 채택`);
}

const LEVEL = (n: number) => (n === 1 ? '첫걸음' : n === 2 ? '쉬움' : n === 3 ? '보통' : '어려움');
const fmt = (o: unknown) => JSON.stringify(o);

const body = chosen
  .map((f, i) => {
    const c = f.ch;
    return `  {
    id: 'road-${String(i + 1).padStart(2, '0')}',
    level: '${LEVEL(f.pieces)}',
    width: 4,
    height: 4,
    allowFlip: false,
    start: { x: ${c.start.x}, y: ${c.start.y} },
    goal: { x: ${c.goal.x}, y: ${c.goal.y}, port: '${c.goal.port}' },
    trees: ${fmt(c.blocked.map((b) => ({ x: b.x, y: b.y })))},
    inventory: ${fmt(c.inventory)},
  },`;
  })
  .join('\n');

console.log(`// 생성물 — scripts/generate-road-challenges.mts 가 만든다. 손으로 고치지 말 것.
// 전부 solver 로 **유일해**를 확인했다(같은 재고 안에서 답이 하나뿐).
export const ROAD_CHALLENGE_DATA = [
${body}
] as const;`);
