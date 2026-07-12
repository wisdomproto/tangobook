// 광고 릴스 에셋(mp4 + 썸네일)을 R2 에 업로드하고 공개 URL 을 출력한다(발행 X).
// 마케팅 "광고 콘텐츠" 시드용 — 출력 URL 을 mkt_instagram_contents.video_settings.reels.ko 에 넣는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const REPO = path.resolve(__dirname, '..', '..', '..');
const MP4 = path.join(REPO, 'docs/marketing/ad-reel-ig.mp4');
const THUMB = path.join(REPO, 'docs/marketing/ad-reel-thumbnail.png');
const PUB = process.env.R2_PUBLIC_URL!;
const TS = Date.now();

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function upload(file: string, key: string, contentType: string): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: fs.readFileSync(file),
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  return `${PUB}/${key}`;
}

async function main() {
  const videoUrl = await upload(MP4, `mkt/ad-reel/ad-reel-${TS}.mp4`, 'video/mp4');
  const coverUrl = await upload(THUMB, `mkt/ad-reel/ad-thumb-${TS}.png`, 'image/png');
  console.log(JSON.stringify({ videoUrl, coverUrl }, null, 2));
}

main().catch((e) => {
  console.error('업로드 실패:', e?.message || e);
  process.exit(1);
});
