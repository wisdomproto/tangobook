import { describe, it, expect } from 'vitest';
import {
  transformCells,
  canPlace,
  isSolved,
  nextHint,
  legalAnchors,
  remainingInventory,
  solve,
  type Cell,
  type Dir,
  type Placement,
} from './puzzle';
import { ROAD_PIECES } from '../data/road-pieces';
import { ROAD_CHALLENGES } from '../data/road-game';

const SET = ROAD_PIECES;
const STEP: Cell[] = SET.step.cells;
/** 다섯 조각을 다 쓰는 문제 — 재고 때문이 아니라 규칙 때문에 막히는지 보려면 이게 필요하다 */
const FULL = ROAD_CHALLENGES.find((c) => Object.keys(c.inventory).length === 5)!;

describe('transformCells', () => {
  it('90도 돌리면 좌표와 포트가 함께 돈다', () => {
    expect(transformCells(STEP, 90, false)).toEqual([
      { x: 1, y: 0, ports: ['N', 'W'] },
      { x: 0, y: 0, ports: ['E', 'S'] },
    ]);
  });

  it('네 번 돌리면 제자리', () => {
    expect(transformCells(STEP, 0, false)).toEqual(
      transformCells(transformCells(transformCells(STEP, 90, false), 90, false), 180, false)
    );
  });

  it('뒤집으면 E/W 만 바뀐다', () => {
    expect(transformCells(STEP, 0, true)).toEqual([
      { x: 0, y: 0, ports: ['E', 'S'] },
      { x: 0, y: 1, ports: ['N', 'W'] },
    ]);
  });
});

describe('길 조각 세트', () => {
  it('1×1 조각은 없다 — 실물에서 아이가 집기 어렵다(기획서 §6)', () => {
    for (const def of Object.values(SET)) expect(def.cells.length).toBeGreaterThanOrEqual(2);
  });

  it('모든 조각은 열린 끝이 정확히 2개다 — solver 가 이 전제 위에 있다', () => {
    const d: Record<Dir, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
    for (const def of Object.values(SET)) {
      const inside = new Set(def.cells.map((c) => `${c.x},${c.y}`));
      const open = def.cells.flatMap((c) =>
        c.ports.filter((p) => !inside.has(`${c.x + d[p][0]},${c.y + d[p][1]}`))
      );
      expect({ id: def.id, open: open.length }).toEqual({ id: def.id, open: 2 });
    }
  });

  it('모퉁이 길에는 길이 없는 칸이 있다 — 자리만 차지한다', () => {
    expect(SET.corner.cells.filter((c) => c.ports.length === 0)).toHaveLength(1);
  });

  it('되돌아 길은 두 끝이 같은 쪽을 본다', () => {
    expect(SET.uturn.cells.flatMap((c) => c.ports).filter((p) => p === 'E')).toHaveLength(2);
  });
});

describe('배치 규칙', () => {
  it('보드 밖으로 나가면 못 놓는다', () => {
    // 곧은 길은 가로 2칸 — 맨 오른쪽 열에 놓으면 한 칸이 판 밖이다
    expect(canPlace(FULL, SET, [], { defId: 'straight', x: 3, y: 0, rot: 0, flip: false })).toBe(
      false
    );
  });

  it('나무 위에는 못 놓는다', () => {
    const tree = FULL.blocked[0];
    // 어느 조각이든 첫 칸이 나무 자리에 오면 막힌다
    for (const defId of Object.keys(FULL.inventory)) {
      expect(canPlace(FULL, SET, [], { defId, x: tree.x, y: tree.y, rot: 0, flip: false })).toBe(
        false
      );
    }
  });

  it('이미 놓인 조각과 겹치면 못 놓는다', () => {
    const [sol] = solve(FULL, SET, [], 1);
    expect(canPlace(FULL, SET, [sol[0]], sol[0])).toBe(false);
  });

  it('놓을 수 있는 자리는 전부 규칙을 지킨다', () => {
    const anchors = legalAnchors(FULL, SET, [], 'straight', 0, false);
    expect(anchors.length).toBeGreaterThan(0);
    expect(
      anchors.every((a) =>
        canPlace(FULL, SET, [], { defId: 'straight', ...a, rot: 0, flip: false })
      )
    ).toBe(true);
  });
});

