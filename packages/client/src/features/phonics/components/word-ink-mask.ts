/** Original font pixels, split into connected parts so a dot/short separate stroke cannot be skipped. */
export interface WordInkMask {
  pixels: number[];
  parts: number[][];
}

export function buildWordInkMasks(
  guide: Uint8ClampedArray,
  width: number,
  ranges: ReadonlyArray<{ start: number; end: number }>
): WordInkMask[] {
  const owners = new Int16Array(guide.length / 4).fill(-1);
  const masks: WordInkMask[] = ranges.map(() => ({ pixels: [], parts: [] }));
  for (let pixel = 0; pixel < owners.length; pixel++) {
    if (!guide[pixel * 4 + 3]) continue;
    const x = pixel % width;
    const owner = ranges.findIndex((range) => x >= range.start && x < range.end);
    if (owner < 0) continue;
    owners[pixel] = owner;
    masks[owner].pixels.push(pixel);
  }
  const visited = new Uint8Array(owners.length);
  for (let owner = 0; owner < masks.length; owner++) {
    for (const seed of masks[owner].pixels) {
      if (visited[seed]) continue;
      const part = [seed];
      visited[seed] = 1;
      for (let at = 0; at < part.length; at++) {
        const pixel = part[at];
        const x = pixel % width;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const next = pixel + dy * width + dx;
            if (x + dx < 0 || x + dx >= width || next < 0 || next >= owners.length) continue;
            if (visited[next] || owners[next] !== owner) continue;
            visited[next] = 1;
            part.push(next);
          }
        }
      }
      masks[owner].parts.push(part);
    }
  }
  return masks;
}

function isPainted(data: Uint8ClampedArray, pixel: number): boolean {
  const p = pixel * 4;
  return data[p + 3] > 0 && data[p + 1] > data[p] + 20 && data[p + 1] > data[p + 2] + 20;
}

export function isWordInkComplete(
  data: Uint8ClampedArray,
  mask: WordInkMask,
  threshold: number
): boolean {
  if (!mask.pixels.length) return false;
  let painted = 0;
  for (const pixel of mask.pixels) if (isPainted(data, pixel)) painted++;
  if (painted / mask.pixels.length < threshold) return false;
  // Ignore only isolated raster dust, not real detached parts such as i/j dots or ㅎ strokes.
  return mask.parts.every((part) => {
    if (part.length < 4) return true;
    let covered = 0;
    for (const pixel of part) if (isPainted(data, pixel)) covered++;
    return covered / part.length >= 0.5;
  });
}

/** Snap only the accepted cell to the original font silhouette, retaining its antialiased edge. */
export function finishWordInk(
  data: Uint8ClampedArray,
  original: Uint8ClampedArray,
  mask: WordInkMask
): void {
  for (const pixel of mask.pixels) {
    const p = pixel * 4;
    data[p] = 16;
    data[p + 1] = 185;
    data[p + 2] = 129;
    data[p + 3] = original[p + 3];
  }
}
