import fs from 'node:fs';
import { createRequire } from 'node:module';
import {
  buildWalls,
  labelRegions,
  paintableRegions,
  borderRegions,
} from '../packages/shared/src/utils/flood-fill.ts';
import { buildPalette } from '../packages/client/src/features/games/lib/answer-colors.ts';
const require = createRequire(new URL('../packages/server/package.json', import.meta.url));
const sharp = require('sharp');
const root = 'D:/ComfyUI-output/classic-scene-coloring/';
const jobs = JSON.parse(fs.readFileSync(root + 'manifest.json', 'utf8'));
for (const key of ['1789350946332-p02', '1789350946317-p13', '1789350946386-p03']) {
  const job = jobs.find((j) => j.key === key);
  const { data, info } = await sharp(root + job.lineartFile)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const source = await sharp(root + job.sourceFile)
    .resize(info.width, info.height, { fit: 'contain', background: '#fff' })
    .ensureAlpha()
    .raw()
    .toBuffer();
  for (const threshold of [128, 192, 224]) {
    const regions = labelRegions(
      buildWalls(new Uint8ClampedArray(data), threshold),
      info.width,
      info.height
    );
    const borders = borderRegions(regions.labels, info.width, info.height);
    const largest = [...borders].sort((a, b) => regions.sizes[b] - regions.sizes[a])[0];
    for (const [mode, excluded] of [
      ['all-border', borders],
      ['largest-border', new Set(largest ? [largest] : [])],
    ]) {
      const required = paintableRegions(
        regions,
        info.width * info.height,
        0.003,
        excluded as Set<number>
      );
      const { palette } = buildPalette(regions, new Uint8ClampedArray(source), required);
      console.log(
        JSON.stringify({
          key,
          threshold,
          mode,
          regions: regions.sizes.length - 1,
          required: palette.flatMap((p) => p.regionIds).length,
          colors: palette.length,
          area:
            Math.round(
              (palette.reduce((sum, p) => sum + p.area, 0) / (info.width * info.height)) * 1000
            ) / 10,
        })
      );
    }
  }
}
