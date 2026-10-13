// Register only visually approved files, preserve latest unrelated fields, and verify CDN + books.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(
  new URL('../generated-images/phonics-missing-20261012/', import.meta.url)
);
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const save = (p, x) => fs.writeFileSync(p, JSON.stringify(x, null, 2));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const selected = read(path.join(root, 'selected.json'));
const reviews = read(path.join(root, 'review.json'));
const plan = read(path.join(root, 'plan.json'));
assert(!plan.retired, 'This content plan was retired by the user; do not register it');
for (const image of selected.images) {
  const job = plan.jobs.find((j) => j.id === image.id);
  assert(
    job && job.bookId === image.bookId && job.pageNumber === image.pageNumber,
    'Image outside missing-phonics scope'
  );
  assert(!image.replace, 'Only missing illustrations may be filled');
  assert(image.bookId.startsWith('kr-') || image.bookId.startsWith('en-'));
}
assert.equal(selected.images.length, selected.expected, 'Generation incomplete');
assert.equal(
  new Set(selected.images.map((x) => x.id)).size,
  selected.expected,
  'Duplicate image jobs'
);
for (const image of selected.images) {
  assert.equal(reviews[image.id]?.status, 'pass', image.id + ' lacks visual approval');
  assert.equal(reviews[image.id]?.sha256, image.sha256, image.id + ' review is stale');
  assert.equal(
    sha(fs.readFileSync(path.join(root, image.file))),
    image.sha256,
    image.id + ' file changed'
  );
}
if (!process.argv.includes('--write')) {
  console.log(
    JSON.stringify({
      dryRun: true,
      visuallyApproved: selected.expected,
      message: 'Use --write to upload and save production books.',
    })
  );
  process.exit(0);
}
const ledgerPath = path.join(
  root,
  'registration-' + sha(Buffer.from(JSON.stringify(selected))).slice(0, 12) + '.json'
);
const ledger = fs.existsSync(ledgerPath)
  ? read(ledgerPath)
  : { startedAt: new Date().toISOString(), uploaded: {}, books: {} };
