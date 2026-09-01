// 파닉스 블로그의 **대표 이미지(썸네일)**를 활동 선택 스크린샷 → **유닛 1쪽 니들펠트 삽화**로 바꾼다 (멱등).
//   node scripts/attach-phonics-blog-hero.mjs [--ids kr-h1-u02,…] [--dry-run]
//
// 왜: 파닉스 블로그는 표지가 없어서 첫 이미지 카드(sort_order 0)에 `{unit}-1-unit` 활동 선택 화면
//   스크린샷(버튼 그리드)이 들어가 있었다. 블로그 목록 썸네일이 그 버튼 뭉치라 카드마다 비슷하게
//   반복돼 지저분했다. 자연/명작이 표지를 쓰듯, 파닉스는 유닛 스토리북의 **1쪽 삽화(한글 나무 장면)**를
//   대표로 쓴다 — 유닛마다 그림이 다르고 니들펠트 브랜드에 맞는다.
//
// 🔴 attach-phonics-blog-screens.mjs 는 더 이상 `1-unit`(메뉴 스크린샷)을 §0 에 넣지 않는다
//   (이 스크립트가 §0 을 삽화로 채우므로). 활동/게임 스크린샷은 본문(§1·§3)에 그대로 남는다.
//   실행 순서: seed-marketing-blogs → attach-phonics-blog-screens → **attach-phonics-blog-hero**.
//
// 원본 삽화(대개 1536px webp)를 그대로 쓰지 않고 **w720 webp** 로 다시 구워 올린다(썸네일 무게 —
//   screens 와 같은 방침). 키에 해시가 들어가 멱등(같은 삽화면 업로드 skip).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
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
const DRY = argv.includes('--dry-run');
const API = process.env.PRERENDER_API_ORIGIN || 'https://tangobook-production.up.railway.app';

// 대상 유닛 = 블로그 JSON 정본에서 파생(허브 hub-* 는 스토리북이 없어 제외).
const BLOG_DIR = path.join(__dirname, '_data', 'marketing', 'blogs');
const IDS = (arg('--ids') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const units = IDS.length
  ? IDS
  : fs
      .readdirSync(BLOG_DIR)
      .filter((f) => /^kr-h\d/.test(f) && f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''));

// write-* 롱테일 블로그는 자체 스토리북이 없어(storybookId=write-*) 관련 유닛의 1쪽 삽화를 빌린다.
const HERO_SOURCE = {
  'write-consonant': 'kr-h1-u02',
  'write-vowel': 'kr-h1-u01',
  'write-batchim': 'kr-h2-u01',
  'write-ssangjaeum': 'kr-h3-u01',
  'read-consonant': 'kr-h1-u02',
  'read-vowel': 'kr-h1-u01',
  'read-batchim': 'kr-h2-u01',
  'read-ganada': 'kr-h1-u02',
  'read-diphthong': 'kr-h4-u01',
  'write-dictation': 'kr-h1-u02',
  'write-line-tracing': 'kr-h1-u01',
  'hub-hangul-home': 'kr-h1-u01',
};

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/** 스토리북 1쪽 삽화 URL 을 받아 w720 webp 로 다시 구워 R2 에 올린다(멱등). */
async function uploadHero(unit, srcUrl) {
  const res = await fetch(encodeURI(decodeURI(srcUrl)));
  if (!res.ok) throw new Error(`삽화 다운로드 실패 ${res.status}`);
  const src = Buffer.from(await res.arrayBuffer());
  const buf = await sharp(src).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
  const key = `blog-phonics/${unit}-hero-${hash}.webp`;
  const url = `${process.env.R2_PUBLIC_URL}/${key}`;
  try {
    await s3.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
    return { url, skipped: true, kb: Math.round(buf.length / 1024) };
  } catch {
    /* 없으면 올린다 */
  }
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
  return { url, skipped: false, kb: Math.round(buf.length / 1024) };
}

let ok = 0;
let miss = 0;
for (const unit of units) {
  // 유닛 → mkt_contents(memo=storybook:<unit>) → mkt_blog_contents → 첫 이미지 카드(sort_order 0)
  const { data: content } = await sb
    .from('mkt_contents')
    .select('id')
    .eq('memo', `storybook:${unit}`)
    .single();
  if (!content) {
    console.warn(`[${unit}] ! 기본글 없음`);
    miss++;
    continue;
  }
  const { data: blogRow } = await sb
    .from('mkt_blog_contents')
    .select('id')
    .eq('content_id', content.id)
    .eq('channel', 'self_hosted')
    .eq('lang', 'ko')
    .single();
  if (!blogRow) {
    console.warn(`[${unit}] ! 블로그 없음`);
    miss++;
    continue;
  }
  const { data: cards } = await sb
    .from('mkt_blog_cards')
    .select('id, sort_order, content')
    .eq('blog_content_id', blogRow.id)
    .order('sort_order');
  const hero = (cards || []).find((c) => c.sort_order === 0);
  if (!hero) {
    console.warn(`[${unit}] ! §0 카드 없음`);
    miss++;
    continue;
  }

  // 스토리북 1쪽 삽화 URL (write-* 는 관련 유닛에서 빌린다)
  const srcUnit = HERO_SOURCE[unit] || unit;
  const sr = await fetch(`${API}/api/storybooks/${srcUnit}`);
  if (!sr.ok) {
    console.warn(`[${unit}] ! 스토리북 로드 실패 ${sr.status}`);
    miss++;
    continue;
  }
  const doc = await sr.json();
  const book = doc.data?.storybook || doc.data || doc.storybook || doc;
  const illus = (book.pages || []).map((p) => p.illustrationUrl).find(Boolean);
  if (!illus) {
    console.warn(`[${unit}] ! 1쪽 삽화 없음`);
    miss++;
    continue;
  }

  const { url, skipped, kb } = await uploadHero(unit, illus);
  if ((hero.content || {}).url === url) {
    console.log(`[${unit}] = 이미 삽화 hero (${kb}KB)`);
    ok++;
    continue;
  }
  if (!DRY)
    await sb
      .from('mkt_blog_cards')
      .update({ content: { ...(hero.content || {}), url } })
      .eq('id', hero.id);
  console.log(`[${unit}] §0 ← 1쪽 삽화 (${kb}KB${skipped ? ', R2 이미 있음' : ''})`);
  ok++;
}
console.log(`\n${DRY ? '(dry-run) ' : ''}완료 — 교체 ${ok} · 건너뜀/실패 ${miss}`);
