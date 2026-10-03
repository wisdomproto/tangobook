import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root = path.resolve('generated-images/changjak-words');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8')),
  save = (p, x) => fs.writeFileSync(p, JSON.stringify(x, null, 2));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const cards = read(root + '/cropped.json'),
  jobs = read(root + '/jobs.json').jobs,
  backup = read(root + '/books-before.json');
const ledgerPath = root + '/registration.json';
const ledger = fs.existsSync(ledgerPath)
  ? read(ledgerPath)
  : { startedAt: new Date().toISOString(), uploaded: {}, books: {}, verified: [] };
async function req(route, method = 'GET', body) {
  const r = await fetch('https://www.tangobook.co.kr/api' + route, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(120000),
  });
  const j = await r.json();
  assert(r.ok && j.success, route + ' HTTP ' + r.status);
  return j.data;
}
const normalize = (b) => {
  b = structuredClone(b);
  delete b.updatedAt;
  return b;
};
function withoutImages(b) {
  b = normalize(b);
  delete b.keyObjectImages;
  return b;
}
async function main() {
  assert.equal(cards.length, read(root + '/cards.json').length, 'unfinished generation');
  assert.equal(new Set(cards.map((c) => c.id)).size, cards.length, 'duplicate card IDs');
  const reviews = read(root + '/reviews.json');
  for (const j of jobs)
    assert.equal(reviews[j.id]?.status, 'pass', j.id + ' not visually reviewed');
  for (const c of cards) assert.equal(sha(fs.readFileSync(c.file)), c.sha256, c.id + ' changed');
  // Shared cards are byte-preserving WebP uploads; no image-generation API is used here.
  let cursor = 0;
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      while (cursor < cards.length) {
        const c = cards[cursor++];
        if (ledger.uploaded[c.id]) continue;
        const r = await req('/comic-assets/' + c.series + '-words', 'POST', {
          key: c.id,
          dataUrl: 'data:image/webp;base64,' + fs.readFileSync(c.file).toString('base64'),
        });
        ledger.uploaded[c.id] = {
          url: r.url.replace(
            'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/',
            'https://assets.tangobook.co.kr/'
          ),
          sha256: c.sha256,
        };
        save(ledgerPath, ledger);
        if (Object.keys(ledger.uploaded).length % 50 === 0)
          console.log('UPLOADED', Object.keys(ledger.uploaded).length);
      }
    })
  );
  for (const id of Object.keys(backup).sort()) {
    if (ledger.books[id]?.verified) continue;
    const fresh = await req('/storybooks/' + id);
    assert.deepEqual(fresh.key_objects, backup[id].key_objects, id + ' words changed');
    const before = structuredClone(fresh),
      images = [...(fresh.keyObjectImages || [])];
    let added = 0;
    for (const o of fresh.key_objects || []) {
      if (images.some((i) => i.objectName === o.name && i.success && i.imageUrl)) continue;
      const c = cards.find((c) => c.uses.some((u) => u.bookId === id && u.objectName === o.name));
      assert(c, id + ' ' + o.name + ' missing');
      const previous = images.findIndex((i) => i.objectName === o.name);
      const image = { objectName: o.name, imageUrl: ledger.uploaded[c.id].url, success: true };
      if (previous < 0) images.push(image);
      else images[previous] = { ...images[previous], ...image };
      added++;
    }
    ledger.books[id] = { before, added };
    save(ledgerPath, ledger);
    if (added) {
      assert.deepEqual(
        normalize(await req('/storybooks/' + id)),
        normalize(before),
        id + ' concurrent edit'
      );
      await req('/storybooks', 'POST', { storybook: { ...fresh, keyObjectImages: images } });
    }
    const got = await req('/storybooks/' + id);
    assert.deepEqual(
      withoutImages(got),
      withoutImages(before),
      id + ' existing pages/fields changed'
    );
    for (const o of got.key_objects || []) {
      const i = got.keyObjectImages?.find((i) => i.objectName === o.name);
      assert(i?.success && i.imageUrl, id + ' missing image');
    }
    for (const old of before.keyObjectImages || [])
      if (old.success && old.imageUrl)
        assert.deepEqual(
          got.keyObjectImages.find((i) => i.objectName === old.objectName),
          old,
          'existing image changed'
        );
    ledger.books[id].verified = true;
    save(ledgerPath, ledger);
    if (Object.values(ledger.books).filter((b) => b.verified).length % 25 === 0)
      console.log('REGISTERED', Object.values(ledger.books).filter((b) => b.verified).length);
  }
  const verified = new Set(ledger.verified);
  let verifyCursor = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (verifyCursor < cards.length) {
        const c = cards[verifyCursor++];
        if (verified.has(c.id)) continue;
        const r = await fetch(ledger.uploaded[c.id].url + '?verify=' + c.sha256.slice(0, 12), {
          signal: AbortSignal.timeout(120000),
        });
        assert(r.ok, c.id + ' CDN');
        assert.equal(sha(Buffer.from(await r.arrayBuffer())), c.sha256, c.id + ' hash');
        verified.add(c.id);
        ledger.verified = [...verified];
        save(ledgerPath, ledger);
        if (verified.size % 100 === 0) console.log('CDN VERIFIED', verified.size);
      }
    })
  );
  ledger.completedAt = new Date().toISOString();
  save(ledgerPath, ledger);
  console.log(
    'PASS',
    Object.keys(ledger.books).length,
    'books',
    cards.length,
    'cards',
    cards.reduce((n, c) => n + c.uses.length, 0),
    'links; existing pages preserved'
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
