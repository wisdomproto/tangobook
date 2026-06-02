#!/usr/bin/env node
/**
 * 기존 R2 이미지 객체에 Cache-Control(immutable) 메타데이터를 소급 적용 (backfill).
 *
 * 배경: buildR2Key 가 모든 이미지 key 에 timestamp 를 박는다 → 콘텐츠 변경 시 URL 이 바뀌므로
 *   (같은 URL = 영원히 같은 그림) 1년 immutable 이 안전하다. 신규 업로드는 r2.provider.uploadBufferToR2
 *   에서 contentType 기준으로 자동 적용되고, 이 스크립트는 이미 올라간 이미지를 처리한다.
 *
 * 방식: CopyObject(같은 key) + MetadataDirective:REPLACE — 객체 본문은 건드리지 않고 메타만 갱신
 *   (zero-copy). REPLACE 는 시스템 메타데이터를 전부 교체하므로 ContentType 을 확장자에서
 *   유도해 함께 재설정한다 (안 하면 ContentType 이 날아감). JSON/오디오/영상은 대상 아님.
 *
 * 멱등: 재실행해도 안전 (이미 적용된 객체를 다시 갱신해도 결과 동일).
 *
 * 사용:
 *   node scripts/backfill-cache-control.mjs            # dry-run (대상 카운트/분포/샘플만, read-only)
 *   node scripts/backfill-cache-control.mjs --apply    # 실제 갱신
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

// Manual .env parser (dotenv 의존 X) — 기존 스크립트 패턴 동일
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
const IMAGE_EXT = /\.(webp|png|jpe?g)$/i;
const CONCURRENCY = 16;

function contentTypeFor(key) {
  const ext = key.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

// CopySource 인코딩 (한글 title 등 특수문자 key 대응; 슬래시는 보존 — r2.provider.copyR2Object 패턴)
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

// ── 1. 전수 스캔 → 이미지 key 수집 ──────────────────────────────
console.log(`R2 전수 스캔 시작 (mode: ${APPLY ? 'APPLY' : 'dry-run'})...\n`);

const imageKeys = [];
const extCount = new Map();
let totalCount = 0;
let token;
let pageCount = 0;
do {
  const out = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
  pageCount++;
  for (const o of out.Contents ?? []) {
    totalCount++;
    const key = o.Key;
    if (!IMAGE_EXT.test(key)) continue;
    imageKeys.push(key);
    const ext = key.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '?';
    extCount.set(ext, (extCount.get(ext) ?? 0) + 1);
  }
  token = out.IsTruncated ? out.NextContinuationToken : undefined;
  if (pageCount % 10 === 0) {
    process.stdout.write(`\r... ${pageCount} pages, ${totalCount} objects, ${imageKeys.length} images`);
  }
} while (token);

console.log(`\n\n전체 ${totalCount} 객체 중 이미지 ${imageKeys.length} 개`);
console.log('확장자 분포:', [...extCount.entries()].map(([e, n]) => `${e}=${n}`).join('  '));

if (imageKeys.length === 0) {
  console.log('\n대상 이미지 없음. 종료.');
  process.exit(0);
}

// ── 2. 현재 Cache-Control 상태 샘플 (처음 5개) ──────────────────
console.log('\n현재 Cache-Control 샘플 (5):');
for (const key of imageKeys.slice(0, 5)) {
  try {
    const h = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    console.log(`  ${h.CacheControl ? `[${h.CacheControl}]` : '(없음)'}  ${key}`);
  } catch (e) {
    console.log(`  (head 실패: ${e.name})  ${key}`);
  }
}

if (!APPLY) {
  console.log(`\n[dry-run] 위 ${imageKeys.length} 개 이미지에 "${CACHE_CONTROL}" 적용 예정.`);
  console.log('실제 적용: node scripts/backfill-cache-control.mjs --apply');
  process.exit(0);
}

// ── 3. APPLY: 첫 객체 검증 후 일괄 ─────────────────────────────
console.log(`\n[apply] 첫 객체로 검증...`);
const first = imageKeys[0];
await updateMeta(first);
const verify = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: first }));
if (verify.CacheControl !== CACHE_CONTROL) {
  console.error(`검증 실패: CacheControl = ${verify.CacheControl ?? '(없음)'}. 중단.`);
  process.exit(1);
}
console.log(`검증 OK: [${verify.CacheControl}]  ContentType=${verify.ContentType}\n`);

let done = 1; // first 포함
let failed = 0;
const failures = [];
let idx = 1; // first 는 처리 완료
const t0 = Date.now();

async function worker() {
  while (idx < imageKeys.length) {
    const key = imageKeys[idx++];
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
        `\r... ${done + failed}/${imageKeys.length}  (성공 ${done}, 실패 ${failed}, ${rate.toFixed(0)}/s)`
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
