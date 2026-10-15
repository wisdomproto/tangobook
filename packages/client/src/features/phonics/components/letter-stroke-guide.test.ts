import { describe, expect, it } from 'vitest';
import { ENGLISH_STROKES } from './english-stroke-templates';
import {
  getLetterGuideStrokes,
  isGuidedLetter,
  sampleFormationPath,
  trimProjectionLoops,
} from './letter-stroke-guide';
import { guidePoints } from './vowel-stroke-guide';

function mask(lines: number[][], offset = 0) {
  const data = new Uint8ClampedArray(400 * 400 * 4);
  for (const [x1, y1, x2, y2] of lines) {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
    for (let i = 0; i <= steps; i++) {
      const cx = Math.round(x1 + ((x2 - x1) * i) / Math.max(1, steps)) + offset;
      const cy = Math.round(y1 + ((y2 - y1) * i) / Math.max(1, steps)) + offset;
      for (let y = cy - 8; y <= cy + 8; y++)
        for (let x = cx - 8; x <= cx + 8; x++) data.set([229, 231, 235, 255], (y * 400 + x) * 4);
    }
  }
  // Native ImageData has non-enumerable prototype getters, unlike a literal.
  return Object.create({
    get data() {
      return data;
    },
    get width() {
      return 400;
    },
    get height() {
      return 400;
    },
  }) as ImageData;
}

describe('all-writing formation paths', () => {
  it('removes pixel-projection return loops without cutting a real bowl or its endpoints', () => {
    const start = { x: 145, y: 185 },
      corner = { x: 145, y: 161 },
      bounce = { x: 146, y: 165 },
      end = { x: 185, y: 151 };
    expect(trimProjectionLoops([start, corner, bounce, corner, bounce, corner, end])).toEqual([
      start,
      corner,
      end,
    ]);
    const bowl = [
      { x: 200, y: 60 },
      { x: 120, y: 110 },
      { x: 120, y: 210 },
      { x: 200, y: 260 },
      { x: 280, y: 210 },
      { x: 280, y: 110 },
      { x: 200, y: 60 },
    ];
    expect(trimProjectionLoops(bowl)).toEqual(bowl);
  });
  it('covers exactly 52 Latin letters, with curves rather than diagonal legacy a/S paths', () => {
    expect(Object.keys(ENGLISH_STROKES).sort()).toEqual(
      [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'].sort()
    );
    for (const paths of Object.values(ENGLISH_STROKES))
      for (const path of paths) {
        const samples = sampleFormationPath(path);
        expect(samples.length).toBeGreaterThan(2);
        expect(samples.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
      }
    const s = sampleFormationPath(ENGLISH_STROKES.S[0]);
    expect(s.some((p) => p.x < 0.3 && p.y < 0.5)).toBe(true);
    expect(s.some((p) => p.x > 0.7 && p.y > 0.5)).toBe(true);
    expect(ENGLISH_STROKES.a.some((path) => path.includes('C'))).toBe(true);
  });
  it('supports native ImageData getters and retains shifted-font coordinates on cache hits', () => {
    const shape = [
      [100, 60, 100, 290],
      [100, 290, 260, 290],
    ];
    const a = getLetterGuideStrokes('L', mask(shape));
    const b = getLetterGuideStrokes('L', mask(shape, 25));
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    const pointsA = guidePoints(a[0]),
      pointsB = guidePoints(b[0]);
    expect(pointsB).toEqual(pointsA.map((p) => ({ x: p.x + 25, y: p.y + 25 })));
    expect(pointsA[0].y).toBeLessThan(pointsA.at(-1)!.y);
    expect(pointsA.at(-1)!.x).toBeGreaterThan(pointsA[0].x);
  });
  it('keeps A’s crossbar horizontal in the actual mask rather than snapping towards its legs', () => {
    const image = mask([
      [170, 55, 90, 300],
      [170, 55, 250, 300],
      [115, 220, 225, 220],
    ]);
    const strokes = getLetterGuideStrokes('A', image);
    expect(strokes).toHaveLength(3);
    const ys = guidePoints(strokes[2]).map((p) => p.y);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThanOrEqual(6);
    expect(strokes[2].from.x).toBeLessThan(strokes[2].to.x);
  });
  it('keeps the two parts of a compound vowel in writing order', () => {
    const compound = getLetterGuideStrokes(
      'ㅢ',
      mask([
        [60, 230, 160, 230],
        [250, 60, 250, 300],
      ])
    );
    expect(compound).toHaveLength(2);
    expect(compound[0].from.x).toBeLessThan(compound[0].to.x);
    expect(compound[1].from.y).toBeLessThan(compound[1].to.y);
  });
  it('does not invent guides for composed syllables, coda clusters, words or other scripts', () => {
    for (const letter of [
      '각',
      '가',
      'ㄳ',
      'ㄵ',
      'ㄶ',
      'ㄺ',
      'ㄻ',
      'ㄼ',
      'ㄽ',
      'ㄾ',
      'ㄿ',
      'ㅀ',
      'ㅄ',
      'cat',
      '字',
      'é',
    ]) {
      expect(isGuidedLetter(letter)).toBe(false);
      expect(getLetterGuideStrokes(letter, mask([]))).toEqual([]);
    }
    for (const letter of [
      ...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㄲㄸㅃㅆㅉㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣㅐㅒㅔㅖㅘㅙㅚㅝㅞㅟㅢ',
    ]) {
      expect(isGuidedLetter(letter)).toBe(true);
    }
  });
});
