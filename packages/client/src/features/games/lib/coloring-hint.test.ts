import { describe, expect, it } from 'vitest';
import { drawColoringHintOutline } from './coloring-hint';

function fixture(w = 40, h = 40) {
  const labels = new Int32Array(w * h).fill(-1);
  for (let y = 4; y < h - 4; y++) for (let x = 4; x < w - 4; x++) labels[y * w + x] = 7;
  const pixels = new Uint8ClampedArray(w * h * 4);
  return { w, h, labels, pixels };
}
const color = [110, 160, 120] as const;
describe('unpainted coloring hint outlines', () => {
  it('leaves the whole interior clear, including former 16px checker cells', () => {
    const f = fixture();
    drawColoringHintOutline(f.pixels, f.labels, f.w, f.h, new Set([7]), color, 2);
    for (let y = 7; y < 33; y++)
      for (let x = 7; x < 33; x++) {
        expect(f.pixels[(y * f.w + x) * 4 + 3]).toBe(0);
      }
    expect([...f.pixels.slice((4 * f.w + 12) * 4, (4 * f.w + 12) * 4 + 4)]).toEqual([
      ...color,
      128,
    ]);
    expect(f.pixels[(3 * f.w + 12) * 4 + 3]).toBe(0);
  });
  it('only guides the selected unfinished region and clears previous hints', () => {
    const f = fixture();
    f.labels[10 * f.w + 10] = 8;
    drawColoringHintOutline(f.pixels, f.labels, f.w, f.h, new Set([8]), color);
    expect(f.pixels[4 * f.w * 4 + 3]).toBe(0);
    expect(f.pixels[(10 * f.w + 10) * 4 + 3]).toBe(128);
    drawColoringHintOutline(f.pixels, f.labels, f.w, f.h, new Set(), color);
    expect(f.pixels.every((v) => v === 0)).toBe(true);
  });
  it('keeps thin regions and canvas borders visible without leaking into adjacent regions', () => {
    const labels = new Int32Array([1, 2, 2, 1, 2, 2, 1, 2, 2]);
    const pixels = new Uint8ClampedArray(36);
    drawColoringHintOutline(pixels, labels, 3, 3, new Set([1]), color, 2);
    for (let i = 0; i < 9; i++) expect(pixels[i * 4 + 3]).toBe(labels[i] === 1 ? 128 : 0);
  });
});
