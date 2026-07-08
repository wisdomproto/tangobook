#!/usr/bin/env node
/**
 * 전체 동화책의 단어(keyObject) 이미지(webp)를 게임 표시에 맞게 다운사이즈(기본 800px) + JSON URL 교체.
 * - 대상 = keyObjectImages[].imageUrl (top-level + styleAssets[*]) + flashcards[].imageUrl (이미 webp).
 *   (어휘 이미지는 게임/단어 익히기에서만 쓰여 1280px 는 과함 — 800px 면 '단어 익히기' 모달까지 선명, 2026-07-08)
 * - 새 key = 같은 경로 + `-w{WIDTH}.webp` (URL 바뀌므로 immutable 캐시 안전). 멱등(이미 -wNNN 이면 skip).
 * - never-inflate: 리사이즈 결과가 원본보다 크면(이미 작은 이미지) 원본 바이트 유지 → 용량 역증가 방지.
 * - 기본 800px(withoutEnlargement) + quality 82. 환경변수 WIDTH/QUALITY 로 조절.
 * 기본 dry-run / --apply (원본 JSON 백업 scripts/_backup-keyobj-resize).
 */
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.R2_BUCKET_NAME;
const APPLY = process.argv.includes('--apply');
const WIDTH = parseInt(process.env.WIDTH ?? '800', 10);
const QUALITY = parseInt(process.env.QUALITY ?? '82', 10);
const MARKER = `-w${WIDTH}.webp`;
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const urlToKey = (u) => decodeURIComponent(new URL(u).pathname.replace(/^\//, ''));
// 대상 = http webp 이면서 아직 -wNNN 마커가 없는 것 (멱등: 이미 리사이즈된 것 skip)
const isTarget = (u) =>
  typeof u === 'string' && u.startsWith('http') && /\.webp$/i.test(u) && !/-w\d+\.webp$/i.test(u);

function collectKeyObjUrls(sb) {
  const urls = new Set();
  const add = (u) => {
    if (isTarget(u)) urls.add(u);
  };
  for (const k of sb.keyObjectImages ?? []) add(k?.imageUrl);
  for (const a of Object.values(sb.styleAssets ?? {})) {
    if (!a) continue;
    for (const k of a.keyObjectImages ?? []) add(k?.imageUrl);
  }
  for (const f of sb.flashcards ?? []) add(f?.imageUrl);
  return [...urls];
}

const keys = [];
let token;
do {
  const out = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: 'storybook-', ContinuationToken: token })
  );
  for (const o of out.Contents ?? []) if (o.Key.endsWith('.json')) keys.push(o.Key);
  token = out.IsTruncated ? out.NextContinuationToken : undefined;
} while (token);

const backupDir = path.join(__dirname, '_backup-keyobj-resize');
if (APPLY) fs.mkdirSync(backupDir, { recursive: true });

let scanned = 0;
let booksChanged = 0;
let resized = 0;
let reused = 0;
let kept = 0; // never-inflate 로 원본 바이트 유지
let bytesBefore = 0;
let bytesAfter = 0;
let idx = 0;

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function worker() {
  while (idx < keys.length) {
    const key = keys[idx++];
    try {
      const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const rawText = await out.Body.transformToString();
      const sb = JSON.parse(rawText);
      scanned++;
      const urls = collectKeyObjUrls(sb);
      if (urls.length === 0) continue;

      let changedText = rawText;
      let bookN = 0;
      for (const url of urls) {
        const newUrl = url.replace(/\.webp$/i, MARKER);
        const newKey = urlToKey(newUrl);
        if (APPLY) {
          if (await exists(newKey)) {
            reused++;
          } else {
            const o = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: urlToKey(url) }));
            const buf = Buffer.from(await o.Body.transformToByteArray());
            const shrunk = await sharp(buf)
              .resize({ width: WIDTH, withoutEnlargement: true })
              .webp({ quality: QUALITY })
              .toBuffer();
            // never-inflate: 이미 작은 이미지는 원본 바이트 유지 (URL 은 새 마커로 통일 → 멱등)
            const finalBuf = shrunk.length < buf.length ? shrunk : buf;
            if (shrunk.length < buf.length) resized++;
            else kept++;
            bytesBefore += buf.length;
            bytesAfter += finalBuf.length;
            await s3.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: newKey,
                Body: finalBuf,
                ContentType: 'image/webp',
                CacheControl: CACHE_CONTROL,
              })
            );
          }
        } else {
          resized++;
        }
        changedText = changedText.split(url).join(newUrl);
        bookN++;
      }
      if (changedText !== rawText) {
        booksChanged++;
        if (APPLY) {
          const sb2 = JSON.parse(changedText);
          sb2.updatedAt = new Date().toISOString();
          fs.writeFileSync(path.join(backupDir, key), rawText);
          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: JSON.stringify(sb2),
              ContentType: 'application/json',
            })
          );
          console.log(
            `  [${booksChanged}] ${sb.title ?? sb.id ?? key} | ${bookN}장 (누적 리사이즈 ${resized}, 유지 ${kept}, 재사용 ${reused})`
          );
        }
      }
    } catch (e) {
      console.log('ERR', key, e.message);
    }
  }
}
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? (APPLY ? '8' : '16'), 10);
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\n[${APPLY ? 'APPLY' : 'dry-run'}] scanned ${scanned} books | ${WIDTH}px q${QUALITY}`);
console.log(
  `  URL 교체 책: ${booksChanged} | 대상 이미지: ${resized + kept + reused}${APPLY ? ` (리사이즈 ${resized}, 원본유지 ${kept}, 재사용 ${reused})` : ''}`
);
if (APPLY && bytesBefore > 0)
  console.log(
    `  용량: ${(bytesBefore / 1048576).toFixed(0)}MB → ${(bytesAfter / 1048576).toFixed(0)}MB (${(100 - (bytesAfter / bytesBefore) * 100).toFixed(0)}% 절감)`
  );
if (!APPLY)
  console.log(`\n실제 적용: WIDTH=${WIDTH} QUALITY=${QUALITY} node scripts/resize-keyobj-images.mjs --apply`);
else console.log(`\n✅ 완료 (원본 JSON 백업: scripts/_backup-keyobj-resize/)`);
