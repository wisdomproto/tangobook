/**
 * 탱고 보드 블록 — `public/tango-board.html` 프로토타입에서 옮겨 온 실물 치수.
 *
 * 🔴 **조각은 16개뿐이다**(자음 13 + 모음 3). 나머지 글자는 만들어 쓴다 —
 *    돌려서(ㄱ↻ㄴ, ㅏ↻ㅗ↻ㅓ↻ㅜ, ㅣ↻ㅡ), 붙여서(ㄱㄱ=ㄲ, ㅏㅣ=ㅐ, ㅗㅏ=ㅘ).
 *    앱의 옛 한글 블록은 글자마다 타일이 하나씩(40개)이라 「ㄲ 타일 찾기」였는데,
 *    이쪽은 **한글이 어떻게 만들어지는가**를 손으로 가르친다.
 *
 * 좌표는 칸 단위이고 획의 **중심선**이다. 그리기는 이 선을 둥근 획으로 그린다.
 */

export type Path = [number, number][];
export type Circle = [number, number, number]; // cx, cy, r
export type Shape = { w: number; h: number; paths: Path[]; circles: Circle[] };

export interface BlockDef extends Shape {
  base: string;
  kind: 'cho' | 'jung';
  /** 회전각(도) → 그 각도에서 읽히는 글자. 키가 곧 허용 회전이다. */
  rots: Record<number, string>;
  rotKeys: number[];
}

const shifted = (paths: Path[], dx: number): Path[] =>
  paths.concat(paths.map((p) => p.map(([x, y]) => [x + dx, y] as [number, number])));

const P_G: Path[] = [
  [
    [0.5, 0.5],
    [2.5, 0.5],
    [2.5, 2.5],
  ],
];
const P_D: Path[] = [
  [
    [2.5, 0.5],
    [0.5, 0.5],
    [0.5, 2.5],
    [2.5, 2.5],
  ],
];
const P_B: Path[] = [
  [
    [0.5, 0.5],
    [0.5, 2.5],
    [2.5, 2.5],
    [2.5, 0.5],
  ],
  [
    [0.5, 1.6],
    [2.5, 1.6],
  ],
];
const P_S: Path[] = [
  [
    [0.5, 2.5],
    [1.5, 0.5],
    [2.5, 2.5],
  ],
];
const P_J: Path[] = [
  [
    [0.5, 0.5],
    [2.5, 0.5],
  ],
  [
    [0.5, 2.5],
    [1.5, 1.0],
    [2.5, 2.5],
  ],
];

function S(
  base: string,
  kind: 'cho' | 'jung',
  w: number,
  h: number,
  paths: Path[] | null,
  circles: Circle[] | null,
  rots: Record<number, string>
): BlockDef {
  return {
    base,
    kind,
    w,
    h,
    paths: paths ?? [],
    circles: circles ?? [],
    rots,
    rotKeys: Object.keys(rots)
      .map(Number)
      .sort((a, z) => a - z),
  };
}

