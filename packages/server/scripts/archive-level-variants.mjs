#!/usr/bin/env node
/**
 * 레벨 사본(`<id>__L1` ~ `__L4`) 을 책 목록 밖으로 옮긴다 — 한 책 = 한 레벨(2026-09-14).
 *
 * 사본 67권은 전부 backup 폴더·비공개였고 편집기에서 사본을 찍어내는 기능도 지웠다.
 * 지우지 않고 R2 `_backup/level-variants/storybook-<id>.json` 으로 **복사 → 바이트 대조 → 원래 키 삭제**.
 * 되돌리기 = 그 파일을 `storybook-<id>.json` 으로 다시 복사.
 * 🔴 공개된 사본이 하나라도 있으면 아무것도 안 하고 멈춘다.
 *
 * 사용: node packages/server/scripts/archive-level-variants.mjs [--apply]
 */
import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { loadEnv, listStorybookKeys, getJsonByKey } from './translation-core.mjs';

const APPLY = process.argv.includes('--apply');
loadEnv();
const Bucket = process.env.R2_BUCKET_NAME;
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});

const keys = (await listStorybookKeys()).filter((k) => /__L\d+\.json$/.test(k));
const books = [];
for (const k of keys) books.push({ key: k, book: await getJsonByKey(k) });
const live = books.filter((x) => x.book.isPublic !== false);
if (live.length) {
  console.error(`공개된 레벨 사본이 있다 — 멈춤: ${live.map((x) => x.book.id).join(', ')}`);
  process.exit(1);
}

let moved = 0;
for (const { key, book } of books) {
  const dest = `_backup/level-variants/${key}`;
  console.log(`${APPLY ? '옮김' : '옮길 것'} ${book.id} ${book.title}`);
  if (!APPLY) continue;
  await s3.send(new CopyObjectCommand({ Bucket, CopySource: `${Bucket}/${encodeURIComponent(key)}`, Key: dest }));
  const [a, b] = await Promise.all([
    s3.send(new HeadObjectCommand({ Bucket, Key: key })),
    s3.send(new HeadObjectCommand({ Bucket, Key: dest })),
  ]);
  if (!a.ContentLength || a.ContentLength !== b.ContentLength) {
    console.error(`  ❌ 복사본 크기가 다르다(${a.ContentLength} vs ${b.ContentLength}) — 원본을 남기고 멈춤`);
    process.exit(1);
  }
  await s3.send(new DeleteObjectCommand({ Bucket, Key: key }));
  moved++;
}
console.log(`\n${APPLY ? '적용' : 'dry-run'} — 레벨 사본 ${books.length}권${APPLY ? ` · 옮김 ${moved}` : ''}`);
if (!APPLY) console.log('실제로 옮기려면 --apply');
