#!/usr/bin/env node
/**
 * overview-map.json (id → overview) 읽어서 R2 storybook-*.json 의 parentGuide.overview 채움.
 *
 * - dry-run 기본. `--apply` 시 실제 PUT.
 * - 기존 parentGuide.lessons / readingTips 보존.
 * - 이미 overview 가 있는 책은 skip (덮어쓰지 않음).
 */

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
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

async function getJson(key) {
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const text = await r.Body.transformToString('utf-8');
    return JSON.parse(text);
  } catch (e) {
    if (e?.name === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404) return null;
    throw e;
  }
}

async function putJson(key, data) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
    })
  );
}

const mapPath = path.join(__dirname, '_data', 'overview-map.json');
if (!fs.existsSync(mapPath)) {
  console.error(`overview-map.json 없음: ${mapPath}`);
  process.exit(1);
}
const map = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
const ids = Object.keys(map);

console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'} | Map: ${ids.length}권`);
console.log('=========================================\n');

const plan = []; // { id, key, current, next, action }
let i = 0;
const CONCURRENCY = 10;
async function scanWorker() {
  while (i < ids.length) {
    const idx = i++;
    const id = ids[idx];
    const overview = map[id];
    const key = `storybook-${id}.json`;
    const book = await getJson(key);
    if (!book) {
      plan.push({ id, key, action: 'skip-no-book' });
      continue;
    }
    const existing = book.parentGuide?.overview;
    if (existing && existing.trim()) {
      plan.push({ id, key, action: 'skip-existing', title: book.title });
      continue;
    }
    plan.push({ id, key, action: 'patch', title: book.title, book, overview });
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, scanWorker));

const counts = plan.reduce((acc, p) => ((acc[p.action] = (acc[p.action] ?? 0) + 1), acc), {});
console.log('계획:', counts, '\n');

const toPatch = plan.filter((p) => p.action === 'patch');
console.log(`PATCH 대상: ${toPatch.length}권`);
for (const p of toPatch.slice(0, 5)) {
  console.log(`  - ${p.id} | ${p.title}`);
  console.log(`    → ${p.overview}`);
}
if (toPatch.length > 5) console.log(`  ... +${toPatch.length - 5}권`);

if (!APPLY) {
  console.log('\n[DRY-RUN] --apply 추가 시 실제 PUT.');
  process.exit(0);
}

console.log('\n[APPLY] R2 PUT 중...');
let done = 0;
for (const p of toPatch) {
  const next = {
    ...p.book,
    parentGuide: {
      ...(p.book.parentGuide ?? {}),
      overview: p.overview,
    },
    updatedAt: new Date().toISOString(),
  };
  await putJson(p.key, next);
  done++;
  if (done % 25 === 0) console.log(`  ${done}/${toPatch.length}`);
}
console.log(`\n완료: ${done}권 patched.`);