async function req(route, method = 'GET', body) {
  const response = await fetch('https://www.tangobook.co.kr/api' + route, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(120000),
  });
  const json = await response.json();
  assert(response.ok && json.success, `${route}: ${response.status} ${json.error ?? ''}`);
  return json.data;
}
const normalize = (book) => {
  const b = structuredClone(book);
  delete b.updatedAt;
  return b;
};
function protectedFields(book, targets) {
  const b = normalize(book);
  for (const p of b.pages) if (targets.includes(p.pageNumber)) delete p.illustrationUrl;
  return b;
}
for (const bookId of new Set(selected.images.map((x) => x.bookId))) {
  const images = selected.images.filter((x) => x.bookId === bookId);
  const targets = images.map((x) => x.pageNumber);
  let entry = ledger.books[bookId];
  if (!entry) {
    const fresh = await req('/storybooks/' + bookId);
    const baseline = read(path.join(root, 'books-before', bookId + '.json'));
    assert.equal(fresh.type, 'phonics');
    assert.equal(fresh.artStyle, baseline.artStyle, bookId + ' style changed');
    assert.deepEqual(fresh.characters, baseline.characters, bookId + ' characters changed');
    const pending = [];
    for (const image of images) {
      const p = fresh.pages.find((x) => x.pageNumber === image.pageNumber);
      const old = baseline.pages.find((x) => x.pageNumber === image.pageNumber);
      assert(p && old, image.id + ' missing page');
      assert.deepEqual(
        {
          text: p.text,
          scene_description: p.scene_description,
          scene_structure: p.scene_structure,
        },
        {
          text: old.text,
          scene_description: old.scene_description,
          scene_structure: old.scene_structure,
        },
        image.id + ' scene changed'
      );
      if (!image.replace && p.illustrationUrl) continue;
      if (image.replace)
        assert.equal(p.illustrationUrl, old.illustrationUrl, image.id + ' original image changed');
      pending.push(image.id);
    }
    entry = ledger.books[bookId] = {
      before: fresh,
      pending,
      skipped: images.filter((x) => !pending.includes(x.id)).map((x) => x.id),
    };
    fs.mkdirSync(path.join(root, bookId), { recursive: true });
    save(ledgerPath, ledger);
  }
  const active = images.filter((x) => entry.pending.includes(x.id));
  for (const image of active) {
    if (!ledger.uploaded[image.id]) {
      const form = new FormData();
      form.set(
        'image',
        new Blob([fs.readFileSync(path.join(root, image.file))], { type: 'image/webp' }),
        image.id + '.webp'
      );
      form.set('storybookId', bookId);
      form.set('storybookTitle', image.title);
      form.set('type', 'illustration');
      form.set('pageNumber', String(image.pageNumber));
      const response = await fetch('https://www.tangobook.co.kr/api/images/upload', {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(120000),
      });
      const json = await response.json();
      assert(response.ok && json.success && json.data.imageUrl, image.id + ' upload failed');
      // The upload endpoint re-encodes WebP; record CDN bytes separately from the approved source.
      const storageUrl = json.data.imageUrl;
      const cdn = new URL(storageUrl);
      const existingUrl = entry.before.pages.find((p) => p.illustrationUrl)?.illustrationUrl;
      if (cdn.hostname.endsWith('.r2.dev'))
        cdn.host = existingUrl ? new URL(existingUrl).host : 'assets.tangobook.co.kr';
      ledger.uploaded[image.id] = { url: cdn.href, storageUrl, sourceSha256: image.sha256 };
      save(ledgerPath, ledger);
    }
    const uploaded = ledger.uploaded[image.id];
    const response = await fetch(uploaded.url, {
      headers: { Referer: 'https://www.tangobook.co.kr/' },
      signal: AbortSignal.timeout(120000),
    });
    assert(response.ok, image.id + ' CDN ' + response.status);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF', image.id + ' not WebP');
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP', image.id + ' not WebP');
    if (uploaded.cdnSha256) assert.equal(sha(bytes), uploaded.cdnSha256, image.id + ' CDN changed');
    uploaded.cdnSha256 = sha(bytes);
    uploaded.bytes = bytes.length;
    const remoteFile = path.join(root, image.file.replace('.webp', '.cdn.webp'));
    fs.writeFileSync(remoteFile, bytes);
    save(ledgerPath, ledger);
  }
  const desired = structuredClone(entry.before);
  for (const image of active)
    desired.pages.find((p) => p.pageNumber === image.pageNumber).illustrationUrl =
      ledger.uploaded[image.id].url;
  const fresh = await req('/storybooks/' + bookId);
  if (!entry.registered && !entry.saveAttempted) {
    assert.deepEqual(normalize(fresh), normalize(entry.before), bookId + ' concurrent edit');
    entry.saveAttempted = new Date().toISOString();
    save(ledgerPath, ledger);
    if (active.length) await req('/storybooks', 'POST', { storybook: desired });
  } else if (!entry.registered) {
    // An uncertain POST can resume only if the remote book is exactly before or desired.
    if (JSON.stringify(normalize(fresh)) !== JSON.stringify(normalize(desired))) {
      assert.deepEqual(
        normalize(fresh),
        normalize(entry.before),
        bookId + ' uncertain write conflict'
      );
      if (active.length) await req('/storybooks', 'POST', { storybook: desired });
    }
  }
  const got = await req('/storybooks/' + bookId);
  assert.deepEqual(
    protectedFields(got, targets),
    protectedFields(entry.before, targets),
    bookId + ' protected fields changed'
  );
  for (const image of active)
    assert.equal(
      got.pages.find((p) => p.pageNumber === image.pageNumber).illustrationUrl,
      ledger.uploaded[image.id].url,
      image.id + ' URL mismatch'
    );
  entry.registered = true;
  entry.verifiedAt = new Date().toISOString();
  entry.updatedPages = active.length;
  save(path.join(root, bookId, 'after.json'), got);
  save(ledgerPath, ledger);
  console.log(
    JSON.stringify({
      bookId,
      updated: active.length,
      skipped: entry.skipped.length,
      verified: true,
    })
  );
}
ledger.completedAt = new Date().toISOString();
save(ledgerPath, ledger);
console.log(
  JSON.stringify({
    selectedBatchComplete: true,
    plannedMissingTotal: plan.expected,
    selected: selected.expected,
    books: Object.keys(ledger.books).length,
    uploaded: Object.keys(ledger.uploaded).length,
  })
);
