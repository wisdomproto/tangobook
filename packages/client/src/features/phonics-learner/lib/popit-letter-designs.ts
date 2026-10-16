import jamoTemplates from '@/features/phonics/components/korean-stroke-templates.json';
import { ENGLISH_STROKES } from '@/features/phonics/components/english-stroke-templates';
import { sampleFormationPath } from '@/features/phonics/components/letter-stroke-guide';

type Point = readonly [number, number];
type Stroke = { path: string; points: Point[] };
export interface PopitDesign {
  path: string;
  points: readonly Point[];
  face?: Point;
  tone: 'mint' | 'coral';
  width: number;
  bubble: number;
}
const KOREAN = [
  ...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㄲㄸㅃㅆㅉㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣㅐㅒㅔㅖㅘㅙㅚㅝㅞㅟㅢ',
];
const ENGLISH = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'];
export const POPIT_ALPHABET = [...KOREAN, ...ENGLISH];
const templates = jamoTemplates as Record<
  string,
  Array<{ type: string; points: Array<{ x: number; y: number }> }>
>;
const round = (n: number) => Math.round(n * 100) / 100;
const bounds = (points: readonly Point[]) => ({
  left: Math.min(...points.map((p) => p[0])),
  right: Math.max(...points.map((p) => p[0])),
  top: Math.min(...points.map((p) => p[1])),
  bottom: Math.max(...points.map((p) => p[1])),
});
function mapPath(path: string, map: (p: Point) => Point): string {
  // Formation paths use only absolute M/L/Q/C coordinate pairs.
  return path.replace(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g, (_, x, y) => {
    const p = map([Number(x), Number(y)]);
    return `${round(p[0])},${round(p[1])}`;
  });
}
function transform(strokes: Stroke[], map: (p: Point) => Point): Stroke[] {
  return strokes.map((s) => ({ path: mapPath(s.path, map), points: s.points.map(map) }));
}
function line(points: Point[]): Stroke {
  const path = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  return { path, points: sampleFormationPath(path).map((p) => [p.x * 100, p.y * 100]) };
}
function loop(points: Point[]): Stroke {
  const b = bounds(points),
    x = (b.left + b.right) / 2,
    y = (b.top + b.bottom) / 2;
  const rx = (b.right - b.left) / 2,
    ry = (b.bottom - b.top) / 2,
    k = 0.55228475;
  const path = `M${x} ${y - ry} C${x - rx * k} ${y - ry} ${x - rx} ${y - ry * k} ${x - rx} ${y} C${x - rx} ${y + ry * k} ${x - rx * k} ${y + ry} ${x} ${y + ry} C${x + rx * k} ${y + ry} ${x + rx} ${y + ry * k} ${x + rx} ${y} C${x + rx} ${y - ry * k} ${x + rx * k} ${y - ry} ${x} ${y - ry}`;
  return { path, points: sampleFormationPath(path).map((p) => [p.x * 100, p.y * 100]) };
}
function jamo(letter: string): Stroke[] {
  return templates[letter].map((s) => {
    const p: Point[] = s.points.map((p) => [p.x * 100, p.y * 100]);
    return s.type === 'loop' ? loop(p) : line(p);
  });
}
function part(letter: string, left: number, top: number, width: number, height: number): Stroke[] {
  const source = koreanShape(letter),
    b = bounds(source.flatMap((s) => s.points));
  return transform(source, ([x, y]) => [
    left + (b.right === b.left ? 0 : ((x - b.left) / (b.right - b.left)) * width),
    top + (b.bottom === b.top ? 0 : ((y - b.top) / (b.bottom - b.top)) * height),
  ]);
}
const doubles: Record<string, string> = { ㄲ: 'ㄱ', ㄸ: 'ㄷ', ㅃ: 'ㅂ', ㅆ: 'ㅅ', ㅉ: 'ㅈ' };
/** Preserve open counters and the visible gap between components of a compound. */
function koreanShape(letter: string): Stroke[] {
  if (doubles[letter])
    return [...part(doubles[letter], 5, 7, 37, 86), ...part(doubles[letter], 58, 7, 37, 86)];
  const compounds: Record<string, Array<[string, number, number, number, number]>> = {
    ㅐ: [
      ['ㅏ', 8, 5, 45, 90],
      ['ㅣ', 86, 5, 0, 90],
    ],
    ㅒ: [
      ['ㅑ', 8, 5, 45, 90],
      ['ㅣ', 86, 5, 0, 90],
    ],
    ㅔ: [
      ['ㅓ', 6, 5, 47, 90],
      ['ㅣ', 86, 5, 0, 90],
    ],
    ㅖ: [
      ['ㅕ', 6, 5, 47, 90],
      ['ㅣ', 86, 5, 0, 90],
    ],
    ㅘ: [
      ['ㅗ', 2, 40, 38, 50],
      ['ㅏ', 58, 5, 40, 90],
    ],
    ㅙ: [
      ['ㅗ', 2, 40, 28, 50],
      ['ㅐ', 48, 5, 50, 90],
    ],
    ㅚ: [
      ['ㅗ', 3, 40, 52, 50],
      ['ㅣ', 85, 5, 0, 90],
    ],
    ㅝ: [
      ['ㅜ', 2, 10, 40, 50],
      ['ㅓ', 58, 5, 40, 90],
    ],
    ㅞ: [
      ['ㅜ', 2, 10, 28, 50],
      ['ㅔ', 48, 5, 50, 90],
    ],
    ㅟ: [
      ['ㅜ', 3, 10, 50, 50],
      ['ㅣ', 85, 5, 0, 90],
    ],
    ㅢ: [
      ['ㅡ', 2, 68, 55, 0],
      ['ㅣ', 88, 5, 0, 90],
    ],
  };
  return compounds[letter]?.flatMap((args) => part(...args)) ?? jamo(letter);
}
function atDistance(points: Point[], fraction: number): Point {
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  let remaining = lengths.reduce((a, b) => a + b, 0) * fraction;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i]) {
      const t = lengths[i] ? remaining / lengths[i] : 0;
      return [
        points[i][0] + (points[i + 1][0] - points[i][0]) * t,
        points[i][1] + (points[i + 1][1] - points[i][1]) * t,
      ];
    }
    remaining -= lengths[i];
  }
  return points[points.length - 1];
}
const apart = (a: Point, b: Point) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
function bubbles(strokes: Stroke[]): Point[] {
  const points: Point[] = [];
  for (const s of strokes) {
    const length = s.points
      .slice(1)
      .reduce((n, p, i) => n + Math.hypot(p[0] - s.points[i][0], p[1] - s.points[i][1]), 0);
    const segments = Math.max(1, Math.floor(length / 86));
    const fractions =
      length < 90 ? [0.5] : Array.from({ length: segments + 1 }, (_, i) => i / segments);
    for (const f of fractions) {
      const p = atDistance(s.points, f);
      if (points.every((q) => apart(p, q) >= 82)) points.push(p);
    }
  }
  return points;
}
function design(letter: string): PopitDesign {
  const english = /^[A-Za-z]$/.test(letter);
  const source = english
    ? ENGLISH_STROKES[letter].map((path) => ({
        path,
        points: sampleFormationPath(path).map((p) => [p.x * 100, p.y * 100] as Point),
      }))
    : koreanShape(letter);
  const b = bounds(source.flatMap((s) => s.points));
  const scale = 260 / Math.max(b.right - b.left, b.bottom - b.top);
  const strokes = transform(source, ([x, y]) => [
    200 + (x - (b.left + b.right) / 2) * scale,
    190 + (y - (b.top + b.bottom) / 2) * scale,
  ]);
  const points = bubbles(strokes);
  const width =
    doubles[letter] || 'ㅙㅞ'.includes(letter)
      ? 32
      : 'ㅐㅒㅔㅖㅘㅚㅝㅟㅢㅎㅊMWmw'.includes(letter)
        ? 42
        : 58;
  const bubble = Math.min(58, width * 0.9);
  // A small face sits in a long quiet section of silicone, away from the bubbles.
  const quiet = strokes
    .flatMap((s) => s.points)
    .filter((p) => p[1] > 90 && p[1] < 295)
    .map((p) => ({ p, d: Math.min(...points.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1]))) }))
    .sort((a, b) => b.d - a.d)[0];
  return {
    path: strokes.map((s) => s.path).join(' '),
    points,
    face: quiet && quiet.d > 44 ? quiet.p : undefined,
    width,
    bubble,
    tone: english || /[ㅏ-ㅣ]/.test(letter) ? 'mint' : 'coral',
  };
}
export const POPIT_LETTERS: Record<string, PopitDesign> = Object.fromEntries(
  POPIT_ALPHABET.map((letter) => [letter, design(letter)])
);
// Keep the three approved samples unchanged.
Object.assign(POPIT_LETTERS, {
  ㅏ: {
    path: 'M120 80 L120 320 M120 190 L280 190',
    points: [
      [120, 90],
      [120, 190],
      [120, 290],
      [200, 190],
      [280, 190],
    ],
    face: [120, 242],
    tone: 'mint',
    width: 80,
    bubble: 62,
  },
  ㄱ: {
    path: 'M80 100 L300 100 L300 320',
    points: [
      [80, 100],
      [190, 100],
      [300, 100],
      [300, 200],
      [300, 300],
    ],
    face: [300, 250],
    tone: 'coral',
    width: 80,
    bubble: 62,
  },
  ㅇ: {
    path: loop([
      [200, 80],
      [80, 200],
      [200, 320],
      [320, 200],
      [200, 80],
    ]).path,
    points: Array.from({ length: 8 }, (_, i) => [
      200 - Math.sin((i * Math.PI) / 4) * 120,
      200 - Math.cos((i * Math.PI) / 4) * 120,
    ]),
    face: [200, 200],
    tone: 'coral',
    width: 80,
    bubble: 62,
  },
} satisfies Record<string, PopitDesign>);
export function hasPopitLetter(letter: string): boolean {
  return Object.prototype.hasOwnProperty.call(POPIT_LETTERS, letter);
}
export type PopitLetter = string;
