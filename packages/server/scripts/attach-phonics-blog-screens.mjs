// 파닉스 블로그 카드에 **실제 학습 화면 스크린샷**을 물린다 (멱등).
//   node scripts/attach-phonics-blog-screens.mjs --shots <디렉터리> --ids kr-h1-u02[,…] [--dry-run]
//
// 촬영 = `packages/client/scripts/capture-phonics-unit.mjs` 가 단원마다 3장을 만든다:
//   {unit}-1-unit.png(단원 화면) · {unit}-2-activity.png(익히기) · {unit}-3-game.png(낱말 게임)
// 그 셋을 블로그 섹션 **0·1·3** 카드의 `content.url` 에 넣는다(섹션 순서는 32편이 공유).
//
// 🔴 원본을 그대로 올리지 않는다 — 1080×1920 PNG 는 장당 1MB 가 넘는다. **w720 webp** 로 구워
//    올린다(단어 카드·표지 썸네일과 같은 방침). 키에 파일 해시가 들어가 재촬영하면 새 URL 이 되고
//    안 바뀌면 업로드를 건너뛴다(immutable 캐시 안전).
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
const SHOTS = arg('--shots');
const IDS = (arg('--ids') || '').split(',').map((s) => s.trim()).filter(Boolean);
const DRY = argv.includes('--dry-run');
if (!SHOTS || !IDS.length) throw new Error('--shots <디렉터리> --ids <단원id,…> 가 필요합니다');

/** 스크린샷 → 블로그 섹션 index. 32편이 같은 6섹션 구조를 쓰므로 고정이다.
 *  🔴 §0 은 이제 `attach-phonics-blog-hero.mjs` 가 **유닛 1쪽 삽화**로 채운다(대표 썸네일).
 *  예전엔 `1-unit`(활동 선택 메뉴 스크린샷)이 §0 이었는데 목록 썸네일이 버튼 그리드라 지저분했다.
 *  메뉴 스크린샷은 정보량이 가장 적어 아예 뺐고, 활동·게임 스크린샷만 본문(§1·§3)에 남긴다. */
const SLOT = [
  { suffix: '2-activity', section: 1 },
  { suffix: '3-game', section: 3 },
];

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function uploadWebp(file) {
  const buf = await sharp(file).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
  const key = `blog-phonics/${path.basename(file, '.png')}-${hash}.webp`;
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

for (const unit of IDS) {
  console.log(`[${unit}]`);
  // 단원 → mkt_contents(memo=storybook:<unit>) → mkt_blog_contents
  const { data: content } = await sb
    .from('mkt_contents')
    .select('id')
    .eq('memo', `storybook:${unit}`)
    .single();
  if (!content) {
    console.warn('  ! 기본글(mkt_contents) 없음 — 먼저 시딩하세요');
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
    console.warn('  ! 블로그 없음 — seed-marketing-blogs 먼저');
    continue;
  }
  const { data: cards } = await sb
    .from('mkt_blog_cards')
    .select('id, sort_order, content')
    .eq('blog_content_id', blogRow.id)
    .order('sort_order');

  for (const slot of SLOT) {
    const file = path.join(SHOTS, `${unit}-${slot.suffix}.png`);
    if (!fs.existsSync(file)) {
      console.warn(`  ! 스크린샷 없음: ${path.basename(file)}`);
      continue;
    }
    const card = (cards || []).find((c) => c.sort_order === slot.section);
    if (!card) {
      console.warn(`  ! 섹션 ${slot.section} 카드 없음`);
      continue;
    }
    const { url, skipped, kb } = await uploadWebp(file);
    if (!DRY) {
      await sb
        .from('mkt_blog_cards')
        .update({ content: { ...(card.content || {}), url } })
        .eq('id', card.id);
    }
    console.log(`  §${slot.section} ← ${slot.suffix} (${kb}KB${skipped ? ', 이미 있음' : ''})`);
  }
}
console.log(DRY ? '완료(dry-run)' : '완료');
