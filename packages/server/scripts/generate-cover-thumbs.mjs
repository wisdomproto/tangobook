#!/usr/bin/env node
/**
 * 표지 썸네일 생성 — 라이브러리 카드가 1536px 원본(~125KB)을 160~256px 로 줄여 쓰던 걸
 * 512px webp(~15KB)로 대체한다. 카드 90장 기준 약 11MB → 1.3MB.
 *
 * 키 규칙(클라가 URL 만으로 유도할 수 있어야 하므로 결정적):
 *   원본  <bucket>/<key>
 *   썸네일 <bucket>/thumbs/512/<key>
 * → 클라(BookCover)는 표지 URL 의 path 앞에 `/thumbs/512` 를 붙여 먼저 시도하고,
 *   404 면 원본으로 폴백한다. 그래서 이 스크립트가 아직 안 돈 표지도 안전하다.
 *
 * 사용:
 *   node packages/server/scripts/generate-cover-thumbs.mjs            # dry-run (대상만 집계)
 *   node packages/server/scripts/generate-cover-thumbs.mjs --apply
 *   node packages/server/scripts/generate-cover-thumbs.mjs --apply --limit=50
 *   node packages/server/scripts/generate-cover-thumbs.mjs --apply --force   # 이미 있어도 재생성
 *
 * 멱등 — 이미 있는 썸네일은 건너뛴다(--force 아니면).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));

// .env 로드 (R2 자격증명)
for (const line of fs.readFileSync(path.join(__dir, '..', '.env'), 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } = await import(
  '@aws-sdk/client-s3'
);
const sharp = (await import('sharp')).default;

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const FORCE = args.includes('--force');
const LIMIT = Number((args.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || 0);

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
const CDN_URL = (process.env.R2_CDN_URL ?? 'https://assets.tangobook.co.kr').replace(/\/$/, '');
const THUMB_PREFIX = 'thumbs/512/';
const THUMB_WIDTH = 512;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const streamToBuffer = async (body) => {
  const chunks = [];
  for await (const c of body) chunks.push(c);
  return Buffer.concat(chunks);
};

/** 표지 URL → R2 key (CDN·pub 두 호스트 모두 허용). */
function keyFromUrl(url) {
  for (const base of [CDN_URL, PUBLIC_URL].filter(Boolean)) {
    if (url.startsWith(base + '/')) return decodeURIComponent(url.slice(base.length + 1));
  }
  return null;
}

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  // 라이브 목록 API 에서 표지 URL 수집 — 저장 데이터가 아니라 "실제로 화면에 쓰이는" 표지만.
  const origin = process.env.THUMB_SOURCE_ORIGIN || 'https://www.tangobook.co.kr';
  console.log(`목록 로딩: ${origin}/api/storybooks`);
  const res = await fetch(`${origin}/api/storybooks`);
  const body = await res.json();
  const books = body.data ?? body;

  const urls = new Set();
  const add = (u) => {
    if (typeof u === 'string' && /^https?:\/\//.test(u) && /\.(webp|png|jpe?g)$/i.test(u))
      urls.add(u);
  };
  const walk = (v) => {
    if (typeof v === 'string') add(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  for (const b of books) {
    add(b.coverImage);
    add(b.cleanCoverImage);
    (b.coverImages ?? []).forEach((c) => add(c?.imageUrl));
    ['coversByStyle', 'coversByLang', 'cleanCoversByStyle', 'primaryCoverByLang'].forEach((k) =>
      walk(b[k])
    );
  }

  const keys = [...urls].map(keyFromUrl).filter(Boolean);
  const targets = LIMIT ? keys.slice(0, LIMIT) : keys;
  console.log(`표지 URL ${urls.size} · R2 key ${keys.length}${LIMIT ? ` (limit ${LIMIT})` : ''}`);

  if (!APPLY) {
    console.log('\nDry-run. --apply 로 실제 생성.');
    return;
  }

  let made = 0,
    skipped = 0,
    failed = 0,
    savedBytes = 0;
  // 동시 6 — R2 쓰기와 sharp CPU 를 적당히 겹친다.
  const queue = [...targets];
  const worker = async () => {
    for (;;) {
      const key = queue.shift();
      if (!key) return;
      const thumbKey = THUMB_PREFIX + key;
      try {
        if (!FORCE && (await exists(thumbKey))) {
          skipped++;
          continue;
        }
        const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
        const src = await streamToBuffer(obj.Body);
        const out = await sharp(src)
          .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
          .webp({ quality: 78 })
          .toBuffer();
        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: thumbKey,
            Body: out,
            ContentType: 'image/webp',
            // 원본과 동일 — 키가 원본 키를 포함해 내용이 바뀌지 않는다.
            CacheControl: 'public, max-age=31536000, immutable',
          })
        );
        savedBytes += src.length - out.length;
        made++;
        if (made % 25 === 0) console.log(`  ... ${made} 생성`);
      } catch (e) {
        failed++;
        if (failed <= 5) console.warn(`  ⚠️ ${key}: ${e.message.slice(0, 60)}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));

  console.log(
    `\n생성 ${made} · 기존 skip ${skipped} · 실패 ${failed}` +
      `\n절감 ${Math.round((savedBytes / 1024 / 1024) * 10) / 10} MB`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
