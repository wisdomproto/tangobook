/** Verify actual versioned player assets after publishing the authorized test gallery. */
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = 'https://assets.tangobook.co.kr/tests/classic-scene-coloring/20261001-review-1/';
const range = process.argv.find((arg) => arg.startsWith('--range='))?.split('=')[1] ?? '2-10';
if (!['2-10', '11-19'].includes(range)) throw new Error('Unsupported range: ' + range);
const extended = range === '11-19';
const root = 'D:/ComfyUI-output/classic-scene-coloring/changjak-' + range;
const expectedBooks = extended ? 1215 : 865;
const expectedScenes = expectedBooks * 2;
const newBooks = extended ? 350 : 450;
const series = extended
  ? /^changjak-(bung|dingding|taro|yuki|mina|kota|moya|bami|dari)-/
  : /^changjak-(coco|mei|dodo|bruno|twins|mio|pipo|nono|lulu)-/;
const response = await fetch(base + 'manifest.json', { cache: 'no-store' });
if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
const jobs = await response.json();
if (jobs.length !== expectedScenes || new Set(jobs.map((j) => j.bookId)).size !== expectedBooks)
  throw new Error('Scope mismatch');
const added = jobs.filter((j) => series.test(j.key));
if (added.length !== newBooks * 2 || added.some((j) => j.status !== 'generated'))
  throw new Error('New scenes missing');
const previous = JSON.parse(await fs.readFile(root + '/previous-public-manifest.json', 'utf8'));
for (const old of previous) {
  const now = jobs.find((j) => j.key === old.key);
  if (!now || ['sourceSha256', 'lineartSha256'].some((field) => old[field] !== now[field]))
    throw new Error('Existing scene changed: ' + old.key);
}
const pending = added.flatMap((j) =>
  ['source', 'lineart'].map((kind) => ({
    key: j.key,
    kind,
    sha: j[kind + 'Sha256'],
    url: base + j[kind + 'File'] + '?v=' + j[kind + 'Sha256'].slice(0, 12),
  }))
);
const verified = [];
const assetCount = pending.length;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (pending.length) {
      const asset = pending.shift();
      let error;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const download = await fetch(asset.url, {
            cache: 'no-store',
            signal: AbortSignal.timeout(120000),
          });
          if (!download.ok) throw new Error('HTTP ' + download.status);
          const sha = createHash('sha256')
            .update(Buffer.from(await download.arrayBuffer()))
            .digest('hex');
          if (sha !== asset.sha) throw new Error('Downloaded SHA mismatch');
          verified.push({ ...asset, downloadedSha256: sha });
          error = null;
          break;
        } catch (e) {
          error = e;
        }
      }
      if (error) throw new Error(asset.key + '/' + asset.kind + ': ' + error.message);
      if (verified.length % 100 === 0)
        console.log('Verified ' + verified.length + '/' + assetCount + ' versioned images');
    }
  })
);
await fs.writeFile(
  root + '/published-asset-verification.json',
  JSON.stringify(
    {
      verifiedAt: new Date().toISOString(),
      books: expectedBooks,
      scenes: expectedScenes,
      newBooks,
      newScenes: newBooks * 2,
      existingScenesPreserved: previous.length,
      assets: verified,
    },
    null,
    2
  )
);
console.log(
  `PASS: ${assetCount} versioned images; ${newBooks * 2} new scenes; previous scenes preserved`
);
