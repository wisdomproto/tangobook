/** Offline diagnostic only: compare tiny boundary-gap closing with the current engine. */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildWalls,
  labelRegions,
  borderRegions,
  paintableRegions,
} from '../packages/shared/src/utils/flood-fill.ts';
import { buildPalette } from '../packages/client/src/features/games/lib/answer-colors.ts';
const require = createRequire(new URL('../packages/server/package.json', import.meta.url));
const sharp = require('sharp');
const root = 'D:/ComfyUI-output/classic-scene-coloring';
const output = path.join(root, 'gap-diagnostic');
fs.mkdirSync(output, { recursive: true });

function filter(mask: Uint8Array, width: number, height: number, radius: number, dilate: boolean) {
  const horizontal = new Uint8Array(mask.length);
  const result = new Uint8Array(mask.length);
  const span = 2 * radius + 1;
  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let x = -radius; x <= radius; x++)
      sum += mask[y * width + Math.max(0, Math.min(width - 1, x))];
    for (let x = 0; x < width; x++) {
      horizontal[y * width + x] = dilate ? Number(sum > 0) : Number(sum === span);
      sum -= mask[y * width + Math.max(0, x - radius)];
      sum += mask[y * width + Math.min(width - 1, x + radius + 1)];
    }
  }
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++)
      sum += horizontal[Math.max(0, Math.min(height - 1, y)) * width + x];
    for (let y = 0; y < height; y++) {
      result[y * width + x] = dilate ? Number(sum > 0) : Number(sum === span);
      sum -= horizontal[Math.max(0, y - radius) * width + x];
      sum += horizontal[Math.min(height - 1, y + radius + 1) * width + x];
    }
  }
  return result;
}

const report = [];
for (const [directory, key] of [
  ['hori-life', '1782815785821-p02'],
  ['hori-kindergarten', '1784550867162-p06'],
  ['nature', '1773711154702-p11'],
]) {
  const local = path.join(root, directory);
  const job = JSON.parse(fs.readFileSync(path.join(local, 'manifest.json'), 'utf8')).find(
    (j) => j.key === key
  );
  const { data, info } = await sharp(path.join(local, job.lineartFile))
    .flatten({ background: '#fff' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const width = info.width,
    height = info.height,
    count = width * height;
  const source = new Uint8ClampedArray(
    await sharp(path.join(local, job.sourceFile))
      .resize(width, height, { fit: 'contain', background: '#fff' })
      .ensureAlpha()
      .raw()
      .toBuffer()
  );
  const original = buildWalls(new Uint8ClampedArray(data), 192);
  for (const radius of [0, 1, 2, 3]) {
    const closed = radius
      ? filter(filter(original, width, height, radius, true), width, height, radius, false)
      : original;
    const walls = new Uint8Array(count);
    let addedWalls = 0;
    for (let i = 0; i < count; i++) {
      walls[i] = original[i] || closed[i];
      addedWalls += Number(!original[i] && !!walls[i]);
    }
    const regions = labelRegions(walls, width, height);
    const borders = borderRegions(regions.labels, width, height);
    let background = 0;
    for (const id of borders)
      if (regions.sizes[id] > (regions.sizes[background] ?? 0)) background = id;
    const required = paintableRegions(
      regions,
      count,
      0.003,
      new Set(background ? [background] : [])
    );
    const { palette, colorOfRegion } = buildPalette(regions, source, required);
    const bytes = Buffer.alloc(count * 3, 255);
    for (let i = 0; i < count; i++) {
      const color = colorOfRegion.get(regions.labels[i]);
      const rgb = walls[i]
        ? [0, 0, 0]
        : color
          ? [1, 3, 5].map((k) => parseInt(color.slice(k, k + 2), 16))
          : [255, 255, 255];
      for (let k = 0; k < 3; k++) bytes[i * 3 + k] = rgb[k];
    }
    await sharp(bytes, { raw: { width, height, channels: 3 } })
      .png()
      .toFile(path.join(output, key + '-r' + radius + '.png'));
    report.push({
      key,
      radius,
      addedWalls,
      required: palette.flatMap((p) => p.regionIds).length,
      colors: palette.length,
      paintablePercent: Math.round((palette.reduce((s, p) => s + p.area, 0) / count) * 1000) / 10,
    });
  }
}
fs.writeFileSync(
  path.join(output, 'report.json'),
  JSON.stringify(
    { experimentalOnly: true, activeImagesOrEngineChanged: false, results: report },
    null,
    2
  )
);
console.log(JSON.stringify(report));
