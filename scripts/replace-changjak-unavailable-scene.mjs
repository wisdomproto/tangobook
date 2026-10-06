/** Select a different same-half main scene after a generation rejection. Read-only book API. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const [collection, ...requestedKeys] = process.argv.slice(2);
const replaceHeld = requestedKeys.includes('--rejected-repair');
const keys = requestedKeys.filter((key) => key !== '--rejected-repair');
if (!/^changjak-[a-z]+$/.test(collection) || !keys.length) throw new Error('Collection and exact rejected keys required');
const root = path.join('D:/ComfyUI-output/classic-scene-coloring', collection);
const manifestPath = path.join(root, 'manifest.json');
const jobs = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const replacements = [];
for (const key of keys) {
  const index = jobs.findIndex((job) => job.key === key);
  if (index < 0 || (jobs[index].status !== 'pending' && !(replaceHeld && jobs[index].previewHold))) throw new Error(`Not a pending or explicitly held rejected repair: ${key}`);
  const old = jobs[index];
  const book = JSON.parse(await fs.readFile(path.join(root, 'books', old.bookId + '.json'), 'utf8'));
  const response = await fetch('https://www.tangobook.co.kr/api/comic-assets/' + old.bookId.replace('changjak-', ''));
  if (!response.ok) throw new Error(`Source index HTTP ${response.status}`);
  const assets = (await response.json()).data || {};
  const middle = Math.ceil(book.pages.length / 2);
  const available = book.pages.map((page) => ({ ...page, pageNumber: page.pageNumber ?? page.page_number }))
    .filter((page) => (page.pageNumber <= middle) === (old.pageNumber <= middle)
      && !jobs.some((job) => job.bookId === old.bookId && job.pageNumber === page.pageNumber)
      && (page.illustrationUrl || page.illustration_url || assets['p' + page.pageNumber]));
  const score = (page) => ((page.text || '').match(/잡|들|넣|건네|안아|찾|만들|뛰|걷|타|먹|물|손|발|놓|꺼|나눠/g) || []).length;
  available.sort((a, b) => score(b) - score(a));
  if (!available.length) throw new Error(`No different scene in this half: ${key}`);
  const page = available[0];
  const selected = old.bookId + '-p' + String(page.pageNumber).padStart(2, '0');
  const url = page.illustrationUrl || page.illustration_url || assets['p' + page.pageNumber];
  const imageResponse = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!imageResponse.ok) throw new Error(`Source HTTP ${imageResponse.status}: ${selected}`);
  const bytes = Buffer.from(await imageResponse.arrayBuffer());
  const sourceFile = 'sources/' + selected + '.png';
  await fs.writeFile(path.join(root, sourceFile), bytes);
  const job = { ...old, key: selected, pageNumber: page.pageNumber, originalUrl: url,
    text: page.text || '', sceneDescription: page.sceneDescription ?? page.scene_description ?? '',
    sourceFile, lineartFile: 'lineart/' + selected + '.png',
    sourceSha256: createHash('sha256').update(bytes).digest('hex'), status: 'pending', previewHold: true,
    sourceOrigin: 'Existing book illustration; different main scene selected after generation rejection',
    selectionReason: 'Different available main-action scene in the same half; rejected scene was not resubmitted' };
  delete job.generation; delete job.lineartSha256; delete job.colorCheck;
  if (page.ttsUrl) job.ttsUrl = page.ttsUrl; else delete job.ttsUrl;
  job.translations = page.translations || {};
  jobs[index] = job;
  replacements.push({ rejectedKey: key, rejectedScene: old, selectedKey: selected, originalUrl: url, text: job.text, sceneDescription: job.sceneDescription });
}
if (jobs.length !== 100 || new Set(jobs.map((job) => job.key)).size !== 100) throw new Error('Scope changed');
await fs.writeFile(manifestPath, JSON.stringify(jobs, null, 2));
const alternativesPath = path.join(root, 'rejected-scene-alternatives.json');
const previous = await fs.readFile(alternativesPath, 'utf8').then(JSON.parse).catch(() => []);
await fs.writeFile(alternativesPath, JSON.stringify([...previous, ...replacements], null, 2));
console.log(JSON.stringify(replacements));
