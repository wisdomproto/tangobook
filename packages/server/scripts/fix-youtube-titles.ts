// 이미 발행된 유튜브 영상(롱폼·쇼츠)의 제목을 "공들여 만든 롱폼 메타"(mkt_youtube_contents.video_title)
// 기준으로 정정한다.
//
// 원인: 발행 경로가 예약 레코드의 metadata.title 을 우선했다. 그 값은 발행큐 표시용으로
// mkt_contents.title 을 복사한 원본이라 검색 키워드가 없다("게", "치카치카 쓱쓱, 반짝반짝!",
// "01. 골고루 먹으면 무지개 힘!"). 그게 키워드가 든 video_title
// ("… | 양치 안 하는 아이를 위한 동화 | 호리네 생활동화 오디오북")을 가려 조회수가 0~9회에 머물렀다.
//   - 롱폼: stripLeadingNumber(video_title)
//   - 쇼츠: deriveShortsTitle(video_title)  ← "… 오디오북" 접미사만 떼고 #Shorts
//
// 🔴 제목만 바꾸고 설명·태그·카테고리는 유튜브 현재 값을 그대로 재전송해 보존한다.
//
// 실행:
//   pnpm --filter @tangobook/server exec tsx scripts/fix-youtube-titles.ts              # dry-run(전체)
//   pnpm --filter @tangobook/server exec tsx scripts/fix-youtube-titles.ts --apply
//   ... --kind=longform|reels   (기본: 둘 다)
import 'dotenv/config';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';
import { YouTubeProvider } from '../src/providers/youtube.provider.js';
import { matchYoutubeRow } from '../src/services/reel/longform-publish.js';
import {
  stripLeadingNumber,
  deriveShortsTitle,
} from '../src/services/mkt/publish-executor.service.js';

const APPLY = process.argv.includes('--apply');
const KIND = (process.argv.find((a) => a.startsWith('--kind='))?.split('=')[1] ?? '').trim();

async function main() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정');

  const { data: records } = await sb
    .from('mkt_publish_records')
    .select('content_id, language, platform_post_id, metadata')
    .eq('channel', 'youtube')
    .eq('status', 'published')
    .not('platform_post_id', 'is', null);

  const all = (records ?? []).filter((r: any) => {
    const kind = r.metadata?.content_kind ?? '';
    if (KIND) return kind === KIND;
    return kind === 'longform' || kind === 'reels';
  });
  console.log(`발행된 레코드: ${all.length}건${KIND ? ` (kind=${KIND})` : ''}`);
  if (!all.length) return;

  const contentIds = [...new Set(all.map((r: any) => r.content_id as string))];
  const { data: ytRows } = await sb
    .from('mkt_youtube_contents')
    .select('content_id, video_title, video_settings')
    .in('content_id', contentIds);
  const byContent = new Map<string, any[]>();
  for (const row of ytRows ?? []) {
    const k = (row as any).content_id as string;
    if (!byContent.has(k)) byContent.set(k, []);
    byContent.get(k)!.push(row);
  }

  const yt = await YouTubeProvider.getAuthenticatedClient();

  const videoIds = all.map((r: any) => r.platform_post_id as string);
  const current = new Map<string, { title: string; desc: string; tags: string[]; cat: string }>();
  for (let i = 0; i < videoIds.length; i += 50) {
    const res = await yt.videos.list({ part: ['snippet'], id: videoIds.slice(i, i + 50) });
    for (const v of res.data.items ?? []) {
      current.set(v.id!, {
        title: v.snippet?.title ?? '',
        desc: v.snippet?.description ?? '',
        tags: v.snippet?.tags ?? [],
        cat: v.snippet?.categoryId ?? '27',
      });
    }
  }

  let same = 0;
  let missing = 0;
  // 🔴 채널이 여러 개 연동돼 있다(탱고북스 / tango books). 남의 채널 영상에 videos.update 하면
  // 403 Forbidden 이므로, 발행 레코드의 metadata.target_id(내부 채널 id)로 인증 채널을 고른다.
  const plan: {
    id: string;
    kind: string;
    before: string;
    after: string;
    cur: any;
    targetId?: string;
  }[] = [];

  for (const r of all as any[]) {
    const vid = r.platform_post_id as string;
    const cur = current.get(vid);
    if (!cur) {
      missing++;
      continue;
    }
    const rows = byContent.get(r.content_id) ?? [];
    const kind = r.metadata?.content_kind as string;
    const lang = (r.language as string) ?? 'ko';

    // 롱폼은 (artStyle, language) 조합 행. 쇼츠는 그림체 개념이 없어 언어 매칭 → 없으면 아무 행.
    const matched =
      kind === 'longform'
        ? matchYoutubeRow(rows as any[], r.metadata?.art_style ?? '', lang)
        : (rows.find((x: any) => x.video_settings?.language === lang) ?? rows[0]) || null;
    const crafted = (matched as any)?.video_title as string | undefined;
    if (!crafted) {
      missing++;
      continue;
    }

    const want =
      kind === 'longform'
        ? stripLeadingNumber(crafted).slice(0, 100)
        : deriveShortsTitle(crafted).slice(0, 100);
    if (want === cur.title) {
      same++;
      continue;
    }
    plan.push({
      id: vid,
      kind,
      before: cur.title,
      after: want,
      cur,
      targetId: (r.metadata?.target_id as string) || undefined,
    });
  }

  console.log(`이미 정상 ${same} · 메타/영상 못찾음 ${missing} · 정정 대상 ${plan.length}\n`);
  if (!plan.length) {
    console.log('✅ 정정할 영상이 없습니다.');
    return;
  }

  for (const p of plan) {
    if (!APPLY) {
      console.log(`[DRY][${p.kind}] ${p.id}\n   before: ${p.before}\n   after : ${p.after}`);
      continue;
    }
    try {
      await YouTubeProvider.setSnippet(
        p.id,
        {
          title: p.after,
          description: p.cur.desc, // 유튜브 현재 값 보존
          tags: p.cur.tags,
          categoryId: p.cur.cat,
        },
        p.targetId // 그 영상을 소유한 채널로 인증(미지정 시 첫 채널)
      );
      console.log(`✅ [${p.kind}] ${p.id}  "${p.before}" → "${p.after}"`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`❌ ${p.id}: ${msg}`);
      if (/quota/i.test(msg)) {
        console.error(
          '⛔ 쿼터 소진 — 내일 재실행하면 이어서 처리됩니다(이미 정상인 건 자동 skip).'
        );
        return;
      }
    }
  }
  if (!APPLY) console.log(`\n--apply 로 실제 반영 (${plan.length}건)`);
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e);
  process.exit(1);
});
