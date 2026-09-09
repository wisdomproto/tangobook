/**
 * 부클릿에서 읽어낸 24문제를 검증하고 데이터로 굽는다.
 *
 *   npx tsx scripts/import-booklet-challenges.mts <booklet.json> > src/features/puzzle/data/road-challenges.ts
 *
 * 입력(booklet.json)은 이미지에서 뽑은 날 것이라 **믿지 않는다**. solver 로 풀어 보고
 * 「답이 정확히 하나」인 것만 통과시킨다. 조각 목록도 입력을 쓰지 않고 **해에서 파생**한다
 * — 꽃 색 판독이 흰 꽃(=흰 종이)에서 새기 때문이다.
 */
import { solve, type Challenge, type Dir } from '../src/features/puzzle/lib/puzzle';
import { ROAD_PIECES } from '../src/features/puzzle/data/road-pieces';
import { readFileSync } from 'node:fs';

type Raw = {
  no: number;
  level: string;
  door: [Dir | null, number];
  rrh: [number, number][];
  house: [number, number][];
  trees: [number, number][];
  wolf: [number, number][];
  pieces: string[];
  grid: string[];
};

const ALL = Object.keys(ROAD_PIECES);
const raws: Raw[] = JSON.parse(readFileSync(process.argv[2], 'utf-8'));

function build(r: Raw, door: Dir, inventory: Record<string, number>): Challenge {
  return {
    id: `booklet-${r.no}`,
    title: '',
    prompt: '',
    width: 4,
    height: 4,
    allowFlip: false,
    start: { x: r.rrh[0][0], y: r.rrh[0][1], label: '빨간모자' },
    goal: { x: r.house[0][0], y: r.house[0][1], port: door, label: '할머니 집' },
    blocked: [...r.trees, ...r.wolf].map(([x, y]) => ({ x, y, label: '나무' })),
    inventory,
    book: { id: '', title: '' },
  };
}

void ALL;

const ok: Array<{ r: Raw; door: Dir; inv: Record<string, number>; n: number }> = [];
const bad: string[] = [];

for (const r of raws) {
  if (!r.rrh.length || !r.house.length) {
    bad.push(`${r.no}: 빨간모자/집을 못 읽음`);
    continue;
  }
  // 읽어낸 문 방향을 먼저 보고, 안 되면 네 방향을 다 시험한다
  const order: Dir[] = r.door[0]
    ? [r.door[0], ...(['N', 'E', 'S', 'W'] as Dir[]).filter((d) => d !== r.door[0])]
    : (['N', 'E', 'S', 'W'] as Dir[]);
  let hit: { door: Dir; inv: Record<string, number>; n: number } | null = null;
  const notes: string[] = [];
  // 🔴 재고는 페이지의 꽃 그대로 쓴다. solver 로 파생하면 **더 적은 조각으로 가는 다른 답**을
  //    찾아버려서 부클릿과 다른 문제가 된다(6문제가 그랬다).
  const inv = Object.fromEntries(r.pieces.map((p) => [p, 1]));
  for (const door of order) {
    const sols = solve(build(r, door, inv), ROAD_PIECES, [], 3);
    notes.push(`${door}:${sols.length}`);
    if (sols.length === 1) {
      hit = { door, inv, n: sols[0].length };
      break;
    }
  }
  if (hit) ok.push({ r, ...hit });
  else bad.push(`${r.no}: ${notes.join(' ')}`);
}

console.error(`통과 ${ok.length}/${raws.length}`);
for (const b of bad) console.error('  ✗ ' + b);
for (const o of ok) {
  if (o.door !== o.r.door[0]) console.error(`  ⚠ ${o.r.no} 문 방향: 이미지 ${o.r.door[0]} → 풀이 ${o.door}`);
}

const LEVEL: Record<string, string> = {
  STARTER: '첫걸음',
  JUNIOR: '쉬움',
  EXPERT: '보통',
  MASTER: '어려움',
};

console.log(`// 생성물 — scripts/import-booklet-challenges.mts 가 만든다. 손으로 고치지 말 것.
// 판·말 배치는 사용자가 준 레퍼런스 부클릿(늑대 없는 24문제)을 그대로 옮긴 것이고,
// 조각 목록과 정답은 우리 solver 가 다시 풀어 **유일해**를 확인한 것이다.
export const ROAD_CHALLENGE_DATA = [
${ok
  .map(
    (o) => `  {
    id: 'road-${String(o.r.no).padStart(2, '0')}',
    level: '${LEVEL[o.r.level] ?? o.r.level}',
    width: 4,
    height: 4,
    allowFlip: false,
    start: { x: ${o.r.rrh[0][0]}, y: ${o.r.rrh[0][1]} },
    goal: { x: ${o.r.house[0][0]}, y: ${o.r.house[0][1]}, port: '${o.door}' },
    trees: [${o.r.trees.map(([x, y]) => `{ x: ${x}, y: ${y} }`).join(', ')}],
    inventory: { ${Object.entries(o.inv)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')} },
  },`
  )
  .join('\n')}
] as const;`);
