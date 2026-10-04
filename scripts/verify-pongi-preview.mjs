/** Verify the actual version URLs used by ColoringPlayer, without modifying remote data. */
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = 'https://assets.tangobook.co.kr/tests/classic-scene-coloring/20261001-review-1/';
const root = 'D:/ComfyUI-output/classic-scene-coloring/changjak-pongi';
const response = await fetch(base + 'manifest.json');
if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
const published = await response.json();
const jobs = published.filter((job) => job.collection === 'changjak-pongi');
if (
  published.length !== 830 ||
  jobs.length !== 100 ||
  new Set(jobs.map((j) => j.bookId)).size !== 50
)
  throw new Error('Incorrect published scope');
const local = new Map(
  JSON.parse(await fs.readFile(root + '/manifest.json', 'utf8')).map((j) => [j.key, j])
);
const pending = jobs.flatMap((job) =>
  ['source', 'lineart'].map((kind) => {
    const expected = job[kind + 'Sha256'];
    if (expected !== local.get(job.key)[kind + 'Sha256'])
      throw new Error(`Manifest SHA mismatch: ${job.key}`);
    return {
      key: job.key,
      kind,
      url: base + job[kind + 'File'] + '?v=' + expected.slice(0, 12),
      expected,
    };
  })
);
const results = [];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (pending.length) {
      const item = pending.shift();
      const asset = await fetch(item.url);
      if (!asset.ok) throw new Error(`Image HTTP ${asset.status}: ${item.key}`);
      const sha256 = createHash('sha256')
        .update(Buffer.from(await asset.arrayBuffer()))
        .digest('hex');
      if (sha256 !== item.expected) throw new Error(`Image SHA mismatch: ${item.key}`);
      results.push({ key: item.key, kind: item.kind, url: item.url, sha256, matches: true });
    }
  })
);
await fs.writeFile(
  root + '/review-workspace/public-image-sha.json',
  JSON.stringify(results, null, 2) + '\n'
);
console.log('Verified 200 versioned public image SHA256 values; 830 total scenes retained');
