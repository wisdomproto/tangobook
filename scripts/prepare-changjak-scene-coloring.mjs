/** Read-only preparation of series 2–10; never regenerate or overwrite selected outputs. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = 'D:/ComfyUI-output/classic-scene-coloring';
const range = process.argv.includes('--range=11-19') ? '11-19' : '2-10';
const inventory = JSON.parse(await fs.readFile(root + '/changjak-' + range + '/book-list.json', 'utf8'));
const series = [...new Set(inventory.map((b) => b.category))].sort().map((category) => ({
  category, number: Number(category.slice(0, 2)),
  id: 'changjak-' + inventory.find((b) => b.category === category).id.split('-')[1],
  label: '창작동화 ' + Number(category.slice(0, 2)) + ' · ' + category.split('. ')[1],
}));
const output = [];
async function getJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(90000) });
      if (!r.ok) throw new Error(`${r.status}: ${url}`);
      return await r.json();
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
}
function select(pages) {
  const sorted = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const middle = Math.ceil(sorted.length / 2);
  const action = /잡|들|넣|건네|안아|끌|밀|찾|만들|쌓|올|내리|펴|접|붙|뛰|걷|타|줍|먹|씻|닦|부|옮|돌|물|손|발|던|놓|꺼|심|다듬|나눠/g;
  const score = (p) => (p.text.match(action) || []).length + Math.min(p.text.length / 80, 2) - (p.pageNumber === 1 ? 1 : 0);
  const pick = (items) => items.sort((a, b) => score(b) - score(a) || a.pageNumber - b.pageNumber)[0];
  return [pick(sorted.filter((p) => p.pageNumber <= middle)), pick(sorted.filter((p) => p.pageNumber > middle))];
}
async function download(url, key) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const asset = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!asset.ok) throw new Error(`HTTP ${asset.status}`);
      return Buffer.from(await asset.arrayBuffer());
    } catch (error) {
      if (attempt === 2) throw new Error(`Source retrieval failed for ${key}: ${error.message}`);
    }
  }
}
for (const collection of series) {
  const directory = path.join(root, collection.id);
  await fs.mkdir(path.join(directory, 'books'), { recursive: true });
  const prior = JSON.parse(await fs.readFile(path.join(directory, 'manifest.json'), 'utf8').catch((e) => {
    if (e.code !== 'ENOENT') throw e;
    return '[]';
  }));
  const byKey = new Map(prior.map((j) => [j.key, j]));
  const books = inventory.filter((b) => b.category === collection.category).sort((a, b) => a.id.localeCompare(b.id));
  const expectedBooks = range === '11-19' && collection.number >= 16 ? 25 : 50;
  if (books.length !== expectedBooks) throw new Error(`Scope changed: ${collection.category}`);
  if (prior.length === expectedBooks * 2) {
    const counts = new Map();
    for (const job of prior) counts.set(job.bookId, (counts.get(job.bookId) || 0) + 1);
    if (counts.size !== expectedBooks || [...counts.values()].some((count) => count !== 2))
      throw new Error(`Invalid saved scope: ${collection.id}`);
    output.push({ ...collection, directory: collection.id, books: expectedBooks, scenes: expectedBooks * 2,
      missing: prior.filter((job) => job.status === 'source-needed').map((job) => job.key) });
    console.log(JSON.stringify({ ...output.at(-1), resumed: 'preserved complete manifest' }));
    continue;
  }
  const pending = [...books], jobs = [], missing = [];
  await Promise.all(Array.from({ length: 5 }, async () => {
    while (pending.length) {
      const summary = pending.shift();
      const book = (await getJson('https://www.tangobook.co.kr/api/storybooks/' + summary.id)).data;
      await fs.writeFile(path.join(directory, 'books', summary.id + '.json'), JSON.stringify(book, null, 2));
      const pages = book.pages.map((p) => ({ ...p, pageNumber: p.pageNumber ?? p.page_number, text: p.text || '' }));
      let assets;
      for (const page of select(pages)) {
        const key = summary.id + '-p' + String(page.pageNumber).padStart(2, '0');
        if (byKey.has(key)) { jobs.push(byKey.get(key)); continue; }
        let url = page.illustrationUrl ?? page.illustration_url;
        let origin = 'Current book illustration';
        if (!url) {
          assets ??= (await getJson('https://www.tangobook.co.kr/api/comic-assets/' + summary.id.replace('changjak-', ''))).data;
          url = assets['p' + page.pageNumber];
          origin = 'Existing comic-assets; source/character visual check required';
        }
        const job = {
          key, bookId: summary.id, title: book.title ?? summary.title, artStyle: book.artStyle,
          collection: collection.id, pageNumber: page.pageNumber, originalUrl: url,
          text: page.text, ttsUrl: page.ttsUrl, translations: page.translations || {},
          backgroundMusicUrl: book.backgroundMusicUrl || 'https://www.tangobook.co.kr/sounds/bgm/default-1.mp3',
          sourceFile: 'sources/' + key + '.png', lineartFile: 'lineart/' + key + '.png',
          sceneDescription: page.sceneDescription ?? page.scene_description ?? '',
          selectionReason: 'Distinct main-action scenes from the first and second halves of the current book',
          status: 'pending', previewHold: true, sourceOrigin: origin,
          generation: { skill: 'imagegen', mode: 'built-in-reference-edit' },
        };
        if (url) {
          const sourcePath = path.join(directory, job.sourceFile);
          const body = await fs.readFile(sourcePath).catch((error) => {
            if (error.code !== 'ENOENT') throw error;
            return download(url, key);
          });
          await fs.mkdir(path.join(directory, 'sources'), { recursive: true });
          await fs.writeFile(path.join(directory, job.sourceFile), body);
          job.sourceSha256 = createHash('sha256').update(body).digest('hex');
        } else { job.status = 'source-needed'; missing.push(key); }
        jobs.push(job);
      }
    }
  }));
  jobs.sort((a, b) => a.key.localeCompare(b.key));
  if (jobs.length !== expectedBooks * 2) throw new Error('Selected scene count mismatch');
  await fs.writeFile(path.join(directory, 'manifest.json'), JSON.stringify(jobs, null, 2));
  await fs.writeFile(path.join(directory, 'source-selection-review.json'), JSON.stringify({
    ...collection, books: expectedBooks, scenes: expectedBooks * 2, missing,
    selection: jobs.map(({ key, title, pageNumber, text, sceneDescription, sourceOrigin }) => ({ key, title, pageNumber, text, sceneDescription, sourceOrigin })),
  }, null, 2));
  output.push({ ...collection, directory: collection.id, books: expectedBooks, scenes: expectedBooks * 2, missing });
  console.log(JSON.stringify(output.at(-1)));
}
await fs.writeFile(root + '/changjak-' + range + '/production-plan.json', JSON.stringify(output, null, 2));
