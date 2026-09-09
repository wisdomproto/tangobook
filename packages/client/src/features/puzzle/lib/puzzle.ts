/**
 * CONNECT 엔진 — 좌표·변환·재고·판정·탐색.
 *
 * 기획서 v1.2 §21 의 데이터 모델을 따른다:
 *   PUZZLE = Board + **Piece Inventory** + Initial State + Allowed Actions + Constraints + Goal
 *
 * 🔴 조각은 무한 팔레트가 아니다. 게임은 **고정 세트**(PieceDef, 카트리지)를 갖고,
 *    문제는 그중 **몇 개씩 쓸 수 있는지**(inventory)를 정한다. 놓으면 줄고 빼면 돌아온다.
 * 🔴 정답을 데이터로 들고 있지 않는다. `solve()` 가 지금 판 위 상태에서 남은 해를 찾고,
 *    힌트도 유일해 검사도 거기서 나온다(§12 context-aware hint · §13 solver).
 * 🔴 이 파일은 화면도 이미지도 모른다 — 디지털(터치)과 실물(카메라)이 같은 판정기를 쓴다.
 */

export type Dir = 'N' | 'E' | 'S' | 'W';
export type Rot = 0 | 90 | 180 | 270;

const DELTA: Record<Dir, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const OPPOSITE: Record<Dir, Dir> = { N: 'S', S: 'N', E: 'W', W: 'E' };
const CW: Record<Dir, Dir> = { N: 'E', E: 'S', S: 'W', W: 'N' };
const MIRROR_X: Record<Dir, Dir> = { N: 'N', S: 'S', E: 'W', W: 'E' };
const ROTS: Rot[] = [0, 90, 180, 270];

/** 조각 한 칸 — 그 칸에서 파이프가 열린 방향들 */
export interface Cell {
  x: number;
  y: number;
  ports: Dir[];
}

/** 게임의 고정 세트에 든 조각 한 종류 (실물 블록 한 모양) */
export interface PieceDef {
  id: string;
  nameKo: string;
  cells: Cell[];
  color: string;
}

/** 판 위에 놓인 한 개 — 어느 종류를, 어디에, 어떤 방향으로 */
export interface Placement {
  defId: string;
  x: number;
  y: number;
  rot: Rot;
  flip: boolean;
}

/**
 * 그림 잘라 쓰기 — [x, y, w, h] 를 원본의 0~1 비율로.
 *
 * 🔴 캐릭터 그림은 **캐릭터 시트**다(정면·측면·표정이 한 장에). 통째로 넣으면 가운데가
 *    잘려 얼굴 반쪽만 나온다. 쓸 포즈 하나를 지정한다.
 */
export type Crop = [number, number, number, number];

export interface Art {
  label: string;
  emoji?: string;
  imageUrl?: string;
  crop?: Crop;
  /** 낱말 음원 — 맞히면 들려준다 */
  ttsUrl?: string;
}

export interface Terminal extends Art {
  x: number;
  y: number;
  /**
   * 이 칸에서 길이 드나드는 방향. 없으면 **어느 쪽이든** 된다.
   *
   * 🔴 실물에서 할머니 집은 **문이 난 쪽**으로만 길이 들어오지만, 빨간모자는 그냥 서 있는
   *    말이라 어느 방향에서 길이 닿아도 된다. 목적지만 방향이 있다.
   */
  port?: Dir;
}

export interface BlockedCell extends Art {
  x: number;
  y: number;
}

/** 문제 하나 (§22.3 Challenge) */
export interface Challenge {
  id: string;
  title: string;
  prompt: string;
  width: number;
  height: number;
  start: Terminal;
  goal: Terminal;
  blocked: BlockedCell[];
  /** defId → 이 문제에서 쓸 수 있는 개수 */
  inventory: Record<string, number>;
  /**
   * 조각을 뒤집을 수 있는가. 기본 true.
   *
   * 🔴 한 면에만 길이 인쇄된 실물 타일은 못 뒤집는다. 뒤집기를 허용하면 같은 문제의 해가
   *    늘어나 「유일해」가 깨진다.
   */
  allowFlip?: boolean;
  book: { id: string; title: string; coverUrl?: string };
}

