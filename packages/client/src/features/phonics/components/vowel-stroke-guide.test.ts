import { describe, expect, it } from 'vitest';
import {
  firstUnpaintedStroke,
  getVowelGuideStrokes,
  guideArrowSegments,
  isIntroVowel,
} from './vowel-stroke-guide';
import { sampleFormationPath } from './letter-stroke-guide';
import { ENGLISH_STROKES } from './english-stroke-templates';

it('e의 방향 표식은 먼저 오른쪽 가로획, 위쪽 반시계, 아래쪽 마무리로 이어진다', () => {
  const points = sampleFormationPath(ENGLISH_STROKES.e[0]).map((p) => ({
    x: p.x * 250,
    y: p.y * 250,
  }));
  const cues = guideArrowSegments({ from: points[0], to: points.at(-1)!, points });
  expect(cues).toHaveLength(3);
  expect(cues[0].at(-1)!.x).toBeGreaterThan(cues[0][0].x);
  expect(cues[0].at(-1)!.y).toBeCloseTo(cues[0][0].y);
  expect(cues[1].at(-1)!.x).toBeLessThan(cues[1][0].x);
  expect(cues[2].at(-1)!.x).toBeGreaterThan(cues[2][0].x);
});

// Independently specified textbook stroke order. Rectangular masks also test
// a narrow/different font placement, without relying on the implementation's paths.
const examples: Record<string, number[][]> = {
  ㅏ: [
    [130, 70, 130, 290],
    [130, 170, 215, 170],
  ],
  ㅑ: [
    [130, 70, 130, 290],
    [130, 135, 215, 135],
    [130, 210, 215, 210],
  ],
  ㅓ: [
    [130, 170, 215, 170],
    [215, 70, 215, 290],
  ],
  ㅕ: [
    [130, 135, 215, 135],
    [130, 210, 215, 210],
    [215, 70, 215, 290],
  ],
  ㅗ: [
    [175, 120, 175, 215],
    [70, 215, 280, 215],
  ],
  ㅛ: [
    [135, 120, 135, 215],
    [210, 120, 210, 215],
    [70, 215, 280, 215],
  ],
  ㅜ: [
    [70, 120, 280, 120],
    [175, 120, 175, 215],
  ],
  ㅠ: [
    [70, 120, 280, 120],
    [135, 120, 135, 215],
    [210, 120, 210, 215],
  ],
  ㅡ: [[70, 175, 280, 175]],
  ㅣ: [[175, 70, 175, 290]],
};

function glyph(lines: number[][], offset = 0) {
  const width = 400,
    height = 400;
  const data = new Uint8ClampedArray(width * height * 4);
  for (const [x1, y1, x2, y2] of lines) {
    for (let y = y1 - 10; y <= y2 + 10; y++) {
      for (let x = x1 - 10; x <= x2 + 10; x++) {
        const i = ((y + offset) * width + x + offset) * 4;
        data.set([229, 231, 235, 255], i);
      }
    }
  }
  return { data, width, height };
}

describe('intro vowel stroke order aligned to the glyph', () => {
  it.each(Object.entries(examples))(
    '%s has the correct direction/order in two font placements',
    (letter, lines) => {
      for (const offset of [0, 25]) {
        const strokes = getVowelGuideStrokes(letter, glyph(lines, offset));
        expect(strokes).toHaveLength(lines.length);
        for (let index = 0; index < lines.length; index++) {
          const { from, to } = strokes[index];
          expect([from.x, from.y, to.x, to.y]).toEqual(lines[index].map((value) => value + offset));
        }
      }
    }
  );
  it('does not offer guessed paths for syllables, other languages or an empty mask', () => {
    expect(isIntroVowel('아')).toBe(false);
    expect(isIntroVowel('a')).toBe(false);
    expect(getVowelGuideStrokes('아', glyph(examples['ㅏ']))).toEqual([]);
    expect(getVowelGuideStrokes('ㅑ', glyph([]))).toEqual([]);
    expect(getVowelGuideStrokes('ㅑ', glyph(examples['ㅏ']))).toEqual([]);
  });
  it('moves to the short stroke only after the trunk is painted, without confusing its intersection', () => {
    const mask = glyph(examples['ㅏ']);
    const strokes = getVowelGuideStrokes('ㅏ', mask);
    expect(firstUnpaintedStroke(strokes, mask)).toBe(0);
    for (let y = 60; y <= 300; y++) {
      for (let x = 120; x <= 140; x++) mask.data.set([16, 185, 129, 255], (y * 400 + x) * 4);
    }
    expect(firstUnpaintedStroke(strokes, mask)).toBe(1);
    for (let i = 0; i < mask.data.length; i += 4) {
      if (mask.data[i + 3]) mask.data.set([16, 185, 129, 255], i);
    }
    expect(firstUnpaintedStroke(strokes, mask)).toBe(-1);
  });
});
