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

/** Lifting pauses the stroke; resume near its last accepted checkpoint. */
export function resumeTrace(
  path: TracePath,
  attempt: TraceAttempt,
  point: StrokePoint
): TraceAttempt | null {
  const fromTip = distance(path.points[attempt.index], point);
  // Touching the original start deliberately retries a failed/scribbled trace.
  if (distance(path.points[0], point) < fromTip) return null;
  return fromTip <= TRACE_TOLERANCE ? { ...attempt, last: point } : null;
}

/** Follow *this* stroke forwards. A tap, reverse trace or shortcut across a bend cannot pass. */
export function moveTrace(
  path: TracePath,
  attempt: TraceAttempt,
  point: StrokePoint,
  { softTurns = false }: { softTurns?: boolean } = {}
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
      j < path.points.length &&
      path.distances[j] - path.distances[index] <= TRACE_TOLERANCE * (softTurns ? 2 : 1);
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

export function tracePassed(
  path: TracePath,
  attempt: TraceAttempt,
  { softEnd = false, completionRatio = 1 }: { softEnd?: boolean; completionRatio?: number } = {}
): boolean {
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
  // On a tiny English crossbar, start/end wobble can consume most of the
  // chord. Still require forward movement, with the existing travel and
  // untraced-tail guards; rubbing in place cannot complete the bar.
  const minimumForward = softEnd
    ? Math.max(4, Math.min(path.length * 0.45, chord - TRACE_TOLERANCE))
    : path.length * 0.45;
  // A short printed crossbar may be only 41px long. Permitted start/end
  // offsets can shorten a forward swipe below 62%, even when its checkpoint
  // reaches the end region. Keep real movement, direction and tail guards.
  const minimumTravel =
    softEnd && path.length < 64 && chord >= path.length * 0.8
      ? Math.min(path.length * 0.62, Math.max(8, chord - TRACE_TOLERANCE))
      : path.length * 0.62;
  // Pointer-up near 90% snaps only the final tail into place. Path progress is
  // measured along the curve, never by distance travelled/scribbling alone.
  // Half a 5px sample accommodates checkpoint quantization at exactly 90%.
  const nearFinish =
    completionRatio < 1 &&
    path.distances[attempt.index] >= path.length * Math.max(0.9, completionRatio) - 2.5;
  const endpointTolerance = nearFinish
    ? Math.max(
        TRACE_TOLERANCE,
        path.length * (1 - Math.max(0.9, completionRatio)) + TRACE_TOLERANCE
      )
    : TRACE_TOLERANCE;
  return (
    // Guided ends use the same corridor as the rest of the stroke. A wobbling
    // finger can reach the end while its nearest checkpoint is still behind.
    // At 90%, allow both the remaining tail and a finger's lateral offset.
    // Keep short-stroke, distance, direction and endpoint guards.
    (nearFinish ||
      path.length - path.distances[attempt.index] <=
        Math.min(softEnd ? TRACE_TOLERANCE * 2 : 16, path.length * (softEnd ? 0.45 : 0.28))) &&
    // The entire untraced tail must be inside the endpoint corridor. Extra arc
    // allowance never skips an uncovered bend or another side of a letter.
    (!(softEnd || nearFinish) ||
      path.points
        .slice(attempt.index)
        .every((p) => distance(p, attempt.last) <= endpointTolerance)) &&
    attempt.travelled >= minimumTravel &&
    // Both ends of a tiny bar can fall inside the start tolerance. Require a
    // real forward swipe so reversing it or scrubbing a dot cannot pass.
    (path.length >= 64 || chord < path.length * 0.8 || forward >= minimumForward) &&
    attempt.offPath <= Math.max(24, attempt.travelled * 0.4) &&
    distance(attempt.last, path.points[path.points.length - 1]) <= endpointTolerance
  );
}

/** Partition the real font ink between strokes, once per paper; no per-move pixel reads. */
export function strokeOwners(
  mask: Pick<ImageData, 'data' | 'width' | 'height'>,
  paths: TracePath[],
  { completeJoins = false }: { completeJoins?: boolean } = {}
): Uint8Array {
  const { width, height, data } = mask;
  const owners = new Uint8Array(width * height);
  // A straight stem keeps a straight edge at a curved join (D/d/p/q).
  // Nearest-centreline alone makes triangular bites where the bowl meets it.
  const stems = paths.flatMap((path, owner) => {
    if (path.dot || path.length < 24) return [];
    let points = path.points;
    let xs = points.map((p) => p.x),
      ys = points.map((p) => p.y);
    // f/n/h have a curved shoulder; t has a curved foot. Find the long straight
    // section inside either kind of stroke so a later crossbar cannot cut a
    // grey gap through the downstroke the child has already completed.
    if (Math.max(...xs) - Math.min(...xs) > 6 && Math.max(...ys) - Math.min(...ys) > 6) {
      let longest: StrokePoint[] | undefined,
        span = 63;
      for (const axis of ['x', 'y'] as const) {
        const along = axis === 'x' ? 'y' : 'x';
        for (let start = 0; start < points.length; start++) {
          let low = points[start][axis],
            high = low;
          for (let end = start + 1; end < points.length; end++) {
            low = Math.min(low, points[end][axis]);
            high = Math.max(high, points[end][axis]);
            if (high - low > 6) break;
            const length = Math.abs(points[end][along] - points[start][along]);
            if (length > span) {
              span = length;
              longest = points.slice(start, end + 1);
            }
          }
        }
      }
      if (longest) {
        points = longest;
        xs = points.map((p) => p.x);
        ys = points.map((p) => p.y);
      }
    }
    const vertical = Math.max(...xs) - Math.min(...xs) <= 6;
    const horizontal = Math.max(...ys) - Math.min(...ys) <= 6;
    if (!vertical && !horizontal) return [];
    const runs: Array<[number, number]> = [];
    // Include the shoulders of a short crossbar. All three middle samples of
    // f/t can land inside its vertical stem and mistake the entire column for
    // the crossbar's thickness, leaving the completed downstroke unpainted.
    for (const fraction of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
      const p = points[Math.floor((points.length - 1) * fraction)];
      const x = Math.round(p.x),
        y = Math.round(p.y);
      const ink = (n: number) => {
        const px = vertical ? n : x,
          py = vertical ? y : n;
        return (
          px >= 0 && px < width && py >= 0 && py < height && data[(py * width + px) * 4 + 3] > 0
        );
      };
      const center = vertical ? x : y;
      if (!ink(center)) continue;
      let low = center,
        high = center;
      while (ink(low - 1)) low--;
      while (ink(high + 1)) high++;
      // A perpendicular run longer than this straight stroke belongs to a
      // crossing stroke. Ignore it; if every sample crosses, use nearest-path
      // ownership rather than granting a large rectangular override.
      if (high - low + 1 <= path.length) runs.push([low, high]);
    }
    if (!runs.length) return [];
    runs.sort((a, b) => a[1] - a[0] - (b[1] - b[0]));
    const [low, high] = runs[Math.floor(runs.length / 2)];
    const extension = (high - low + 1) / 2 + 4;
    return [
      {
        owner,
        vertical,
        low,
        high,
        start: Math.min(...(vertical ? ys : xs)) - extension,
        end: Math.max(...(vertical ? ys : xs)) + extension,
      },
    ];
  });
  // Only visit font ink, once at setup. Pixel ownership avoids visible 4px stairs
  // where two strokes meet; tracing still does no per-move pixel reads.
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (!data[(y * width + x) * 4 + 3]) continue;
      const stem = stems.find((s) => {
        const across = s.vertical ? x : y,
          along = s.vertical ? y : x;
        return across >= s.low && across <= s.high && along >= s.start && along <= s.end;
      });
      if (stem) {
        owners[y * width + x] = stem.owner;
        continue;
      }
      let owner = 0,
        best = Infinity;
      paths.forEach((path, i) => {
        for (const p of path.points) {
          const d = (p.x - x) ** 2 + (p.y - y) ** 2;
          if (d < best) {
            best = d;
            owner = i;
          }
        }
      });
      owners[y * width + x] = owner;
    }
  if (completeJoins) completeStrokeJoins(mask, paths, owners);
  return owners;
}

