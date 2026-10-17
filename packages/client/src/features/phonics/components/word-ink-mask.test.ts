import { describe, expect, it } from 'vitest';
import { buildWordInkMasks, finishWordInk, isWordInkComplete } from './word-ink-mask';

const gray = [229, 231, 235, 255];
const green = [16, 185, 129, 255];
const image = () => new Uint8ClampedArray(30 * 20 * 4);
function mark(data: Uint8ClampedArray, x: number, y: number, color = gray) {
  data.set(color, (y * 30 + x) * 4);
}
function square(data: Uint8ClampedArray, left = 0) {
  for (let y = 0; y < 10; y++) for (let x = left; x < left + 10; x++) mark(data, x, y);
}

describe('낱말 끝맺음', () => {
  it('90%는 완성하지만 89%나 빈 글자는 통과시키지 않는다', () => {
    const original = image();
    square(original);
    const [mask] = buildWordInkMasks(original, 30, [{ start: 0, end: 15 }]);
    const ink = original.slice();
    for (const pixel of mask.pixels.slice(0, 89)) ink.set(green, pixel * 4);
    expect(isWordInkComplete(ink, mask, 0.9)).toBe(false);
    ink.set(green, mask.pixels[89] * 4);
    expect(isWordInkComplete(ink, mask, 0.9)).toBe(true);
    expect(isWordInkComplete(ink, mask, 0.99)).toBe(false);
    expect(isWordInkComplete(ink, { pixels: [], parts: [] }, 0.9)).toBe(false);
  });

  it('전체 면적이 충분해도 i/j 점이나 한글의 떨어진 짧은 획을 빼먹으면 통과하지 않는다', () => {
    const original = image();
    square(original);
    for (let y = 15; y < 17; y++) for (let x = 0; x < 2; x++) mark(original, x, y);
    const [mask] = buildWordInkMasks(original, 30, [{ start: 0, end: 15 }]);
    expect(mask.parts.map((part) => part.length)).toEqual([100, 4]);
    const ink = original.slice();
    for (const pixel of mask.parts[0]) ink.set(green, pixel * 4);
    expect(isWordInkComplete(ink, mask, 0.9)).toBe(false);
    for (const pixel of mask.parts[1].slice(0, 2)) ink.set(green, pixel * 4);
    expect(isWordInkComplete(ink, mask, 0.9)).toBe(true);
  });

  it('완성한 칸의 빈틈만 채우고 원래 윤곽·투명도·다음 칸의 잉크는 보존한다', () => {
    const original = image();
    square(original);
    square(original, 20);
    mark(original, 0, 0, [229, 231, 235, 80]);
    const [mask] = buildWordInkMasks(original, 30, [
      { start: 0, end: 15 },
      { start: 15, end: 30 },
    ]);
    const ink = original.slice();
    mark(ink, 20, 0, green);
    const nextCell = ink.slice(20 * 4, 30 * 4);
    finishWordInk(ink, original, mask);
    for (const pixel of mask.pixels) {
      expect([...ink.slice(pixel * 4, pixel * 4 + 3)]).toEqual(green.slice(0, 3));
      expect(ink[pixel * 4 + 3]).toBe(original[pixel * 4 + 3]);
    }
    expect(ink.slice(20 * 4, 30 * 4)).toEqual(nextCell);
    expect([...ink.slice(15 * 4, 16 * 4)]).toEqual([0, 0, 0, 0]);
  });

  it('행 끝과 다음 행 시작을 붙은 획으로 오인하지 않는다', () => {
    const original = image();
    mark(original, 29, 0);
    mark(original, 0, 1);
    const [mask] = buildWordInkMasks(original, 30, [{ start: 0, end: 30 }]);
    expect(mask.parts).toHaveLength(2);
  });
});
