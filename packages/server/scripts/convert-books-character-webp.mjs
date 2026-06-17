#!/usr/bin/env node
/**
 * books/ v2 캐릭터 레퍼런스 이미지(characters[].referenceImage 의 jpg/jpeg/jfif/png)를 webp 로 변환
 * + styles/{style}/characters.json 의 URL 교체 + 원본 삭제.
 *
 * - webp quality 90, resize 없음 (레퍼런스 화질 보존). 멱등 (webp 이미 있으면 변환 skip, URL 만 교체).
 * - 1:1 참조(조사 확인)라 characters.json URL 교체 PutObject 성공 후 그 원본을 삭제.
 * - 기본 dry-run / --apply. 원 characters.json 백업 → scripts/_backup-books-char/.
 */
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
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
const QUALITY = parseInt(process.env.QUALITY ?? '90', 10);
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

const urlToKey = (u) => decodeURIComponent(new URL(u).pathname.replace(/^\//, ''));
const NONWEBP = /\.(jpe?g|jfif|png)$/i;
const isTarget = (u) => typeof u === 'string' && u.startsWith('http') && NONWEBP.test(u.split('?')[0]);
const fmt = (b) => (b >= 1e6 ? (b / 1e6).toFixed(1) + 'MB' : (b / 1e3).toFixed(0) + 'KB');

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

// books/ 의 characters.json 만 대상
const keys = [];
let token;
do {
  const out = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: 'books', ContinuationToken: token })
  );
  for (const o of out.Contents ?? []) if (o.Key.endsWith('characters.json')) keys.push(o.Key);
  token = out.IsTruncated ? out.NextContinuationToken : undefined;
} while (token);
console.log(`characters.json ${keys.length}개 스캔 | webp q${QUALITY} | ${APPLY ? 'APPLY' : 'dry-run'}`);

const backupDir = path.join(__dirname, '_backup-books-char');
if (APPLY) fs.mkdirSync(backupDir, { recursive: true });

let filesChanged = 0;
let converted = 0;
let reused = 0;
let deleted = 0;
let bytesBefore = 0;
let bytesAfter = 0;
const samples = [];
let idx = 0;

async function worker() {
  while (idx < keys.length) {
    const key = keys[idx++];
    try {
      const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const rawText = await out.Body.transformToString('utf-8');
      const sb = JSON.parse(rawText);
      // 대상 URL 수집 (characters[].referenceImage)
      const urls = [];
      for (const c of sb.characters ?? []) if (isTarget(c?.referenceImage)) urls.push(c.referenceImage);
      if (urls.length === 0) continue;

      let changedText = rawText;
      const origKeysToDelete = [];
      for (const url of urls) {
        const webpUrl = url.replace(NONWEBP, '.webp');
        const origKey = urlToKey(url);
        const webpKey = urlToKey(webpUrl);
        if (APPLY) {
          if (await exists(webpKey)) {
            reused++;
          } else {
            const o = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: origKey }));
            const buf = Buffer.from(await o.Body.transformToByteArray());
            const webp = await sharp(buf).webp({ quality: QUALITY }).toBuffer();
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
          origKeysToDelete.push(origKey);
        } else {
          converted++;
        }
        changedText = changedText.split(url).join(webpUrl);
      }

      if (changedText !== rawText) {
        filesChanged++;
        if (samples.length < 8) samples.push(`${key.replace(/^books\//, '')} | ${urls.length}장`);
        if (APPLY) {
          // 1) characters.json URL 교체 먼저 (성공해야 원본 삭제)
          const flat = key.replace(/[/]/g, '__');
          fs.writeFileSync(path.join(backupDir, flat), rawText);
          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: changedText,
              ContentType: 'application/json',
            })
          );
          // 2) JSON 교체 성공 후 원본 삭제 (1:1 참조 확인됨)
          for (const ok of origKeysToDelete) {
            await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: ok }));
            deleted++;
          }
          console.log(`  [${filesChanged}] ${key.replace(/^books\//, '')} | webp ${urls.length}, 원본삭제 ${origKeysToDelete.length}`);
        }
      }
    } catch (e) {
      console.log('ERR', key, e.message);
    }
  }
}
await Promise.all(Array.from({ length: APPLY ? 6 : 12 }, worker));

console.log(`\n[${APPLY ? 'APPLY' : 'dry-run'}] characters.json 변경: ${filesChanged}`);
console.log(`  변환 ${converted}${APPLY ? ` (재사용 ${reused}), 원본삭제 ${deleted}` : ''}`);
if (APPLY && bytesBefore > 0)
  console.log(`  용량: ${fmt(bytesBefore)} → ${fmt(bytesAfter)} (${(100 - (bytesAfter / bytesBefore) * 100).toFixed(0)}% 절감)`);
if (samples.length) {
  console.log('샘플:');
  for (const s of samples) console.log('  ' + s);
}
if (!APPLY) console.log(`\n실제 적용: node scripts/convert-books-character-webp.mjs --apply`);
else console.log(`\n✅ 완료 (원 characters.json 백업: scripts/_backup-books-char/)`);
