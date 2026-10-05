/** Replace an unavailable selected page only with a main-action page in the same half. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const collection = process.argv[2];
if (!/^changjak-(dodo|bruno|twins|mio|pipo|nono|lulu)$/.test(collection)) throw new Error('Specify an unstarted series');
const root = path.join('D:/ComfyUI-output/classic-scene-coloring', collection);
const jobs = JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8'));
const replacements = [];
for (let index = 0; index < jobs.length; index++) {
  const job = jobs[index];
  if (job.status !== 'source-needed') continue;
  const book = JSON.parse(await fs.readFile(path.join(root, 'books', job.bookId + '.json'), 'utf8'));
  const response = await fetch('https://www.tangobook.co.kr/api/comic-assets/' + job.bookId.replace('changjak-', ''));
  if (!response.ok) throw new Error(`Source index ${response.status}: ${job.bookId}`);
  const assets = (await response.json()).data || {};
  const middle = Math.ceil(book.pages.length / 2);
  const pages = book.pages.map((page) => ({ ...page, pageNumber: page.pageNumber ?? page.page_number }));
  const available = pages.filter((page) =>
    (page.pageNumber <= middle) === (job.pageNumber <= middle) &&
    !jobs.some((selected) => selected.bookId === job.bookId && selected.pageNumber === page.pageNumber) &&
    (page.illustrationUrl || page.illustration_url || assets['p' + page.pageNumber])
  );
  const score = (page) => ((page.text || '').match(/잡|들|넣|건네|안아|찾|만들|뛰|걷|타|먹|물|손|발|놓|꺼|나눠/g) || []).length;
  available.sort((a, b) => score(b) - score(a));
  if (!available.length) continue;
  const page = available[0];
  const key = job.bookId + '-p' + String(page.pageNumber).padStart(2, '0');
  const url = page.illustrationUrl || page.illustration_url || assets['p' + page.pageNumber];
  const asset = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!asset.ok) throw new Error(`Source ${asset.status}: ${key}`);
  const bytes = Buffer.from(await asset.arrayBuffer());
  const sourceFile = 'sources/' + key + '.png';
  await fs.writeFile(path.join(root, sourceFile), bytes);
  jobs[index] = { ...job, key, pageNumber: page.pageNumber, originalUrl: url,
    text: page.text || '', ttsUrl: page.ttsUrl, translations: page.translations || {},
    sceneDescription: page.sceneDescription ?? page.scene_description ?? '',
    sourceFile, lineartFile: 'lineart/' + key + '.png',
    sourceSha256: createHash('sha256').update(bytes).digest('hex'), status: 'pending',
    sourceOrigin: 'Existing illustration; alternate main-action page after selected source absence',
    selectionReason: 'Available main-action scene in the same half of the current story',
  };
  replacements.push({ absent: job.key, selected: key, reason: 'Selected original absent; same-half main action with available original' });
}
jobs.sort((a, b) => a.key.localeCompare(b.key));
if (jobs.length !== 100 || new Set(jobs.map((job) => job.key)).size !== 100) throw new Error('Scope changed');
await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify(jobs, null, 2));
await fs.writeFile(path.join(root, 'source-selection-replacements.json'), JSON.stringify(replacements, null, 2));
console.log(JSON.stringify({ collection, replacements, missing: jobs.filter((job) => job.status === 'source-needed').map((job) => job.key) }));
