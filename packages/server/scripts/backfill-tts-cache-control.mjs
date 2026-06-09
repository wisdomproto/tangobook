#!/usr/bin/env node
/**
 * 기존 TTS(.mp3) 객체에 Cache-Control(immutable) 메타데이터를 소급 적용 (backfill).
 *
 * 배경: TTS key 도 끝에 timestamp 를 박는다 (`{id}-tts-page{n}-{ts}.mp3`) → 콘텐츠가 바뀌면
 *   URL 이 바뀌므로 1년 immutable 이 안전. 신규 업로드는 r2.provider 의 cacheControlFor 가
 *   audio/* 에 자동 적용하지만, cacheControlFor 도입(2026-06) 이전에 올라간 TTS 는 헤더가 없다.
 *   → BookDetailPage 프리페치가 브라우저 HTTP 캐시로 뷰어에 전달되려면 이 헤더가 필요.
 *
 * 방식: CopyObject(같은 key) + MetadataDirective:REPLACE (zero-copy, 본문 불변).
 *   REPLACE 는 시스템 메타를 전부 교체하므로 ContentType=audio/mpeg 도 함께 재설정.
 *
 * 멱등: 재실행해도 안전. mp4(영상)·이미지는 대상 아님(이미지는 backfill-cache-control.mjs).
 *
 * 사용:
 *   node scripts/backfill-tts-cache-control.mjs          # dry-run (카운트/샘플만)
 *   node scripts/backfill-tts-cache-control.mjs --apply   # 실제 갱신
 */
import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error('R2 env vars 누락. packages/server/.env 확인.');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const APPLY = process.argv.includes('--apply');
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
// TTS 만 대상 (-tts- 패턴). BGM/SFX 등 다른 mp3 는 제외 — URL 불변 보장이 약할 수 있어 immutable 회피.
const TTS_PATTERN = /-tts-.*\.mp3$/i;
const CONCURRENCY = 16;

function copySource(key) {
  return `${bucket}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
}

async function updateMeta(key) {
  await s3.send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: key,
      CopySource: copySource(key),
      MetadataDirective: 'REPLACE',
      ContentType: 'audio/mpeg',
      CacheControl: CACHE_CONTROL,
    })
  );
}

console.log(`R2 전수 스캔 시작 (mode: ${APPLY ? 'APPLY' : 'dry-run'})...\n`);

const mp3Keys = [];
let totalCount = 0;
let token;
let pageCount = 0;
do {
  const out = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
  pageCount++;
  for (const o of out.Contents ?? []) {
    totalCount++;
    if (TTS_PATTERN.test(o.Key)) mp3Keys.push(o.Key);
  }
  token = out.IsTruncated ? out.NextContinuationToken : undefined;
  if (pageCount % 10 === 0) {
    process.stdout.write(`\r... ${pageCount} pages, ${totalCount} objects, ${mp3Keys.length} mp3`);
  }
} while (token);

console.log(`\n\n전체 ${totalCount} 객체 중 mp3 ${mp3Keys.length} 개`);
if (mp3Keys.length === 0) {
  console.log('대상 mp3 없음. 종료.');
  process.exit(0);
}

// 현재 Cache-Control 샘플 (5)
console.log('\n현재 Cache-Control 샘플 (5):');
for (const key of mp3Keys.slice(0, 5)) {
  try {
    const h = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    console.log(`  ${h.CacheControl ? `[${h.CacheControl}]` : '(없음)'}  ${key.slice(0, 60)}`);
  } catch (e) {
    console.log(`  (head 실패: ${e.name})  ${key.slice(0, 60)}`);
  }
}

if (!APPLY) {
  console.log(`\n[dry-run] 위 ${mp3Keys.length} 개 mp3 에 "${CACHE_CONTROL}" 적용 예정.`);
  console.log('실제 적용: node scripts/backfill-tts-cache-control.mjs --apply');
  process.exit(0);
}

console.log(`\n[apply] 첫 객체로 검증...`);
const first = mp3Keys[0];
await updateMeta(first);
const verify = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: first }));
if (verify.CacheControl !== CACHE_CONTROL) {
  console.error(`검증 실패: CacheControl = ${verify.CacheControl ?? '(없음)'}. 중단.`);
  process.exit(1);
}
console.log(`검증 OK: [${verify.CacheControl}]  ContentType=${verify.ContentType}\n`);

let done = 1;
let failed = 0;
const failures = [];
let idx = 1;
const t0 = Date.now();

async function worker() {
  while (idx < mp3Keys.length) {
    const key = mp3Keys[idx++];
    try {
      await updateMeta(key);
      done++;
    } catch (e) {
      failed++;
      if (failures.length < 20) failures.push(`${key} → ${e.name}: ${e.message}`);
    }
    if ((done + failed) % 100 === 0) {
      const rate = (done + failed) / ((Date.now() - t0) / 1000);
      process.stdout.write(
        `\r... ${done + failed}/${mp3Keys.length}  (성공 ${done}, 실패 ${failed}, ${rate.toFixed(0)}/s)`
      );
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\n\n완료: 성공 ${done}, 실패 ${failed} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
if (failures.length) {
  console.log('\n실패 샘플:');
  failures.forEach((f) => console.log('  ' + f));
  process.exit(1);
}