export const BLOCKS: BlockDef[] = [
  S('ㄱ', 'cho', 3, 3, P_G, null, { 0: 'ㄱ', 180: 'ㄴ' }),
  S('ㄷ', 'cho', 3, 3, P_D, null, { 0: 'ㄷ' }),
  S(
    'ㄹ',
    'cho',
    3,
    3,
    [
      [
        [0.5, 0.5],
        [2.5, 0.5],
        [2.5, 1.5],
        [0.5, 1.5],
        [0.5, 2.5],
        [2.5, 2.5],
      ],
    ],
    null,
    { 0: 'ㄹ' }
  ),
  S(
    'ㅁ',
    'cho',
    3,
    3,
    [
      [
        [0.5, 0.5],
        [2.5, 0.5],
        [2.5, 2.5],
        [0.5, 2.5],
        [0.5, 0.5],
      ],
    ],
    null,
    { 0: 'ㅁ' }
  ),
  S('ㅂ', 'cho', 3, 3, P_B, null, { 0: 'ㅂ' }),
  S('ㅅ', 'cho', 3, 3, P_S, null, { 0: 'ㅅ' }),
  S('ㅇ', 'cho', 3, 3, null, [[1.5, 1.5, 1.0]], { 0: 'ㅇ' }),
  S('ㅈ', 'cho', 3, 3, P_J, null, { 0: 'ㅈ' }),
  S(
    'ㅊ',
    'cho',
    3,
    3,
    [
      [
        [1.5, 0.5],
        [1.5, 0.62],
      ],
      [
        [0.5, 1.15],
        [2.5, 1.15],
      ],
      [
        [0.5, 2.5],
        [1.5, 1.5],
        [2.5, 2.5],
      ],
    ],
    null,
    { 0: 'ㅊ' }
  ),
  S(
    'ㅋ',
    'cho',
    3,
    3,
    [
      [
        [0.5, 0.5],
        [2.5, 0.5],
        [2.5, 2.5],
      ],
      [
        [0.5, 1.5],
        [2.5, 1.5],
      ],
    ],
    null,
    { 0: 'ㅋ' }
  ),
  S(
    'ㅌ',
    'cho',
    3,
    3,
    [
      [
        [2.5, 0.5],
        [0.5, 0.5],
        [0.5, 2.5],
        [2.5, 2.5],
      ],
      [
        [0.5, 1.5],
        [2.5, 1.5],
      ],
    ],
    null,
    { 0: 'ㅌ' }
  ),
  S(
    'ㅍ',
    'cho',
    3,
    3,
    [
      [
        [0.5, 0.5],
        [2.5, 0.5],
      ],
      [
        [0.5, 2.5],
        [2.5, 2.5],
      ],
      [
        [1.1, 0.5],
        [1.1, 2.5],
      ],
      [
        [1.9, 0.5],
        [1.9, 2.5],
      ],
    ],
    null,
    { 0: 'ㅍ' }
  ),
  S(
    'ㅎ',
    'cho',
    3,
    3,
    [
      [
        [1.5, 0.5],
        [1.5, 0.62],
      ],
      [
        [0.5, 1.15],
        [2.5, 1.15],
      ],
    ],
    [[1.5, 2.15, 0.35]],
    { 0: 'ㅎ' }
  ),
  // 쌍자음 블록은 **트레이에 없다** — 같은 자음 둘을 나란히 놓아 만든다. 인식용으로만 둔다.
  S('ㄲ', 'cho', 6, 3, shifted(P_G, 3), null, { 0: 'ㄲ' }),
  S('ㄸ', 'cho', 6, 3, shifted(P_D, 3), null, { 0: 'ㄸ' }),
  S('ㅃ', 'cho', 6, 3, shifted(P_B, 3), null, { 0: 'ㅃ' }),
  S('ㅆ', 'cho', 6, 3, shifted(P_S, 3), null, { 0: 'ㅆ' }),
  S('ㅉ', 'cho', 6, 3, shifted(P_J, 3), null, { 0: 'ㅉ' }),
  // 모음 — 세로바가 오른쪽, 짧은 획이 왼쪽. 돌리면 ㅗ / ㅏ / ㅜ.
  S(
    'ㅓ',
    'jung',
    2,
    5,
    [
      [
        [1.5, 0.5],
        [1.5, 4.5],
      ],
      [
        [0.5, 2.5],
        [1.5, 2.5],
      ],
    ],
    null,
    { 0: 'ㅓ', 90: 'ㅗ', 180: 'ㅏ', 270: 'ㅜ' }
  ),
  S(
    'ㅕ',
    'jung',
    2,
    5,
    [
      [
        [1.5, 0.5],
        [1.5, 4.5],
      ],
      [
        [0.5, 1.7],
        [1.5, 1.7],
      ],
      [
        [0.5, 3.3],
        [1.5, 3.3],
      ],
    ],
    null,
    { 0: 'ㅕ', 90: 'ㅛ', 180: 'ㅑ', 270: 'ㅠ' }
  ),
  S(
    'ㅣ',
    'jung',
    1,
    5,
    [
      [
        [0.5, 0.5],
        [0.5, 4.5],
      ],
    ],
    null,
    { 0: 'ㅣ', 90: 'ㅡ' }
  ),
];

