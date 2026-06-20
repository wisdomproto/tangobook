#!/usr/bin/env node
/**
 * 모기 이북: 글자 제거한 깨끗한 이미지(images2/page N.png 31장) → webp 변환 → R2 신규 업로드.
 * - key = ebook/mosquito/img/v1/page-NN.webp (immutable). buildR2Key 안 씀
 *   (timestamp 불필요; 콘텐츠 교체 시 v2 로 캐시버스트).
 * - 결과 {page: url} 맵을 scripts/_data/mosquito-image-urls.json 에 저장(--apply 시).
 * 기본 dry-run / --apply. WIDTH(기본 1536) / QUALITY(기본 90) / SRC_DIR env override.
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env 로드 (기존 convert-*.mjs 패턴)
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const ACCOUNT = process.env.R2_ACCOUNT_ID;
const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;
if (!ACCOUNT || !BUCKET || !PUBLIC_URL) {
  console.error('R2_ACCOUNT_ID / R2_BUCKET_NAME / R2_PUBLIC_URL env 누락');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const APPLY = process.argv.includes('--apply');
const WIDTH = parseInt(process.env.WIDTH ?? '1536', 10);
const QUALITY = parseInt(process.env.QUALITY ?? '90', 10);
const VERSION = 'v1';
const SRC_DIR =
  process.env.SRC_DIR ??
  'C:/Users/101024/Documents/카카오톡 받은 파일/모기의_항변_추출/images2';

const files = fs
  .readdirSync(SRC_DIR)
  .map((f) => ({ f, m: f.match(/^page (\d+)\.png$/i) }))
  .filter((x) => x.m)
  .map((x) => ({ file: x.f, num: parseInt(x.m[1], 10) }))
  .sort((a, b) => a.num - b.num);

if (files.length === 0) {
  console.error(`이미지 없음: ${SRC_DIR}`);
  process.exit(1);
}

const urlMap = {};
let uploaded = 0;
let bytesBefore = 0;
let bytesAfter = 0;

for (const { file, num } of files) {
  const pad = String(num).padStart(2, '0');
  const key = `ebook/mosquito/img/${VERSION}/page-${pad}.webp`;
  urlMap[num] = `${PUBLIC_URL}/${key}`;
  if (APPLY) {
    const buf = fs.readFileSync(path.join(SRC_DIR, file));
    const webp = await sharp(buf)
      .resize({ width: WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
    bytesBefore += buf.length;
    bytesAfter += webp.length;
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: webp,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
    uploaded++;
    console.log(`  [${uploaded}/${files.length}] page ${num} → ${key} (${(webp.length / 1024).toFixed(0)}KB)`);
  }
}

console.log(`\n[${APPLY ? 'APPLY' : 'dry-run'}] ${files.length}장 | ${WIDTH}px q${QUALITY} | prefix ebook/mosquito/img/${VERSION}/`);
console.log(`샘플 URL(page 1): ${urlMap[1]}`);

if (APPLY) {
  const dataDir = path.join(__dirname, '_data');
  fs.mkdirSync(dataDir, { recursive: true });
  const outPath = path.join(dataDir, 'mosquito-image-urls.json');
  fs.writeFileSync(outPath, JSON.stringify(urlMap, null, 2));
  console.log(`용량: ${(bytesBefore / 1048576).toFixed(1)}MB → ${(bytesAfter / 1048576).toFixed(1)}MB`);
  console.log(`✅ URL 맵 저장: ${outPath}`);
} else {
  console.log(`\n실제 업로드: node scripts/mosquito-upload-images.mjs --apply`);
}
