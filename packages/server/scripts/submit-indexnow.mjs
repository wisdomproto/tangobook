#!/usr/bin/env node
/**
 * IndexNow 즉시 색인 제출.
 * 공개 책 URL (또는 --url 로 지정한 URL) 을 IndexNow 참여 검색엔진에 알린다.
 *   - api.indexnow.org  (Bing·Yandex·Seznam 공유망)
 *   - searchadvisor.naver.com  (네이버)
 *
 * 키 파일: packages/client/public/<KEY>.txt  (내용 = 키) — 배포되어 있어야 함.
 *
 * 사용:
 *   pnpm --filter server indexnow                 # 공개 책 전체 + 정적 라우트
 *   pnpm --filter server indexnow -- --dry-run    # 전송 안 하고 목록만
 *   pnpm --filter server indexnow -- --limit 5    # 앞 5권만 (테스트)
 *   pnpm --filter server indexnow -- --url https://www.tangobook.co.kr/library/123
 *                                                 # 특정 URL 만 (쉼표로 여러 개)
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

// --- 설정 ---
const HOST = 'www.tangobook.co.kr';
const SITE_URL = `https://${HOST}`;
const KEY = 'b3b333d656886ff7c80be13b2e827c8a';
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;
const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://searchadvisor.naver.com/indexnow',
];
const VARIANT_RE = /__L\d+$/;
const BATCH = 10000; // IndexNow 요청당 URL 상한

// --- args ---
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.indexOf('--limit');
const limit = limitArg >= 0 ? parseInt(args[limitArg + 1], 10) : Infinity;
const urlArg = args.indexOf('--url');
const explicitUrls =
  urlArg >= 0
    ? (args[urlArg + 1] ?? '')
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean)
    : null;

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

/** 공개 책 URL 목록 (sitemap 과 동일 필터). */
async function collectPublicUrls() {
  console.log('[indexnow] R2 storybook 키 목록 가져오는 중...');
  const bookKeys = await listAllKeys('storybook-');
  console.log(`[indexnow] 총 storybook.json 키: ${bookKeys.length}`);

  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/library`,
    `${SITE_URL}/library/phonics/korean`,
    `${SITE_URL}/library/phonics/english`,
  ];

  // 파닉스 단원 SEO — sitemap 과 **같은 소스(커리큘럼 상수)** 에서 파생한다.
  // 🔴 여기와 sitemap 이 각자 목록을 들면 갈라진다 — sitemap 에만 넣었다가 IndexNow 에서
  //    파닉스가 통째로 빠질 뻔했다(이 파일은 자기 목록을 따로 만든다).
  try {
    const { KOREAN_PHONICS_CURRICULUM, ENGLISH_PHONICS_CURRICULUM } =
      await import('../../shared/dist/constants/index.js');
    for (const [track, curriculum] of [
      ['korean', KOREAN_PHONICS_CURRICULUM],
      ['english', ENGLISH_PHONICS_CURRICULUM],
    ]) {
      urls.push(`${SITE_URL}/library/phonics/${track}/about`);
      for (const level of curriculum) {
        for (const u of level.units) {
          urls.push(`${SITE_URL}/library/phonics/${track}/${u.id}/about`);
        }
      }
    }
  } catch (e) {
    // 조용히 넘기지 않는다 — 말이 없으면 파닉스가 또 색인 요청에서 사라진다.
    console.warn('[indexnow] ⚠️ 파닉스 단원 스킵 — shared 미빌드?', e.message);
  }

  let publicCount = 0;
  for (const key of bookKeys) {
    if (publicCount >= limit) break;
    try {
      const book = await getJson(key);
      if (!book || !book.id) continue;
      if (VARIANT_RE.test(book.id)) continue;
      if ((book.type ?? 'storybook') !== 'storybook') continue;
      if (book.isPublic === false) continue;
      urls.push(`${SITE_URL}/library/${book.id}`);
      urls.push(`${SITE_URL}/library/${book.id}/about`);
      publicCount++;
    } catch (e) {
      console.warn(`[indexnow] skip ${key}: ${e.message}`);
    }
  }
  console.log(`[indexnow] 공개 책: ${publicCount} → URL ${urls.length}개 (정적 3 포함)`);

  // 공개 내부 블로그(self_hosted published) — sitemap 과 동일 소스(/api/blog) · 언어별.
  // ko 는 bare, 그 외 /:lang 프리픽스. 번역 없는 언어는 빈 목록이라 자동 스킵.
  let blogLangs = ['ko', 'en', 'vi', 'zh', 'th'];
  try {
    const { HUB_STRINGS } = await import('../../shared/dist/constants/seo-i18n.js');
    blogLangs = ['ko', ...Object.keys(HUB_STRINGS)];
  } catch {
    /* shared 미빌드 시 폴백 */
  }
  let blogCount = 0;
  for (const lang of blogLangs) {
    const pre = lang === 'ko' ? '' : `/${lang}`;
    const q = lang === 'ko' ? '' : `?lang=${lang}`;
    try {
      const res = await fetch(`${SITE_URL}/api/blog${q}`);
      if (!res.ok) {
        console.warn(`[indexnow] 블로그 목록 실패(${lang}, HTTP ${res.status}) — 스킵`);
        continue;
      }
      const json = await res.json();
      const posts = json?.data ?? json ?? [];
      if (!Array.isArray(posts) || posts.length === 0) continue;
      urls.push(`${SITE_URL}${pre}/blog`);
      for (const p of posts) {
        if (!p?.slug) continue;
        urls.push(`${SITE_URL}${pre}/blog/${encodeURIComponent(p.slug)}`);
        blogCount++;
      }
    } catch (e) {
      console.warn(`[indexnow] 블로그 목록 실패(${lang}): ${e.message} — 스킵`);
    }
  }
  console.log(`[indexnow] 공개 블로그(전 언어): ${blogCount}`);
  console.log(`[indexnow] 총 제출 URL: ${urls.length}개`);
  return urls;
}

async function submitBatch(endpoint, urlList) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  });
  // IndexNow: 200 OK / 202 Accepted = 성공
  const body = await res.text().catch(() => '');
  return { status: res.status, ok: res.status === 200 || res.status === 202, body: body.slice(0, 200) };
}

async function main() {
  const urls = explicitUrls ?? (await collectPublicUrls());

  // 모든 URL 은 키와 같은 호스트여야 함 — 방어적으로 필터
  const valid = urls.filter((u) => {
    try {
      return new URL(u).host === HOST;
    } catch {
      return false;
    }
  });
  const dropped = urls.length - valid.length;
  if (dropped > 0) console.warn(`[indexnow] ⚠️ 호스트 불일치로 제외된 URL: ${dropped}개`);

  if (valid.length === 0) {
    console.error('[indexnow] 제출할 URL 이 없습니다.');
    process.exit(1);
  }

  console.log(`[indexnow] 제출 대상 URL: ${valid.length}개`);
  console.log(`[indexnow] key: ${KEY}`);
  console.log(`[indexnow] keyLocation: ${KEY_LOCATION}`);

  if (dryRun) {
    console.log('[indexnow] --dry-run: 전송하지 않음. URL 목록:');
    valid.forEach((u) => console.log(`  ${u}`));
    return;
  }

  // 배치로 나눠 각 엔드포인트에 전송
  const chunks = [];
  for (let i = 0; i < valid.length; i += BATCH) chunks.push(valid.slice(i, i + BATCH));

  let allOk = true;
  for (const endpoint of ENDPOINTS) {
    for (let i = 0; i < chunks.length; i++) {
      try {
        const r = await submitBatch(endpoint, chunks[i]);
        const tag = chunks.length > 1 ? ` [batch ${i + 1}/${chunks.length}]` : '';
        console.log(
          `[indexnow] ${r.ok ? '✅' : '❌'} ${endpoint}${tag} → ${r.status}${r.body ? ` ${r.body}` : ''}`
        );
        if (!r.ok) allOk = false;
      } catch (e) {
        console.error(`[indexnow] ❌ ${endpoint} 전송 실패: ${e.message}`);
        allOk = false;
      }
    }
  }

  console.log(allOk ? '[indexnow] 완료 (모든 엔드포인트 성공).' : '[indexnow] 일부 엔드포인트 실패 — 위 로그 확인.');
  if (!allOk) process.exit(1);
}

main().catch((err) => {
  console.error('[indexnow] FATAL:', err);
  process.exit(1);
});
