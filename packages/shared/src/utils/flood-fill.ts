/**
 * 색칠공부 — 도안을 "칠할 수 있는 칸"으로 나눈다.
 *
 * 도안은 흰 면 + 검은 선이다. 검은 선을 **벽**으로 보고, 벽에 둘러싸인 흰 덩어리 하나가
 * 아이가 한 번 탭해서 칠하는 **칸**이다.
 *
 * 🔴 칸은 도안을 읽을 때 **한 번만** 나눈다. 탭할 때마다 번지기(flood fill)를 돌리면 백만 픽셀을
 *    매번 훑어야 하고, "다 칠했나"를 알려면 어차피 전체 칸 목록이 필요하다. 라벨을 미리 만들어
 *    두면 탭은 `labels[i] === hit` 인 픽셀을 칠하는 한 번의 훑기로 끝난다.
 */

/** 벽(선) 판정 — 어두우면 벽. 도안은 생성 단계에서 이미 흑백 2치로 굳혀 회색이 없다. */
export function buildWalls(rgba: Uint8ClampedArray, threshold = 128): Uint8Array {
  const n = rgba.length / 4;
  const walls = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    // 투명한 픽셀도 벽으로 친다 — 도안 밖은 칠할 데가 아니다.
    if (rgba[o + 3] < 128 || (rgba[o] + rgba[o + 1] + rgba[o + 2]) / 3 < threshold) walls[i] = 1;
  }
  return walls;
}

export interface Regions {
  /** 픽셀별 칸 번호. 0 = 벽, 1..count = 칸. */
  labels: Int32Array;
  /** 칸 번호 → 픽셀 수. `sizes[0]` 은 벽이라 쓰지 않는다. */
  sizes: number[];
}

/** 벽이 아닌 픽셀을 이어진 덩어리(4방향)로 묶는다. */
export function labelRegions(walls: Uint8Array, w: number, h: number): Regions {
  const labels = new Int32Array(w * h);
  const sizes: number[] = [0];
  const stack: number[] = [];
  let next = 0;

  for (let seed = 0; seed < labels.length; seed++) {
    if (walls[seed] || labels[seed]) continue;
    next++;
    let size = 0;
    labels[seed] = next;
    stack.push(seed);

    while (stack.length > 0) {
      const p = stack.pop() as number;
      size++;
      const x = p % w;
      // 라벨은 **밀어 넣을 때** 찍는다 — 꺼낼 때 찍으면 같은 픽셀이 여러 번 쌓여 칸 크기가 부풀고
      // 큰 도안에서 스택이 터진다.
      if (x > 0 && !walls[p - 1] && !labels[p - 1]) {
        labels[p - 1] = next;
        stack.push(p - 1);
      }
      if (x < w - 1 && !walls[p + 1] && !labels[p + 1]) {
        labels[p + 1] = next;
        stack.push(p + 1);
      }
      if (p >= w && !walls[p - w] && !labels[p - w]) {
        labels[p - w] = next;
        stack.push(p - w);
      }
      if (p + w < labels.length && !walls[p + w] && !labels[p + w]) {
        labels[p + w] = next;
        stack.push(p + w);
      }
    }
    sizes.push(size);
  }

  return { labels, sizes };
}

/**
 * "다 칠했다"고 볼 칸들.
 *
 * 🔴 **모든 칸을 요구하면 영영 못 끝낸다** — 눈동자 하이라이트나 선이 교차하며 생긴 몇 픽셀짜리
 *    틈까지 칸으로 잡히는데, 그건 네 살 손가락으로 짚을 수 없다. 그림에서 눈에 보일 만한 크기만
 *    센다.
 */
export function paintableRegions(
  regions: Regions,
  totalPixels: number,
  minRatio = 0.003,
  exclude?: Set<number>
): number[] {
  const out: number[] = [];
  for (let id = 1; id < regions.sizes.length; id++) {
    if (exclude?.has(id)) continue;
    if (regions.sizes[id] / totalPixels >= minRatio) out.push(id);
  }
  return out;
}

/**
 * 그림 테두리에 닿는 칸 = 도안 **바깥** 여백.
 *
 * 🔴 여백도 칠할 수 있어야 하지만 **다 칠했다의 조건에는 넣지 않는다** — 종이 색칠할 때
 *    아무도 배경까지 칠하라고 하지 않는데, 여기서 요구하면 그림을 다 칠한 아이가 이유를
 *    모른 채 못 끝낸다. 게다가 여백은 늘 가장 큰 칸이라 크기 기준으로는 절대 안 걸러진다.
 */
export function borderRegions(labels: Int32Array, w: number, h: number): Set<number> {
  const out = new Set<number>();
  const add = (i: number) => {
    if (labels[i] > 0) out.add(labels[i]);
  };
  for (let x = 0; x < w; x++) {
    add(x);
    add((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    add(y * w);
    add(y * w + w - 1);
  }
  return out;
}