export const key = (x: number, y: number) => `${x},${y}`;

export const ALL_DIRS: Dir[] = ['N', 'E', 'S', 'W'];

/** 터미널이 열어 두는 방향들 — port 가 없으면 사방 */
export const terminalPorts = (t: Terminal): Dir[] => (t.port ? [t.port] : ALL_DIRS);

const flipsFor = (ch: Challenge): boolean[] => (ch.allowFlip === false ? [false] : [false, true]);

// ─── 기하 ───

/** flip(좌우) → rot(시계) → 좌상단 정규화 */
export function transformCells(cells: Cell[], rot: Rot, flip: boolean): Cell[] {
  let out = cells.map((c) => ({ ...c, ports: [...c.ports] }));
  if (flip) {
    out = out.map((c) => ({ x: -c.x, y: c.y, ports: c.ports.map((d) => MIRROR_X[d]) }));
  }
  for (let i = 0; i < rot / 90; i++) {
    out = out.map((c) => ({ x: -c.y, y: c.x, ports: c.ports.map((d) => CW[d]) }));
  }
  const minX = Math.min(...out.map((c) => c.x));
  const minY = Math.min(...out.map((c) => c.y));
  return out.map((c) => ({ x: c.x - minX, y: c.y - minY, ports: c.ports }));
}

export function placedCells(def: PieceDef, p: Placement): Cell[] {
  return transformCells(def.cells, p.rot, p.flip).map((c) => ({
    x: c.x + p.x,
    y: c.y + p.y,
    ports: c.ports,
  }));
}

export type PieceSet = Record<string, PieceDef>;

// ─── 재고 (§21) ───

/** 지금 남은 재고 — 초기 inventory 에서 판 위에 놓인 것을 뺀 값 */
export function remainingInventory(ch: Challenge, placed: Placement[]): Record<string, number> {
  const out = { ...ch.inventory };
  for (const p of placed) out[p.defId] = (out[p.defId] ?? 0) - 1;
  return out;
}

// ─── 배치 규칙 ───

function occupiedKeys(ch: Challenge, set: PieceSet, placed: Placement[], ignore?: number) {
  const taken = new Set<string>();
  for (const b of ch.blocked) taken.add(key(b.x, b.y));
  taken.add(key(ch.start.x, ch.start.y));
  taken.add(key(ch.goal.x, ch.goal.y));
  placed.forEach((p, i) => {
    if (i === ignore) return;
    for (const c of placedCells(set[p.defId], p)) taken.add(key(c.x, c.y));
  });
  return taken;
}

/** 보드 안 · 장애물/터미널 위 아님 · 겹치지 않음 · **재고가 남아 있음** */
export function canPlace(
  ch: Challenge,
  set: PieceSet,
  placed: Placement[],
  next: Placement,
  ignore?: number
): boolean {
  const left = remainingInventory(
    ch,
    ignore === undefined ? placed : placed.filter((_, i) => i !== ignore)
  );
  if ((left[next.defId] ?? 0) <= 0) return false;
  const taken = occupiedKeys(ch, set, placed, ignore);
  return placedCells(set[next.defId], next).every(
    (c) => c.x >= 0 && c.y >= 0 && c.x < ch.width && c.y < ch.height && !taken.has(key(c.x, c.y))
  );
}

/** 이 방향으로 이 조각을 놓을 수 있는 좌상단 좌표 전부 */
export function legalAnchors(
  ch: Challenge,
  set: PieceSet,
  placed: Placement[],
  defId: string,
  rot: Rot,
  flip: boolean,
  ignore?: number
): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < ch.height; y++) {
    for (let x = 0; x < ch.width; x++) {
      if (canPlace(ch, set, placed, { defId, x, y, rot, flip }, ignore)) out.push({ x, y });
    }
  }
  return out;
}

