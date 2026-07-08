#!/usr/bin/env node
/**
 * 모든 오디오(.mp3/.wav) R2 객체에 Cache-Control(immutable) 소급 적용 (backfill).
 *
 * 🔴 배경: 기존 `backfill-tts-cache-control.mjs` 는 `-tts-` 패턴만 대상이라 **phonics-library
 *    음절 mp3**(`phonics-library/mod_korean/ㄱ.mp3` 등 3232개 — 그림짝/블록 게임이 재생하는
 *    음원)에 Cache-Control 이 없었다. 헤더가 없으면 브라우저가 durable 캐시를 안 해서 게임에서
 *    **매번 음원을 재다운로드 → 첫 발음이 늘 느림**(프리워밍도 무의미). 이 스크립트가 전 오디오를
 *    커버한다. 음절/BGM/효과음/TTS 는 콘텐츠가 안정적(같은 파일=같은 소리)이라 immutable 안전.
 *
 * 방식: CopyObject(같은 key) + MetadataDirective:REPLACE (zero-copy). ContentType 도 재설정.
 * 멱등: 재실행 안전. 이미지·mp4 는 대상 아님.
 *
 * 사용:
 *   node scripts/backfill-audio-cache-control.mjs           # dry-run (카운트/현재헤더 샘플)
 *   node scripts/backfill-audio-cache-control.mjs --apply    # 실제 적용
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
const AUDIO_PATTERN = /\.(mp3|wav)$/i;
const CONCURRENCY = 16;

const contentTypeFor = (key) => (/\.wav$/i.test(key) ? 'audio/wav' : 'audio/mpeg');
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
      ContentType: contentTypeFor(key),
      CacheControl: CACHE_CONTROL,
    })
  );
}

console.log(`R2 전수 스캔 시작 (mode: ${APPLY ? 'APPLY' : 'dry-run'})...\n`);

const keys = [];
let totalCount = 0;
let token;
let pageCount = 0;
do {
  const out = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
  pageCount++;
  for (const o of out.Contents ?? []) {
    totalCount++;
    if (AUDIO_PATTERN.test(o.Key)) keys.push(o.Key);
  }
  token = out.IsTruncated ? out.NextContinuationToken : undefined;
  if (pageCount % 10 === 0) {
    process.stdout.write(`\r... ${pageCount} pages, ${totalCount} objects, ${keys.length} audio`);
  }
} while (token);

console.log(`\n\n전체 ${totalCount} 객체 중 오디오 ${keys.length} 개`);
// prefix 별 분포
const byPrefix = {};
for (const k of keys) {
  const p = k.split('/')[0] || '(root)';
  byPrefix[p] = (byPrefix[p] || 0) + 1;
}
console.log('prefix 분포:', JSON.stringify(byPrefix));

if (keys.length === 0) process.exit(0);

console.log('\n현재 Cache-Control 샘플 (8):');
for (const key of keys.slice(0, 8)) {
  try {
    const h = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    console.log(`  ${h.CacheControl ? `[${h.CacheControl}]` : '(없음)'}  ${key.slice(0, 64)}`);
  } catch (e) {
    console.log(`  (head 실패: ${e.name})  ${key.slice(0, 64)}`);
  }
}

if (!APPLY) {
  console.log(`\n[dry-run] 위 ${keys.length} 개 오디오에 "${CACHE_CONTROL}" 적용 예정.`);
  console.log('실제 적용: node scripts/backfill-audio-cache-control.mjs --apply');
  process.exit(0);
}

console.log(`\n[apply] 첫 객체 검증...`);
await updateMeta(keys[0]);
const verify = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: keys[0] }));
if (verify.CacheControl !== CACHE_CONTROL) {
  console.error(`검증 실패: ${verify.CacheControl ?? '(없음)'}. 중단.`);
  process.exit(1);
}
console.log(`검증 OK: [${verify.CacheControl}] ${verify.ContentType}\n`);

let done = 1;
let failed = 0;
const failures = [];
let idx = 1;
const t0 = Date.now();
async function worker() {
  while (idx < keys.length) {
    const key = keys[idx++];
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
        `\r... ${done + failed}/${keys.length} (성공 ${done}, 실패 ${failed}, ${rate.toFixed(0)}/s)`
      );
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\n\n완료: 성공 ${done}, 실패 ${failed} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
if (failures.length) {
  console.log('\n실패 샘플:');
  failures.forEach((f) => console.log('  ' + f));
}
