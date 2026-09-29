// Remove only the existing page illustrations for Bung and Dingding so their
// newly approved character sheets can be used for a fresh illustration run.
// Usage: node packages/server/scripts/clear-bung-dingding-illustrations.mjs [--apply]
// Dry-run by default. Before applying, original storybook JSON is backed up
// outside the repository. Character/guest sheets and all other book fields stay.
import fs from 'node:fs/promises';
import path from 'node:path';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getJsonByKey, putJsonByKey, loadEnv } from './translation-core.mjs';

const APPLY = process.argv.includes('--apply');
const SERIES = ['bung', 'dingding'];
const BACKUP_ROOT = 'D:/ComfyUI-output/changjak-bung-dingding-reset-20260929';
loadEnv();

const bucket = process.env.R2_BUCKET_NAME;
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function listKeys(prefix) {
  const keys = [];
  let token;
  do {
    const out = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
    for (const object of out.Contents ?? []) if (object.Key) keys.push(object.Key);
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

const books = [];
const imageKeys = [];
const pageKey = (series, key) => new RegExp(`^comic-assets/${series}-(?:0[1-9]|[1-4][0-9]|50)/p(?:10|[1-9])\\.(?:png|jpg|webp)$`).test(key);
for (const series of SERIES) {
  for (let n = 1; n <= 50; n++) {
    const id = `changjak-${series}-${String(n).padStart(2, '0')}`;
    const key = `storybook-${id}.json`;
    const book = await getJsonByKey(key);
    if (book.id !== id || book.isPublic !== false || !Array.isArray(book.pages) || book.pages.length !== 10) {
      throw new Error(`Unexpected book shape or public book: ${key}`);
    }
    const illustrated = book.pages.filter((page) => Boolean(page.illustrationUrl)).length;
    books.push({ key, book, illustrated });
  }
  const keys = await listKeys(`comic-assets/${series}-`);
  for (const key of keys) {
    if (pageKey(series, key)) imageKeys.push(key);
  }
}

console.log(JSON.stringify({
  mode: APPLY ? 'apply' : 'dry-run',
  books: books.length,
  linkedPages: books.reduce((sum, row) => sum + row.illustrated, 0),
  imageObjects: imageKeys.length,
  bySeries: Object.fromEntries(SERIES.map((series) => [series, {
    linkedPages: books.filter((row) => row.book.id.startsWith(`changjak-${series}-`)).reduce((sum, row) => sum + row.illustrated, 0),
    imageObjects: imageKeys.filter((key) => key.startsWith(`comic-assets/${series}-`)).length,
  }])),
}, null, 2));
if (!APPLY) process.exit(0);

try {
  await fs.access(path.join(BACKUP_ROOT, 'manifest.json'));
  throw new Error(`Backup already exists; refusing to overwrite original book snapshots: ${BACKUP_ROOT}`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await fs.mkdir(path.join(BACKUP_ROOT, 'storybook-json'), { recursive: true });
const manifest = {
  createdAt: new Date().toISOString(),
  books: books.map(({ key, illustrated }) => ({ key, illustrated })),
  imageKeys,
};
await fs.writeFile(path.join(BACKUP_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2));
for (const { key, book } of books) {
  const target = path.join(BACKUP_ROOT, 'storybook-json', key);
  await fs.writeFile(target, JSON.stringify(book, null, 2));
}
console.log(`Backed up ${books.length} original book JSON files to ${BACKUP_ROOT}`);

for (const { key, book, illustrated } of books) {
  if (!illustrated) continue;
  const updated = structuredClone(book);
  for (const page of updated.pages) delete page.illustrationUrl;
  // Reflect the changed book content without touching its text, audio or translations.
  updated.updatedAt = new Date().toISOString();
  await putJsonByKey(key, updated);
}
console.log('Removed illustrationUrl from storybook pages.');

for (let offset = 0; offset < imageKeys.length; offset += 500) {
  const batch = imageKeys.slice(offset, offset + 500);
  const out = await s3.send(new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: false },
  }));
  if (out.Errors?.length) throw new Error(`R2 deletion failed for ${out.Errors.length} objects: ${out.Errors.map((e) => e.Key).join(', ')}`);
  console.log(`Deleted ${out.Deleted?.length ?? 0}/${batch.length} page image objects.`);
}

for (const series of SERIES) {
  const remaining = (await listKeys(`comic-assets/${series}-`)).filter((key) => pageKey(series, key));
  if (remaining.length) throw new Error(`${series} page assets remain: ${remaining.length}`);
}
for (const { key } of books) {
  const current = await getJsonByKey(key);
  if (current.pages.some((page) => Boolean(page.illustrationUrl))) throw new Error(`Book still links an illustration: ${key}`);
}
console.log('Verified: zero Bung/Dingding page objects and zero storybook illustration links.');
