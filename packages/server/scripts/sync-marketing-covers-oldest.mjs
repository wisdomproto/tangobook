// 마케팅 DB(mkt_instagram_contents)의 릴스 커버(video_settings.reels.ko.coverUrl)를
// catalog 의 구버전(가장 오래된 R2 thumb) 커버로 동기화한다.
// build-shorts-catalog.mjs 가 각 책의 구버전 커버를 catalog 에 넣으므로, 그 값을 DB 에 반영해
// marketing 페이지에서 보이는 릴스 커버도 인스타 발행 커버(07-12 카드)로 통일한다.
//
// 실행: cd packages/server
//   npx tsx scripts/sync-marketing-covers-oldest.mjs --dry-run   # 미리보기
//   npx tsx scripts/sync-marketing-covers-oldest.mjs             # 반영
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG = path.resolve(__dirname, '../../..', 'docs/marketing/drafts/shorts-upload-catalog.json');
const DRY = process.argv.includes('--dry-run');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf-8'));
const coverByVideo = new Map(
  catalog.filter((r) => r.videoUrl && r.coverUrl).map((r) => [r.videoUrl, r.coverUrl])
);

const { data: rows, error } = await sb.from('mkt_instagram_contents').select('id, video_settings');
if (error) { console.error('DB error:', error.message); process.exit(1); }

const ts = (u) => u?.match(/thumb-(\d+)/)?.[1] ?? '?';
let changed = 0, skipped = 0, failed = 0;
for (const row of rows) {
  const ko = row.video_settings?.reels?.ko;
  if (!ko?.videoUrl) { skipped++; continue; }
  const newCover = coverByVideo.get(ko.videoUrl);
  if (!newCover || newCover === ko.coverUrl) { skipped++; continue; }
  const bid = ko.videoUrl.match(/reels\/(\d+)-/)?.[1] ?? '?';
  console.log(`${bid}: ${ts(ko.coverUrl)} → ${ts(newCover)}`);
  if (!DRY) {
    const vs = JSON.parse(JSON.stringify(row.video_settings));
    vs.reels.ko.coverUrl = newCover;
    const { error: ue } = await sb.from('mkt_instagram_contents').update({ video_settings: vs }).eq('id', row.id);
    if (ue) { console.error(`  ❌ ${bid}: ${ue.message}`); failed++; continue; }
  }
  changed++;
}
console.log(`\n${DRY ? '[dry-run] ' : ''}변경: ${changed} · 스킵: ${skipped} · 실패: ${failed}`);
