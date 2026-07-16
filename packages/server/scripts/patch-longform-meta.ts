// 이미 등록된 롱폼 행(mkt_youtube_contents)의 제목/설명/태그를 _data/longform-meta.json 기준으로 갱신.
// 폴백 메타(제목만)로 등록된 자연관찰 롱폼을 풍성한 메타로 소급 패치할 때 사용. 렌더 불필요·멱등.
//
// 사용:
//   pnpm --filter @tangobook/server exec tsx scripts/patch-longform-meta.ts --lang=ko [--dry-run] [--only-fallback]
//   ...  --book=<id>  (특정 책만)
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const META_FILE = path.join(SCRIPT_DIR, '_data', 'longform-meta.json');

const argv = process.argv.slice(2);
const has = (f: string) => argv.includes(f);
const val = (f: string, d = '') => {
  const hit = argv.find((a) => a.startsWith(`${f}=`));
  return hit ? hit.slice(f.length + 1) : d;
};
const DRY = has('--dry-run');
const ONLY_FALLBACK = has('--only-fallback'); // description 이 빈 행(=폴백)만 패치
const LANG = val('--lang', 'ko');
const ONE_BOOK = val('--book', '');

type MetaEntry = { title?: string; description?: string; tags?: string[] };

async function main() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase admin 미설정');
  const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf8')) as Record<
    string,
    Record<string, MetaEntry>
  >;

  const { data: rows, error } = await sb
    .from('mkt_youtube_contents')
    .select('id, video_settings, video_title, video_description')
    .eq('target_duration', 'long');
  if (error) throw new Error(`조회 실패: ${error.message}`);

  let patched = 0;
  let skipped = 0;
  const misses: string[] = [];
  for (const r of (rows ?? []) as any[]) {
    const vs = r.video_settings || {};
    const bookId = String(vs.bookId ?? '');
    const lang = String(vs.language ?? 'ko');
    if (lang !== LANG) continue;
    if (ONE_BOOK && bookId !== ONE_BOOK) continue;
    if (ONLY_FALLBACK && (r.video_description ?? '').trim()) {
      skipped++;
      continue;
    }
    const entry = meta[bookId]?.[lang];
    if (!entry?.title) {
      misses.push(bookId);
      continue;
    }
    if (DRY) {
      console.log(`  [dry] ${bookId} → ${entry.title}`);
      patched++;
      continue;
    }
    const { error: upErr } = await sb
      .from('mkt_youtube_contents')
      .update({
        video_title: entry.title,
        video_description: entry.description ?? '',
        video_tags: Array.isArray(entry.tags) ? entry.tags : [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', r.id);
    if (upErr) {
      console.error(`  ✗ ${bookId}: ${upErr.message}`);
      continue;
    }
    patched++;
  }
  console.log(
    `\n${DRY ? '[DRY] ' : ''}패치 ${patched} · 스킵 ${skipped} · 메타없음 ${misses.length}` +
      (misses.length ? ` (${misses.slice(0, 15).join(', ')}${misses.length > 15 ? ' …' : ''})` : '')
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
