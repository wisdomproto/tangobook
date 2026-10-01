/** Publish the explicitly requested static test gallery, without changing book records. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const client = path.join(workspace, 'packages/client');
const require = createRequire(path.join(workspace, 'packages/server/package.json'));
require('dotenv').config({ path: 'C:/projects/tangobook/packages/server/.env', quiet: true });
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const prefix = 'tests/classic-scene-coloring/20261001-review-1';
const cdn = (process.env.R2_CDN_URL || 'https://assets.tangobook.co.kr').replace(/\/$/, '');
const base = `${cdn}/${prefix}/`;
const artifacts = 'D:/ComfyUI-output/classic-scene-coloring';
const destination = path.join(artifacts, 'hosted-preview');
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.R2_BUCKET_NAME;
const playerOnly = process.argv.includes('--player-only');
if (!bucket || !process.env.R2_ACCOUNT_ID) throw new Error('R2 configuration missing');
if (!playerOnly)
  try {
    await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: `${prefix}/index.html` }));
    throw new Error('Preview already published; choose a new version before replacing it');
  } catch (error) {
    if (error.$metadata?.httpStatusCode !== 404) throw error;
  }

const jobs = JSON.parse(await fs.readFile(path.join(artifacts, 'manifest.json'), 'utf8'));
const publicFields = [
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
];
const manifest = jobs.map((job) =>
  Object.fromEntries(publicFields.filter((k) => job[k] !== undefined).map((k) => [k, job[k]]))
);
await fs.mkdir(destination, { recursive: true });
let html = await fs.readFile(path.join(artifacts, 'index.html'), 'utf8');
html = html.replace(
  /(<script id="manifest" type="application\/json">)[\s\S]*?(<\/script>)/,
  (_, start, end) => start + JSON.stringify(manifest).replaceAll('<', '\\u003c') + end
);
html = html.replaceAll('http://127.0.0.1:5191/play', './play.html');
if (!playerOnly) {
  await fs.writeFile(path.join(destination, 'index.html'), html);
  await fs.writeFile(path.join(destination, 'manifest.json'), JSON.stringify(manifest));
}

const localServer = await fs.readFile(
  path.join(workspace, 'scripts/serve-classic-coloring.mjs'),
  'utf8'
);
let entrySource = localServer.match(/const source = `([\s\S]*?)`;\s*const server/)[1];
entrySource = entrySource
  .replace('const query=', `const galleryBase=${JSON.stringify(base)};const query=`)
  .replace("fetch('/local-manifest')", "fetch(galleryBase+'manifest.json')")
  .replaceAll("'/local-assets/'+", 'galleryBase+')
  .replace("location.href='http://127.0.0.1:5190/'", "location.href=galleryBase+'index.html'");
const temp = path.join(client, '.classic-coloring-preview');
await fs.mkdir(temp, { recursive: true });
await fs.writeFile(path.join(temp, 'entry.tsx'), entrySource);
await fs.writeFile(
  path.join(temp, 'play.html'),
  '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>동화 장면 색칠 테스트</title><div id="root"></div><script type="module" src="./entry.tsx"></script></html>'
);
const clientRequire = createRequire(path.join(client, 'package.json'));
const { build } = await import(
  new URL('./dist/node/index.js', pathToFileURL(clientRequire.resolve('vite/package.json'))).href
);
process.chdir(client);
try {
  await build({
    configFile: path.join(client, 'vite.config.ts'),
    base,
    publicDir: false,
    build: {
      outDir: destination,
      emptyOutDir: false,
      rollupOptions: { input: path.join(temp, 'play.html') },
    },
    plugins: [
      {
        name: 'preview-sounds',
        enforce: 'pre',
        transform(code, id) {
          if (id.includes('/src/') && /\.[tj]sx?$/.test(id))
            return code
              .replaceAll("'/sounds/", `'${base}sounds/`)
              .replaceAll('"/sounds/', `"${base}sounds/`)
              .replaceAll('`/sounds/', '`' + base + 'sounds/');
        },
      },
    ],
  });
  await fs.rename(
    path.join(destination, '.classic-coloring-preview/play.html'),
    path.join(destination, 'play.html')
  );
} finally {
  await fs.unlink(path.join(temp, 'entry.tsx'));
  await fs.unlink(path.join(temp, 'play.html'));
  await fs.rmdir(temp);
}
await fs.cp(path.join(client, 'public/sounds/game'), path.join(destination, 'sounds/game'), {
  recursive: true,
});
const files = [];
async function walk(directory, relative = '') {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const name = relative + entry.name;
    if (entry.isDirectory()) await walk(path.join(directory, entry.name), name + '/');
    else files.push({ file: path.join(directory, entry.name), key: name });
  }
}
await walk(destination);
for (const job of playerOnly ? [] : jobs)
  for (const kind of ['source', 'lineart']) {
    const file = path.join(artifacts, job[kind + 'File']);
    const bytes = await fs.readFile(file);
    if (createHash('sha256').update(bytes).digest('hex') !== job[kind + 'Sha256'])
      throw new Error('Hash mismatch: ' + job.key);
    files.push({ file, key: job[kind + 'File'] });
  }
const types = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.mp3': 'audio/mpeg',
};
// Entry HTML is uploaded last so the published link never references unfinished uploads.
const index = files.find((x) => x.key === (playerOnly ? 'play.html' : 'index.html'));
const pending = files.filter(
  (x) => x !== index && (!playerOnly || x.key.startsWith('assets/') || x.key.startsWith('sounds/'))
);
let completed = 0;
async function upload(item) {
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: prefix + '/' + item.key,
      Body: await fs.readFile(item.file),
      ContentType: types[path.extname(item.key)] || 'application/octet-stream',
      CacheControl:
        item.key.endsWith('.html') || item.key.endsWith('.json')
          ? 'no-cache'
          : 'public, max-age=86400',
    })
  );
  completed++;
  if (completed % 50 === 0) console.log('Uploaded', completed, '/', files.length);
}
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (pending.length) await upload(pending.shift());
  })
);
await upload(index);
await fs.writeFile(
  path.join(
    artifacts,
    playerOnly ? 'hosted-player-deployment.json' : 'hosted-preview-deployment.json'
  ),
  JSON.stringify(
    {
      prefix,
      url: base + 'index.html',
      player: base + 'play.html',
      uploaded: completed,
      generated: 288,
      finalReview: 'pending',
      publishedAt: new Date().toISOString(),
    },
    null,
    2
  )
);
console.log('PUBLISHED', base + 'index.html', completed);
