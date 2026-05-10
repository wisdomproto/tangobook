#!/usr/bin/env node
/**
 * v2-only 책의 R2 데이터 폐기.
 *
 * 대상: `_data/v2-only-books.json` 의 47권 (모두 빈 manifest, 콘텐츠 0)
 * 삭제 범위:
 *   - `books/{id}/manifest.json`
 *   - `books/{id}/` 하위 모든 객체 (혹시 잔재 있을 경우)
 *
 * v1 storybook (`storybook-{id}.json`) 에 없는 책만 대상이라 v1 단일화 라이브러리에 영향 X.
 * variant (`storybook-{id}__L{n}.json`) 는 v1 에 별도로 존재해 영향 X.
 *
 * dry-run 기본. `--apply` 시 실 삭제.
 */
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
const envText = fs.readFileSync(envPath, 'utf-8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const APPLY = process.argv.includes('--apply');
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const dumpPath = path.join(__dirname, '_data', 'v2-only-books.json');
const v2Only = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));

console.log(`Mode: ${APPLY ? 'APPLY (실 DELETE)' : 'DRY-RUN'} | v2-only: ${v2Only.length}권\n`);

console.log('[1/2] 각 책의 books/{id}/ 하위 객체 list...');
const allKeysToDelete = [];
let i = 0;
const CONCURRENCY = 10;
async function listWorker() {
  while (i < v2Only.length) {
    const idx = i++;
    const b = v2Only[idx];
    const prefix = `books/${b.id}/`;
    const keys = [];
    let token;
    do {
      const r = await s3.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token })
      );
      if (r.Contents) {
        for (const o of r.Contents) keys.push(o.Key);
      }
      token = r.IsTruncated ? r.NextContinuationToken : undefined;
    } while (token);
    if (keys.length > 0) {
      allKeysToDelete.push({ bid: b.id, title: b.title, keys });
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, listWorker));

const totalKeys = allKeysToDelete.reduce((acc, b) => acc + b.keys.length, 0);
console.log(`  ${allKeysToDelete.length}/${v2Only.length} 권에 R2 객체 존재 (총 ${totalKeys} keys)`);

console.log('\n[2/2] DELETE 대상:');
for (const b of allKeysToDelete) {
  console.log(`  - ${b.bid} | ${b.title} | keys=${b.keys.length}`);
  for (const k of b.keys.slice(0, 3)) console.log(`      · ${k}`);
  if (b.keys.length > 3) console.log(`      · ... +${b.keys.length - 3}개`);
}

if (!APPLY) {
  console.log('\n[DRY-RUN] --apply 시 실제 DELETE.');
  process.exit(0);
}

console.log('\n[APPLY] DELETE 실행 중...');
let done = 0;
for (const b of allKeysToDelete) {
  for (const k of b.keys) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: k }));
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${totalKeys}`);
  }
}
console.log(`\n완료: ${done} keys deleted (${allKeysToDelete.length}권)`);
