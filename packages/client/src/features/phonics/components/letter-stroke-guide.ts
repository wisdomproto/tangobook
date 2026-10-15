import jamoTemplates from './korean-stroke-templates.json';
import { DOUBLE_STOREY_G, ENGLISH_STROKES } from './english-stroke-templates';
import {
  getVowelGuideStrokes,
  guidePoints,
  isIntroVowel,
  type StrokePoint,
  type VowelGuideStroke,
} from './vowel-stroke-guide';

type Rect = { left: number; top: number; right: number; bottom: number };
type Mask = Pick<ImageData, 'data' | 'width' | 'height'>;
interface Component extends Rect {
  pixels: number[];
}
function traceComponents(
  mask: Mask,
  region: Rect = { left: 0, top: 0, right: mask.width, bottom: mask.height }
): Component[] {
  const seen = new Uint8Array(mask.width * mask.height),
    result: Component[] = [];
  const left = Math.max(0, Math.ceil(region.left)),
    right = Math.min(mask.width, Math.floor(region.right));
  const top = Math.max(0, Math.ceil(region.top)),
    bottom = Math.min(mask.height, Math.floor(region.bottom));
  for (let y = top; y < bottom; y++)
    for (let x = left; x < right; x++) {
      const p = y * mask.width + x;
      if (seen[p] || mask.data[p * 4 + 3] < 128) continue;
      seen[p] = 1;
      const queue = [p];
      let l = x,
        r = x,
        t = y,
        b = y;
      for (let k = 0; k < queue.length; k++) {
        const at = queue[k],
          px = at % mask.width,
          py = Math.floor(at / mask.width);
        l = Math.min(l, px);
        r = Math.max(r, px);
        t = Math.min(t, py);
        b = Math.max(b, py);
        for (const [nx, ny] of [
          [px - 1, py],
          [px + 1, py],
          [px, py - 1],
          [px, py + 1],
        ]) {
          if (nx < left || nx >= right || ny < top || ny >= bottom) continue;
          const next = ny * mask.width + nx;
          if (!seen[next] && mask.data[next * 4 + 3] >= 128) {
            seen[next] = 1;
            queue.push(next);
          }
        }
      }
      if (queue.length > 4)
        result.push({ left: l, top: t, right: r + 1, bottom: b + 1, pixels: queue });
    }
  return result;
}
export function getMaskComponents(mask: Mask): Rect[] {
  return traceComponents(mask).map(({ pixels: _pixels, ...box }) => box);
}
interface Ink extends Mask {
  distance: Float32Array;
}
const templates = jamoTemplates as Record<string, Array<{ type: string; points: StrokePoint[] }>>;
const fittedCache = new Map<string, VowelGuideStroke[]>();
const compoundVowels: Record<string, [string, string]> = {
  ㅘ: ['ㅗ', 'ㅏ'],
  ㅙ: ['ㅗ', 'ㅐ'],
  ㅚ: ['ㅗ', 'ㅣ'],
  ㅝ: ['ㅜ', 'ㅓ'],
  ㅞ: ['ㅜ', 'ㅔ'],
  ㅟ: ['ㅜ', 'ㅣ'],
  ㅢ: ['ㅡ', 'ㅣ'],
};
export function isGuidedLetter(letter: string): boolean {
  return /^[A-Za-zㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㄲㄸㅃㅆㅉㅏ-ㅣ]$/.test(letter);
}

/** Sample absolute M/L/Q/C paths without DOM measurement or an animation engine. */
export function sampleFormationPath(path: string): StrokePoint[] {
  const tokens = path.match(/[MLQC]|-?\d+(?:\.\d+)?/g) ?? [];
  const result: StrokePoint[] = [];
  let cursor: StrokePoint = { x: 0, y: 0 };
  let index = 0;
  const point = () => ({ x: Number(tokens[index++]) / 100, y: Number(tokens[index++]) / 100 });
  while (index < tokens.length) {
    const command = tokens[index++];
    if (command === 'M') {
      cursor = point();
      result.push(cursor);
      continue;
    }
    const from = cursor;
    const a = point(),
      b = command === 'Q' || command === 'C' ? point() : a;
    const end = command === 'C' ? point() : b;
    const steps = command === 'L' ? 24 : 48;
    for (let step = 1; step <= steps; step++) {
      const t = step / steps,
        u = 1 - t;
      cursor =
        command === 'L'
          ? { x: from.x * u + a.x * t, y: from.y * u + a.y * t }
          : command === 'Q'
            ? {
                x: u * u * from.x + 2 * u * t * a.x + t * t * b.x,
                y: u * u * from.y + 2 * u * t * a.y + t * t * b.y,
              }
            : {
                x:
                  u * u * u * from.x +
                  3 * u * u * t * a.x +
                  3 * u * t * t * b.x +
                  t * t * t * end.x,
                y:
                  u * u * u * from.y +
                  3 * u * u * t * a.y +
                  3 * u * t * t * b.y +
                  t * t * t * end.y,
              };
      result.push(cursor);
    }
  }
  return result;
}

