import fs from 'node:fs';
import path from 'node:path';
import { root, targets } from './changjak-word-scope.mjs';
const books = JSON.parse(fs.readFileSync(root + '/books-before.json'));
const dir = root + '/references';
fs.mkdirSync(dir, { recursive: true });
const receipts = {};
async function download(url, stem) {
  const canonical = url.replace(
    'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/',
    'https://assets.tangobook.co.kr/'
  );
  const r = await fetch(canonical);
  if (!r.ok) return undefined;
  const file = dir + '/' + stem + path.extname(new URL(canonical).pathname);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  return { file, url: canonical };
}
for (const [series] of targets) {
  const asset = await (
    await fetch('https://www.tangobook.co.kr/api/comic-assets/' + series + '-plan')
  ).json();
  const chars = [];
  for (const [key, url] of Object.entries(asset.data || {})) {
    const got = await download(url, series + '-cast-' + key);
    if (got) chars.push(got);
  }
  let scene;
  const candidates = Object.values(books).filter((b) =>
    b.id.startsWith('changjak-' + series + '-')
  );
  for (const b of candidates) {
    for (const p of b.pages || []) {
      if (!p.illustrationUrl) continue;
      scene = await download(p.illustrationUrl, series);
      if (scene) break;
    }
    if (scene) break;
  }
  if (!scene && chars.length) {
    const file = dir + '/' + series + path.extname(chars[0].file);
    fs.copyFileSync(chars[0].file, file);
    scene = { ...chars[0], file, castFallback: true };
  }
  if (!scene) throw Error(series + ' has no readable reference');
  receipts[series] = { scene, characters: chars };
  console.log(series, chars.length, scene.castFallback ? 'cast reference' : 'story reference');
}
fs.writeFileSync(root + '/references.json', JSON.stringify(receipts, null, 2));
