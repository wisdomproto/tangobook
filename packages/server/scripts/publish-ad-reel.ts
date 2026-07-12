import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { decrypt } from '../src/services/mkt/external/meta-crypto.js';

const GRAPH = 'https://graph.facebook.com/v21.0';

async function graphPost(pathStr: string, body: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${GRAPH}/${pathStr}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = (await res.json()) as { id?: string; error?: Record<string, unknown> };
  if (j.error) throw new Error(JSON.stringify(j.error));
  return j.id || '';
}

// 영상 처리 대기 — 릴스는 오래 걸려 최대 6분 폴링.
async function waitReady(containerId: string, token: string): Promise<void> {
  for (let i = 0; i < 120; i++) {
    const res = await fetch(`${GRAPH}/${containerId}?fields=status_code&access_token=${token}`);
    const j = (await res.json()) as { status_code?: string };
    if (j.status_code === 'FINISHED') return;
    if (j.status_code === 'ERROR' || j.status_code === 'EXPIRED')
      throw new Error(`처리 실패: ${j.status_code}`);
    if (i % 5 === 0) console.log(`   …처리 중 (${i * 3}s, ${j.status_code || 'IN_PROGRESS'})`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error('처리 타임아웃(6분)');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// .env 로드(R2 자격증명 등). 이미 설정된 값(META_TOKEN_ENC_KEY 등)은 유지.
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
const REPO = path.resolve(__dirname, '..', '..', '..');
const MP4 = path.join(REPO, 'docs/marketing/ad-reel-ig.mp4');
const THUMB = path.join(REPO, 'docs/marketing/ad-reel-thumbnail.png');
const PUB = process.env.R2_PUBLIC_URL!;
const ENC_KEY = process.env.META_TOKEN_ENC_KEY!;
const TS = Date.now();

const CAPTION = `🐯 매일 밤, "한 번만 더 읽어줘…"

이제 탱고북이 대신 읽어줄게요.
세계명작 동화를 한글·영어로 실감나게 읽어주고, 단어는 게임으로 익혀요. 방금 배운 단어가 동화 속 장면으로 다시 이어지죠.

📖 명작부터 자연관찰까지 · 그림체도 취향대로
🎁 지금 가입하면 7일 무료 체험
👉 tangobook.co.kr

#그림책 #동화책 #유아교육 #한글떼기 #영어그림책 #육아 #4세 #5세 #6세 #7세 #세계명작 #잠자리동화 #엄마표영어 #탱고북`;

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
  const encPayload = fs.readFileSync(path.join(__dirname, '_enc.txt'), 'utf8').trim();
  const bundle = JSON.parse(decrypt(encPayload, ENC_KEY));
  const page = bundle.pages.find((p: { instagram: unknown }) => p.instagram);
  if (!page || !page.instagram) throw new Error('IG 연결된 페이지 없음');
  console.log(`Meta: @${page.instagram.username} (${page.instagram.id}) / page ${page.name}`);

  console.log('[1/2] R2 업로드…');
  const videoUrl = await upload(MP4, `mkt/ad-reel/ad-reel-${TS}.mp4`, 'video/mp4');
  const coverUrl = await upload(THUMB, `mkt/ad-reel/ad-thumb-${TS}.png`, 'image/png');
  console.log('   video:', videoUrl);
  console.log('   cover:', coverUrl);

  console.log('[2/2] IG 릴스 컨테이너 생성…');
  const igId = page.instagram.id;
  const token = page.pageAccessToken;
  const containerId = await graphPost(`${igId}/media`, {
    media_type: 'REELS',
    video_url: videoUrl,
    ...(process.env.SKIP_COVER ? {} : { cover_url: coverUrl }),
    caption: CAPTION,
    access_token: token,
  });
  console.log('   container:', containerId, '— 영상 처리 대기…');
  await waitReady(containerId, token);
  const mediaId = await graphPost(`${igId}/media_publish`, {
    creation_id: containerId,
    access_token: token,
  });
  console.log('✅ 발행 완료! mediaId:', mediaId);
}

main().catch((e) => {
  console.error('발행 실패:', e?.message || e);
  process.exit(1);
});
