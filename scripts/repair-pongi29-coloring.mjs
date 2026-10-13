/** Publish only two verified Pongi29 replacements, preserving all other rows/assets. */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const workspace = path.resolve('.');
const root = path.join(workspace, 'generated-images/pongi29-repair-20261013');
const localRoot = 'D:/ComfyUI-output/classic-scene-coloring';
const prefix = 'tests/classic-scene-coloring/20261001-review-1';
const base = 'https://assets.tangobook.co.kr/' + prefix + '/';
const read = async (p) => JSON.parse((await fs.readFile(p, 'utf8')).replace(/^\uFEFF/, ''));
const save = (p, value) => fs.writeFile(p, JSON.stringify(value, null, 2) + '\n');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const jobs = await read(path.join(root, 'manifest.json'));
const registration = await read(path.join(root, 'page-registration.json'));
const pageEntries = await read(path.join(root, 'pages-manifest.json'));
const play = await read(path.join(root, 'browser/coloring-full-play.json'));
assert.deepEqual(
  jobs.map((j) => j.pageNumber),
  [4, 8]
);
for (const n of [4, 8])
  for (const lang of ['ko', 'en'])
    assert(
      play.some(
        (r) => r.page === n && r.lang === lang && r.allRegionsCompleted && r.narrationNaturallyEnded
      )
    );
assert(registration.bookVerified);
const require = createRequire(path.join(workspace, 'packages/server/package.json'));
require('dotenv').config({ path: 'C:/projects/tangobook/packages/server/.env', quiet: true });
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const get = async (key) =>
  (
    await client.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: prefix + '/' + key,
      })
    )
  ).Body.transformToString();
const put = (key, bytes, type) =>
  client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: prefix + '/' + key,
      Body: bytes,
      ContentType: type,
      CacheControl: type.startsWith('image/') ? 'public, max-age=86400' : 'no-cache',
    })
  );
const changes = {};
for (const j of jobs) {
  const bytes = await fs.readFile(path.join(root, j.lineartFile));
  assert.equal(sha(bytes), j.lineartSha256);
  const { data, info } = await sharp(bytes)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let coloredPixels = 0;
  for (let i = 0; i < data.length; i += 3)
    if (
      Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) >
      12
    )
      coloredPixels++;
  assert.equal(coloredPixels, 0);
  changes[j.key] = {
    ...j,
    sourceFile: 'changjak-pongi/' + j.sourceFile,
    lineartFile: 'changjak-pongi/' + j.lineartFile,
    originalUrl: registration.uploads[j.pageNumber],
    revealOriginalUrl: registration.uploads[j.pageNumber],
    colorCheck: { monochromePassed: true, coloredPixels, totalPixels: info.width * info.height },
  };
  for (const kind of ['source', 'lineart']) {
    const b = await fs.readFile(path.join(root, j[kind + 'File']));
    assert.equal(sha(b), j[kind + 'Sha256']);
    const key = changes[j.key][kind + 'File'];
    await put(key, b, 'image/png');
    const response = await fetch(base + key + '?v=' + j[kind + 'Sha256'].slice(0, 12));
    assert(response.ok);
    assert.equal(sha(Buffer.from(await response.arrayBuffer())), j[kind + 'Sha256']);
    await fs.copyFile(path.join(root, j[kind + 'File']), path.join(localRoot, key));
  }
  await fs.copyFile(
    path.join(root, j.lineartFile),
    path.join(workspace, 'generated-images/pongi-scene-coloring/lineart/' + j.key + '.png')
  );
}
function replace(rows, local = false) {
  let replaced = 0;
  const updated = rows.map((row) => {
    const change = changes[row.key];
    if (!change) return row;
    assert.equal(row.bookId, 'changjak-pongi-29');
    replaced++;
    return {
      ...row,
      ...change,
      ...(local
        ? {
            sourceFile: change.sourceFile.replace('changjak-pongi/', ''),
            lineartFile: change.lineartFile.replace('changjak-pongi/', ''),
            sourceOrigin:
              'Corrected approved Pongi29 cast; aligned native GPT color answer 2026-10-13',
            reviewStatus: 'all-four-ko-en-brush-reveal-native-tts-completed',
            previewHold: false,
            generation: {
              skill: 'gpt-image',
              mode: 'built-in',
              outputSha256: change.lineartSha256,
              outputFile: 'generated-images/pongi-scene-coloring/lineart/' + row.key + '.png',
            },
          }
        : {}),
    };
  });
  assert.equal(replaced, 2);
  assert.deepEqual(
    updated.filter((j) => !changes[j.key]),
    rows.filter((j) => !changes[j.key])
  );
  return updated;
}
for (const file of ['manifest.json', 'gallery-manifest.json']) {
  const beforeText = await get(file);
  const before = JSON.parse(beforeText);
  assert.equal(before.length, 2430);
  const updated = replace(before);
  assert.equal(await get(file), beforeText, 'Concurrent catalog edit');
  await put(file, JSON.stringify(updated), 'application/json');
  assert.deepEqual(JSON.parse(await get(file)), updated);
}
for (const [file, local] of [
  ['changjak-pongi/manifest.json', true],
  ['gallery-manifest.json', false],
]) {
  const p = path.join(localRoot, file);
  await save(p, replace(await read(p), local));
}
// Keep the combined preview HTML's embedded manifest current without a broad content sync.
const currentPublic = JSON.parse(await get('manifest.json'));
const template = await fs.readFile(
  path.join(workspace, 'scripts/classic-scene-coloring-gallery.html'),
  'utf8'
);
const embedded = JSON.stringify(currentPublic).replaceAll('<', '\\u003c');
await put(
  'index.html',
  template
    .replace('__MANIFEST__', embedded)
    .replaceAll('http://127.0.0.1:5191/play', './play.html'),
  'text/html; charset=utf-8'
);
await fs.writeFile(path.join(localRoot, 'index.html'), template.replace('__MANIFEST__', embedded));
const ledgerPath = path.join(localRoot, 'preview-upload-ledger.json');
const ledger = await read(ledgerPath);
for (const change of Object.values(changes))
  for (const kind of ['source', 'lineart']) ledger[change[kind + 'File']] = change[kind + 'Sha256'];