// ─── 판정 ───

/** 칸 → 그 칸에서 열린 방향들 (조각 + 터미널) */
export function portMap(ch: Challenge, set: PieceSet, placed: Placement[]): Map<string, Dir[]> {
  const map = new Map<string, Dir[]>();
  map.set(key(ch.start.x, ch.start.y), terminalPorts(ch.start));
  map.set(key(ch.goal.x, ch.goal.y), terminalPorts(ch.goal));
  for (const p of placed) {
    for (const c of placedCells(set[p.defId], p)) map.set(key(c.x, c.y), c.ports);
  }
  return map;
}

/**
 * 길이 이어졌는가 — 시작 칸에서 목적지 칸까지 포트가 맞물려 도달하면 성공.
 *
 * 열린 끝(open end)은 허용한다(§11 — 게임별 constraint). 아이가 곁길을 만들어도
 * 목적지에 닿기만 하면 통과다. 「완벽하게 정리된 배치」를 요구하면 5세엔 너무 이르다.
 */
export function isSolved(ch: Challenge, set: PieceSet, placed: Placement[]): boolean {
  const ports = portMap(ch, set, placed);
  const goalKey = key(ch.goal.x, ch.goal.y);
  const seen = new Set<string>([key(ch.start.x, ch.start.y)]);
  const queue = [{ x: ch.start.x, y: ch.start.y }];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const d of ports.get(key(cur.x, cur.y)) ?? []) {
      const [dx, dy] = DELTA[d];
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const nk = key(nx, ny);
      if (seen.has(nk)) continue;
      const nPorts = ports.get(nk);
      if (!nPorts || !nPorts.includes(OPPOSITE[d])) continue;
      if (nk === goalKey) return true;
      seen.add(nk);
      queue.push({ x: nx, y: ny });
    }
  }
  return false;
}

// ─── Solver (§13 · §22.5) ───

/**
 * 조각 안을 지나가 본다 — 들어온 칸/방향에서 시작해 반대편 열린 끝을 찾는다.
 *
 * 세트의 조각은 전부 열린 끝이 정확히 2개인 「길 한 도막」이라, 들어가면 나오는 곳이 하나다.
 */
function traverse(
  cells: Cell[],
  entry: { x: number; y: number },
  entryPort: Dir
): { x: number; y: number; dir: Dir } | null {
  const byKey = new Map(cells.map((c) => [key(c.x, c.y), c]));
  let cur = byKey.get(key(entry.x, entry.y));
  let came: Dir = entryPort;
  for (let guard = 0; guard < cells.length + 1; guard++) {
    if (!cur) return null;
    const next = cur.ports.filter((d) => d !== came);
    if (next.length !== 1) return null; // 갈림길 있는 조각은 이 solver 밖이다
    const d = next[0];
    const [dx, dy] = DELTA[d];
    const nb = byKey.get(key(cur.x + dx, cur.y + dy));
    if (!nb || !nb.ports.includes(OPPOSITE[d])) {
      return { x: cur.x, y: cur.y, dir: d }; // 조각 밖으로 나가는 끝
    }
    cur = nb;
    came = OPPOSITE[d];
  }
  return null;
}

/** 판 위 모습 — 어느 칸이 어떤 포트로 차 있는지. 같은 그림이면 같은 답이다. */
export function boardSignature(ch: Challenge, set: PieceSet, placed: Placement[]): string {
  return placed
    .flatMap((p) => placedCells(set[p.defId], p))
    .map((c) => `${c.x},${c.y}:${[...c.ports].sort().join('')}`)
    .sort()
    .join('|');
}

/**
 * 지금 판 위 상태에서 **끝까지 갈 수 있는 배치**를 찾는다.
 *
 * 시작 칸에서 길을 한 도막씩 늘려 가며, 이미 놓인 조각은 그대로 통과하고
 * 빈 칸은 남은 재고에서 꺼내 놓아 본다. 반환값은 `placed` 를 포함한 완성 배치 목록.
 * `limit` 로 몇 개까지 찾을지 정한다(유일해 검사는 2개만 찾아 보면 된다).
 */
