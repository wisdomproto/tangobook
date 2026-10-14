/** Highlight only the inside edge of unfinished regions; leave the paper unpainted. */
export function drawColoringHintOutline(
  pixels: Uint8ClampedArray,
  labels: Int32Array,
  width: number,
  height: number,
  regionIds: ReadonlySet<number>,
  rgb: readonly [number, number, number],
  thickness = Math.max(1, Math.round(Math.min(width, height) / 240)),
  alpha = 128
): void {
  pixels.fill(0);
  if (labels.length !== width * height || pixels.length !== width * height * 4) return;
  if (regionIds.size === 0) return;
  for (let i = 0; i < labels.length; i++) {
    const id = labels[i];
    if (!regionIds.has(id)) continue;
    const x = i % width;
    const y = Math.floor(i / width);
    let edge = false;
    for (let d = 1; d <= thickness; d++) {
      if (
        x < d ||
        x + d >= width ||
        y < d ||
        y + d >= height ||
        labels[i - d] !== id ||
        labels[i + d] !== id ||
        labels[i - d * width] !== id ||
        labels[i + d * width] !== id
      ) {
        edge = true;
        break;
      }
    }
    if (!edge) continue;
    const o = i * 4;
    pixels[o] = rgb[0];
    pixels[o + 1] = rgb[1];
    pixels[o + 2] = rgb[2];
    pixels[o + 3] = alpha;
  }
}