/** 트레이에 실제로 내주는 조각 — 자음 13(쌍자음 제외) + 모음 3(ㅏ ㅑ ㅣ). */
const DOUBLE_BASES = new Set(['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ']);

export function blockIndexOf(base: string): number {
  return BLOCKS.findIndex((b) => b.base === base);
}

export const TRAY_CHO: { id: number; rotDeg: number }[] = BLOCKS.map((b, id) => ({ b, id }))
  .filter(({ b }) => b.kind === 'cho' && !DOUBLE_BASES.has(b.base))
  .map(({ b, id }) => ({ id, rotDeg: b.rotKeys[0] }));

/** ㅏ=ㅓ블록 180° · ㅑ=ㅕ블록 180° · ㅣ=ㅣ블록 0°. 탭 회전으로 ㅗㅜㅓㅡ 가 나온다. */
export const TRAY_JUNG: { id: number; rotDeg: number }[] = [
  ['ㅓ', 180],
  ['ㅕ', 180],
  ['ㅣ', 0],
].map(([base, rotDeg]) => ({ id: blockIndexOf(base as string), rotDeg: rotDeg as number }));

/** 시계 90° × k 회전. (x,y) → (H−y, x) 이고 폭·높이가 뒤바뀐다. */
export function rotShape(sh: Shape, k: number): Shape {
  let { w, h } = sh;
  let paths = sh.paths;
  let circles = sh.circles;
  for (let i = 0; i < (k & 3); i++) {
    const H = h;
    paths = paths.map((p) => p.map(([x, y]) => [H - y, x] as [number, number]));
    circles = circles.map(([cx, cy, r]) => [H - cy, cx, r] as Circle);
    [w, h] = [h, w];
  }
  return { w, h, paths, circles };
}

export function shapeAt(id: number, rotDeg: number): Shape {
  return rotShape(BLOCKS[id], rotDeg / 90);
}

/** 그 회전에서 읽히는 글자. */
export function charAt(id: number, rotDeg: number): string {
  return BLOCKS[id].rots[rotDeg];
}

/** 다음 회전 각도 — 트레이·판 위 블록을 탭하면 이 순서로 돈다. */
export function nextRot(id: number, rotDeg: number): number {
  const keys = BLOCKS[id].rotKeys;
  return keys[(keys.indexOf(rotDeg) + 1) % keys.length];
}

/**
 * 획이 지나가는 칸들 — 판 위 자리 차지(겹침 방지) 판정에 쓴다.
 * 획을 0.15칸 간격으로 찍어 어느 칸을 지나는지 모은다.
 */
export function rasterize(sh: Shape): [number, number][] {
  const set = new Set<string>();
  const put = (x: number, y: number) => {
    const c = Math.floor(x);
    const r = Math.floor(y);
    if (r >= 0 && r < sh.h && c >= 0 && c < sh.w) set.add(`${r},${c}`);
  };
  for (const p of sh.paths) {
    for (let i = 0; i + 1 < p.length; i++) {
      const [ax, ay] = p[i];
      const [bx, by] = p[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.15));
      for (let t = 0; t <= n; t++) put(ax + ((bx - ax) * t) / n, ay + ((by - ay) * t) / n);
    }
  }
  for (const [cx, cy, r] of sh.circles) {
    for (let t = 0; t < 200; t++) {
      const th = (t / 200) * Math.PI * 2;
      put(cx + Math.cos(th) * r, cy + Math.sin(th) * r);
    }
  }
  return [...set]
    .map((k) => k.split(',').map(Number) as [number, number])
    .sort((a, z) => a[0] - z[0] || a[1] - z[1]);
}
