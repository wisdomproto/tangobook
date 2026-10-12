// Fill only missing narration after source-bound generation and ASR/review checks.
// Upload immutable MP3s directly to R2; never add page narration to the BGM library.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../packages/server/package.json', import.meta.url));
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const root = 'D:/tangobook-audio/library-missing-20261012';
const out = path.join(root, 'registration');
const stage = process.argv[2];
assert(['audit', 'apply', 'verify'].includes(stage), 'Use audit/apply/verify');
const follow = process.argv.includes('--follow');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const save = (p, x) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p + '.tmp', JSON.stringify(x, null, 2));
  fs.renameSync(p + '.tmp', p);
};
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const plan = read(path.join(root, 'plan.json'));
const num = (p) => p.pageNumber ?? p.page_number;
const normalize = (b) => {
  const x = structuredClone(b);
  delete x.updatedAt;
  return x;
};
const source = (b) => ({
  title: b.title,
  characters: b.characters ?? [],
  pages: b.pages.map((p) => ({ number: num(p), text: p.text, scene: p.scene_description ?? null })),
});
const stem = (j) => path.join(j.bookId, j.language, 'p' + String(j.pageNumber).padStart(2, '0'));
async function api(route, book) {
  const r = await fetch('https://www.tangobook.co.kr/api' + route, {
    method: book ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    body: book ? JSON.stringify({ storybook: book }) : undefined,
    signal: AbortSignal.timeout(120000),
  });
  const j = await r.json();
  assert(r.ok && j.success, route + ': ' + r.status);
  return j.data;
}
function inspect(bookId) {
  const jobs = plan.jobs.filter((j) => j.bookId === bookId);
  const reviewsPath = path.join(root, 'asr-review.json');
  const reviews = fs.existsSync(reviewsPath) ? read(reviewsPath) : {};
  const manualPath = path.join(root, 'manual-asr-review.json');
  if (fs.existsSync(manualPath)) Object.assign(reviews, read(manualPath));
  const checked = [];
  for (const j of jobs) {
    const s = stem(j),
      p = path.join(root, 'audio', s + '.json'),
      a = path.join(root, 'audit-large-v3-vad-v1', s + '.json');
    if (!fs.existsSync(p) || !fs.existsSync(a)) return null;
    const receipt = read(p),
      audit = read(a),
      file = path.join(root, 'audio', s + '.mp3');
    assert.equal(receipt.bookId, j.bookId);
    assert.equal(receipt.pageNumber, j.pageNumber);
    assert.equal(receipt.language, j.language);
    assert.equal(receipt.sourceSha256, j.sourceSha256);
    assert.equal(sha(fs.readFileSync(file)), receipt.mp3Sha256);
    assert.equal(audit.mp3Sha256, receipt.mp3Sha256);
    if (audit.status !== 'asr-matched') {
      const approved = reviews[s.replaceAll(path.sep, '/')];
      if (!approved || approved.status !== 'pass' || approved.mp3Sha256 !== receipt.mp3Sha256)
        return null;
    }
    let text = j.existingText;
    if (j.language === 'en' && !text) {
      const tr = read(path.join(root, 'translations', bookId + '.json'));
      assert.equal(tr.sourceSha256, j.sourceSha256);
      assert.equal(tr.reviewed, true);
      text = tr.pages.find((p) => p.pageNumber === j.pageNumber).text;
    }
    assert.equal(receipt.request.text, text.replaceAll('**', '').replaceAll('__', '').trim());
    checked.push({
      ...j,
      file,
      sha256: receipt.mp3Sha256,
      text,
      duration: receipt.duration,
      auditStatus: audit.status,
    });
  }
  return checked;
}
let s3;
if (stage === 'apply') {
  dotenv.config({ path: 'C:/projects/tangobook/packages/server/.env', quiet: true });
  for (const k of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'])
    assert(process.env[k], k + ' missing');
  s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    maxAttempts: 3,
  });
}
async function upload(j) {
  const key = `tts/library-qwen-missing-v1/${j.bookId}/${j.language}/p${String(j.pageNumber).padStart(2, '0')}-${j.sha256}.mp3`;
  const url = 'https://assets.tangobook.co.kr/' + key;
  const receiptPath = path.join(out, 'uploads', stem(j) + '.json');
  if (!fs.existsSync(receiptPath)) {
    await s3
      .send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: fs.readFileSync(j.file),
          ContentType: 'audio/mpeg',
          CacheControl: 'public, max-age=31536000, immutable',
          IfNoneMatch: '*',
        })
      )
      .catch((e) => {
        if (e.$metadata?.httpStatusCode !== 412) throw e;
      });
  } else assert.equal(read(receiptPath).sha256, j.sha256);
  const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
  assert(r.ok, 'CDN missing: ' + key);
  assert.equal(sha(Buffer.from(await r.arrayBuffer())), j.sha256, 'CDN content changed');
  save(receiptPath, { url, sha256: j.sha256, verifiedAt: new Date().toISOString() });
  return url;
}
async function apply(bookId, jobs) {
  const completed = path.join(out, 'applied', bookId + '.json');
  if (fs.existsSync(completed)) return;
  const pending = path.join(out, 'pending', bookId + '.json');
  let row = fs.existsSync(pending) ? read(pending) : null;
  if (!row) {
    const fresh = await api('/storybooks/' + bookId);
    const baseline = read(path.join(root, 'books-before', bookId + '.json'));
    assert.deepEqual(source(fresh), source(baseline), bookId + ' narration source changed');
    const desired = structuredClone(fresh),
      used = [],
      skipped = [];
    for (const j of jobs) {
      const p = desired.pages.find((p) => num(p) === j.pageNumber);
      const oldUrl = j.language === 'ko' ? p.ttsUrl : p.translations?.en?.ttsUrl;
      if (oldUrl) {
        skipped.push(stem(j));
        continue;
      }
      if (j.language === 'en' && p.translations?.en?.text)
        assert.equal(p.translations.en.text, j.text, 'New English source conflict');
      const url = await upload(j);
      if (j.language === 'ko') p.ttsUrl = url;
      else
        p.translations = {
          ...p.translations,
          en: { ...p.translations?.en, text: j.text, ttsUrl: url },
        };
      used.push({ pageNumber: j.pageNumber, language: j.language, url, sha256: j.sha256 });
    }
    if (used.some((j) => j.language === 'en')) {
      const tr = read(path.join(root, 'translations', bookId + '.json'));
      if (!desired.titleTranslations?.en)
        desired.titleTranslations = { ...desired.titleTranslations, en: tr.title };
      desired.languages = [...new Set([...(desired.languages ?? ['ko']), 'en'])];
    }
    row = { before: fresh, desired, used, skipped, preparedAt: new Date().toISOString() };
    save(pending, row);
  }
  const fresh = await api('/storybooks/' + bookId);
  if (!isDeepStrictEqual(normalize(fresh), normalize(row.desired))) {
    assert.deepEqual(normalize(fresh), normalize(row.before), bookId + ' concurrent edit');
    await api('/storybooks', row.desired);
  }
  const got = await api('/storybooks/' + bookId);
  assert.deepEqual(normalize(got), normalize(row.desired), bookId + ' save differs');
  assert.deepEqual(source(got), source(row.before), bookId + ' original source changed');
  save(completed, { ...row, after: got, verifiedAt: new Date().toISOString() });
  console.log(
    JSON.stringify({
      registered: bookId,
      audio: row.used.length,
      preservedExisting: row.skipped.length,
    })
  );
}
async function verify() {
  let registered = 0;
  for (const b of plan.books) {
    const p = path.join(out, 'applied', b.id + '.json');
    assert(fs.existsSync(p), b.id + ' not registered');
    const row = read(p),
      got = await api('/storybooks/' + b.id);
    assert.deepEqual(normalize(got), normalize(row.after), b.id + ' changed after registration');
    for (const j of row.used) {
      const p = got.pages.find((p) => num(p) === j.pageNumber),
        url = j.language === 'ko' ? p.ttsUrl : p.translations.en.ttsUrl;
      assert.equal(url, j.url);
      const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
      assert(r.ok);
      assert.equal(sha(Buffer.from(await r.arrayBuffer())), j.sha256);
      registered++;
    }
  }
  save(path.join(out, 'complete.json'), {
    books: plan.books.length,
    planned: plan.expected,
    registered,
    completedAt: new Date().toISOString(),
    sourcesAndUnrelatedFieldsPreserved: true,
  });
  console.log(
    JSON.stringify({ complete: true, books: plan.books.length, planned: plan.expected, registered })
  );
}
if (stage === 'verify') await verify();
else {
  let previous = '';
  do {
    let ready = 0;
    for (const b of plan.books) {
      const jobs = inspect(b.id);
      if (!jobs) continue;
      ready++;
      if (stage === 'apply') await apply(b.id, jobs);
    }
    const applied = fs.existsSync(path.join(out, 'applied'))
      ? fs.readdirSync(path.join(out, 'applied')).filter((f) => f.endsWith('.json')).length
      : 0;
    const state = {
      readyBooks: ready,
      appliedBooks: applied,
      expectedBooks: plan.books.length,
      expectedAudio: plan.expected,
    };
    save(path.join(out, 'status.json'), { ...state, updatedAt: new Date().toISOString() });
    if (JSON.stringify(state) !== previous) {
      console.log(JSON.stringify(state));
      previous = JSON.stringify(state);
    }
    if (stage === 'apply' && applied === plan.books.length) {
      await verify();
      break;
    }
    if (!follow) break;
    await new Promise((resolve) => setTimeout(resolve, 30000));
  } while (true);
}
