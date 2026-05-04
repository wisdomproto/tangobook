#!/usr/bin/env node
/**
 * v1 phonics 책 일괄 isPublic=true 토글.
 *
 * 배경:
 *   2026-04-24 seed-phonics-books.mjs 로 71권 + 추가 1권 = 72권의 type='phonics' 책이
 *   생성되었으나 모두 isPublic=false 로 저장되어 라이브러리(/library/phonics)에 노출되지 않음.
 *   사용자 결정으로 일괄 공개.
 *
 * 동작:
 *   1) `storybook-*.json` 모두 list
 *   2) 각 책 GET → type==='phonics' && isPublic!==true 만 대상
 *   3) isPublic=true 로 set + putJson
 *   4) dry-run 기본. `--apply` 시 실제 PUT.
 *
 * 후속:
 *   - server 의 listStorybooks listCache (in-memory) 는 5분 TTL stale-while-revalidate.
 *     변경 즉시 반영하려면 server 재시작 또는 5분 대기.
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
  const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const text = await r.Body.transformToString('utf-8');
  return JSON.parse(text);
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

console.log('[1/3] storybook-*.json list 가져오는 중...');
const keys = [];
let token;
do {
  const r = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: 'storybook-', ContinuationToken: token })
  );
  if (r.Contents) {
    for (const o of r.Contents) {
      if (o.Key?.endsWith('.json')) keys.push(o.Key);
    }
  }
  token = r.IsTruncated ? r.NextContinuationToken : undefined;
} while (token);
console.log(`  ${keys.length} storybook docs\n`);

console.log('[2/3] type=phonics + isPublic 검사...');
const targets = []; // { key, id, title, current, lang }

let i = 0;
const CONCURRENCY = 20;
async function worker() {
  while (i < keys.length) {
    const idx = i++;
    const key = keys[idx];
    let sb;
    try {
      sb = await getJson(key);
    } catch {
      continue;
    }
    if (sb.type !== 'phonics') continue;
    if (sb.isPublic === true) continue;
    targets.push({
      key,
      id: sb.id,
      title: sb.title,
      current: sb.isPublic,
      lang: sb.phonicsConfig?.language,
      sb,
    });
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`  대상: ${targets.length}권 (type=phonics, isPublic !== true)\n`);

console.log('[3/3] PATCH 대상 목록:');
const byLang = { korean: 0, english: 0, other: 0 };
targets.forEach((t) => {
  const langKey = t.lang === 'korean' ? 'korean' : t.lang === 'english' ? 'english' : 'other';
  byLang[langKey]++;
});
console.log(
  `  한글: ${byLang.korean} | 영어: ${byLang.english} | 기타: ${byLang.other}`
);
console.log();
targets.slice(0, 10).forEach((t) =>
  console.log(`  - ${t.id} | ${t.title.slice(0, 60)} | isPublic: ${t.current} → true`)
);
if (targets.length > 10) console.log(`  ... +${targets.length - 10}권 더`);

if (!APPLY) {
  console.log('\n[DRY-RUN] --apply 추가 시 실제 PUT 실행됩니다.');
  process.exit(0);
}

console.log('\n[APPLY] PUT 실행 중...');
let done = 0;
for (const t of targets) {
  const next = { ...t.sb, isPublic: true, updatedAt: new Date().toISOString() };
  await putJson(t.key, next);
  done++;
  if (done % 20 === 0) console.log(`  ${done}/${targets.length}`);
}
console.log(`\n완료: ${done}권 공개됨.`);
console.log('주의: server 재시작 또는 5분 대기 후 라이브러리에 반영됨 (listCache TTL).');
