// Register the completed local narration without changing illustrations or other book fields.
// R2 assets are immutable and content-addressed; registration and verification are resumable.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../packages/server/package.json', import.meta.url));
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const args = process.argv.slice(2);
const stage = args[0];
assert(['audit', 'apply', 'verify'].includes(stage), 'Use audit/apply/verify');
const root = 'D:/tangobook-audio/changjak-series-01-19-20261004';
const out = path.join(root, 'registration-20261012');
const api = 'https://www.tangobook.co.kr/api';
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
function save(p, v) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p + '.tmp', JSON.stringify(v, null, 2));
  fs.renameSync(p + '.tmp', p);
}
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const normalize = (b) => {
  const v = structuredClone(b);
  delete v.updatedAt;
  return v;
};
function untouched(b) {
  const v = normalize(b);
  delete v.languages;
  if (v.titleTranslations) {
    delete v.titleTranslations.en;
    if (!Object.keys(v.titleTranslations).length) delete v.titleTranslations;
  }
  for (const p of v.pages) {
    delete p.ttsUrl;
    if (p.translations) {
      delete p.translations.en;
      if (!Object.keys(p.translations).length) delete p.translations;
    }
  }
  return v;
}
async function req(route, body) {
  const r = await fetch(api + route, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(120000),
  });
  assert(r.ok, `API ${route}: ${r.status}`);
  const j = await r.json();
  assert(j.success, `API ${route} failed`);
  return j.data;
}
async function pool(items, n, fn) {
  let i = 0,
    failed;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length && !failed) {
        const item = items[i++];
        try {
          await fn(item);
        } catch (e) {
          failed = e;
        }
      }
    })
  );
  if (failed) throw failed;
}
const inventory = read(path.join(root, 'inventory.json')).perBook;
assert.equal(inventory.length, 850);
const ids = inventory.map((b) => b.id);
assert.equal(new Set(ids).size, 850);
const selectedId = args.find((a) => a.startsWith('--only='))?.slice(7);
if (selectedId) assert(ids.includes(selectedId), 'Unknown book');
let done = 0;
if (stage === 'audit') {
  const status = read(path.join(root, 'batch-status.json'));
  assert.equal(status.generated, 17000);
  assert.equal(status.auditPending, 0);
  await pool(ids, 8, async (id) => {
    const before = await req('/storybooks/' + id);
    const source = read(path.join(root, 'books-before', id + '.json'));
    const en = read(path.join(root, 'translations', id + '.json'));
    assert.equal(en.reviewed, true);
    assert.equal(en.bookId, id);
    assert.deepEqual(
      before.pages.map((p) => [p.page_number, p.text]),
      source.pages.map((p) => [p.page_number, p.text]),
      id + ' source text changed'
    );
    assert.deepEqual(before.characters, source.characters, id + ' characters changed');
    assert.equal(before.title, source.title, id + ' title changed');
    assert.deepEqual(
      en.pages.map((p) => p.pageNumber),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    );
    const jobs = [];
    for (const p of before.pages)
      for (const lang of ['ko', 'en']) {
        const num = p.page_number,
          stem = 'p' + String(num).padStart(2, '0');
        const file = path.join(root, 'audio', id, lang, stem + '.mp3');
        const receipt = read(file.replace(/\.mp3$/, '.json'));
        const audit = read(path.join(root, 'audit-large-v3-vad-v1', id, lang, stem + '.json'));
        const text = lang === 'ko' ? p.text : en.pages.find((e) => e.pageNumber === num).text;
        assert.equal(receipt.bookId, id);
        assert.equal(receipt.pageNumber, num);
        assert.equal(receipt.language, lang);
        assert.equal(receipt.request.text, text, id + ' narration text mismatch');
        assert.equal(sha(fs.readFileSync(file)), receipt.mp3Sha256, id + ' MP3 changed');
        assert.equal(audit.mp3Sha256, receipt.mp3Sha256, id + ' audit version mismatch');
        assert(receipt.duration > 0);
        if (lang === 'en' && p.translations?.en?.text)
          assert.equal(p.translations.en.text, text, id + ' existing English differs');
        jobs.push({
          num,
          lang,
          file,
          sha256: receipt.mp3Sha256,
          duration: receipt.duration,
          auditStatus: audit.status,
        });
      }
    if (before.titleTranslations?.en) assert.equal(before.titleTranslations.en, en.titleEn);
    save(path.join(out, 'before', id + '.json'), { before, en, jobs });
    if (++done % 50 === 0) console.log('AUDIT', done, '/850');
  });
  save(path.join(out, 'audit.json'), {
    books: 850,
    audioPages: 17000,
    needsListeningReview: status.needsListeningReview,
    createdAt: Date.now(),
  });
  console.log('AUDIT COMPLETE', done);
}
if (stage === 'apply') {
  assert.equal(read(path.join(out, 'audit.json')).audioPages, 17000);
  dotenv.config({ path: 'C:/projects/tangobook/packages/server/.env', quiet: true });
  const env = process.env;
  for (const key of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'])
    assert(env[key], key + ' missing');
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
    maxAttempts: 3,
  });
  await pool(selectedId ? [selectedId] : ids, 8, async (id) => {
    const row = read(path.join(out, 'before', id + '.json'));
    const complete = path.join(out, 'applied', id + '.json');
    if (fs.existsSync(complete)) {
      assert.deepEqual(
        normalize(await req('/storybooks/' + id)),
        normalize(read(complete).after),
        id + ' changed after save'
      );
      return;
    }
    const updated = structuredClone(row.before);
    await pool(row.jobs, 4, async (j) => {
      const key = `tts/changjak-qwen-v1/${id}/${j.lang}/p${String(j.num).padStart(2, '0')}-${j.sha256}.mp3`;
      const url = 'https://assets.tangobook.co.kr/' + key;
      const receiptPath = path.join(out, 'uploads', id, j.lang, 'p' + j.num + '.json');
      if (!fs.existsSync(receiptPath)) {
        const buf = fs.readFileSync(j.file);
        assert.equal(sha(buf), j.sha256);
        await s3
          .send(
            new PutObjectCommand({
              Bucket: env.R2_BUCKET_NAME,
              Key: key,
              Body: buf,
              ContentType: 'audio/mpeg',
              CacheControl: 'public, max-age=31536000, immutable',
              IfNoneMatch: '*',
            })
          )
          .catch((e) => {
            if (e.$metadata?.httpStatusCode !== 412) throw e;
          });
        const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
        assert(r.ok, id + ' CDN audio missing');
        assert.equal(sha(Buffer.from(await r.arrayBuffer())), j.sha256, id + ' CDN hash mismatch');
        save(receiptPath, { url, sha256: j.sha256, verifiedAt: Date.now() });
      } else {
        const saved = read(receiptPath);
        assert.equal(saved.url, url);
        assert.equal(saved.sha256, j.sha256);
      }
      const page = updated.pages.find((p) => p.page_number === j.num);
      if (j.lang === 'ko') page.ttsUrl = url;
      else
        page.translations = {
          ...page.translations,
          en: {
            ...page.translations?.en,
            text: row.en.pages.find((p) => p.pageNumber === j.num).text,
            ttsUrl: url,
          },
        };
    });
    updated.titleTranslations = { ...updated.titleTranslations, en: row.en.titleEn };
    updated.languages = [...new Set([...(updated.languages ?? ['ko']), 'ko', 'en'])];
    assert.deepEqual(untouched(updated), untouched(row.before), id + ' unrelated change');
    const fresh = await req('/storybooks/' + id);
    // Reconcile an interrupted successful write before making another request.
    if (JSON.stringify(normalize(fresh)) !== JSON.stringify(normalize(updated))) {
      assert.deepEqual(normalize(fresh), normalize(row.before), id + ' concurrent edit');
      save(path.join(out, 'pending', id + '.json'), { before: fresh, after: updated });
      await req('/storybooks', { storybook: updated });
    }
    const got = await req('/storybooks/' + id);
    assert.deepEqual(normalize(got), normalize(updated), id + ' saved differs');
    save(complete, { after: got, verifiedAt: Date.now() });
    if (++done % 10 === 0) console.log('REGISTERED', done, '/850');
  });
  console.log('APPLY COMPLETE');
}
if (stage === 'verify') {
  await pool(ids, 8, async (id) => {
    const row = read(path.join(out, 'before', id + '.json'));
    const expected = read(path.join(out, 'applied', id + '.json')).after;
    const got = await req('/storybooks/' + id);
    assert.deepEqual(normalize(got), normalize(expected), id + ' final mismatch');
    assert.deepEqual(untouched(got), untouched(row.before), id + ' unrelated fields changed');
    assert(got.languages.includes('en'));
    for (const j of row.jobs) {
      const p = got.pages.find((p) => p.page_number === j.num);
      const url = j.lang === 'ko' ? p.ttsUrl : p.translations.en.ttsUrl;
      assert.equal(url, read(path.join(out, 'uploads', id, j.lang, 'p' + j.num + '.json')).url);
    }
    if (++done % 50 === 0) console.log('VERIFIED', done, '/850');
  });
  save(path.join(out, 'complete.json'), {
    books: done,
    ko: 8500,
    en: 8500,
    registered: true,
    cdnHashVerified: 17000,
    unrelatedFieldsPreserved: true,
    needsListeningReview: 4054,
    verifiedAt: Date.now(),
  });
  console.log('VERIFICATION COMPLETE', done);
}
