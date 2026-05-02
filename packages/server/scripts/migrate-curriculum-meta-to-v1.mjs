#!/usr/bin/env node
/**
 * v2 BookManifest.curriculumMeta → v1 Storybook.curriculumMeta 마이그레이션.
 *
 * 배경:
 *   4-25~27 v2 시도 때 BookManifest 에만 추가됐던 curriculumMeta(no/originalTitle/author/...)를
 *   v1 폐기 결정 후에도 옮기지 않고 있어 v1 단일화 시 손실 위험. 이 스크립트가 그 갭을 메운다.
 *
 * 동작:
 *   1) `books/`*\/manifest.json 모두 list
 *   2) 각 manifest 의 curriculumMeta 추출 (없으면 skip)
 *   3) 동일 id 의 v1 `storybook-{id}.json` 읽기 (없으면 skip — v2-only 137권 등)
 *   4) v1 에 curriculumMeta 가 이미 있고 동일 → skip / 없거나 다름 → patch
 *   5) dry-run 기본. `--apply` 시 실제 PUT.
 */

import {
  S3Client,
  ListObjectsV2Command,
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

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error('R2 env vars 누락');
  process.exit(1);
}

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

console.log(`Mode: ${APPLY ? 'APPLY (실 PUT)' : 'DRY-RUN (목록만)'}`);
console.log('=========================================\n');

console.log('[1/3] v2 manifest 목록 가져오는 중...');
const manifestKeys = [];
let token;
do {
  const r = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: 'books/', ContinuationToken: token })
  );
  if (r.Contents) {
    for (const o of r.Contents) {
      if (o.Key?.endsWith('/manifest.json')) manifestKeys.push(o.Key);
    }
  }
  token = r.IsTruncated ? r.NextContinuationToken : undefined;
} while (token);
console.log(`  ${manifestKeys.length} manifests\n`);

console.log('[2/3] curriculumMeta 추출 + v1 비교...');
const plan = []; // { bid, manifestMeta, v1Existing, action: 'patch' | 'skip-same' | 'skip-no-v1' | 'skip-no-meta' }

let i = 0;
const CONCURRENCY = 20;
async function worker() {
  while (i < manifestKeys.length) {
    const idx = i++;
    const key = manifestKeys[idx];
    const m = await getJson(key);
    if (!m) continue;
    const bid = m.id;
    const meta = m.curriculumMeta;
    if (!meta || Object.keys(meta).length === 0) {
      plan.push({ bid, action: 'skip-no-meta' });
      continue;
    }
    const v1 = await getJson(`storybook-${bid}.json`);
    if (!v1) {
      plan.push({ bid, action: 'skip-no-v1', manifestMeta: meta });
      continue;
    }
    const same = JSON.stringify(v1.curriculumMeta ?? null) === JSON.stringify(meta);
    if (same) {
      plan.push({ bid, action: 'skip-same' });
      continue;
    }
    plan.push({ bid, action: 'patch', manifestMeta: meta, v1Existing: v1.curriculumMeta, v1, title: v1.title });
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const counts = plan.reduce((acc, p) => ((acc[p.action] = (acc[p.action] ?? 0) + 1), acc), {});
console.log('  결과:', counts, '\n');

const toPatch = plan.filter((p) => p.action === 'patch');
console.log(`[3/3] PATCH 대상: ${toPatch.length}권`);
for (const p of toPatch) {
  const before = p.v1Existing ? JSON.stringify(p.v1Existing) : '(없음)';
  const after = JSON.stringify(p.manifestMeta);
  console.log(`  - ${p.bid} | ${p.title}`);
  console.log(`      before: ${before}`);
  console.log(`      after : ${after}`);
}

if (!APPLY) {
  console.log('\n[DRY-RUN] --apply 추가 시 실제 PUT 실행됩니다.');
  process.exit(0);
}

console.log('\n[APPLY] PUT 실행 중...');
let done = 0;
for (const p of toPatch) {
  const next = { ...p.v1, curriculumMeta: p.manifestMeta, updatedAt: new Date().toISOString() };
  await putJson(`storybook-${p.bid}.json`, next);
  done++;
  if (done % 20 === 0) console.log(`  ${done}/${toPatch.length}`);
}
console.log(`\n완료: ${done}권 patched.`);
