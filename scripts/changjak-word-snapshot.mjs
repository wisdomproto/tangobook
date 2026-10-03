import fs from 'node:fs';
import path from 'node:path';
import { SERIES } from '../packages/client/scripts/_series-config.mjs';
const root = path.resolve('generated-images/changjak-words');
fs.mkdirSync(root, { recursive: true });
const targets = Object.entries(SERIES).filter(([k, c]) => Number(c.no) <= 10);
const list = [];
for (const [series, cfg] of targets)
  for (let n = 1; n <= 50; n++) list.push({ series, number: String(n).padStart(2, '0'), cfg });
const books = {};
let cursor = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (cursor < list.length) {
      const { series, number } = list[cursor++],
        id = 'changjak-' + series + '-' + number;
      const r = await fetch('https://www.tangobook.co.kr/api/storybooks/' + id);
      const j = await r.json();
      if (!r.ok || !j.success) throw Error(id + ' ' + r.status);
      books[id] = j.data;
    }
  })
);
fs.writeFileSync(root + '/books-before.json', JSON.stringify(books, null, 2));
const summary = targets.map(([series, cfg]) => {
  const bs = Object.values(books).filter((b) => b.id.startsWith('changjak-' + series + '-'));
  const objects = bs.flatMap((b) => b.key_objects || []);
  return {
    series,
    no: cfg.no,
    title: cfg.title,
    books: bs.length,
    words: objects.length,
    uniqueWords: new Set(objects.map((o) => o.korean || o.name)).size,
    existingImages: bs.reduce(
      (n, b) => n + (b.keyObjectImages || []).filter((i) => i.success && i.imageUrl).length,
      0
    ),
    emptyBooks: bs.filter((b) => !b.key_objects?.length).map((b) => b.id),
  };
});
fs.writeFileSync(root + '/summary.json', JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary));
const example = [];
for (const b of Object.values(books))
  for (const i of b.keyObjectImages || [])
    if (i.imageUrl && example.length < 10) example.push({ id: b.id, ...i });
fs.writeFileSync(root + '/existing-image-examples.json', JSON.stringify(example, null, 2));
for (const [series, cfg] of targets) {
  const b = books['changjak-' + series + '-01'];
  const page = b.pages.find((p) => p.illustrationUrl);
  if (!page) continue;
  const r = await fetch(page.illustrationUrl);
  if (!r.ok) throw Error(series + ' reference');
  const ext = path.extname(new URL(page.illustrationUrl).pathname);
  fs.mkdirSync(root + '/references', { recursive: true });
  fs.writeFileSync(root + '/references/' + series + ext, Buffer.from(await r.arrayBuffer()));
}
console.log('REFERENCES SAVED');
