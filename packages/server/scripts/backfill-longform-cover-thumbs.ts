// 기존 롱폼 오디오북(mkt_youtube_contents) 썸네일을 언어별 표지로 백필.
// LongformThumbnail 렌더본(mkt/.../longform/*-thumb-*.png) → styleAssets 표지 URL 로 교체.
// 재렌더 0 · R2 업로드 0 · 순수 DB 업데이트(+ 구 썸네일 PNG R2 정리).
//
//   미리보기: pnpm --filter @tangobook/server exec tsx scripts/backfill-longform-cover-thumbs.ts
//   실제 적용: pnpm --filter @tangobook/server exec tsx scripts/backfill-longform-cover-thumbs.ts --apply
import 'dotenv/config';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';
import { deleteFromR2, urlToR2Key } from '../src/providers/r2.provider.js';
import { fetchStorybook } from '../src/services/reel/reel-targets.js';
import { resolveLongformCoverUrl } from '../src/services/reel/longform-publish.js';

const APPLY = process.argv.includes('--apply');

// 구 롱폼 썸네일(렌더 PNG)만 R2 에서 삭제 — 책 표지는 절대 건드리지 않음.
function isOldRenderedThumb(url: string | null | undefined): boolean {
  return !!url && /\/longform\/.*-thumb-\d+\.png(\?|$)/.test(url);
}

async function main() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase admin 미설정 (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 필요)');

  const { data: rows, error } = await sb
    .from('mkt_youtube_contents')
    .select('id, thumbnail_url, video_settings')
    .eq('target_duration', 'long');
  if (error) throw new Error(`mkt_youtube_contents 조회 실패: ${error.message}`);

  const all = rows ?? [];
  console.log(`[backfill] 롱폼 행 ${all.length}개${APPLY ? ' · APPLY' : ' · 미리보기'}`);

  const bookCache = new Map<string, any>();
  const getBook = async (id: string) => {
    if (!bookCache.has(id)) bookCache.set(id, await fetchStorybook(id));
    return bookCache.get(id);
  };

  let updated = 0;
  let same = 0;
  let skipped = 0;
  let purged = 0;
  const oldThumbs = new Set<string>();

  for (const row of all) {
    const vs = (row.video_settings ?? {}) as Record<string, any>;
    const { bookId, artStyle, language } = vs;
    if (!bookId || !artStyle || !language) {
      console.warn(`  - ${row.id} SKIP (video_settings 불완전)`);
      skipped++;
      continue;
    }
    let cover: string;
    try {
      cover = resolveLongformCoverUrl(await getBook(bookId), artStyle, language);
    } catch (e) {
      console.warn(`  - ${row.id} SKIP (책 로드 실패 ${bookId}): ${(e as Error).message}`);
      skipped++;
      continue;
    }
    if (!cover) {
      console.warn(`  - ${row.id} SKIP (표지 URL 없음 ${bookId}/${artStyle}/${language})`);
      skipped++;
      continue;
    }
    if (row.thumbnail_url === cover) {
      same++;
      continue;
    }
    // 갈아끼울 구 렌더 썸네일은 나중에 R2 에서 정리.
    if (isOldRenderedThumb(row.thumbnail_url)) oldThumbs.add(row.thumbnail_url!);

    console.log(`  ✎ ${bookId}/${artStyle}/${language} → ${cover.split('/').pop()}`);
    updated++;

    if (APPLY) {
      const { error: upErr } = await sb
        .from('mkt_youtube_contents')
        .update({ thumbnail_url: cover, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      if (upErr) throw new Error(`행 갱신 실패(${row.id}): ${upErr.message}`);
    }
  }

  // 구 렌더 썸네일 PNG R2 정리 (갱신 후 어떤 행도 더는 참조하지 않는 것만 삭제).
  if (APPLY && oldThumbs.size) {
    const { data: after } = await sb
      .from('mkt_youtube_contents')
      .select('thumbnail_url')
      .eq('target_duration', 'long');
    const refAfter = new Set((after ?? []).map((r) => r.thumbnail_url).filter(Boolean));
    for (const url of oldThumbs) {
      if (refAfter.has(url)) continue; // 아직 어떤 행이 참조 → 보존
      try {
        await deleteFromR2(urlToR2Key(url));
        purged++;
      } catch {
        /* 이미 없음 — 무시 */
      }
    }
  }

  console.log(
    `\n[backfill] 갱신 ${updated} · 이미표지 ${same} · 스킵 ${skipped}` +
      (APPLY ? ` · 구썸네일정리 ${purged}` : ` · (구썸네일 ${oldThumbs.size}개 APPLY 시 정리)`)
  );
  if (!APPLY) console.log('  → 실제 적용하려면 --apply');
}

main().catch((e) => {
  console.error('[backfill] 치명적 오류:', e);
  process.exit(1);
});