function jamoPaths(letter: string): StrokePoint[][] {
  return (templates[letter] ?? []).map(({ type, points }) => {
    if (type !== 'loop') {
      const out: StrokePoint[] = [points[0]];
      for (let i = 1; i < points.length; i++) {
        for (let s = 1; s <= 24; s++) {
          const t = s / 24,
            a = points[i - 1],
            b = points[i];
          out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        }
      }
      return out;
    }
    // Cardinal points describe a circle/oval, not a diamond.
    const xs = points.map((p) => p.x),
      ys = points.map((p) => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2,
      cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const rx = (Math.max(...xs) - Math.min(...xs)) / 2,
      ry = (Math.max(...ys) - Math.min(...ys)) / 2;
    return Array.from({ length: 97 }, (_, i) => {
      const angle = -Math.PI / 2 - (i / 96) * 2 * Math.PI;
      return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
    });
  });
}

function analyse(mask: Mask): Ink {
  const { data, width, height } = mask;
  const distance = new Float32Array(width * height);
  for (let p = 0; p < distance.length; p++) distance[p] = data[p * 4 + 3] >= 128 ? 10000 : 0;
  // Chamfer distance to the glyph edge: attract a formation path towards the
  // ink's centre, not the edge/white counter. Computed once per paper, not per frame.
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (!distance[p]) continue;
      distance[p] = Math.min(
        distance[p],
        x ? distance[p - 1] + 1 : 1,
        y ? distance[p - width] + 1 : 1,
        x && y ? distance[p - width - 1] + 1.414 : 1,
        x + 1 < width && y ? distance[p - width + 1] + 1.414 : 1
      );
    }
  for (let y = height - 1; y >= 0; y--)
    for (let x = width - 1; x >= 0; x--) {
      const p = y * width + x;
      if (!distance[p]) continue;
      distance[p] = Math.min(
        distance[p],
        x + 1 < width ? distance[p + 1] + 1 : 1,
        y + 1 < height ? distance[p + width] + 1 : 1,
        x + 1 < width && y + 1 < height ? distance[p + width + 1] + 1.414 : 1,
        x && y + 1 < height ? distance[p + width - 1] + 1.414 : 1
      );
    }
  // Native ImageData exposes these through prototype getters; object spread
  // silently drops them even though plain-object test fixtures keep them.
  return { data, width, height, distance };
}

