import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { buildPalette } from '../packages/client/src/features/games/lib/answer-colors.ts';
import { buildSceneColoringRegions } from '../packages/client/src/features/games/lib/scene-coloring-regions.ts';
const require = createRequire(new URL('../packages/server/package.json', import.meta.url));
const sharp = require('sharp');
const root =
  path.resolve(process.env.SCENE_COLORING_ROOT || 'D:/ComfyUI-output/classic-scene-coloring') + '/';
const jobs = JSON.parse(fs.readFileSync(root + 'manifest.json', 'utf8'));
const reports = fs.existsSync(root + 'audit.json')
  ? JSON.parse(fs.readFileSync(root + 'audit.json', 'utf8'))
  : [];
fs.mkdirSync(root + 'audit', { recursive: true });
for (const j of jobs.filter(
  (j) =>
    j.status === 'generated' &&
    (!process.argv[2] || process.argv[2] === '--missing' || j.key === process.argv[2])
)) {
  const previousReport = reports.find((r) => r.key === j.key);
  if (
    process.argv[2] === '--missing' &&
    previousReport?.sourceSha256 === j.sourceSha256 &&
    previousReport?.lineartSha256 === j.lineartSha256 &&
    fs.existsSync(root + 'audit/' + j.key + '-filled.png')
  )
    continue;
  const { data, info } = await sharp(root + j.lineartFile)
    .flatten({ background: '#fff' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width,
    h = info.height,
    n = w * h;
  const { walls, regions, required } = buildSceneColoringRegions(new Uint8ClampedArray(data), w, h);
  const source = await sharp(root + j.sourceFile)
    .resize(w, h, { fit: 'contain', background: '#fff' })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const { palette, colorOfRegion } = buildPalette(
    regions,
    new Uint8ClampedArray(source),
    required,
    undefined,
    j.colorSampling
  );
  const out = Buffer.alloc(n * 3, 255);
  for (let i = 0; i < n; i++) {
    let rgb = walls[i] ? [0, 0, 0] : [255, 255, 255];
    const c = colorOfRegion.get(regions.labels[i]);
    if (c)
      rgb = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    for (let k = 0; k < 3; k++) out[i * 3 + k] = rgb[k];
  }
  await sharp(out, { raw: { width: w, height: h, channels: 3 } })
    .png()
    .toFile(root + 'audit/' + j.key + '-filled.png');
  const report = {
    key: j.key,
    sourceSha256: j.sourceSha256,
    lineartSha256: j.lineartSha256,
    regions: regions.sizes.length - 1,
    required: palette.flatMap((p) => p.regionIds).length,
    colors: palette.length,
    paintablePercent: Math.round((palette.reduce((s, p) => s + p.area, 0) / n) * 1000) / 10,
  };
  const previous = reports.findIndex((r) => r.key === j.key);
  if (previous >= 0) reports[previous] = report;
  else reports.push(report);
  console.log(JSON.stringify(report));
}
fs.writeFileSync(root + 'audit.json', JSON.stringify(reports, null, 2));
