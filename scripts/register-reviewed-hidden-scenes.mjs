/** Register visually reviewed hidden scenes, preserving every other book field. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root = path.resolve('generated-images/activity-completion-20261013');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const save = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const entries = read(path.join(root, 'hidden-reviewed.json')).filter(
  (e) => e.reviewStatus === 'pass'
);
const ledgerPath = path.join(root, 'hidden-registration.json');
const ledger = fs.existsSync(ledgerPath) ? read(ledgerPath) : { books: {}, uploads: {} };
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
for (const e of entries) {
  if (ledger.books[e.id]?.verified) continue;
  const before = await api('/storybooks/' + e.id);
  assert(!before.hiddenObjectScenes?.length, 'Existing scenes must be preserved ' + e.id);
  const names = new Set(before.key_objects?.map((k) => k.name));
  assert(new Set(e.hotspots.map((h) => h.objectName)).size >= 2, 'Two distinct targets required');
  for (const h of e.hotspots) {
    assert(
      names.has(h.objectName) ||
        (h.objectName.startsWith('scene-') && h.labels?.ko?.trim() && h.labels?.en?.trim()),
      'Unknown or untranslated target ' + h.objectName
    );
    for (const k of ['x', 'y', 'w', 'h'])
      assert(Number.isFinite(h[k]) && h[k] >= 0 && h[k] <= 1, 'Invalid geometry');
    assert(h.w > 0 && h.h > 0 && h.x + h.w <= 1.001 && h.y + h.h <= 1.001);
  }
  let url = e.sceneImageUrl;
  if (e.newImage) {
    const bytes = fs.readFileSync(e.file);
    assert.equal(sha(bytes), e.sha256);
    if (!ledger.uploads[e.id]) {
      const result = await api('/comic-assets/activity-hidden-20261013', {
        key: e.id,
        dataUrl: 'data:image/webp;base64,' + bytes.toString('base64'),
      });
      const cdn = new URL(result.url);
      if (cdn.hostname.endsWith('.r2.dev')) cdn.host = 'assets.tangobook.co.kr';
      ledger.uploads[e.id] = cdn.href;
      save(ledgerPath, ledger);
    }
    url = ledger.uploads[e.id];
    const response = await fetch(url);
    assert(response.ok);
    assert.equal(sha(Buffer.from(await response.arrayBuffer())), e.sha256);
  } else
    assert(
      before.pages.some(
        (p, i) =>
          (p.page_number ?? p.pageNumber ?? i + 1) === e.pageNumber && p.illustrationUrl === url
      ),
      'Approved page changed'
    );
  const scene = {
    id: 'hobj_activity20261013',
    sceneImageUrl: url,
    theme: '동화 속 낱말 찾기',
    artStyle: before.artStyle,
    hotspots: e.hotspots,
  };
  const desired = { ...before, hiddenObjectScenes: [scene] };
  const snapshots = path.join(root, 'hidden-books-before');
  fs.mkdirSync(snapshots, { recursive: true });
  const snapshot = path.join(snapshots, e.id + '.json');
  if (!fs.existsSync(snapshot)) save(snapshot, before);
  assert.deepEqual(await api('/storybooks/' + e.id), before, 'Concurrent edit ' + e.id);
  await api('/storybooks', { storybook: desired });
  const after = await api('/storybooks/' + e.id);
  assert.deepEqual(after.hiddenObjectScenes, [scene]);
  for (const k of Object.keys(before).filter(
    (k) => k !== 'updatedAt' && k !== 'hiddenObjectScenes'
  ))
    assert.deepEqual(after[k], before[k], 'Protected field ' + k);
  ledger.books[e.id] = {
    verified: true,
    targets: new Set(e.hotspots.map((h) => h.objectName)).size,
    newImage: !!e.newImage,
    completedAt: new Date().toISOString(),
  };
  save(ledgerPath, ledger);
  console.log(JSON.stringify({ registered: e.id, total: Object.keys(ledger.books).length }));
}
console.log(
  JSON.stringify({ reviewed: entries.length, registered: Object.keys(ledger.books).length })
);
