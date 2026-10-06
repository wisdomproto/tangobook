/** Import the published, reviewed scenes; book IDs keep different art styles separate. */
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const base = 'https://assets.tangobook.co.kr/tests/classic-scene-coloring/20261001-review-1/';
const collections = JSON.parse(
  await fs.readFile(new URL('./scene-coloring-collections.json', import.meta.url), 'utf8')
);
let jobs;
if (process.argv.includes('--local')) {
  // Build mappings before publication; this does not authorize or upload held scenes.
  const root = 'D:/ComfyUI-output/classic-scene-coloring';
  jobs = (
    await Promise.all(
      collections.map(async (collection) => {
        const scenes = JSON.parse(
          await fs.readFile(path.join(root, collection.directory, 'manifest.json'), 'utf8')
        );
        return scenes.map((scene) => ({
          ...scene,
          sourceFile: [collection.directory, scene.sourceFile].filter(Boolean).join('/'),
          lineartFile: [collection.directory, scene.lineartFile].filter(Boolean).join('/'),
        }));
      })
    )
  ).flat();
} else {
  const response = await fetch(base + 'manifest.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Published catalog: ${response.status}`);
  jobs = await response.json();
}
const books = {};
const keys = new Set();
for (const job of jobs) {
  if (job.status !== 'generated' || !job.bookId || keys.has(job.key))
    throw new Error(`Invalid or duplicate scene: ${job.key}`);
  keys.add(job.key);
  const asset = (kind) => {
    const file = job[kind + 'File'];
    const sha = job[kind + 'Sha256'];
    if (!file || !/^[a-f0-9]{64}$/.test(sha) || file.includes('..'))
      throw new Error(`Missing versioned ${kind}: ${job.key}`);
    return base + file + '?v=' + sha.slice(0, 12);
  };
  const scene = {
    key: job.key,
    bookId: job.bookId,
    pageNumber: job.pageNumber,
    lineartUrl: asset('lineart'),
    colorSourceUrl: asset('source'),
    text: job.text || '',
    ttsUrl: job.ttsUrl || undefined,
    translations: job.translations || {},
    backgroundMusicUrl: job.backgroundMusicUrl,
    ...(job.colorSampling ? { colorSampling: job.colorSampling } : {}),
  };
  (books[job.bookId] ??= []).push(scene);
}
const creativeSeries = collections.filter((collection) => collection.id.startsWith('changjak-'));
const expectedBooks =
  365 + creativeSeries.reduce((sum, collection) => sum + (collection.books ?? 50), 0);
const expectedScenes = expectedBooks * 2;
if (keys.size !== expectedScenes || Object.keys(books).length !== expectedBooks)
  throw new Error(`Unexpected scope: ${Object.keys(books).length} books / ${keys.size} scenes`);
for (const scenes of Object.values(books)) {
  scenes.sort((a, b) => a.pageNumber - b.pageNumber);
  if (scenes.length !== 2) throw new Error('Each reviewed book must have two scenes');
}
const destination = fileURLToPath(
  new URL('../packages/client/src/features/games/data/scene-coloring-catalog.json', import.meta.url)
);
await fs.mkdir(
  fileURLToPath(new URL('../packages/client/src/features/games/data/', import.meta.url)),
  { recursive: true }
);
await fs.writeFile(destination, JSON.stringify(books, null, 2) + '\n');
console.log(
  `Imported ${Object.keys(books).length} books / ${keys.size} ${process.argv.includes('--local') ? 'local preview mappings' : 'published scenes'}`
);
