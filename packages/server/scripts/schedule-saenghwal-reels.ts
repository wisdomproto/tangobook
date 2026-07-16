// 생활동화(호리) 릴스를 인스타그램 + 유튜브 쇼츠에 하루 1개씩 예약 발행 등록.
// 릴스 videoUrl = mkt_instagram_contents.video_settings.reels.ko.videoUrl (render-nature-reels 가 연결).
// mkt_publish_records: channel='instagram'|'youtube' + metadata{content_kind:'reels', target_id} → 스케줄러 자동 발행.
//   - instagram: executor loadReel → publishInstagramReel (Meta 연동 토큰 서버측)
//   - youtube:   executor publishYouTube(비-longform) → loadReel → #Shorts 업로드
// 멱등(이미 그 채널에 reels 예약/발행된 콘텐츠는 스킵). 기본 dry-run.
//
// 사용:
//   pnpm --filter @tangobook/server exec tsx scripts/schedule-saenghwal-reels.ts            # dry-run
//   pnpm --filter @tangobook/server exec tsx scripts/schedule-saenghwal-reels.ts --apply    # 실제 예약
//   ... --channels=instagram,youtube  --ig-hour=3 --yt-hour=9 --start=2026-07-18
import 'dotenv/config';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';

// 기본 타겟: IG 비즈니스(tangobook_korea) / YouTube 내부 채널(탱고북스).
const IG_TARGET = process.env.IG_TARGET_ID || '17841415316344124';
const YT_TARGET = process.env.LONGFORM_YT_CHANNEL_ID || '82d18111-c023-4d2b-a893-dbe40893fdb8';
const LANG = 'ko';

const argv = process.argv.slice(2);
const has = (f: string) => argv.includes(f);
const val = (f: string, d: string) => {
  const hit = argv.find((a) => a.startsWith(`${f}=`));
  return hit ? hit.slice(f.length + 1) : d;
};
const APPLY = has('--apply');
const CHANNELS = val('--channels', 'instagram,youtube')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const IG_HOUR = Number(val('--ig-hour', '3')); // UTC 03:00 ≈ KST 12:00
const YT_HOUR = Number(val('--yt-hour', '9')); // UTC 09:00 ≈ KST 18:00

function slotAt(startDayMs: number, dayIndex: number, hour: number): string {
  return new Date(startDayMs + dayIndex * 86400_000 + hour * 3600_000).toISOString();
}

async function main() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정');

  // 1) 릴스 보유 콘텐츠 (video_settings.reels.ko.videoUrl)
  const { data: igRows } = await sb
    .from('mkt_instagram_contents')
    .select('content_id, video_settings');
  const reelContentIds = new Set(
    (igRows ?? [])
      .filter((r: any) => r.video_settings?.reels?.[LANG]?.videoUrl)
      .map((r: any) => r.content_id as string)
  );

  // 2) 생활동화(life) 콘텐츠 중 릴스 보유분
  const { data: contents } = await sb
    .from('mkt_contents')
    .select('id, title, project_id, project:mkt_projects(user_id)')
    .eq('category', 'life');
  let rows = (contents ?? [])
    .filter((c: any) => reelContentIds.has(c.id))
    .map((c: any) => ({
      content_id: c.id as string,
      title: (c.title as string) ?? '',
      project_id: c.project_id as string,
      owner_id: c.project?.user_id as string,
    }));
  // 제목순(번호) 정렬
  rows.sort((a, b) => a.title.localeCompare(b.title, 'ko', { numeric: true }));

  console.log(`생활동화 릴스 보유 ${rows.length}권 · 채널=${CHANNELS.join(',')}`);
  if (!rows.length) {
    console.log('릴스가 연결된 생활동화 콘텐츠가 없습니다(렌더/연결 대기?).');
    return;
  }

  // 3) 채널별 멱등 스킵셋
  const { data: existing } = await sb
    .from('mkt_publish_records')
    .select('content_id, channel, metadata')
    .in('status', ['scheduled', 'publishing', 'published']);
  const queued = (channel: string) =>
    new Set(
      (existing ?? [])
        .filter(
          (r: any) => r.channel === channel && (r.metadata?.content_kind ?? 'cardnews') === 'reels'
        )
        .map((r: any) => r.content_id as string)
    );

  // 4) 슬롯 = 내일 00:00 UTC 부터 채널별 1/일
  const now = new Date();
  const tomorrow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0);
  const startStr = val('--start', '');
  const startDayMs = startStr ? Date.parse(`${startStr}T00:00:00Z`) : tomorrow;

  const nowIso = new Date().toISOString();
  const allRecords: any[] = [];
  for (const channel of CHANNELS) {
    const skip = queued(channel);
    const targetId = channel === 'instagram' ? IG_TARGET : YT_TARGET;
    const hour = channel === 'instagram' ? IG_HOUR : YT_HOUR;
    const fresh = rows.filter((r) => !skip.has(r.content_id));
    console.log(
      `\n[${channel}] 신규 ${fresh.length} · 이미예약 스킵 ${rows.length - fresh.length} · target=${targetId} · ${hour}:00 UTC`
    );
    fresh.forEach((r, i) => {
      const when = slotAt(startDayMs, i, hour);
      if (i < 6) console.log(`   ${when}  ${r.title}`);
      allRecords.push({
        user_id: r.owner_id,
        content_id: r.content_id,
        project_id: r.project_id,
        channel,
        language: LANG,
        status: 'scheduled',
        scheduled_at: when,
        retry_count: 0,
        metadata: { target_id: targetId, content_kind: 'reels', title: r.title },
        updated_at: nowIso,
      });
    });
  }

  if (!APPLY) {
    console.log(`\nDry-run — 총 ${allRecords.length}개 예약 예정. 실제 등록은 --apply.`);
    return;
  }
  for (let i = 0; i < allRecords.length; i += 100) {
    const chunk = allRecords.slice(i, i + 100);
    const { error } = await sb.from('mkt_publish_records').insert(chunk);
    if (error) throw new Error(`삽입 실패(${i}): ${error.message}`);
  }
  console.log(
    `\n완료 — ${allRecords.length}개 릴스 발행 예약(IG+YouTube). 스케줄러가 자동 발행합니다.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
