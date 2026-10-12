// Register the 24 inspected missing word images; preserve every other book field.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(
  new URL('../generated-images/active-word-gaps-20261012/', import.meta.url)
);
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const save = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2));
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const selected = read(path.join(root, 'selected.json'));
const review = read(path.join(root, 'review.json'));
assert.equal(selected.images.length, 24);
for (const im of selected.images) {
  assert(['1777601619896', '1777601011770', 'en-b2-u03'].includes(im.bookId));
  assert.equal(review[im.token]?.status, 'pass');
  assert.equal(review[im.token]?.sha256, im.sha256);
  assert.equal(sha(fs.readFileSync(path.join(root, im.file))), im.sha256);
}
if (!process.argv.includes('--write')) {
  console.log(
    JSON.stringify({
      dryRun: true,
      selected: 24,
      files: new Set(selected.images.map((x) => x.file)).size,
    })
  );
  process.exit(0);
}
async function req(route, method = 'GET', data) {
  const res = await fetch('https://www.tangobook.co.kr/api' + route, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
    signal: AbortSignal.timeout(120000),
  });
  const json = await res.json();
  assert(res.ok && json.success, route + ' ' + res.status);
  return json.data;
}
const ledgerPath = path.join(root, 'registration.json');
const ledger = fs.existsSync(ledgerPath) ? read(ledgerPath) : { uploads: {}, books: {} };
const normalize = (b) => {
  const v = structuredClone(b);
  delete v.updatedAt;
  return v;
};
function protectedFields(book) {
  const b = normalize(book);
  if (b.id === 'en-b2-u03') {
    const card = b.flashcards.find((c) => c.word === 'hip');
    for (const key of ['imageUrl', 'imageDescription', 'keypoints']) delete card[key];
  } else {
    const targets = selected.images.filter((x) => x.bookId === b.id).map((x) => x.objectName);
    b.keyObjectImages = (b.keyObjectImages ?? []).filter((x) => !targets.includes(x.objectName));
  }
  return b;
}
for (const bid of ['1777601619896', '1777601011770', 'en-b2-u03']) {
  const targets = selected.images.filter((x) => x.bookId === bid);
  if (!ledger.books[bid]) {
    const before = await req('/storybooks/' + bid);
    const original = read(path.join(root, bid + '.before.json'));
    assert.deepEqual(normalize(before), normalize(original), 'Concurrent source change: ' + bid);
    for (const im of targets) {
      if (im.kind === 'phonics') assert(!before.flashcards.find((c) => c.word === 'hip').imageUrl);
      else {
        assert(before.key_objects.some((w) => w.name === im.objectName));
        assert(!before.keyObjectImages?.find((x) => x.objectName === im.objectName)?.imageUrl);
      }
    }
    ledger.books[bid] = { before };
    save(ledgerPath, ledger);
  }
  const entry = ledger.books[bid];
  for (const im of targets) {
    if (!ledger.uploads[im.sha256]) {
      const form = new FormData();
      form.set(
        'image',
        new Blob([fs.readFileSync(path.join(root, im.file))], { type: 'image/webp' }),
        im.token + '.webp'
      );
      form.set('storybookId', bid);
      form.set('storybookTitle', entry.before.title);
      form.set('type', im.kind === 'phonics' ? 'phonics' : 'key-object');
      form.set('characterName', im.objectName);
      const res = await fetch('https://www.tangobook.co.kr/api/images/upload', {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(120000),
      });
      const json = await res.json();
      assert(res.ok && json.success && json.data.imageUrl);
      const url = new URL(json.data.imageUrl);
      if (url.hostname.endsWith('.r2.dev')) url.host = 'assets.tangobook.co.kr';
      const cdn = await fetch(url.href, {
        headers: { Referer: 'https://www.tangobook.co.kr/' },
        signal: AbortSignal.timeout(120000),
      });
      assert(cdn.ok);
      const bytes = Buffer.from(await cdn.arrayBuffer());
      assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
      assert.equal(bytes.subarray(8, 12).toString(), 'WEBP');
      ledger.uploads[im.sha256] = { url: url.href, cdnSha256: sha(bytes), bytes: bytes.length };
      save(ledgerPath, ledger);
    }
  }
  const desired = structuredClone(entry.before);
  for (const im of targets) {
    const imageUrl = ledger.uploads[im.sha256].url;
    if (im.kind === 'phonics') {
      const card = desired.flashcards.find((c) => c.word === 'hip');
      card.imageUrl = imageUrl;
      card.imageDescription =
        '양모 펠트 인물이 파란 반바지 바깥쪽 엉덩이·골반 부위를 가리키는 모습.';
      card.keypoints = review.hip.keypoints;
      assert(
        card.keypoints?.length >= 8,
        'New image needs new outline points, not retired rabbit points'
      );
    } else {
      desired.keyObjectImages ??= [];
      const existing = desired.keyObjectImages.find((x) => x.objectName === im.objectName);
      if (existing) Object.assign(existing, { imageUrl, success: true });
      else desired.keyObjectImages.push({ objectName: im.objectName, imageUrl, success: true });
    }
  }
  const fresh = await req('/storybooks/' + bid);
  if (
    !entry.registered &&
    JSON.stringify(normalize(fresh)) !== JSON.stringify(normalize(desired))
  ) {
    assert.deepEqual(
      normalize(fresh),
      normalize(entry.before),
      'Concurrent edit before save: ' + bid
    );
    entry.saveAttempted = true;
    save(ledgerPath, ledger);
    await req('/storybooks', 'POST', { storybook: desired });
  }
  const got = await req('/storybooks/' + bid);
  assert.deepEqual(
    protectedFields(got),
    protectedFields(entry.before),
    'Unrelated fields changed: ' + bid
  );
  assert.deepEqual(normalize(got), normalize(desired), 'Target changes do not match: ' + bid);
  entry.registered = true;
  entry.count = targets.length;
  save(ledgerPath, ledger);
  save(path.join(root, bid + '.after.json'), got);
  await req('/vocabulary-db/sync', 'POST', { storybookId: bid });
  console.log(
    JSON.stringify({ bookId: bid, registered: targets.length, otherFieldsPreserved: true })
  );
}
ledger.complete = true;
ledger.completedAt = new Date().toISOString();
save(ledgerPath, ledger);
console.log(
  JSON.stringify({
    complete: true,
    registered: 24,
    uniqueFiles: Object.keys(ledger.uploads).length,
  })
);
