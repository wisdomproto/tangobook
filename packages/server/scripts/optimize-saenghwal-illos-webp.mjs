// 생활동화 45권의 페이지 삽화(comic-assets png/jpg)를 webp 로 최적화.
//   - R2 에서 원본 get → sharp webp 변환 → 같은 경로 .webp 로 put → 원본(png/jpg) delete
//   - page.illustrationUrl 을 .webp URL 로 갱신 + 그 삽화를 가리키던 표지(primaryCoverByLang 등)도 갱신
//   - 이미 webp 인 삽화는 skip. (표지는 이미 대부분 webp — 삽화만 대상)
//
// 사용:
//   node packages/server/scripts/optimize-saenghwal-illos-webp.mjs            # dry-run
//   node packages/server/scripts/optimize-saenghwal-illos-webp.mjs --apply
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { loadEnv, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

loadEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAP = Object.fromEntries(
  Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname, 'saenghwal-book-map.json'), 'utf-8')))
    .filter(([k]) => !k.startsWith('_'))
);
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev').replace(/\/$/, '');
const BUCKET = process.env.R2_BUCKET_NAME;
const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const keyFromUrl = (u) => (u.startsWith(PUBLIC_URL + '/') ? u.slice(PUBLIC_URL.length + 1) : null);
const isRaster = (u) => /\.(png|jpg|jpeg)(\?|$)/i.test(u || '');

async function getBuf(key) {
  const out = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const chunks = [];
  for await (const c of out.Body) chunks.push(c);
  return Buffer.concat(chunks);
}

async function main() {
  let converted = 0, skipped = 0, bookN = 0, failed = [];
  for (const bookId of Object.values(MAP)) {
    const sb = await getStorybook(bookId);
    if (!sb) continue;
    const urlMap = {}; // oldUrl -> newUrl (표지 갱신용)
    let bookConverted = 0;
    for (const p of sb.pages ?? []) {
      const url = p.illustrationUrl;
      if (!url || !isRaster(url)) { if (url) skipped++; continue; }
      const key = keyFromUrl(url);
      if (!key) { skipped++; continue; }
      const webpKey = key.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      const newUrl = `${PUBLIC_URL}/${webpKey}`;
      if (APPLY) {
        try {
          const buf = await getBuf(key);
          const webp = await sharp(buf).webp({ quality: 82 }).toBuffer();
          await s3.send(new PutObjectCommand({
            Bucket: BUCKET, Key: webpKey, Body: webp, ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000, immutable',
          }));
          await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
        } catch (e) { failed.push(`${key}: ${e.message}`); continue; }
      }
      p.illustrationUrl = newUrl;
      urlMap[url] = newUrl;
      converted++; bookConverted++;
    }
    // 이 삽화를 가리키던 표지(top-level + styleAssets + coverImage) 갱신
    const remap = (u) => (u && urlMap[u]) ? urlMap[u] : u;
    if (sb.coverImage) sb.coverImage = remap(sb.coverImage);
    if (sb.primaryCoverByLang) for (const l of Object.keys(sb.primaryCoverByLang)) sb.primaryCoverByLang[l] = remap(sb.primaryCoverByLang[l]);
    for (const st of Object.values(sb.styleAssets ?? {})) {
      if (st?.coverImage) st.coverImage = remap(st.coverImage);
      if (st?.primaryCoverByLang) for (const l of Object.keys(st.primaryCoverByLang)) st.primaryCoverByLang[l] = remap(st.primaryCoverByLang[l]);
    }
    if (bookConverted > 0) {
      bookN++;
      console.log(`${sb.title} — 삽화 ${bookConverted}장 webp`);
      if (APPLY) { sb.updatedAt = new Date().toISOString(); await putStorybook(bookId, sb); }
    }
  }
  console.log(`\n${APPLY ? '완료' : 'DRY-RUN'} — ${bookN}권 · 변환 ${converted}장 · skip(이미webp 등) ${skipped}`);
  if (failed.length) { console.log(`⚠️ 실패 ${failed.length}:`); failed.slice(0, 10).forEach((f) => console.log('  ' + f)); }
  if (!APPLY) console.log('실제 반영: --apply');
}

main().catch((e) => { console.error(e); process.exit(1); });
