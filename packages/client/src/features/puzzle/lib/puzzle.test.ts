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
  type Placement,
} from './puzzle';
import { CHALLENGES, CONNECT_PIECES } from '../data/connect-game';

const SET = CONNECT_PIECES;
const STEP2: Cell[] = SET.step2.cells;

describe('transformCells', () => {
  it('90도 돌리면 좌표와 포트가 함께 돈다', () => {
    expect(transformCells(STEP2, 90, false)).toEqual([
      { x: 1, y: 0, ports: ['N', 'W'] },
      { x: 0, y: 0, ports: ['E', 'S'] },
    ]);
  });

  it('네 번 돌리면 제자리', () => {
    expect(transformCells(STEP2, 0, false)).toEqual(
      transformCells(transformCells(transformCells(STEP2, 90, false), 90, false), 180, false)
    );
  });

  it('뒤집으면 E/W 만 바뀐다', () => {
    expect(transformCells(STEP2, 0, true)).toEqual([
      { x: 0, y: 0, ports: ['E', 'S'] },
      { x: 0, y: 1, ports: ['N', 'W'] },
    ]);
  });
});

describe('고정 세트', () => {
  it('1×1 조각은 없다 — 실물에서 아이가 집기 어렵다(기획서 §6)', () => {
    for (const def of Object.values(SET)) expect(def.cells.length).toBeGreaterThanOrEqual(2);
  });

  it('모든 조각은 열린 끝이 정확히 2개다 — solver 가 이 전제 위에 있다', () => {
    for (const def of Object.values(SET)) {
      const inside = new Set(def.cells.map((c) => `${c.x},${c.y}`));
      const d: Record<string, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
      const open = def.cells.flatMap((c) =>
        c.ports.filter((p) => !inside.has(`${c.x + d[p][0]},${c.y + d[p][1]}`))
      );
      expect({ id: def.id, open: open.length }).toEqual({ id: def.id, open: 2 });
    }
  });
});

describe('배치 규칙', () => {
  const ch = CHALLENGES[0];

  it('보드 밖으로 나가면 못 놓는다', () => {
    expect(canPlace(ch, SET, [], { defId: 'straight3', x: 3, y: 0, rot: 0, flip: false })).toBe(
      false
    );
  });

  it('장애물(늑대) 위에는 못 놓는다', () => {
    expect(canPlace(ch, SET, [], { defId: 'straight3', x: 1, y: 2, rot: 0, flip: false })).toBe(
      false
    );
  });

  it('이미 놓인 조각과 겹치면 못 놓는다', () => {
    const placed: Placement[] = [{ defId: 'elbow3', x: 1, y: 1, rot: 0, flip: false }];
    expect(canPlace(ch, SET, placed, { defId: 'step2', x: 1, y: 1, rot: 0, flip: false })).toBe(
      false
    );
  });

  it('놓을 수 있는 자리를 전부 찾아 준다', () => {
    const anchors = legalAnchors(ch, SET, [], 'step2', 0, false);
    expect(anchors).toContainEqual({ x: 3, y: 1 });
    expect(
      anchors.every((a) => canPlace(ch, SET, [], { defId: 'step2', ...a, rot: 0, flip: false }))
    ).toBe(true);
  });
});

describe('유한 재고 (기획서 §21)', () => {
  const ch = CHALLENGES[1]; // bend2 × 2

  it('놓으면 줄고 빼면 돌아온다', () => {
    expect(remainingInventory(ch, []).bend2).toBe(2);
    const one: Placement[] = [{ defId: 'bend2', x: 1, y: 1, rot: 0, flip: false }];
    expect(remainingInventory(ch, one).bend2).toBe(1);
    expect(remainingInventory(ch, []).bend2).toBe(2);
  });

  it('재고가 바닥나면 더 못 놓는다 — 무한 팔레트가 아니다', () => {
    const two: Placement[] = [
      { defId: 'bend2', x: 1, y: 1, rot: 0, flip: false },
      { defId: 'bend2', x: 2, y: 2, rot: 270, flip: true },
    ];
    expect(remainingInventory(ch, two).bend2).toBe(0);
    expect(canPlace(ch, SET, two, { defId: 'bend2', x: 0, y: 4, rot: 0, flip: false })).toBe(false);
    // 재고가 남은 다른 조각은 여전히 놓인다
    expect(canPlace(ch, SET, two, { defId: 'straight2', x: 3, y: 3, rot: 0, flip: false })).toBe(
      true
    );
  });
});

describe('solver — 문제가 실제로 풀리는가 (기획서 §13 · §22.6)', () => {
  it.each(CHALLENGES.map((c) => [c.id, c] as const))(
    '%s — 주어진 재고 안에서 해가 있고, 그 해가 판정을 통과한다',
    (_id, ch) => {
      const sols = solve(ch, SET, [], 10);
      expect(sols.length).toBeGreaterThan(0);
      for (const s of sols) expect(isSolved(ch, SET, s)).toBe(true);
      // 해가 지나치게 많으면 퍼즐이 아니다(§22.6 Branching Quality)
      expect(sols.length).toBeLessThanOrEqual(6);
    }
  );

  it.each(CHALLENGES.map((c) => [c.id, c] as const))('%s — 빈 판은 안 풀린다', (_id, ch) => {
    expect(isSolved(ch, SET, [])).toBe(false);
  });

  it('한 조각만 빠져도 안 풀린다', () => {
    const ch = CHALLENGES[0];
    const [sol] = solve(ch, SET, [], 1);
    expect(isSolved(ch, SET, sol.slice(0, -1))).toBe(false);
  });
});

describe('힌트 — 저장된 정답이 아니라 지금 판에서 계산한다 (기획서 §12)', () => {
  const ch = CHALLENGES[0];

  it('빈 판에서는 첫 조각을 알려 준다', () => {
    const h = nextHint(ch, SET, []);
    expect(h).not.toBeNull();
    expect(canPlace(ch, SET, [], h!)).toBe(true);
  });

  it('힌트만 따라가면 끝까지 풀린다', () => {
    const placed: Placement[] = [];
    for (let i = 0; i < 6; i++) {
      const h = nextHint(ch, SET, placed);
      if (!h) break;
      placed.push(h);
    }
    expect(isSolved(ch, SET, placed)).toBe(true);
  });

  it('길을 막아 놓으면 힌트가 없다 — 빼야 한다는 뜻이다', () => {
    // 시작 칸 바로 오른쪽을 엉뚱한 방향 조각으로 막는다
    const blockIt: Placement[] = [{ defId: 'straight3', x: 1, y: 0, rot: 90, flip: false }];
    const dead = [...blockIt, { defId: 'elbow3', x: 1, y: 1, rot: 90, flip: false } as Placement];
    if (solve(ch, SET, dead, 1).length === 0) expect(nextHint(ch, SET, dead)).toBeNull();
  });
});
