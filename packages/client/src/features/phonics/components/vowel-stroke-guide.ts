export interface StrokePoint {
  x: number;
  y: number;
}
export interface VowelGuideStroke {
  /** A dot is completed by touching and releasing, rather than a swipe. */
  dot?: boolean;
  from: StrokePoint;
  to: StrokePoint;
  /** Curved/bent glyphs use a sampled path; intro vowels keep exact two-point lines. */
  points?: StrokePoint[];
}
export type WritingGuidance = 'demo' | 'hint' | 'independent';

export function isIntroVowel(letter: string): boolean {
  return /^[ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ]$/.test(letter);
}

function runs(values: number[], min: number): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  let start = -1;
  for (let i = 0; i <= values.length; i++) {
    if (i < values.length && values[i] >= min) {
      if (start < 0) start = i;
    } else if (start >= 0) {
      result.push([start, i - 1]);
      start = -1;
    }
  }
  return result;
}

/**
 * Basic vowel topology/order agrees with the existing Korean jamo library.
 * Coordinates come from the *rendered 700-weight glyph*, not a second font or
 * a generic square: narrow/wide faces and font fallback retain aligned hints.
 * This helper deliberately does not compose consonants or complex vowels.
 */
export function getVowelGuideStrokes(
  letter: string,
  mask: Pick<ImageData, 'data' | 'width' | 'height'>
): VowelGuideStroke[] {
  if (!isIntroVowel(letter)) return [];
  const { data, width, height } = mask;
  const cols = Array<number>(width).fill(0);
  const rows = Array<number>(height).fill(0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] >= 128) {
        cols[x]++;
        rows[y]++;
      }
    }
  }
  const xs = runs(cols, 1);
  const ys = runs(rows, 1);
  if (!xs.length || !ys.length) return [];
  const left = xs[0][0];
  const right = xs[xs.length - 1][1];
  const top = ys[0][0];
  const bottom = ys[ys.length - 1][1];
  const vertical = /[ㅏㅑㅓㅕㅣ]/.test(letter);
  const projection = vertical ? cols : rows;
  const mainRun = runs(projection, Math.max(...projection) * 0.8).sort(
    (a, b) => b[1] - b[0] - (a[1] - a[0])
  )[0];
  if (!mainRun) return [];
  const axis = (mainRun[0] + mainRun[1]) / 2;
  const inset = (mainRun[1] - mainRun[0]) / 2;
  const line = (x1: number, y1: number, x2: number, y2: number): VowelGuideStroke => ({
    from: { x: x1, y: y1 },
    to: { x: x2, y: y2 },
  });
  const main = vertical
    ? line(axis, top + inset, axis, bottom - inset)
    : line(left + inset, axis, right - inset, axis);
  if (letter === 'ㅡ' || letter === 'ㅣ') return [main];

  const beforeMain = /[ㅓㅕㅗㅛ]/.test(letter);
  // Probe well outside the trunk to distinguish one/two short bars.
  const probe = vertical
    ? Math.round(beforeMain ? (left + mainRun[0]) / 2 : (right + mainRun[1]) / 2)
    : Math.round(beforeMain ? (top + mainRun[0]) / 2 : (bottom + mainRun[1]) / 2);
  const cross = Array.from({ length: vertical ? height : width }, (_, index) => {
    const x = vertical ? probe : index;
    const y = vertical ? index : probe;
    return data[(y * width + x) * 4 + 3];
  });
  const branches = runs(cross, 128).map(([start, end]) => {
    const center = (start + end) / 2;
    const cap = (end - start) / 2;
    return vertical
      ? beforeMain
        ? line(left + cap, center, axis, center)
        : line(axis, center, right - cap, center)
      : beforeMain
        ? line(center, top + cap, center, axis)
        : line(center, axis, center, bottom - cap);
  });
  const expected = /[ㅑㅕㅛㅠ]/.test(letter) ? 2 : 1;
  // An unsupported/broken font must not produce misleading partial guidance.
  if (branches.length !== expected) return [];
  return beforeMain ? [...branches, main] : [main, ...branches];
}

/** Hint advancement only; actual pass remains LetterFillCanvas's 99% mask. */
export function guidePoints(stroke: VowelGuideStroke): StrokePoint[] {
  return stroke.points ?? [stroke.from, stroke.to];
}

export function guidePath(stroke: VowelGuideStroke): string {
  return guidePoints(stroke)
    .map((p, index) => `${index ? 'L' : 'M'} ${p.x} ${p.y}`)
    .join(' ');
}

/** Direction cues follow arc length. An e's short first crossbar must be
 * visible before the much longer counter-clockwise bowl. */
export function guideArrowSegments(stroke: VowelGuideStroke, startRadius = 12): StrokePoint[][] {
  const points = guidePoints(stroke);
  const lengths = [0];
  for (let n = 1; n < points.length; n++)
    lengths.push(
      lengths[n - 1] + Math.hypot(points[n].x - points[n - 1].x, points[n].y - points[n - 1].y)
    );
  const total = lengths.at(-1)!;
  if (total < startRadius + 25) return [];
  const at = (length: number): StrokePoint => {
    const end = lengths.findIndex((n) => n >= length);
    if (end <= 0) return points[end < 0 ? points.length - 1 : 0];
    const ratio = (length - lengths[end - 1]) / Math.max(0.001, lengths[end] - lengths[end - 1]);
    return {
      x: points[end - 1].x + (points[end].x - points[end - 1].x) * ratio,
      y: points[end - 1].y + (points[end].y - points[end - 1].y) * ratio,
    };
  };
  return (total > 300 ? [0.12, 0.4, 0.8] : total > 140 ? [0.12, 0.62] : [0.55]).map((fraction) => {
    const from = Math.max(startRadius + 8, total * fraction);
    const to = Math.min(total - 5, from + Math.max(14, total * 0.08));
    return [at(from), ...points.filter((_, n) => lengths[n] > from && lengths[n] < to), at(to)];
  });
}

export function firstUnpaintedStroke(
  strokes: VowelGuideStroke[],
  image: Pick<ImageData, 'data' | 'width' | 'height'>
): number {
  return strokes.findIndex((stroke) => {
    const points = guidePoints(stroke);
    let samples = 0;
    let painted = 0;
    for (let segment = 1; segment < points.length; segment++) {
      const from = points[segment - 1],
        to = points[segment];
      const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 5));
      for (let i = 0; i <= steps; i++) {
        samples++;
        const x = Math.round(from.x + ((to.x - from.x) * i) / steps);
        const y = Math.round(from.y + ((to.y - from.y) * i) / steps);
        if (x < 0 || x >= image.width || y < 0 || y >= image.height) continue;
        const offset = (y * image.width + x) * 4;
        if (
          image.data[offset + 3] > 0 &&
          image.data[offset] < 128 &&
          image.data[offset + 1] > 128 &&
          image.data[offset + 2] < 200
        )
          painted++;
      }
    }
    return painted / Math.max(1, samples) < 0.95;
  });
}
