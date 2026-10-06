/** Read-only media validation for the standalone scene-coloring trial. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = 'D:/ComfyUI-output/classic-scene-coloring';
const require = createRequire(path.join(workspace, 'packages/server/package.json'));
require('dotenv').config({ path: 'C:/projects/tangobook/packages/server/.env', quiet: true });
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const ffmpeg = require('ffmpeg-static');
const exec = promisify(execFile);
const cache = path.join(root, 'media-validation');
await fs.mkdir(cache, { recursive: true });
const jobs = [];
const collections = JSON.parse(
  await fs.readFile(path.join(workspace, 'scripts/scene-coloring-collections.json'), 'utf8')
);
for (const collection of collections) {
  let list;
  try {
    list = JSON.parse(
      await fs.readFile(path.join(root, collection.directory, 'manifest.json'), 'utf8')
    );
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  jobs.push(...list.map((j) => ({ ...j, collection: collection.id })));
}
const urls = new Map();
function add(url, j, role) {
  if (!url) return;
  if (!urls.has(url)) urls.set(url, []);
  urls.get(url).push({ key: j.key, collection: j.collection, role });
}
for (const j of jobs) {
  add(j.ttsUrl, j, 'narration-ko');
  add(j.backgroundMusicUrl, j, 'bgm');
  if (process.argv.includes('--all-languages'))
    for (const [language, translation] of Object.entries(j.translations || {}))
      add(translation.ttsUrl, j, 'narration-' + language);
}
const results = [];
const pending = [...urls];
let next = 0;
async function inspect(url, uses) {
  const id = createHash('sha256').update(url).digest('hex');
  const file = path.join(cache, id + '.mp3');
  const recordFile = path.join(cache, id + '.json');
  let previous;
  try {
    previous = JSON.parse(await fs.readFile(recordFile, 'utf8'));
  } catch {}
  const u = new URL(url);
  if (!['assets.tangobook.co.kr', 'www.tangobook.co.kr', 'tangobook.co.kr'].includes(u.hostname))
    throw new Error('Unsupported media host');
  let body, etag, contentType;
  if (u.hostname === 'assets.tangobook.co.kr') {
    try {
      const object = await client.send(
        new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: decodeURIComponent(u.pathname.slice(1)),
          ...(previous?.etag ? { IfNoneMatch: previous.etag } : {}),
        })
      );
      body = Buffer.from(await object.Body.transformToByteArray());
      etag = object.ETag;
      contentType = object.ContentType;
    } catch (error) {
      if (error.$metadata?.httpStatusCode !== 304) throw error;
      body = await fs.readFile(file);
      etag = previous.etag;
      contentType = previous.contentType;
    }
  } else {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    body = Buffer.from(await response.arrayBuffer());
    contentType = response.headers.get('content-type');
  }
  await fs.writeFile(file, body);
  const { stderr } = await exec(
    ffmpeg,
    [
      '-hide_banner',
      '-nostdin',
      '-i',
      file,
      '-vn',
      '-af',
      'astats=metadata=1:reset=0',
      '-f',
      'null',
      '-',
    ],
    { timeout: 120000, maxBuffer: 2 * 1024 * 1024 }
  );
  const duration = stderr.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
  const seconds = duration
    ? Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3])
    : 0;
  const levels = [...stderr.matchAll(/RMS level dB: ([-\d.]+|-?inf)/g)];
  const rmsDb = levels.length ? Number(levels.at(-1)[1]) : null;
  const record = {
    url,
    uses,
    etag,
    contentType,
    bytes: body.length,
    sha256: createHash('sha256').update(body).digest('hex'),
    durationSeconds: seconds,
    rmsDb,
    decodePassed: seconds > 0 && Number.isFinite(rmsDb),
    checkedAt: new Date().toISOString(),
  };
  await fs.writeFile(recordFile, JSON.stringify(record, null, 2));
  return record;
}
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (next < pending.length) {
      const [url, uses] = pending[next++];
      try {
        results.push(await inspect(url, uses));
      } catch (error) {
        results.push({ url, uses, decodePassed: false, error: error.message.slice(0, 400) });
      }
      if (results.length % 40 === 0) console.log('Decoded', results.length, '/', pending.length);
    }
  })
);
const report = {
  checkedAt: new Date().toISOString(),
  scenes: jobs.length,
  uniqueMedia: results.length,
  passed: results.filter((r) => r.decodePassed).length,
  failed: results.filter((r) => !r.decodePassed),
  scope: process.argv.includes('--all-languages')
    ? 'all supplied languages and BGM'
    : 'Korean narration and BGM',
  limitation:
    'File retrieval, full decoding and non-silence checks do not verify spoken words or browser playback.',
  results,
};
await fs.writeFile(path.join(root, 'media-validation.json'), JSON.stringify(report, null, 2));
console.log(
  JSON.stringify({
    scenes: report.scenes,
    uniqueMedia: report.uniqueMedia,
    passed: report.passed,
    failed: report.failed.length,
  })
);
if (report.failed.length) process.exitCode = 1;
