/** Sync only the authorized test namespace; preserve published classic content. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = 'D:/ComfyUI-output/classic-scene-coloring';
const prefix = 'tests/classic-scene-coloring/20261001-review-1';
const require = createRequire(path.join(workspace, 'packages/server/package.json'));
require('dotenv').config({ path: 'C:/projects/tangobook/packages/server/.env', quiet: true });
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const classic = JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8'));
const collections = JSON.parse(
  await fs.readFile(path.join(workspace, 'scripts/scene-coloring-collections.json'), 'utf8')
);
let traditional = [];
try {
  traditional = JSON.parse(await fs.readFile(path.join(root, 'traditional/manifest.json'), 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const fields = [
  'key',
  'bookId',
  'title',
  'artStyle',
  'pageNumber',
  'originalUrl',
  'text',
  'ttsUrl',
  'translations',
  'backgroundMusicUrl',
  'sourceFile',
  'lineartFile',
  'status',
  'sourceSha256',
  'lineartSha256',
  'colorCheck',
  'colorSampling',
  'collection',
];
const jobs = [
  ...classic.map((j) => ({ ...j, collection: 'classic' })),
  ...traditional.map((j) => ({
    ...j,
    collection: 'traditional',
    sourceFile: 'traditional/' + j.sourceFile,
    lineartFile: 'traditional/' + j.lineartFile,
  })),
];
for (const collection of collections.slice(2)) {
  let extra = [];
  try {
    extra = JSON.parse(
      await fs.readFile(path.join(root, collection.directory, 'manifest.json'), 'utf8')
    );
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  jobs.push(
    ...extra.map((j) => ({
      ...j,
      collection: collection.id,
      sourceFile: collection.directory + '/' + j.sourceFile,
      lineartFile: collection.directory + '/' + j.lineartFile,
    }))
  );
}
// Keep the published version while a local replacement fails game validation.
let previousPublic = [];
try {
  previousPublic = JSON.parse(await fs.readFile(path.join(root, 'gallery-manifest.json'), 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
for (let i = 0; i < jobs.length; i++) {
  if (!jobs[i].previewHold) continue;
  const previous = previousPublic.find((j) => j.key === jobs[i].key);
  jobs[i] = previous || { ...jobs[i], status: 'review-pending' };
}
const publicJobs = jobs.map((j) =>
  Object.fromEntries(fields.filter((k) => j[k] !== undefined).map((k) => [k, j[k]]))
);
const ledgerPath = path.join(root, 'preview-upload-ledger.json');
let ledger;
try {
  ledger = JSON.parse(await fs.readFile(ledgerPath, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  ledger = {};
  // Initial deployment snapshot is the evidence for already uploaded files.
  const published = JSON.parse(
    await fs.readFile(path.join(root, 'hosted-preview/manifest.json'), 'utf8')
  );
  for (const j of published)
    for (const kind of ['source', 'lineart'])
      if (j[kind + 'Sha256']) ledger[j[kind + 'File']] = j[kind + 'Sha256'];
}
async function put(key, body, type) {
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: prefix + '/' + key,
      Body: body,
      ContentType: type,
      CacheControl:
        key.endsWith('.json') || key.endsWith('.html') ? 'no-cache' : 'public, max-age=86400',
    })
  );
}
const files = [];
for (const j of jobs)
  for (const kind of ['source', 'lineart']) {
    if (kind === 'lineart' && j.status !== 'generated') continue;
    const key = j[kind + 'File'],
      hash = j[kind + 'Sha256'];
    if (!hash) throw new Error('Missing hash: ' + key);
    if (ledger[key] === hash) continue;
    files.push({ key, hash });
  }
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (files.length) {
      const item = files.shift(),
        body = await fs.readFile(path.join(root, item.key));
      if (createHash('sha256').update(body).digest('hex') !== item.hash)
        throw new Error('Hash mismatch: ' + item.key);
      await put(item.key, body, 'image/png');
      ledger[item.key] = item.hash;
    }
  })
);
await fs.writeFile(ledgerPath + '.tmp', JSON.stringify(ledger, null, 2));
await fs.rename(ledgerPath + '.tmp', ledgerPath);
const template = await fs.readFile(
  path.join(workspace, 'scripts/classic-scene-coloring-gallery.html'),
  'utf8'
);
const serialized = JSON.stringify(publicJobs).replaceAll('<', '\\u003c');
const html = template
  .replace('__MANIFEST__', serialized)
  .replaceAll('http://127.0.0.1:5191/play', './play.html');
await put('manifest.json', JSON.stringify(publicJobs), 'application/json');
await put('gallery-manifest.json', JSON.stringify(publicJobs), 'application/json');
await put('index.html', html, 'text/html; charset=utf-8');
// Local combined gallery uses the same content, with the local player endpoint.
await fs.writeFile(path.join(root, 'index.html'), template.replace('__MANIFEST__', serialized));
await fs.writeFile(path.join(root, 'gallery-manifest.json'), JSON.stringify(publicJobs));
const status = {
  updatedAt: new Date().toISOString(),
  classic: classic.filter((j) => j.status === 'generated').length,
  traditional: traditional.filter((j) => j.status === 'generated').length,
  traditionalTotal: traditional.length,
  url: 'https://assets.tangobook.co.kr/' + prefix + '/index.html',
};
await fs.writeFile(path.join(root, 'preview-sync-status.json'), JSON.stringify(status, null, 2));
console.log(JSON.stringify(status));
