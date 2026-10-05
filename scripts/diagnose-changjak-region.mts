import fs from 'node:fs';
import { createRequire } from 'node:module';
import { buildSceneColoringRegions } from '../packages/client/src/features/games/lib/scene-coloring-regions.ts';
import { buildPalette } from '../packages/client/src/features/games/lib/answer-colors.ts';
const sharp = createRequire(new URL('../packages/server/package.json', import.meta.url))('sharp');
const [collection, key, ...points] = process.argv.slice(2);
const root = 'D:/ComfyUI-output/classic-scene-coloring/' + collection + '/';
const j = JSON.parse(fs.readFileSync(root + 'manifest.json', 'utf8')).find((j) => j.key === key);
const { data, info } = await sharp(root + j.lineartFile)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { walls, regions, required } = buildSceneColoringRegions(
  new Uint8ClampedArray(data),
  info.width,
  info.height
);
const source = await sharp(root + j.sourceFile)
  .resize(info.width, info.height, { fit: 'contain', background: '#fff' })
  .ensureAlpha()
  .raw()
  .toBuffer();
const { colorOfRegion } = buildPalette(
  regions,
  new Uint8ClampedArray(source),
  required,
  undefined,
  j.colorSampling
);
for (const p of points) {
  const [x, y] = p.split(',').map(Number);
  const i = Math.floor(y * info.height) * info.width + Math.floor(x * info.width);
  const id = regions.labels[i];
  console.log(
    JSON.stringify({
      key,
      point: p,
      width: info.width,
      height: info.height,
      region: id,
      area: regions.sizes[id],
      required: required.includes(id),
      color: colorOfRegion.get(id),
      wall: !!walls[i],
    })
  );
}
