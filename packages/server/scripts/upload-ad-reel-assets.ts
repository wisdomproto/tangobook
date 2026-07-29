// 광고 릴스 에셋(mp4 + 썸네일)을 R2 에 업로드하고 공개 URL 을 출력한다(발행 X).
// 마케팅 "광고 콘텐츠" 시드용 — 출력 URL 을 mkt_instagram_contents.video_settings.reels.ko 에 넣는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 🔴 워크트리엔 `.env` 가 없다(메인 체크아웃에만 있다) — 없으면 메인으로 폴백한다.
const ENV_FILE = [
  path.join(__dirname, '..', '.env'),
  'C:/projects/tangobook/packages/server/.env',
].find((f) => fs.existsSync(f));
if (!ENV_FILE) throw new Error('.env 를 못 찾았다');
for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

// 인자로 받는다 — 광고가 여러 개(브랜드·파닉스·명작…)라 하드코딩하면 매번 파일을 고치게 된다.
//   node upload-ad-reel-assets.ts <mp4> <cover.png> [키접두사]
const REPO = path.resolve(__dirname, '..', '..', '..');
const [argMp4, argThumb, argSlug] = process.argv.slice(2);
const MP4 = argMp4 ? path.resolve(REPO, argMp4) : path.join(REPO, 'docs/marketing/ad-reel-ig.mp4');
const THUMB = argThumb
  ? path.resolve(REPO, argThumb)
  : path.join(REPO, 'docs/marketing/ad-reel-thumbnail.png');
const SLUG = argSlug || 'ad-reel';
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
  const videoUrl = await upload(MP4, `mkt/ad-reel/${SLUG}-${TS}.mp4`, 'video/mp4');
  const coverUrl = await upload(THUMB, `mkt/ad-reel/${SLUG}-cover-${TS}.png`, 'image/png');
  console.log(JSON.stringify({ videoUrl, coverUrl }, null, 2));
}

main().catch((e) => {
  console.error('업로드 실패:', e?.message || e);
  process.exit(1);
});
