// 광고 랜딩(`/hangul`) 화면 스크린샷 → R2 업로드 (멱등).
//   node packages/server/scripts/upload-landing-shots.mjs --shots <디렉터리> [--dry-run]
//
// 촬영 = `packages/client/scripts/capture-landing-shots.mjs`
//
// 🔴 원본(1080×1920 PNG, 장당 1MB+)을 그대로 올리지 않는다 — 랜딩은 광고 도착지라
//    첫 화면 속도가 곧 이탈률이다. **w540 webp** 로 구워 올린다(카드에 그리는 폭의 2배).
//    키에 파일 해시가 들어가 재촬영하면 새 URL 이 되고, 안 바뀌면 업로드를 건너뛴다.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV = [path.join(__dirname, '..', '.env'), 'C:/projects/tangobook/packages/server/.env'].find(
  (f) => fs.existsSync(f)
);
if (!ENV) throw new Error('.env 를 못 찾았다');
for (const line of fs.readFileSync(ENV, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const argv = process.argv.slice(2);
const arg = (k) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : null;
};
const SHOTS = arg('--shots');
const DRY = argv.includes('--dry-run');
if (!SHOTS) throw new Error('--shots <디렉터리> 가 필요합니다');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const files = fs.readdirSync(SHOTS).filter((f) => f.endsWith('.png')).sort();
const out = {};
let made = 0,
  skipped = 0,
  bytes = 0;

for (const file of files) {
  const buf = await sharp(path.join(SHOTS, file))
    .resize({ width: 540, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
  const key = `landing/hangul/${path.basename(file, '.png')}-${hash}.webp`;
  const url = `${process.env.R2_PUBLIC_URL}/${key}`;
  out[path.basename(file, '.png')] = url;
  bytes += buf.length;
  let exists = false;
  try {
    await s3.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
    exists = true;
  } catch {
    /* 없으면 올린다 */
  }
  if (exists) {
    skipped++;
  } else {
    if (!DRY)
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: buf,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
    made++;
  }
  console.log(`  ${path.basename(file, '.png').padEnd(18)} ${Math.round(buf.length / 1024)}KB${exists ? ' (이미 있음)' : ''}`);
}

console.log(`\n생성 ${made} · skip ${skipped} · 합계 ${Math.round(bytes / 1024)}KB`);
console.log('\n// 페이지에 붙일 상수:\n' + JSON.stringify(out, null, 2));