await save(ledgerPath, ledger);
// Only these two application catalog entries change; unrelated originals stay as before.
const catalogPath = path.join(
  workspace,
  'packages/client/src/features/games/data/scene-coloring-catalog.json'
);
const catalog = await read(catalogPath);
catalog['changjak-pongi-29'] = catalog['changjak-pongi-29'].map((s) => {
  const c = changes[s.key];
  assert(c);
  return {
    ...s,
    originalUrl: c.originalUrl,
    minRegionAreaRatio: c.minRegionAreaRatio,
    lineartUrl: base + c.lineartFile + '?v=' + c.lineartSha256.slice(0, 12),
    colorSourceUrl: base + c.sourceFile + '?v=' + c.sourceSha256.slice(0, 12),
  };
});
await save(catalogPath, catalog);
const hiddenPath = path.join(
  workspace,
  'docs/work/games/tasks/20261013-hidden-object-manifest.json'
);
const hidden = await read(hiddenPath);
const entry = hidden.find((e) => e.id === 'changjak-pongi-29');
assert(entry);
Object.assign(entry, {
  pageNumber: 5,
  sceneImageUrl: registration.hiddenScene.sceneImageUrl,
  hotspots: registration.hiddenScene.hotspots,
  newImage: false,
  reviewEvidence:
    'Correct Pongi/Dad/Baby cast; newly repaired p5 and fish/shell hotspots; English game 2/2 and restart verified 2026-10-13',
});
await fs.writeFile(hiddenPath, JSON.stringify(hidden));
await save(path.join(workspace, 'docs/work/content/tasks/20261013-pongi29-assets.json'), {
  bookId: 'changjak-pongi-29',
  approvedCast: 'Pongi red cord / Dad brown overalls / Baby shell without cord',
  pages: Object.entries(registration.uploads).map(([page, url]) => ({
    pageNumber: Number(page),
    url,
    sha256: pageEntries.find((e) => e.page === Number(page)).sha256,
  })),
  coloring: Object.values(changes),
  hiddenScene: registration.hiddenScene,
  verification: {
    protectedBookFields: true,
    allFourKoEnFullBrushNativeTts: true,
    onlyTwoCatalogRowsChanged: true,
    cdnSha256Matched: true,
  },
});
console.log('Published/verified exactly two coloring pairs; 2428 other rows preserved');