/** Earlier strokes keep their whole ink ribbon through a later crossing/join.
 * Closest-path partitioning alone lets a future stroke cut a grey hole in an
 * already completed diagonal or bowl. Measure the font's normal thickness,
 * cap expanded junctions, and claim only real glyph ink. Setup only. */
function completeStrokeJoins(
  mask: Pick<ImageData, 'data' | 'width' | 'height'>,
  paths: TracePath[],
  owners: Uint8Array
) {
  const { width, height, data } = mask;
  const ink = (x: number, y: number) => {
    x = Math.round(x);
    y = Math.round(y);
    return x >= 0 && y >= 0 && x < width && y < height && data[(y * width + x) * 4 + 3] >= 128;
  };
  paths.forEach((path, owner) => {
    if (path.dot) return;
    const sections = path.points.flatMap((p, i, points) => {
      if (!ink(p.x, p.y)) return [];
      const before = points[Math.max(0, i - 2)],
        after = points[Math.min(points.length - 1, i + 2)];
      const length = Math.hypot(after.x - before.x, after.y - before.y);
      if (length < 1) return [];
      const nx = -(after.y - before.y) / length,
        ny = (after.x - before.x) / length;
      let left = 0,
        right = 0;
      // Font ink, not a tracing tolerance, determines the completed width.
      while (left < 80 && ink(p.x - nx * (left + 1), p.y - ny * (left + 1))) left++;
      while (right < 80 && ink(p.x + nx * (right + 1), p.y + ny * (right + 1))) right++;
      return [{ p, nx, ny, left: left + 0.75, right: right + 0.75 }];
    });
    if (!sections.length) return;
    const widths = sections.map((s) => s.left + s.right).sort((a, b) => a - b);
    const typical = widths[Math.floor(widths.length / 2)];
    for (const { p, nx, ny, left, right } of sections) {
      // A crossing can make a normal run arbitrarily long. Retain the usual
      // stroke width there rather than painting the next stem in advance.
      const l = Math.min(left, typical * 0.65),
        r = Math.min(right, typical * 0.65);
      const offset = (r - l) / 2;
      const cx = p.x + nx * offset,
        cy = p.y + ny * offset;
      const radius = Math.max(2.5, (l + r) / 2 + 1);
      for (
        let y = Math.max(0, Math.floor(cy - radius));
        y <= Math.min(height - 1, Math.ceil(cy + radius));
        y++
      )
        for (
          let x = Math.max(0, Math.floor(cx - radius));
          x <= Math.min(width - 1, Math.ceil(cx + radius));
          x++
        ) {
          const at = y * width + x;
          if (
            owners[at] > owner &&
            data[at * 4 + 3] &&
            (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2
          )
            owners[at] = owner;
        }
    }
  });
}
