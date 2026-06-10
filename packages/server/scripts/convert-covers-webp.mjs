#!/usr/bin/env node
/**
 * 전체 동화책의 활성 표지(jpg/png)를 1024px webp 로 변환 + storybook JSON 의 표지 URL 교체.
 * - 대상 = coverImage / coverImages[] / primaryCoverByLang / styleAssets[*].(같은 필드). 히스토리(coverImageHistory) 제외.
 * - 새 key = 같은 경로 + 확장자 .webp (URL 이 바뀌므로 immutable 캐시 안전). 멱등(webp 이미 있으면 변환 skip, URL 만 교체).
 * - 1024px(withoutEnlargement) + quality 85. ContentType image/webp + Cache-Control immutable.
 * 기본 dry-run / --apply (원본 JSON 백업 scripts/_backup-webp).
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
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const urlToKey = (u) => decodeURIComponent(new URL(u).pathname.replace(/^\//, ''));
const isRasterCover = (u) =>
  typeof u === 'string' && /cover/i.test(u) && /\.(jpe?g|png)$/i.test(u) && u.startsWith('http');

function collectCoverUrls(sb) {
  const urls = new Set();
  const add = (u) => {
    if (isRasterCover(u)) urls.add(u);
  };
  add(sb.coverImage);
  (sb.coverImages ?? []).forEach((c) => add(c?.imageUrl));
  Object.values(sb.primaryCoverByLang ?? {}).forEach(add);
  for (const a of Object.values(sb.styleAssets ?? {})) {
    if (!a) continue;
    add(a.coverImage);
    (a.coverImages ?? []).forEach((c) => add(c?.imageUrl));
    Object.values(a.primaryCoverByLang ?? {}).forEach(add);
  }
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

const backupDir = path.join(__dirname, '_backup-webp');
if (APPLY) fs.mkdirSync(backupDir, { recursive: true });

let scanned = 0;
let booksChanged = 0;
let coversConverted = 0;
let coversReused = 0;
let bytesBefore = 0;
let bytesAfter = 0;
const samples = [];
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
      const coverUrls = collectCoverUrls(sb);
      if (coverUrls.length === 0) continue;

      let changedText = rawText;
      let bookConv = 0;
      for (const url of coverUrls) {
        const webpUrl = url.replace(/\.(jpe?g|png)$/i, '.webp');
        const webpKey = urlToKey(webpUrl);
        if (APPLY) {
          if (await exists(webpKey)) {
            coversReused++;
          } else {
            const jpgKey = urlToKey(url);
            const o = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: jpgKey }));
            const buf = Buffer.from(await o.Body.transformToByteArray());
            const webp = await sharp(buf)
              .resize({ width: 1024, withoutEnlargement: true })
              .webp({ quality: 85 })
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
            coversConverted++;
          }
        } else {
          coversConverted++;
        }
        changedText = changedText.split(url).join(webpUrl);
        bookConv++;
      }
      if (changedText !== rawText) {
        booksChanged++;
        if (samples.length < 10) samples.push(`${sb.id} | ${sb.title} | 표지 ${bookConv}장`);
        if (APPLY) {
          const sb2 = JSON.parse(changedText);
          sb2.updatedAt = new Date().toISOString();
          fs.writeFileSync(path.join(backupDir, `storybook-${sb.id}.json`), rawText);
          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: JSON.stringify(sb2),
              ContentType: 'application/json',
            })
          );
        }
      }
    } catch (e) {
      console.log('ERR', key, e.message);
    }
  }
}
await Promise.all(Array.from({ length: APPLY ? 6 : 12 }, worker));

console.log(`\n[${APPLY ? 'APPLY' : 'dry-run'}] scanned ${scanned} books`);
console.log(`  표지 URL 교체 책: ${booksChanged} | 변환할 표지: ${coversConverted}${APPLY ? ` (재사용 ${coversReused})` : ''}`);
if (APPLY && bytesBefore > 0)
  console.log(`  용량: ${(bytesBefore / 1048576).toFixed(1)}MB → ${(bytesAfter / 1048576).toFixed(1)}MB (${(100 - (bytesAfter / bytesBefore) * 100).toFixed(0)}% 절감)`);
console.log('샘플:');
for (const s of samples) console.log('  ' + s);
if (!APPLY) console.log(`\n실제 적용: node scripts/convert-covers-webp.mjs --apply`);
else console.log(`\n✅ 완료 (원본 JSON 백업: scripts/_backup-webp/)`);
