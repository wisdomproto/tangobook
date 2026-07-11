#!/usr/bin/env node
/**
 * R2 에서 공개 책 (isPublic=true, type='storybook', variant 제외) 가져와
 * packages/client/public/sitemap.xml 생성.
 *
 * 포함: 정적 라우트 + 책별 detail (/library/{id}) + 책별 about (/library/{id}/about)
 *
 * 사용: pnpm --filter server sitemap
 */
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
const envText = fs.readFileSync(envPath, 'utf-8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const SITE_URL = 'https://www.tangobook.co.kr';
const VARIANT_RE = /__L\d+$/;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.R2_BUCKET_NAME;

async function listAllKeys(prefix) {
  const keys = [];
  let token;
  do {
    const out = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token })
    );
    (out.Contents ?? []).forEach((o) => {
      if (o.Key && o.Key.endsWith('.json')) keys.push(o.Key);
    });
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function getJson(key) {
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const text = await out.Body.transformToString();
  return JSON.parse(text);
}

function fmtDate(iso) {
  if (!iso) return new Date().toISOString().slice(0, 10);
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function urlEntry({ loc, lastmod, changefreq = 'weekly', priority = 0.6, image }) {
  const lines = [
    '  <url>',
    `    <loc>${esc(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    image
      ? `    <image:image><image:loc>${esc(image)}</image:loc></image:image>`
      : '',
    '  </url>',
  ].filter(Boolean);
  return lines.join('\n');
}

async function main() {
  console.log('[sitemap] R2 storybook 키 목록 가져오는 중...');
  const bookKeys = await listAllKeys('storybook-');
  console.log(`[sitemap] 총 storybook.json 키: ${bookKeys.length}`);

  const entries = [];

  // 정적 라우트
  const today = new Date().toISOString().slice(0, 10);
  entries.push(urlEntry({ loc: `${SITE_URL}/`, lastmod: today, changefreq: 'weekly', priority: 1.0 }));
  entries.push(urlEntry({ loc: `${SITE_URL}/library`, lastmod: today, changefreq: 'daily', priority: 0.9 }));
  entries.push(urlEntry({ loc: `${SITE_URL}/library/phonics/korean`, lastmod: today, changefreq: 'weekly', priority: 0.7 }));
  entries.push(urlEntry({ loc: `${SITE_URL}/vocabulary`, lastmod: today, changefreq: 'weekly', priority: 0.6 }));
  entries.push(urlEntry({ loc: `${SITE_URL}/blog`, lastmod: today, changefreq: 'daily', priority: 0.8 }));
  entries.push(urlEntry({ loc: `${SITE_URL}/guide/classics`, lastmod: today, changefreq: 'weekly', priority: 0.8 }));
  entries.push(urlEntry({ loc: `${SITE_URL}/guide/nature`, lastmod: today, changefreq: 'weekly', priority: 0.8 }));

  // 공개 블로그 (발행된 self_hosted 내부 블로그) — 공개 API 에서 목록 fetch
  let blogCount = 0;
  try {
    const res = await fetch(`${SITE_URL}/api/blog`);
    const body = await res.json();
    const posts = Array.isArray(body?.data) ? body.data : [];
    for (const p of posts) {
      if (!p?.slug) continue;
      entries.push(urlEntry({
        loc: `${SITE_URL}/blog/${encodeURIComponent(p.slug)}`,
        lastmod: fmtDate(p.publishedAt),
        changefreq: 'monthly',
        priority: 0.7,
      }));
      blogCount++;
    }
    console.log(`[sitemap] 공개 블로그: ${blogCount}`);
  } catch (e) {
    console.warn(`[sitemap] 블로그 목록 실패 (스킵): ${e.message}`);
  }

  // 책별 라우트
  let publicCount = 0;
  let skippedVariant = 0;
  let skippedPrivate = 0;
  let skippedNonStorybook = 0;

  for (const key of bookKeys) {
    try {
      const book = await getJson(key);
      if (!book || !book.id) continue;
      if (VARIANT_RE.test(book.id)) { skippedVariant++; continue; }
      if ((book.type ?? 'storybook') !== 'storybook') { skippedNonStorybook++; continue; }
      if (book.isPublic === false) { skippedPrivate++; continue; }

      const cover =
        book.coverImage ||
        (Array.isArray(book.coverImages) && book.coverImages[0]?.imageUrl) ||
        '';
      const lastmod = fmtDate(book.updatedAt || book.createdAt);

      entries.push(urlEntry({
        loc: `${SITE_URL}/library/${book.id}`,
        lastmod,
        changefreq: 'monthly',
        priority: 0.7,
        image: cover || undefined,
      }));
      entries.push(urlEntry({
        loc: `${SITE_URL}/library/${book.id}/about`,
        lastmod,
        changefreq: 'monthly',
        priority: 0.8,
        image: cover || undefined,
      }));
      publicCount++;
    } catch (e) {
      console.warn(`[sitemap] skip ${key}: ${e.message}`);
    }
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- 자동 생성: packages/server/scripts/generate-sitemap.mjs · 수정 X -->',
    '<urlset',
    '  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '  xmlns:xhtml="http://www.w3.org/1999/xhtml"',
    '  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    entries.join('\n'),
    '</urlset>',
    '',
  ].join('\n');

  const outPath = path.join(__dirname, '..', '..', 'client', 'public', 'sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf-8');

  console.log('[sitemap] 작성 완료:');
  console.log(`  ${outPath}`);
  console.log(`  공개 책: ${publicCount} (책당 2 URL = ${publicCount * 2})`);
  console.log(`  공개 블로그: ${blogCount}`);
  console.log(`  정적: 5`);
  console.log(`  총 URL: ${5 + publicCount * 2 + blogCount}`);
  console.log(`  스킵: variant=${skippedVariant} private=${skippedPrivate} non-storybook=${skippedNonStorybook}`);
}

main().catch((err) => {
  console.error('[sitemap] FATAL:', err);
  process.exit(1);
});
