/** Fill reviewed English vocabulary fields without changing approved pages, media or publication. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve('generated-images/activity-completion-20261013');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const plan = read(path.join(root, 'english-word-plan.json'));
const earlierPath = path.join(root, 'english-word-plan-v1.json');
const earlier = fs.existsSync(earlierPath)
  ? new Map(read(earlierPath).map((b) => [b.id, b]))
  : new Map();
assert.equal(plan.length, 850);
assert.equal(
  plan.reduce((n, b) => n + b.words.length, 0),
  3957
);
const baseline = new Map(
  read('D:/tangobook-inventory/20261012-after-active-word-gap-fill/books.json').map((b) => [
    b.id,
    b,
  ])
);
const ledgerPath = path.join(root, 'english-word-registration.json');
const ledger = fs.existsSync(ledgerPath)
  ? read(ledgerPath)
  : { books: {}, startedAt: new Date().toISOString() };
const save = () => fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));
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
const limit = Number(process.argv.find((x) => x.startsWith('--limit='))?.slice(8) ?? 850);
let cursor = 0,
  done = 0;
await Promise.all(
  Array.from({ length: 2 }, async () => {
    while (cursor < Math.min(limit, plan.length)) {
      const p = plan[cursor++];
      const changed = earlier.get(p.id)?.words.some((w, i) => w.nameEn !== p.words[i].nameEn);
      if (ledger.books[p.id]?.verified && !changed) {
        done++;
        continue;
      }
      const current = await api('/storybooks/' + p.id),
        source = baseline.get(p.id);
      assert.deepEqual(
        current.key_objects.map((k) => k.name),
        source.key_objects.map((k) => k.name),
        'Word list changed ' + p.id
      );
      const desired = structuredClone(current);
      for (const w of p.words) {
        const k = desired.key_objects.find((k) => k.name === w.name),
          old = source.key_objects.find((k) => k.name === w.name);
        assert.deepEqual(k.pages, old.pages, 'Word page meaning changed');
        assert.equal(k.korean, old.korean);
        const prior = earlier.get(p.id)?.words.find((x) => x.name === w.name)?.nameEn;
        const ownSnapshot = fs.existsSync(path.join(root, 'books-before', p.id + '.json'));
        assert(
          !k.nameEn || k.nameEn === w.nameEn || (ownSnapshot && k.nameEn === prior),
          'Concurrent English label differs ' + p.id + ' ' + w.name
        );
        k.nameEn = w.nameEn;
      }
      const recordPath = path.join(root, 'books-before');
      fs.mkdirSync(recordPath, { recursive: true });
      const snapshot = path.join(recordPath, p.id + '.json');
      if (!fs.existsSync(snapshot)) fs.writeFileSync(snapshot, JSON.stringify(current));
      if (JSON.stringify(current) !== JSON.stringify(desired)) {
        const fresh = await api('/storybooks/' + p.id);
        assert.deepEqual(fresh, current, 'Concurrent book change ' + p.id);
        await api('/storybooks', { storybook: desired });
      }
      const got = await api('/storybooks/' + p.id);
      assert.deepEqual(got.key_objects, desired.key_objects, 'Saved labels differ');
      for (const key of Object.keys(current).filter(
        (k) => k !== 'key_objects' && k !== 'updatedAt'
      ))
        assert.deepEqual(
          got[key],
          current[key],
          'Protected book field changed ' + p.id + ' ' + key
        );
      await api('/vocabulary-db/sync', { storybookId: p.id });
      ledger.books[p.id] = {
        verified: true,
        words: p.words.length,
        completedAt: new Date().toISOString(),
      };
      save();
      done++;
      if (done % 25 === 0) console.log(JSON.stringify({ registered: done, total: limit }));
    }
  })
);
save();
console.log(
  JSON.stringify({ registered: done, total: limit, verified: Object.keys(ledger.books).length })
);
