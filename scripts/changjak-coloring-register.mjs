/** Register reviewed vocabulary coloring assets and append their authoring/game catalogs. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const root = 'generated-images/changjak-word-coloring';
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const save = (p, x) => fs.writeFileSync(p, JSON.stringify(x, null, 2));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const cards = read(root + '/cropped.json');
const jobs = read(root + '/jobs.json').jobs;
const reviews = read(root + '/reviews.json');
const measurements = read(root + '/measurements.json');
const geometry = read(root + '/geometry.json');
const measurementVersion = crypto
  .createHash('sha256')
  .update(fs.readFileSync('scripts/changjak-coloring-check.mjs'))
  .update(fs.readFileSync('packages/client/src/features/games/lib/answer-colors.ts'))
  .digest('hex');
const measure = new Map(measurements.map((x) => [x.id, x]));
const sourceUploads = {},
  books = {};
for (const folder of ['changjak-words', 'changjak-words-11-19']) {
  Object.assign(sourceUploads, read('generated-images/' + folder + '/registration.json').uploaded);
  Object.assign(books, read('generated-images/' + folder + '/books-before.json'));
}
const ledgerPath = root + '/registration.json';
const ledger = fs.existsSync(ledgerPath)
  ? read(ledgerPath)
  : { startedAt: new Date().toISOString(), uploaded: {}, verified: [] };
const proxy = (url) =>
  '/api/r2-proxy?key=' + encodeURIComponent(decodeURIComponent(new URL(url).pathname).slice(1));
const origin = 'https://www.tangobook.co.kr';
async function request(route, method = 'GET', body) {
  const response = await fetch(origin + '/api' + route, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(120000),
  });
  const result = await response.json();
  assert(response.ok && result.success, route + ' HTTP ' + response.status);
  return result.data;
}
function validate() {
  const expected = jobs.flatMap((j) => j.cards.map((c) => c.id));
  assert.equal(cards.length, expected.length, 'unfinished generation or review');
  assert.deepEqual(new Set(cards.map((c) => c.id)), new Set(expected), 'missing/duplicate cards');
  for (const card of cards) {
    assert.equal(sha(fs.readFileSync(card.lineart)), card.sha256, card.id + ' lineart changed');
    assert.equal(
      sha(fs.readFileSync(card.original)),
      card.originalSha256,
      card.id + ' original changed'
    );
    assert.equal(
      sourceUploads[card.id]?.sha256,
      card.originalSha256,
      card.id + ' source upload changed'
    );
    const job = jobs.find((j) => j.id === card.sheet);
    assert.equal(
      sha(fs.readFileSync(job.source)),
      job.sourceSha256,
      job.id + ' approved source changed'
    );
    const override = path.join(root, 'overrides', card.id + '.png');
    const review = reviews[fs.existsSync(override) ? card.id : card.sheet];
    const file = fs.existsSync(override) ? override : job.out;
    assert.equal(review?.status, 'pass', card.id + ' not reviewed');
    assert.equal(review?.sha256, sha(fs.readFileSync(file)), card.id + ' stale review');
    const m = measure.get(card.id);
    assert(m && m.regions > 0 && m.palette.length > 0, card.id + ' no paintable areas/colors');
    assert.equal(m.sheetSha256, sha(fs.readFileSync(job.out)), card.id + ' stale measured sheet');
    assert.equal(m.measurementVersion, measurementVersion, card.id + ' stale measurement policy');
    const overridesHash = crypto.createHash('sha256');
    for (const c of job.cards) {
      const p = path.join(root, 'overrides', c.id + '.png');
      if (fs.existsSync(p)) overridesHash.update(fs.readFileSync(p));
    }
    assert.equal(
      m.overridesSha256,
      overridesHash.digest('hex'),
      card.id + ' stale measured repairs'
    );
    assert.equal(
      m.geometrySha256,
      sha(Buffer.from(JSON.stringify(job.cards.map((c) => geometry[c.id] ?? null)))),
      card.id + ' stale measured crop'
    );
    assert(!m.flags.includes('colored'), card.id + ' color remains');
  }
}
async function upload() {
  const assets = await request('/comic-assets/coloring-plan');
  save(root + '/assets-before-upload.json', assets);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      while (cursor < cards.length) {
        const card = cards[cursor++],
          key = 'cw-' + card.id;
        const recorded = ledger.uploaded[card.id];
        if (recorded) {
          assert.equal(recorded.sha256, card.sha256, card.id + ' uploaded version differs');
          continue;
        }
        let url;
        if (assets[key]) {
          const response = await fetch(assets[key], { signal: AbortSignal.timeout(120000) });
          assert(response.ok, key + ' existing asset unreadable');
          assert.equal(
            sha(Buffer.from(await response.arrayBuffer())),
            card.sha256,
            key + ' existing asset preserved; conflict'
          );
          url = assets[key];
        } else {
          url = (
            await request('/comic-assets/coloring-plan', 'POST', {
              key,
              dataUrl: 'data:image/png;base64,' + fs.readFileSync(card.lineart).toString('base64'),
            })
          ).url;
        }
        url = url.replace(
          'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/',
          'https://assets.tangobook.co.kr/'
        );
        ledger.uploaded[card.id] = { key, url, sha256: card.sha256 };
        save(ledgerPath, ledger);
        if (Object.keys(ledger.uploaded).length % 100 === 0)
          console.log('UPLOADED', Object.keys(ledger.uploaded).length);
      }
    })
  );
  const verified = new Set(ledger.verified);
  cursor = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (cursor < cards.length) {
        const card = cards[cursor++];
        if (verified.has(card.id)) continue;
        const response = await fetch(
          ledger.uploaded[card.id].url + '?verify=' + card.sha256.slice(0, 12),
          { signal: AbortSignal.timeout(120000) }
        );
        assert(response.ok, card.id + ' CDN');
        assert.equal(
          sha(Buffer.from(await response.arrayBuffer())),
          card.sha256,
          card.id + ' CDN SHA'
        );
        verified.add(card.id);
        ledger.verified = [...verified];
        save(ledgerPath, ledger);
        if (verified.size % 100 === 0) console.log('CDN VERIFIED', verified.size);
      }
    })
  );
  const after = await request('/comic-assets/coloring-plan');
  for (const [key, url] of Object.entries(assets))
    assert.equal(after[key], url, key + ' existing asset changed');
  for (const card of cards) assert(after['cw-' + card.id], card.id + ' registration missing');
  ledger.completedAt = new Date().toISOString();
  save(ledgerPath, ledger);
}
function integrate() {
  assert.equal(ledger.verified.length, cards.length, 'verify uploaded assets first');
  const publicRoot = 'packages/client/public';
  const planPath = publicRoot + '/coloring-plan-data.json';
  const manifestPath = publicRoot + '/coloring/manifest.json';
  const indexPath = publicRoot + '/coloring/book-index.json';
  const plan = read(planPath),
    manifest = read(manifestPath),
    bookIndex = read(indexPath);
  const previousPlan = structuredClone(plan),
    previousManifest = structuredClone(manifest),
    previousIndex = structuredClone(bookIndex);
  if (!fs.existsSync(root + '/catalog-before.json'))
    save(root + '/catalog-before.json', { plan, manifest, bookIndex });
  const baseline = read(root + '/catalog-before.json');
  assert.deepEqual(
    plan.groups.filter((g) => !g.id.startsWith('changjak-')),
    baseline.plan.groups,
    'legacy plan changed'
  );
  assert.deepEqual(
    manifest.filter((s) => !s.key.startsWith('cw-')),
    baseline.manifest,
    'legacy manifest changed'
  );
  const groups = new Map(),
    sheets = [],
    wordsByBook = new Map();
  for (const card of cards) {
    const sourceUrl = sourceUploads[card.id].url,
      lineartUrl = ledger.uploaded[card.id].url;
    let group = groups.get(card.series);
    if (!group) {
      const category = books[card.uses[0].bookId].category;
      group = { id: 'changjak-' + card.series, label: category, sections: [] };
      groups.set(card.series, group);
    }
    for (const use of card.uses) {
      const book = books[use.bookId];
      assert(book, use.bookId + ' missing book');
      let section = group.sections.find((s) => s.bookId === use.bookId);
      if (!section) {
        section = { bookId: use.bookId, label: book.title, items: [] };
        group.sections.push(section);
      }
      section.items.push({
        key: 'cw-' + card.id,
        bookId: use.bookId,
        bookTitle: book.title,
        word: use.word,
        subject: card.word,
        imageUrl: sourceUrl,
      });
      sheets.push({
        key: 'cw-' + card.id + '-' + use.bookId.split('-').at(-1),
        group: group.label,
        section: book.title,
        unitId: use.bookId,
        word: use.word,
        language: 'korean',
        lineartUrl: proxy(lineartUrl),
        originalUrl: proxy(sourceUrl),
      });
      if (!wordsByBook.has(use.bookId)) wordsByBook.set(use.bookId, new Set());
      wordsByBook.get(use.bookId).add(use.word);
    }
  }
  const additions = [...groups.values()].sort((a, b) => a.label.localeCompare(b.label, 'ko'));
  for (const group of additions) group.sections.sort((a, b) => a.bookId.localeCompare(b.bookId));
  plan.groups = [...baseline.plan.groups, ...additions];
  assert.equal(
    new Set(sheets.map((s) => s.key)).size,
    sheets.length,
    'duplicate book/coloring keys'
  );
  const nextManifest = [...baseline.manifest, ...sheets];
  for (const [id, words] of wordsByBook) bookIndex[id] = [...words];
  assert.deepEqual(nextManifest.slice(0, baseline.manifest.length), baseline.manifest);
  for (const [id, words] of Object.entries(baseline.bookIndex))
    assert.deepEqual(bookIndex[id], words, 'legacy book index changed');
  save(planPath, plan);
  fs.writeFileSync(manifestPath, JSON.stringify(nextManifest));
  fs.writeFileSync(indexPath, JSON.stringify(bookIndex));
  save(root + '/integration.json', {
    cards: cards.length,
    books: wordsByBook.size,
    links: sheets.length,
    groups: additions.length,
    legacyPlanGroups: baseline.plan.groups.length,
    legacyManifest: baseline.manifest.length,
    legacyIndex: Object.keys(baseline.bookIndex).length,
    previousHashes: {
      plan: sha(Buffer.from(JSON.stringify(previousPlan))),
      manifest: sha(Buffer.from(JSON.stringify(previousManifest))),
      index: sha(Buffer.from(JSON.stringify(previousIndex))),
    },
    storybooksModified: 0,
    activityPublication: 'Private creative books excluded; public activity catalog preserved.',
  });
  console.log(
    'INTEGRATED',
    cards.length,
    'cards',
    wordsByBook.size,
    'books',
    sheets.length,
    'links; legacy catalogs preserved'
  );
}
validate();
if (process.argv.includes('--upload')) await upload();
if (process.argv.includes('--integrate')) integrate();
console.log('PASS', cards.length, 'reviewed coloring cards');
