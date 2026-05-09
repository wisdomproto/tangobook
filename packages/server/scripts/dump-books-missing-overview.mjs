#!/usr/bin/env node
/**
 * parentGuide.overview 가 누락된 storybook 정보를 단일 JSON 으로 dump.
 *
 * 출력: packages/server/scripts/_data/books-missing-overview.json
 * 형식: [{ id, title, category, ref }, ...]
 *   - ref = referenceContent 의 첫 1500자 (overview 작성용 컨텍스트)
 *
 * 그 후 Claude (또는 사용자) 가 책별 overview 작성 → overview-map.json 에 누적
 *   {[id]: "overview text"}
 * 마지막에 backfill-parent-guide-overview-from-map.mjs 가 그 map 으로 R2 patch.
 */

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
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

console.log('[1/2] storybook-*.json 목록 가져오는 중...');
const keys = [];
let token;
do {
  const r = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: 'storybook-', ContinuationToken: token })
  );
  if (r.Contents) {
    for (const o of r.Contents) {
      if (o.Key?.endsWith('.json') && !o.Key.includes('/')) keys.push(o.Key);
    }
  }
  token = r.IsTruncated ? r.NextContinuationToken : undefined;
} while (token);
console.log(`  ${keys.length} files\n`);

console.log('[2/2] overview 누락 책 정보 추출...');
const missing = [];
let i = 0;
const CONCURRENCY = 20;
async function worker() {
  while (i < keys.length) {
    const idx = i++;
    const key = keys[idx];
    const book = await getJson(key);
    if (!book?.id) continue;
    const ov = book.parentGuide?.overview;
    if (!ov || !ov.trim()) {
      missing.push({
        id: book.id,
        title: book.title || '',
        category: book.category || '',
        ref: (book.referenceContent || '').slice(0, 1500),
      });
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// id 정렬 (안정적 순서)
missing.sort((a, b) => a.id.localeCompare(b.id));

const outDir = path.join(__dirname, '_data');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'books-missing-overview.json');
fs.writeFileSync(outPath, JSON.stringify(missing, null, 2), 'utf-8');

console.log(`  누락: ${missing.length}권`);
console.log(`  ref 보유: ${missing.filter((m) => m.ref).length}권`);
console.log(`  ref 없음: ${missing.filter((m) => !m.ref).length}권`);
console.log(`\n저장: ${outPath}`);
