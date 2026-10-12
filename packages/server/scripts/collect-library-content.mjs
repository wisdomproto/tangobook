// Read-only evidence for the library master. Never boots the server or writes to R2.
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
const arg = (name, fallback) =>
  process.argv.find((v) => v.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const out = arg('out', 'D:/tangobook-inventory/20261012');
dotenv.config({ path: arg('env', 'C:/projects/tangobook/packages/server/.env'), quiet: true });
fs.mkdirSync(out, { recursive: true });
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  maxAttempts: 3,
});
const Bucket = process.env.R2_BUCKET_NAME;
async function list(Prefix) {
  const objects = [];
  let ContinuationToken;
  do {
    const r = await s3.send(new ListObjectsV2Command({ Bucket, Prefix, ContinuationToken }));
    objects.push(...(r.Contents ?? []).map((x) => ({ key: x.Key, bytes: x.Size })));
    ContinuationToken = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return objects;
}
const startedAt = new Date().toISOString();
const keys = (await list('storybook-')).filter((x) => x.key.endsWith('.json'));
const books = [],
  failures = [];
let cursor = 0;
await Promise.all(
  Array.from({ length: 12 }, async () => {
    while (cursor < keys.length) {
      const key = keys[cursor++].key;
      try {
        const r = await s3.send(new GetObjectCommand({ Bucket, Key: key }));
        books.push(JSON.parse(await r.Body.transformToString()));
      } catch (e) {
        failures.push({ key, error: e.name });
      }
      if ((books.length + failures.length) % 100 === 0)
        console.log('BOOKS', books.length, '/', keys.length);
    }
  })
);
fs.writeFileSync(path.join(out, 'books.json'), JSON.stringify(books));
console.log('Books collected', books.length, 'failed', failures.length);
const objects = await list('');
fs.writeFileSync(path.join(out, 'objects.json'), JSON.stringify(objects));
for (const name of ['book-index', 'manifest']) {
  const r = await fetch(`https://www.tangobook.co.kr/coloring/${name}.json`);
  if (!r.ok) throw new Error(`Coloring ${name} ${r.status}`);
  fs.writeFileSync(path.join(out, `coloring-${name}.json`), JSON.stringify(await r.json()));
}
fs.writeFileSync(
  path.join(out, 'collection.json'),
  JSON.stringify(
    {
      startedAt,
      completedAt: new Date().toISOString(),
      books: books.length,
      objects: objects.length,
      failures,
    },
    null,
    2
  )
);
console.log('COMPLETE', books.length, objects.length, 'failures', failures.length);
if (failures.length) process.exitCode = 1;
