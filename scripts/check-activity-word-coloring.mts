import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import sharp from '../packages/server/node_modules/sharp/lib/index.js';
import {
  buildWalls,
  labelRegions,
  paintableRegions,
  borderRegions,
} from '../packages/shared/src/utils/flood-fill.ts';
const root = fileURLToPath(
  new URL('../generated-images/activity-completion-20261013/', import.meta.url)
);
const cards = [
  ...JSON.parse(fs.readFileSync(path.join(root, 'coloring-selected.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(root, 'extra-coloring/selected.json'), 'utf8')),
];
for (const semantic of JSON.parse(
  fs.readFileSync(path.join(root, 'semantic/registration.json'), 'utf8')
))
  cards.push({
    token: semantic.token,
    lineart: { file: 'semantic/' + semantic.token + '-lineart.png' },
  });
const measurements = [];
const seen = new Set<string>();
for (const card of cards) {
  if (seen.has(card.token)) continue;
  seen.add(card.token);
  const pixels = await sharp(path.join(root, card.lineart.file))
    .resize(512, 512)
    .ensureAlpha()
    .raw()
    .toBuffer();
  const rgba = new Uint8ClampedArray(pixels.buffer, pixels.byteOffset, pixels.length);
  const walls = buildWalls(rgba),
    regions = labelRegions(walls, 512, 512);
  const candidates = paintableRegions(
    regions,
    512 * 512,
    0.003,
    borderRegions(regions.labels, 512, 512)
  );
  assert(candidates.length > 0, card.token + ' has no usable closed regions');
  let chromatic = 0;
  for (let i = 0; i < rgba.length; i += 4)
    if (
      Math.max(rgba[i], rgba[i + 1], rgba[i + 2]) - Math.min(rgba[i], rgba[i + 1], rgba[i + 2]) >
      8
    )
      chromatic++;
  assert(chromatic / (512 * 512) < 0.001, card.token + ' contains colored pixels');
  measurements.push({
    token: card.token,
    regions: candidates.length,
    area: candidates.reduce((sum, id) => sum + regions.sizes[id], 0) / (512 * 512),
    chromatic,
  });
}
fs.writeFileSync(
  path.join(root, 'coloring-measurements.json'),
  JSON.stringify(measurements, null, 2)
);
console.log(
  JSON.stringify({
    files: measurements.length,
    links: cards.length,
    minRegions: Math.min(...measurements.map((m) => m.regions)),
  })
);
