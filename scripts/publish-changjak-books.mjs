// User-authorized visibility change only; preserve fresh book data and a resumable journal.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = process.argv[2];
const snapshot = process.argv[3];
assert(root && snapshot, 'Output directory and read-only inventory are required');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const save = (p, x) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p + '.tmp', JSON.stringify(x)); fs.renameSync(p + '.tmp', p); };
const normalize = b => { const c = structuredClone(b); delete c.updatedAt; return c; };
async function api(route, book) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch('https://www.tangobook.co.kr/api' + route, { method: book ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      body: book ? JSON.stringify({ storybook: book }) : undefined, signal: AbortSignal.timeout(120000) });
    if (!book && [404, 429, 500, 502, 503, 504].includes(r.status) && attempt < 3) {
      await r.text();
      await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
      continue;
    }
    const j = await r.json(); assert(r.ok && j.success, route + ':' + r.status); return j.data;
  }
}
const books = read(snapshot).filter(b => /^changjak-[a-z]+-\d+$/.test(b.id));
assert.equal(books.length, 850); assert.equal(new Set(books.map(b => b.id)).size, 850);
let cursor = 0, done = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (cursor < books.length) {
    const id = books[cursor++].id, completed = path.join(root, 'applied', id + '.json');
    if (!fs.existsSync(completed)) {
      const pending = path.join(root, 'pending', id + '.json');
      let row = fs.existsSync(pending) ? read(pending) : null;
      if (!row) {
        const before = await api('/storybooks/' + id);
        assert.equal(before.id, id);
        row = { before, desired: { ...before, isPublic: true }, preparedAt: new Date().toISOString() };
        save(pending, row);
      }
      const fresh = await api('/storybooks/' + id);
      if (!fresh.isPublic) {
        assert.deepEqual(normalize(fresh), normalize(row.before), id + ' concurrent edit');
        await api('/storybooks', row.desired);
      }
      const after = await api('/storybooks/' + id);
      assert.deepEqual(normalize(after), normalize(row.desired), id + ' unrelated data changed');
      save(completed, { ...row, after, verifiedAt: new Date().toISOString() });
    }
    done++;
    if (done % 25 === 0 || done === books.length) {
      save(path.join(root, 'status.json'), { expected: books.length, done, updatedAt: new Date().toISOString() });
      console.log(JSON.stringify({ publishedAndVerified: done, expected: books.length }));
    }
  }
}));
// A concurrently refreshed server list can lag individual verified writes for its five-minute TTL.
let listVerified = false;
for (let attempt = 0; attempt < 37; attempt++) {
  const list = await api('/storybooks');
  const remaining = books.filter(b => !list.some(x => x.id === b.id && x.isPublic));
  if (!remaining.length) { listVerified = true; break; }
  console.log(JSON.stringify({ waitingForPublicList: remaining.length, attempt }));
  if (attempt < 36) await new Promise(resolve => setTimeout(resolve, 10000));
}
assert(listVerified, 'Public list still missing books');
save(path.join(root, 'complete.json'), { books: done, publicListVerified: true, unrelatedFieldsPreserved: true, completedAt: new Date().toISOString() });
