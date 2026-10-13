/** Approved Pongi 29 cast repair; exact book only, guarded and resumable. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const root = path.resolve('generated-images/pongi29-repair-20261013');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const save = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const id = 'changjak-pongi-29';
const entries = read(path.join(root, 'pages-manifest.json'));
assert.deepEqual(
  entries.map((p) => p.page),
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
);
const ledgerPath = path.join(root, 'page-registration.json');
const ledger = fs.existsSync(ledgerPath) ? read(ledgerPath) : { uploads: {}, canonical: {} };
async function api(route, body) {
  const r = await fetch('https://www.tangobook.co.kr/api' + route, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(120000),
  });
  const j = await r.json();
  assert(r.ok && j.success, `${route}: HTTP ${r.status}`);
  return j.data;
}
async function upload(doc, entry) {
  const bytes = fs.readFileSync(path.join(root, entry.file));
  assert.equal(sha(bytes), entry.sha256);
  const result = await api('/comic-assets/' + doc, {
    key: 'p' + entry.page,
    dataUrl: 'data:image/webp;base64,' + bytes.toString('base64'),
  });
  const u = new URL(result.url);
  if (u.hostname.endsWith('.r2.dev')) u.hostname = 'assets.tangobook.co.kr';
  const response = await fetch(u.href, { signal: AbortSignal.timeout(60000) });
  assert(response.ok);
  assert.equal(sha(Buffer.from(await response.arrayBuffer())), entry.sha256);
  return u.href;
}
const baseline = read(path.join(root, 'book-before.json'));
assert.equal(baseline.id, id);
if (!ledger.bookVerified) {
  assert.deepEqual(await api('/storybooks/' + id), baseline, 'Book changed since approval review');
  for (const e of entries) {
    if (!ledger.uploads[e.page]) {
      ledger.uploads[e.page] = await upload('pongi-29-repair-20261013', e);
      save(ledgerPath, ledger);
    }
  }
  const desired = structuredClone(baseline);
  for (const [i, p] of desired.pages.entries()) {
    const n = p.page_number ?? p.pageNumber ?? i + 1;
    p.illustrationUrl = ledger.uploads[n];
  }
  assert.equal(desired.hiddenObjectScenes.length, 1);
  const scene = desired.hiddenObjectScenes[0];
  assert.equal(scene.id, 'hobj_activity20261013');
  scene.sceneImageUrl = ledger.uploads[5];
  const names = Object.fromEntries(baseline.key_objects.map((k) => [k.nameEn, k.name]));
  assert(names.fish && names.shell);
  scene.hotspots = [
    { objectName: names.fish, x: 0.545, y: 0.77, w: 0.345, h: 0.145, layer: 1 },
    { objectName: names.shell, x: 0.177, y: 0.602, w: 0.074, h: 0.14, layer: 1 },
  ];
  for (const k of Object.keys(baseline).filter((k) => !['pages', 'hiddenObjectScenes'].includes(k)))
    assert.deepEqual(desired[k], baseline[k], 'Protected field ' + k);
  for (const [i, p] of baseline.pages.entries())
    for (const k of Object.keys(p).filter((k) => k !== 'illustrationUrl'))
      assert.deepEqual(desired.pages[i][k], p[k], 'Protected page ' + k);
  assert.deepEqual(await api('/storybooks/' + id), baseline, 'Concurrent book edit');
  await api('/storybooks', { storybook: desired });
  const after = await api('/storybooks/' + id);
  for (const k of Object.keys(desired).filter((k) => k !== 'updatedAt'))
    assert.deepEqual(after[k], desired[k], 'Saved field ' + k);
  save(path.join(root, 'book-after.json'), after);
  ledger.bookVerified = true;
  ledger.hiddenScene = after.hiddenObjectScenes[0];
  save(ledgerPath, ledger);
  console.log(
    'Registered 10 correct pages and p5 hidden targets; text/translations/TTS/cover preserved'
  );
}
// The plan HTML reads the canonical comic-assets keys, separately from the book JSON.
for (const e of entries) {
  if (!ledger.canonical[e.page]) {
    ledger.canonical[e.page] = await upload('pongi-29', e);
    save(ledgerPath, ledger);
  }
}
const canonical = await api('/comic-assets/pongi-29');
for (const e of entries)
  assert.equal(
    new URL(canonical['p' + e.page]).pathname,
    new URL(ledger.canonical[e.page]).pathname
  );
ledger.completedAt = new Date().toISOString();
save(ledgerPath, ledger);
console.log('Verified all 10 canonical plan images and SHA-256 CDN bytes');