describe('유한 재고 (기획서 §21)', () => {
  it('놓으면 줄고 빼면 돌아온다', () => {
    const [sol] = solve(FULL, SET, [], 1);
    const first = sol[0];
    expect(remainingInventory(FULL, [])[first.defId]).toBe(1);
    expect(remainingInventory(FULL, [first])[first.defId]).toBe(0);
    expect(remainingInventory(FULL, [])[first.defId]).toBe(1);
  });

  it('재고가 바닥나면 더 못 놓는다 — 무한 팔레트가 아니다', () => {
    const [sol] = solve(FULL, SET, [], 1);
    const first = sol[0];
    // 같은 종류를 하나 더 놓으려 하면 자리와 무관하게 막힌다
    const anywhere = legalAnchors(FULL, SET, [], first.defId, 0, false)[0];
    expect(
      canPlace(FULL, SET, [first], { defId: first.defId, ...anywhere, rot: 0, flip: false })
    ).toBe(false);
  });
});

describe('문제 — 전부 유일해인가 (기획서 §13 · §22.6)', () => {
  it.each(ROAD_CHALLENGES.map((c) => [c.id, c] as const))(
    '%s — 해가 정확히 하나이고, 그 해가 판정을 통과한다',
    (_id, ch) => {
      const sols = solve(ch, SET, [], 3);
      expect(sols).toHaveLength(1);
      expect(isSolved(ch, SET, sols[0])).toBe(true);
      // 재고를 남김없이 쓴다 — 문제가 주는 조각이 곧 답에 드는 조각이다
      const need = Object.values(ch.inventory).reduce((a, b) => a + b, 0);
      expect(sols[0]).toHaveLength(need);
    }
  );

  it.each(ROAD_CHALLENGES.map((c) => [c.id, c] as const))('%s — 빈 판은 안 풀린다', (_id, ch) => {
    expect(isSolved(ch, SET, [])).toBe(false);
  });

  it('한 조각만 빠져도 안 풀린다', () => {
    for (const ch of ROAD_CHALLENGES) {
      const [sol] = solve(ch, SET, [], 1);
      expect(isSolved(ch, SET, sol.slice(0, -1))).toBe(false);
    }
  });

  it('뒤집기를 허용하면 유일해가 깨지는 문제가 있다 — 그래서 세트가 allowFlip:false 다', () => {
    const loosened = ROAD_CHALLENGES.map((c) => ({ ...c, allowFlip: true }));
    const extra = loosened.filter((c) => solve(c, SET, [], 3).length > 1);
    expect(extra.length).toBeGreaterThan(0);
  });
});

describe('힌트 — 저장된 정답이 아니라 지금 판에서 계산한다 (기획서 §12)', () => {
  it('힌트만 따라가면 모든 문제가 풀린다', () => {
    for (const ch of ROAD_CHALLENGES) {
      const placed: Placement[] = [];
      for (let i = 0; i < 8; i++) {
        const h = nextHint(ch, SET, placed);
        if (!h) break;
        expect(canPlace(ch, SET, placed, h)).toBe(true);
        placed.push(h);
      }
      expect({ id: ch.id, solved: isSolved(ch, SET, placed) }).toEqual({ id: ch.id, solved: true });
    }
  });

  it('엉뚱한 자리에 다 써 버리면 힌트가 없다 — 빼야 한다는 뜻이다', () => {
    const ch = ROAD_CHALLENGES.find((c) => Object.keys(c.inventory).length === 1)!;
    const defId = Object.keys(ch.inventory)[0];
    const [sol] = solve(ch, SET, [], 1);
    // 정답이 아닌 자리를 하나 골라 하나뿐인 조각을 거기에 쓴다
    const wrong = legalAnchors(ch, SET, [], defId, sol[0].rot, false).find(
      (a) => a.x !== sol[0].x || a.y !== sol[0].y
    )!;
    const dead: Placement[] = [{ defId, ...wrong, rot: sol[0].rot, flip: false }];
    expect(solve(ch, SET, dead, 1)).toHaveLength(0);
    expect(nextHint(ch, SET, dead)).toBeNull();
  });
});
