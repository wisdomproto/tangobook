import { guidePoints, type StrokePoint, type VowelGuideStroke } from './vowel-stroke-guide';

export interface TracePath {
  dot?: boolean;
  points: StrokePoint[];
  distances: number[];
  length: number;
}

/** Fixed distance samples keep curves and long straight strokes equally forgiving. */
export function makeTracePath(stroke: VowelGuideStroke): TracePath {
  const source = guidePoints(stroke);
  const points = [source[0]];
  for (let s = 1; s < source.length; s++) {
    const a = source[s - 1],
      b = source[s];
    const count = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 5));
    for (let n = 1; n <= count; n++)
      points.push({ x: a.x + ((b.x - a.x) * n) / count, y: a.y + ((b.y - a.y) * n) / count });
  }
  const distances = [0];
  for (let i = 1; i < points.length; i++)
    distances.push(
      distances[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
    );
  return { points, distances, length: distances[distances.length - 1], dot: stroke.dot };
}

export interface TraceAttempt {
  index: number;
  travelled: number;
  offPath: number;
  last: StrokePoint;
  start: StrokePoint;
}
const distance = (a: StrokePoint, b: StrokePoint) => Math.hypot(a.x - b.x, a.y - b.y);
export const TRACE_TOLERANCE = 32; // 24px on a 300px paper, friendly to small fingers.

export function beginTrace(path: TracePath, point: StrokePoint): TraceAttempt | null {
  return distance(path.points[0], point) <= (path.dot ? 20 : TRACE_TOLERANCE)
    ? { index: 0, travelled: 0, offPath: 0, last: point, start: point }
    : null;
}

/** Follow *this* stroke forwards. A tap, reverse trace or shortcut across a bend cannot pass. */
export function moveTrace(
  path: TracePath,
  attempt: TraceAttempt,
  point: StrokePoint
): TraceAttempt {
  const movement = distance(attempt.last, point);
  if (movement < 1) return attempt;
  let index = attempt.index,
    travelled = attempt.travelled,
    offPath = attempt.offPath;
  const pieces = Math.ceil(movement / 5);
  for (let n = 1; n <= pieces; n++) {
    const p = {
      x: attempt.last.x + ((point.x - attempt.last.x) * n) / pieces,
      y: attempt.last.y + ((point.y - attempt.last.y) * n) / pieces,
    };
    let nearest = index,
      best = distance(p, path.points[index]);
    // Never leap to a nearby but much later leg of a loop/zigzag.
    for (
      let j = index + 1;
      j < path.points.length && path.distances[j] - path.distances[index] <= TRACE_TOLERANCE;
      j++
    ) {
      const d = distance(p, path.points[j]);
      if (d < best) {
        best = d;
        nearest = j;
      }
    }
    if (best <= TRACE_TOLERANCE) {
      // Count the finger's movement inside the corridor, not the rounded
      // checkpoint jumps. Quantization otherwise discards valid slow strokes.
      travelled += movement / pieces;
      index = nearest;
    } else offPath += movement / pieces;
  }
  return { index, travelled, offPath, last: point, start: attempt.start };
}

export function tracePassed(path: TracePath, attempt: TraceAttempt): boolean {
  if (path.dot)
    return (
      distance(attempt.start, path.points[0]) <= 20 &&
      distance(attempt.last, path.points[0]) <= 20 &&
      attempt.offPath <= 6 &&
      attempt.travelled <= 36
    );
  const first = path.points[0],
    last = path.points[path.points.length - 1];
  const chord = distance(first, last);
  const forward =
    chord > 0
      ? ((attempt.last.x - attempt.start.x) * (last.x - first.x) +
          (attempt.last.y - attempt.start.y) * (last.y - first.y)) /
        chord
      : 0;
  return (
    // Short bars can end a few pixels shy when a small finger wobbles. Retain
    // travelled distance and endpoint checks; a dot/half-stroke still fails.
    path.length - path.distances[attempt.index] <= Math.min(16, path.length * 0.28) &&
    attempt.travelled >= path.length * 0.62 &&
    // Both ends of a tiny bar can fall inside the start tolerance. Require a
    // real forward swipe so reversing it or scrubbing a dot cannot pass.
    (path.length >= 64 || chord < path.length * 0.8 || forward >= path.length * 0.45) &&
    attempt.offPath <= Math.max(24, attempt.travelled * 0.4) &&
    distance(attempt.last, path.points[path.points.length - 1]) <= TRACE_TOLERANCE
  );
}

/** Partition the real font ink between strokes, once per paper; no per-move pixel reads. */
export function strokeOwners(
  mask: Pick<ImageData, 'data' | 'width' | 'height'>,
  paths: TracePath[]
): Uint8Array {
  const { width, height, data } = mask;
  const owners = new Uint8Array(width * height);
  // 4px cells bound work even for complex jamo; the alpha mask keeps crisp font edges.
  for (let y = 0; y < height; y += 4)
    for (let x = 0; x < width; x += 4) {
      let ink = false;
      for (let dy = 0; dy < 4 && y + dy < height; dy++)
        for (let dx = 0; dx < 4 && x + dx < width; dx++)
          if (data[((y + dy) * width + x + dx) * 4 + 3]) ink = true;
      if (!ink) continue;
      let owner = 0,
        best = Infinity;
      paths.forEach((path, i) => {
        for (const p of path.points) {
          const d = (p.x - x - 1.5) ** 2 + (p.y - y - 1.5) ** 2;
          if (d < best) {
            best = d;
            owner = i;
          }
        }
      });
      for (let dy = 0; dy < 4 && y + dy < height; dy++)
        for (let dx = 0; dx < 4 && x + dx < width; dx++) owners[(y + dy) * width + x + dx] = owner;
    }
  return owners;
}
