/** Register only the 23 reviewed egret/parrot vocabulary coloring links. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root = path.resolve('generated-images/activity-completion-20261013');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const save = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const targets = read(path.join(root, 'extra-coloring/selected.json'));
assert.equal(targets.length, 18);
const ledgerFile = path.join(root, 'extra-coloring/registration.json');
const ledger = fs.existsSync(ledgerFile) ? read(ledgerFile) : { uploads: {}, books: {} };
async function api(route, body) {
  const r = await fetch('https://www.tangobook.co.kr/api' + route, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(120000),
  });
  const j = await r.json();
  assert(r.ok && j.success, route + ' HTTP ' + r.status);
  return j.data;
}
const assets = await api('/comic-assets/coloring-plan');
for (const bid of new Set(targets.map((t) => t.bookId))) {
  const b = await api('/storybooks/' + bid);
  ledger.books[bid] = b;
  for (const t of targets.filter((t) => t.bookId === bid))
    assert(
      b.keyObjectImages?.some((k) => k.objectName === t.objectName && k.imageUrl),
      'Missing original ' + t.word
    );
}
for (const t of targets) {
  assert.equal(t.lineart.review, 'pass');
  const bytes = fs.readFileSync(path.join(root, t.lineart.file));
  assert.equal(sha(bytes), t.lineart.sha256);
  const key = 'activity-20261013-' + t.token;
  if (!ledger.uploads[t.token]) {
    const url =
      assets[key] ||
      (
        await api('/comic-assets/coloring-plan', {
          key,
          dataUrl: 'data:image/png;base64,' + bytes.toString('base64'),
        })
      ).url;
    const cdn = new URL(url);
    if (cdn.hostname.endsWith('.r2.dev')) cdn.host = 'assets.tangobook.co.kr';
    const r = await fetch(cdn.href, { signal: AbortSignal.timeout(60000) });
    assert(r.ok, 'CDN ' + t.token);
    assert.equal(
      sha(Buffer.from(await r.arrayBuffer())),
      t.lineart.sha256,
      'Uploaded lineart differs'
    );
    ledger.uploads[t.token] = { key, url: cdn.href, sha256: t.lineart.sha256 };
    save(ledgerFile, ledger);
  }
}
const pub = path.resolve('packages/client/public');
const planPath = path.join(pub, 'coloring-plan-data.json'),
  manifestPath = path.join(pub, 'coloring/manifest.json'),
  indexPath = path.join(pub, 'coloring/book-index.json');
const plan = read(planPath),
  manifest = read(manifestPath),
  index = read(indexPath);
const backup = path.join(root, 'coloring-catalog-before.json');
if (!fs.existsSync(backup)) save(backup, { plan, manifest, index });
const group = { id: 'activity-word-extras-20261013', label: '동화 어휘 도안 보완', sections: [] };
const proxy = (url) =>
  '/api/r2-proxy?key=' + encodeURIComponent(decodeURIComponent(new URL(url).pathname).slice(1));
for (const bid of new Set(targets.map((t) => t.bookId))) {
  const b = ledger.books[bid],
    ts = targets.filter((t) => t.bookId === bid),
    items = [];
  for (const t of ts) {
    const key = ledger.uploads[t.token].key,
      source = b.keyObjectImages.find((k) => k.objectName === t.objectName).imageUrl;
    items.push({
      key,
      bookId: bid,
      bookTitle: b.title,
      word: t.word,
      subject: t.word,
      imageUrl: source,
    });
    const entry = {
      key: key + '-' + bid,
      group: b.category,
      section: b.title,
      unitId: bid,
      word: t.word,
      language: 'korean',
      lineartUrl: proxy(ledger.uploads[t.token].url),
      originalUrl: proxy(source),
    };
    const old = manifest.find((s) => s.key === entry.key);
    if (old) assert.deepEqual(old, entry);
    else manifest.push(entry);
  }
  group.sections.push({ bookId: bid, label: b.title, items });
  const existing = index[bid] ?? [];
  index[bid] = [...new Set([...existing, ...ts.map((t) => t.word)])];
}
const oldGroup = plan.groups.find((g) => g.id === group.id);
if (oldGroup) assert.deepEqual(oldGroup, group);
else plan.groups.push(group);
save(planPath, plan);
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
fs.writeFileSync(indexPath, JSON.stringify(index));
ledger.completedAt = new Date().toISOString();
save(ledgerFile, ledger);
console.log(
  JSON.stringify({
    links: 18,
    linearts: Object.keys(ledger.uploads).length,
    books: new Set(targets.map((t) => t.bookId)).size,
  })
);
