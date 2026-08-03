#!/usr/bin/env node
/**
 * R2 에서 공개 책 (isPublic=true, type='storybook', variant 제외) 가져와
 * packages/client/public/sitemap.xml 생성.
 *
 * 포함: 정적 라우트 + 책별 about (/library/{id}/about, 언어별 포함). bare /library/{id}(앱
 *       페이지)는 제외 — canonical 이 /about 으로 통합되므로 색인 서피스는 /about 단일.
 *
 * 사용: pnpm --filter server sitemap
 */
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 워크트리에는 .env 가 없다 — 메인 체크아웃으로 폴백한다.
const envPath = [
  path.join(__dirname, '..', '.env'),
  'C:/projects/tangobook/packages/server/.env',
].find((f) => fs.existsSync(f));
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
  // 광고 랜딩 — 「한글앱」(440)·「파닉스앱」(100) 을 노린다. 광고 도착지지만 색인도 받는다.
  entries.push(urlEntry({ loc: `${SITE_URL}/hangul`, lastmod: today, changefreq: 'monthly', priority: 0.8 }));
  entries.push(urlEntry({ loc: `${SITE_URL}/vocabulary`, lastmod: today, changefreq: 'weekly', priority: 0.6 }));
  entries.push(urlEntry({ loc: `${SITE_URL}/blog`, lastmod: today, changefreq: 'daily', priority: 0.8 }));
  // 허브 — 언어별 (SSOT = shared seo-i18n HUB_STRINGS; dist 없으면 폴백 목록)
  let hubLangList = ['ko', 'en', 'vi', 'zh', 'th'];
  try {
    const { HUB_STRINGS } = await import('../../shared/dist/constants/seo-i18n.js');
    hubLangList = ['ko', ...Object.keys(HUB_STRINGS)];
  } catch { /* shared 미빌드 시 폴백 */ }
  for (const lang of hubLangList) {
    const p = lang === 'ko' ? '' : `/${lang}`;
    entries.push(urlEntry({ loc: `${SITE_URL}${p}/guide/classics`, lastmod: today, changefreq: 'weekly', priority: 0.8 }));
    entries.push(urlEntry({ loc: `${SITE_URL}${p}/guide/nature`, lastmod: today, changefreq: 'weekly', priority: 0.8 }));
  }

  // 공개 블로그 (발행된 self_hosted 내부 블로그) — 언어별 공개 API 에서 목록 fetch.
  // ko 는 bare, 그 외 /:lang 프리픽스 (about·guide 와 동일 규칙). 번역 없는 언어는 빈 목록.
  let blogCount = 0;
  for (const lang of hubLangList) {
    const p = lang === 'ko' ? '' : `/${lang}`;
    const q = lang === 'ko' ? '' : `?lang=${lang}`;
    try {
      const res = await fetch(`${SITE_URL}/api/blog${q}`);
      const body = await res.json();
      const posts = Array.isArray(body?.data) ? body.data : [];
      for (const post of posts) {
        if (!post?.slug) continue;
        entries.push(urlEntry({
          loc: `${SITE_URL}${p}/blog/${encodeURIComponent(post.slug)}`,
          lastmod: fmtDate(post.publishedAt),
          changefreq: 'monthly',
          priority: 0.7,
        }));
        blogCount++;
      }
    } catch (e) {
      console.warn(`[sitemap] 블로그 목록 실패 (${lang}, 스킵): ${e.message}`);
    }
  }
  console.log(`[sitemap] 공개 블로그(전 언어): ${blogCount}`);

  // 책별 라우트
  let publicCount = 0;
  let langAboutCount = 0;
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

      // 🔴 bare /library/:id 는 sitemap 에 넣지 않는다 — 앱 페이지라 canonical 이 /about 으로
      // 통합되므로(app.ts), 두 URL 을 다 색인 요청하면 중복("다른 표준 선택")을 유발한다.
      // 책의 SEO 서피스는 /about 단일. (앱 페이지는 내부 링크로 발견 → about 로 canonical 통합)
      entries.push(urlEntry({
        loc: `${SITE_URL}/library/${book.id}/about`,
        lastmod,
        changefreq: 'monthly',
        priority: 0.8,
        image: cover || undefined,
      }));
      // 언어별 about — 번역(제목+부모가이드) 있는 언어 자동 derive (SSR hasAboutLang 와 동일 술어)
      for (const lang of Object.keys(book.parentGuideTranslations ?? {})) {
        if (lang === 'ko' || !book.titleTranslations?.[lang]) continue;
        entries.push(urlEntry({
          loc: `${SITE_URL}/${lang}/library/${book.id}/about`,
          lastmod,
          changefreq: 'monthly',
          priority: 0.7,
          image: cover || undefined,
        }));
        langAboutCount++;
      }
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
  console.log(`  공개 책: ${publicCount} (책당 2 URL = ${publicCount * 2}) + 언어별 about ${langAboutCount}`);
  console.log(`  공개 블로그: ${blogCount}`);
  console.log(`  총 URL: ${entries.length}`);
  console.log(`  스킵: variant=${skippedVariant} private=${skippedPrivate} non-storybook=${skippedNonStorybook}`);
}

main().catch((err) => {
  console.error('[sitemap] FATAL:', err);
  process.exit(1);
});
