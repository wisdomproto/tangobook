#!/usr/bin/env node
/**
 * 전체 동화책의 단어(keyObject) 이미지(jpg/png)를 webp 로 변환 + storybook JSON 의 URL 교체.
 * - 대상 = keyObjectImages[].imageUrl (top-level + styleAssets[*]) + flashcards[].imageUrl.
 *   (게임/단어 학습 화면 이미지 — jpg 가 장당 0.6~1.4MB 라 로딩 지연 주범, 2026-07-03)
 * - 새 key = 같은 경로 + .webp (URL 바뀌므로 immutable 캐시 안전). 멱등(webp 이미 있으면 변환 skip, URL만 교체).
 * - 기본 1280px(withoutEnlargement) + quality 82. 환경변수 WIDTH/QUALITY 로 조절.
 * 기본 dry-run / --apply (원본 JSON 백업 scripts/_backup-keyobj-webp).
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
const WIDTH = parseInt(process.env.WIDTH ?? '1280', 10);
const QUALITY = parseInt(process.env.QUALITY ?? '82', 10);
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const urlToKey = (u) => decodeURIComponent(new URL(u).pathname.replace(/^\//, ''));
const isRaster = (u) =>
  typeof u === 'string' && /\.(jpe?g|png)$/i.test(u) && u.startsWith('http');

function collectKeyObjUrls(sb) {
  const urls = new Set();
  const add = (u) => {
    if (isRaster(u)) urls.add(u);
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

const backupDir = path.join(__dirname, '_backup-keyobj-webp');
if (APPLY) fs.mkdirSync(backupDir, { recursive: true });

let scanned = 0;
let booksChanged = 0;
let converted = 0;
let reused = 0;
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
      let bookConv = 0;
      for (const url of urls) {
        const webpUrl = url.replace(/\.(jpe?g|png)$/i, '.webp');
        const webpKey = urlToKey(webpUrl);
        if (APPLY) {
          if (await exists(webpKey)) {
            reused++;
          } else {
            const o = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: urlToKey(url) }));
            const buf = Buffer.from(await o.Body.transformToByteArray());
            const webp = await sharp(buf)
              .resize({ width: WIDTH, withoutEnlargement: true })
              .webp({ quality: QUALITY })
              .toBuffer();
            bytesBefore += buf.length;
            bytesAfter += webp.length;
            await s3.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: webpKey,
                Body: webp,
                ContentType: 'image/webp',
                CacheControl: CACHE_CONTROL,
              })
            );
            converted++;
          }
        } else {
          converted++;
        }
        changedText = changedText.split(url).join(webpUrl);
        bookConv++;
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
          console.log(`  [${booksChanged}] ${sb.title ?? sb.id ?? key} | +${bookConv}장 (누적 변환 ${converted}, 재사용 ${reused})`);
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
console.log(`  이미지 URL 교체 책: ${booksChanged} | 변환할 이미지: ${converted}${APPLY ? ` (재사용 ${reused})` : ''}`);
if (APPLY && bytesBefore > 0)
  console.log(`  용량: ${(bytesBefore / 1048576).toFixed(0)}MB → ${(bytesAfter / 1048576).toFixed(0)}MB (${(100 - (bytesAfter / bytesBefore) * 100).toFixed(0)}% 절감)`);
if (!APPLY) console.log(`\n실제 적용: WIDTH=${WIDTH} QUALITY=${QUALITY} node scripts/convert-keyobj-images-webp.mjs --apply`);
else console.log(`\n✅ 완료 (원본 JSON 백업: scripts/_backup-keyobj-webp/)`);
