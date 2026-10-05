import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from '../packages/server/node_modules/sharp/lib/index.js';
import {
  buildWalls,
  labelRegions,
  paintableRegions,
  borderRegions,
} from '../packages/shared/src/utils/flood-fill.ts';
import {
  buildPalette,
  cornerBackground,
  boundsOf,
} from '../packages/client/src/features/games/lib/answer-colors.ts';

// Measure the actual game's segmentation; no tracing, repair, or generated pixels here.
const root = 'generated-images/changjak-word-coloring';
const measurementVersion = crypto
  .createHash('sha256')
  .update(fs.readFileSync(new URL(import.meta.url)))
  .update(fs.readFileSync('packages/client/src/features/games/lib/answer-colors.ts'))
  .digest('hex');
const jobs = JSON.parse(fs.readFileSync(root + '/jobs.json', 'utf8')).jobs;
const size = 512;
const results = [];
const prior = fs.existsSync(root + '/measurements.json')
  ? JSON.parse(fs.readFileSync(root + '/measurements.json', 'utf8'))
  : [];
const geometry = fs.existsSync(root + '/geometry.json')
  ? JSON.parse(fs.readFileSync(root + '/geometry.json', 'utf8'))
  : {};
for (const job of jobs) {
  if (!fs.existsSync(job.out)) continue;
  const source = fs.readFileSync(job.out);
  const sourceSha256 = crypto.createHash('sha256').update(source).digest('hex');
  const overrides = job.cards.map((c) => root + '/overrides/' + c.id + '.png');
  const overrideHash = crypto.createHash('sha256');
  for (const p of overrides) if (fs.existsSync(p)) overrideHash.update(fs.readFileSync(p));
  const overridesSha256 = overrideHash.digest('hex');
  const geometrySha256 = crypto
    .createHash('sha256')
    .update(JSON.stringify(job.cards.map((c) => geometry[c.id] ?? null)))
    .digest('hex');
  const cached = prior.filter(
    (p) =>
      p.sheet === job.id &&
      p.sheetSha256 === sourceSha256 &&
      p.measurementVersion === measurementVersion &&
      p.overridesSha256 === overridesSha256 &&
      p.geometrySha256 === geometrySha256
  );
  if (cached.length === job.cards.length) {
    results.push(...cached);
    continue;
  }
  const metadata = await sharp(source).metadata();
  if (Math.abs(metadata.width / 3 - metadata.height / 2) > 4)
    throw Error(job.id + ' invalid geometry');
  for (const [n, card] of job.cards.entries()) {
    const x = n % 3,
      y = Math.floor(n / 3),
      margin = job.inset;
    const selected = geometry[card.id];
    if (selected && selected.sheetSha256 !== sourceSha256) throw Error(card.id + ' stale geometry');
    const left = selected?.box[0] ?? Math.round((x * metadata.width) / 3) + margin;
    const top = selected?.box[1] ?? Math.round((y * metadata.height) / 2) + margin;
    const width = (selected?.box[2] ?? Math.round(((x + 1) * metadata.width) / 3) - margin) - left;
    const height = (selected?.box[3] ?? Math.round(((y + 1) * metadata.height) / 2) - margin) - top;
    const override = overrides[n];
    const input = fs.existsSync(override)
      ? sharp(override)
      : sharp(source).extract({ left, top, width, height });
    const pixels = await input.resize(size, size).ensureAlpha().raw().toBuffer();
    const rgba = new Uint8ClampedArray(pixels.buffer, pixels.byteOffset, pixels.length);
    const walls = buildWalls(rgba);
    const regions = labelRegions(walls, size, size);
    const candidates = paintableRegions(
      regions,
      size * size,
      0.003,
      borderRegions(regions.labels, size, size)
    );
    const area = candidates.reduce((sum, id) => sum + regions.sizes[id], 0) / (size * size);
    const original = await sharp(card.file).resize(size, size).ensureAlpha().raw().toBuffer();
    const flat = new Uint8ClampedArray(original.buffer, original.byteOffset, original.length);
    const background = cornerBackground(flat, size, size);
    const subject = boundsOf(size, size, (i) =>
      [0, 1, 2].some((c) => Math.abs(flat[i * 4 + c] - background[c]) > 18)
    );
    const ink = boundsOf(size, size, (i) => walls[i] === 1);
    // Same bounds/background policy as ColoringPlayer.readColorSource. Sharp interpolation is
    // an offline approximation; a browser play test remains separate evidence.
    const adjusted = await sharp(original, { raw: { width: size, height: size, channels: 4 } })
      .extract({ left: subject.x, top: subject.y, width: subject.w, height: subject.h })
      .resize(ink.w, ink.h)
      .raw()
      .toBuffer();
    const reference = new Uint8ClampedArray(original.length);
    for (let i = 0; i < size * size; i++)
      reference.set([...background.map(Math.round), 255], i * 4);
    for (let yy = 0; yy < ink.h; yy++)
      for (let xx = 0; xx < ink.w; xx++) {
        const to = ((yy + ink.y) * size + xx + ink.x) * 4,
          from = (yy * ink.w + xx) * 4;
        reference.set(adjusted.subarray(from, from + 4), to);
      }
    const paletteResult = buildPalette(regions, reference, candidates, background);
    const filled = Buffer.from(pixels);
    for (let i = 0; i < size * size; i++) {
      const color = paletteResult.colorOfRegion.get(regions.labels[i]);
      if (!color) continue;
      for (let c = 0; c < 3; c++)
        filled[i * 4 + c] = parseInt(color.slice(1 + c * 2, 3 + c * 2), 16);
    }
    await sharp(filled, { raw: { width: size, height: size, channels: 4 } })
      .png()
      .toFile(root + '/review/' + card.id + '-filled.png');
    let colored = 0;
    for (let p = 0; p < pixels.length; p += 4) {
      if (Math.max(...pixels.subarray(p, p + 3)) - Math.min(...pixels.subarray(p, p + 3)) > 32)
        colored++;
    }
    let foreground = 0,
      unpainted = 0;
    for (let i = 0; i < size * size; i++) {
      if (walls[i] || ![0, 1, 2].some((c) => Math.abs(reference[i * 4 + c] - background[c]) > 40))
        continue;
      foreground++;
      if (!paletteResult.colorOfRegion.has(regions.labels[i])) unpainted++;
    }
    const missingRatio = foreground ? unpainted / foreground : 0;
    results.push({
      id: card.id,
      sheet: job.id,
      sheetSha256: sourceSha256,
      overridesSha256,
      geometrySha256,
      measurementVersion,
      word: card.word,
      regions: candidates.length,
      area,
      colored: colored / (size * size),
      missingRatio,
      palette: paletteResult.palette.map((p) => ({
        color: p.color,
        regions: p.regionIds.length,
        area: p.area,
      })),
      flags: [
        ...(candidates.length === 0 ? ['empty'] : []),
        ...(paletteResult.palette.length === 0 ? ['empty-palette'] : []),
        ...(area < 0.05 ? ['low-area'] : []),
        ...(missingRatio > 0.35 ? ['unpainted-subject'] : []),
        ...(candidates.length > 20 ? ['busy'] : []),
        ...(colored / (size * size) > 0.001 ? ['colored'] : []),
      ],
    });
  }
}
fs.writeFileSync(root + '/measurements.json', JSON.stringify(results, null, 2));
fs.writeFileSync(
  root + '/repair-candidates.json',
  JSON.stringify(
    results.filter((c) => c.flags.length),
    null,
    2
  )
);
console.log(
  JSON.stringify({
    cards: results.length,
    flagged: results.filter((c) => c.flags.length).length,
    empty: results
      .filter((c) => c.flags.includes('empty'))
      .map((c) => ({ id: c.id, word: c.word, sheet: c.sheet })),
  })
);