function inkBounds(ink: Ink, region: Rect): Rect | null {
  let left = region.right,
    right = region.left,
    top = region.bottom,
    bottom = region.top;
  for (
    let y = Math.max(0, Math.floor(region.top));
    y < Math.min(ink.height, Math.ceil(region.bottom));
    y++
  ) {
    for (
      let x = Math.max(0, Math.floor(region.left));
      x < Math.min(ink.width, Math.ceil(region.right));
      x++
    ) {
      if (!ink.distance[y * ink.width + x]) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return left <= right && top <= bottom
    ? { left, top, right: right + 1, bottom: bottom + 1 }
    : null;
}

function split(ink: Ink, box: Rect, axis: 'x' | 'y', ratio: number): [Rect, Rect] {
  const start = axis === 'x' ? box.left : box.top,
    end = axis === 'x' ? box.right : box.bottom;
  const target = start + (end - start) * ratio;
  let boundary = target,
    best = Infinity;
  for (
    let coordinate = Math.ceil(start + (end - start) * 0.2);
    coordinate < end - (end - start) * 0.2;
    coordinate++
  ) {
    let count = 0;
    const acrossStart = axis === 'x' ? box.top : box.left,
      acrossEnd = axis === 'x' ? box.bottom : box.right;
    for (let across = Math.ceil(acrossStart); across < acrossEnd; across++) {
      const x = axis === 'x' ? coordinate : across,
        y = axis === 'x' ? across : coordinate;
      if (ink.distance[y * ink.width + x]) count++;
    }
    const score = count * 4 + Math.abs(coordinate - target);
    if (score < best) {
      best = score;
      boundary = coordinate;
    }
  }
  return axis === 'x'
    ? [
        { ...box, right: boundary },
        { ...box, left: boundary },
      ]
    : [
        { ...box, bottom: boundary },
        { ...box, top: boundary },
      ];
}

function counterCount(ink: Ink, box: Rect): number {
  const seen = new Uint8Array(ink.width * ink.height);
  let counters = 0;
  for (let y = box.top; y < box.bottom; y++)
    for (let x = box.left; x < box.right; x++) {
      const start = y * ink.width + x;
      if (seen[start] || ink.distance[start]) continue;
      let boundary = false,
        size = 0;
      const queue = [start];
      seen[start] = 1;
      for (let q = 0; q < queue.length; q++) {
        const p = queue[q],
          px = p % ink.width,
          py = Math.floor(p / ink.width);
        size++;
        if (px === box.left || px === box.right - 1 || py === box.top || py === box.bottom - 1)
          boundary = true;
        for (const [nx, ny] of [
          [px - 1, py],
          [px + 1, py],
          [px, py - 1],
          [px, py + 1],
        ]) {
          if (nx < box.left || nx >= box.right || ny < box.top || ny >= box.bottom) continue;
          const next = ny * ink.width + nx;
          if (!seen[next] && !ink.distance[next]) {
            seen[next] = 1;
            queue.push(next);
          }
        }
      }
      if (!boundary && size > 10) counters++;
    }
  return counters;
}

/** Independent pixel projection can bounce between neighbouring ink pixels.
 * Remove only tiny return loops; real letter bowls have much longer arcs. */
export function trimProjectionLoops(source: StrokePoint[]): StrokePoint[] {
  if (source.length < 3) return source;
  const points: StrokePoint[] = [];
  for (const point of source) {
    let travelled = 0;
    let match = -1;
    for (let i = points.length - 1; i >= 0; i--) {
      if (i < points.length - 1)
        travelled += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
      if (travelled > 32) break;
      if (Math.hypot(point.x - points[i].x, point.y - points[i].y) < 1.5) match = i;
    }
    if (match >= 0) points.length = match + 1;
    const last = points[points.length - 1];
    if (!last || last.x !== point.x || last.y !== point.y) points.push(point);
  }
  return points.length > 1 ? points : [source[0], source[source.length - 1]];
}

function fit(
  ink: Ink,
  letter: string,
  region: Rect,
  suppliedPaths?: StrokePoint[][]
): VowelGuideStroke[] {
  const box = inkBounds(ink, region);
  if (!box) return [];
  const paths =
    suppliedPaths ??
    (ENGLISH_STROKES[letter]
      ? (letter === 'g' && counterCount(ink, box) > 1
          ? DOUBLE_STOREY_G
          : ENGLISH_STROKES[letter]
        ).map(sampleFormationPath)
      : jamoPaths(letter));
  const flat = paths.flat();
  if (!flat.length) return [];
  const minX = Math.min(...flat.map((p) => p.x)),
    maxX = Math.max(...flat.map((p) => p.x));
  const minY = Math.min(...flat.map((p) => p.y)),
    maxY = Math.max(...flat.map((p) => p.y));
  let thickness = 0;
  for (let y = box.top; y < box.bottom; y++)
    for (let x = box.left; x < box.right; x++)
      thickness = Math.max(thickness, ink.distance[y * ink.width + x]);
  const inset = Math.max(1, thickness * 0.75);
  const radius = Math.max(
    5,
    Math.ceil(Math.max(box.right - box.left, box.bottom - box.top) * 0.16)
  );
  const project = (
    point: StrokePoint,
    locked?: { axis: 'x' | 'y'; value: number }
  ): StrokePoint => {
    const tx =
      minX === maxX
        ? (box.left + box.right) / 2
        : box.left +
          inset +
          ((point.x - minX) / (maxX - minX)) * Math.max(1, box.right - box.left - 2 * inset);
    const ty =
      minY === maxY
        ? (box.top + box.bottom) / 2
        : box.top +
          inset +
          ((point.y - minY) / (maxY - minY)) * Math.max(1, box.bottom - box.top - 2 * inset);
    let best = -Infinity,
      closest = { x: tx, y: ty };
    for (
      let y = Math.max(box.top, Math.round(ty) - radius);
      y < Math.min(box.bottom, Math.round(ty) + radius + 1);
      y += 2
    ) {
      for (
        let x = Math.max(box.left, Math.round(tx) - radius);
        x < Math.min(box.right, Math.round(tx) + radius + 1);
        x += 2
      ) {
        const d = ink.distance[y * ink.width + x];
        if (!d) continue;
        if (locked && Math.abs((locked.axis === 'x' ? x : y) - locked.value) > 3) continue;
        const score = d * 1.5 - Math.hypot(x - tx, y - ty);
        if (score > best) {
          best = score;
          closest = { x, y };
        }
      }
    }
    return closest;
  };
  return paths.map((path) => {
    const horizontal = path.every((p) => Math.abs(p.y - path[0].y) < 0.001);
    const vertical = path.every((p) => Math.abs(p.x - path[0].x) < 0.001);
    const mid = project(path[Math.floor(path.length / 2)]);
    const locked = horizontal
      ? { axis: 'y' as const, value: mid.y }
      : vertical
        ? { axis: 'x' as const, value: mid.x }
        : undefined;
    const projected = path.map((point) => project(point, locked));
    const points = /^[A-Za-z]$/.test(letter) ? trimProjectionLoops(projected) : projected;
    // A printed i/j dot can project every sample to the same centre pixel.
    // Keep a tiny visible stroke there (and let the pencil tap it).
    if (points.every((point) => Math.hypot(point.x - points[0].x, point.y - points[0].y) < 0.5)) {
      points[points.length - 1] = { x: points[0].x, y: points[0].y + 1 };
    }
    return { from: points[0], to: points[points.length - 1], points };
  });
}

const pairedJamo: Record<string, [string, string]> = {
  ㄲ: ['ㄱ', 'ㄱ'],
  ㄸ: ['ㄷ', 'ㄷ'],
  ㅃ: ['ㅂ', 'ㅂ'],
  ㅆ: ['ㅅ', 'ㅅ'],
  ㅉ: ['ㅈ', 'ㅈ'],
  ㅐ: ['ㅏ', 'ㅣ'],
  ㅒ: ['ㅑ', 'ㅣ'],
  ㅔ: ['ㅓ', 'ㅣ'],
  ㅖ: ['ㅕ', 'ㅣ'],
};
const componentCount = (letter: string): number =>
  letter === 'ㅎ' || letter === 'ㅔ' || letter === 'ㅖ'
    ? 2
    : pairedJamo[letter] && !['ㅆ', 'ㅉ', 'ㅐ', 'ㅒ'].includes(letter)
      ? componentCount(pairedJamo[letter][0]) + componentCount(pairedJamo[letter][1])
      : 1;
const byX = (a: Rect, b: Rect) => a.left + a.right - (b.left + b.right);
const byY = (a: Rect, b: Rect) => a.top + a.bottom - (b.top + b.bottom);
const translate = (strokes: VowelGuideStroke[], dx: number, dy: number) =>
  strokes.map((stroke) => {
    const points = guidePoints(stroke).map((p) => ({ x: p.x + dx, y: p.y + dy }));
    return { from: points[0], to: points[points.length - 1], points };
  });

function cropGroup(ink: Ink, components: Component[]): { ink: Ink; x: number; y: number } | null {
  if (!components.length) return null;
  const left = Math.min(...components.map((c) => c.left)),
    right = Math.max(...components.map((c) => c.right));
  const top = Math.min(...components.map((c) => c.top)),
    bottom = Math.max(...components.map((c) => c.bottom));
  const width = right - left,
    height = bottom - top,
    data = new Uint8ClampedArray(width * height * 4);
  for (const component of components)
    for (const p of component.pixels) {
      const x = (p % ink.width) - left,
        y = Math.floor(p / ink.width) - top,
        offset = (y * width + x) * 4;
      data.set(ink.data.subarray(p * 4, p * 4 + 4), offset);
    }
  return { ink: analyse({ data, width, height }), x: left, y: top };
}

function groupJamo(ink: Ink, letter: string, components: Component[]): VowelGuideStroke[] {
  const crop = cropGroup(ink, components);
  return crop
    ? translate(
        renderJamo(crop.ink, letter, {
          left: 0,
          top: 0,
          right: crop.ink.width,
          bottom: crop.ink.height,
        }),
        crop.x,
        crop.y
      )
    : [];
}

function renderJamo(ink: Ink, letter: string, region: Rect): VowelGuideStroke[] {
  if (isIntroVowel(letter)) {
    const crop = cropGroup(ink, traceComponents(ink, region));
    return crop ? translate(getVowelGuideStrokes(letter, crop.ink), crop.x, crop.y) : [];
  }
  const pair = compoundVowels[letter] ?? pairedJamo[letter];
  const components = traceComponents(ink, region);
  if (pair && components.length > 1) {
    const sorted = components.sort(byX),
      rightCount = componentCount(pair[1]);
    if (sorted.length > rightCount) {
      return [
        ...groupJamo(ink, pair[0], sorted.slice(0, -rightCount)),
        ...groupJamo(ink, pair[1], sorted.slice(-rightCount)),
      ];
    }
  }
  if (pair) {
    const box = inkBounds(ink, region);
    if (!box) return [];
    const [left, right] = split(ink, box, 'x', /[ㅐㅒㅔㅖ]/.test(letter) ? 0.64 : 0.5);
    return [
      ...groupJamo(ink, pair[0], traceComponents(ink, left)),
      ...groupJamo(ink, pair[1], traceComponents(ink, right)),
    ];
  }
  if (letter === 'ㅎ' && components.length >= 2) {
    const sorted = components.sort(byY),
      hat = cropGroup(ink, sorted.slice(0, -1)),
      circle = cropGroup(ink, sorted.slice(-1));
    return [
      ...(hat
        ? translate(
            fit(
              hat.ink,
              'ㅎ',
              { left: 0, top: 0, right: hat.ink.width, bottom: hat.ink.height },
              jamoPaths('ㅎ').slice(0, 2)
            ),
            hat.x,
            hat.y
          )
        : []),
      ...(circle
        ? translate(
            fit(circle.ink, 'ㅇ', {
              left: 0,
              top: 0,
              right: circle.ink.width,
              bottom: circle.ink.height,
            }),
            circle.x,
            circle.y
          )
        : []),
    ];
  }
  return fit(ink, letter, region);
}

function cachedBuild(ink: Ink, letter: string, region: Rect): VowelGuideStroke[] {
  const box = inkBounds(ink, region);
  if (!box) return [];
  let hash = 2166136261;
  for (let y = box.top; y < box.bottom; y++)
    for (let x = box.left; x < box.right; x++)
      hash = Math.imul(hash ^ (ink.data[(y * ink.width + x) * 4 + 3] >= 128 ? 1 : 0), 16777619);
  const key = `${letter}:${box.right - box.left}:${box.bottom - box.top}:${hash}`;
  const move = (strokes: VowelGuideStroke[], dx: number, dy: number) =>
    strokes.map((stroke) => {
      const points = guidePoints(stroke).map((p) => ({ x: p.x + dx, y: p.y + dy }));
      return { from: points[0], to: points[points.length - 1], points };
    });
  const hit = fittedCache.get(key);
  if (hit) return move(hit, box.left, box.top);
  const result = /^[A-Za-z]$/.test(letter)
    ? fit(ink, letter, region)
    : renderJamo(ink, letter, region);
  if (fittedCache.size >= 128) fittedCache.delete(fittedCache.keys().next().value!);
  fittedCache.set(key, move(result, -box.left, -box.top));
  return result;
}

export function getLetterGuideStrokes(letter: string, mask: Mask): VowelGuideStroke[] {
  if (!isGuidedLetter(letter)) return [];
  if (isIntroVowel(letter)) return getVowelGuideStrokes(letter, mask);
  const strokes = cachedBuild(analyse(mask), letter, {
    left: 0,
    top: 0,
    right: mask.width,
    bottom: mask.height,
  });
  return /^[ij]$/.test(letter)
    ? strokes.map((stroke, index) =>
        index === strokes.length - 1 ? { ...stroke, dot: true } : stroke
      )
    : strokes;
}