export function solve(
  ch: Challenge,
  set: PieceSet,
  placed: Placement[] = [],
  limit = 1
): Placement[][] {
  const results: Placement[][] = [];
  const seenBoards = new Set<string>();
  const defIds = Object.keys(ch.inventory);

  const step = (x: number, y: number, dir: Dir, cur: Placement[]) => {
    if (results.length >= limit) return;
    const [dx, dy] = DELTA[dir];
    const nx = x + dx;
    const ny = y + dy;
    if (nx === ch.goal.x && ny === ch.goal.y) {
      if (!terminalPorts(ch.goal).includes(OPPOSITE[dir])) return;
      // 🔴 해는 **판 위 모습**으로 센다. 조각에 따라 r0 와 r180 이 같은 그림이라,
      //    (rot, flip) 조합으로 세면 같은 답이 4배, 8배로 부풀어 「유일해」가 뜻을 잃는다.
      const sig = boardSignature(ch, set, cur);
      if (seenBoards.has(sig)) return;
      seenBoards.add(sig);
      results.push([...cur]);
      return;
    }
    if (nx < 0 || ny < 0 || nx >= ch.width || ny >= ch.height) return;
    if (ch.blocked.some((b) => b.x === nx && b.y === ny)) return;
    if (nx === ch.start.x && ny === ch.start.y) return;

    // 이미 놓인 조각이 그 칸에 있으면 그대로 통과한다
    const hit = cur.find((p) => placedCells(set[p.defId], p).some((c) => c.x === nx && c.y === ny));
    if (hit) {
      const cells = placedCells(set[hit.defId], hit);
      const entryCell = cells.find((c) => c.x === nx && c.y === ny)!;
      if (!entryCell.ports.includes(OPPOSITE[dir])) return;
      const exit = traverse(cells, { x: nx, y: ny }, OPPOSITE[dir]);
      if (exit) step(exit.x, exit.y, exit.dir, cur);
      return;
    }

    const left = remainingInventory(ch, cur);
    for (const defId of defIds) {
      if ((left[defId] ?? 0) <= 0) continue;
      for (const rot of ROTS) {
        for (const flip of flipsFor(ch)) {
          const shape = transformCells(set[defId].cells, rot, flip);
          for (const anchorCell of shape) {
            // 이 칸이 (nx,ny) 에 오도록 놓았을 때
            if (!anchorCell.ports.includes(OPPOSITE[dir])) continue;
            const cand: Placement = {
              defId,
              x: nx - anchorCell.x,
              y: ny - anchorCell.y,
              rot,
              flip,
            };
            if (!canPlace(ch, set, cur, cand)) continue;
            const cells = placedCells(set[defId], cand);
            const exit = traverse(cells, { x: nx, y: ny }, OPPOSITE[dir]);
            if (!exit) continue;
            cur.push(cand);
            step(exit.x, exit.y, exit.dir, cur);
            cur.pop();
            if (results.length >= limit) return;
          }
        }
      }
    }
  };

  for (const d of terminalPorts(ch.start)) step(ch.start.x, ch.start.y, d, [...placed]);
  return results;
}

const samePlacement = (a: Placement, b: Placement) =>
  a.defId === b.defId && a.x === b.x && a.y === b.y && a.rot === b.rot && a.flip === b.flip;

/**
 * 힌트 — 지금 판을 그대로 두고 끝까지 가는 해를 찾아, 아직 안 놓인 첫 조각을 알려 준다.
 * 해가 없으면 null (놓인 조각 중 하나를 빼야 한다는 뜻이다).
 */
export function nextHint(ch: Challenge, set: PieceSet, placed: Placement[]): Placement | null {
  const [first] = solve(ch, set, placed, 1);
  if (!first) return null;
  return first.find((s) => !placed.some((p) => samePlacement(p, s))) ?? null;
}
