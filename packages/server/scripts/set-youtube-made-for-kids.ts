// 이미 발행된 유튜브 영상들을 일괄로 "아동용(Made for Kids)"으로 전환한다.
// 탱고북 유튜브 콘텐츠(동화·오디오북·쇼츠)는 전부 아동 대상이므로 COPPA상 아동용 선언이 맞다.
// R2 에 저장된 OAuth 토큰(system/youtube-channels.json)으로 채널 업로드 목록을 훑어 videos.update.
//
// 실행:
//   pnpm --filter @tangobook/server exec tsx scripts/set-youtube-made-for-kids.ts             # dry-run (기본)
//   pnpm --filter @tangobook/server exec tsx scripts/set-youtube-made-for-kids.ts --apply      # 실제 전환
//   옵션: --channel="탱고북스"  대상 채널명(기본: 탱고북스, 없으면 첫 연결 채널)
//         --limit=100          한 번에 전환할 최대 개수(쿼터 절약)
//         --list-channels      연결된 채널만 출력하고 종료
//
// ⚠️ 쿼터: videos.update = 영상당 50 units, 기본 일일 10,000 units → 하루 약 190개가 상한.
//    초과하면(403 quotaExceeded) 그 지점에서 멈추고, 다음날 그대로 재실행하면 이어서 처리된다
//    (이미 아동용인 영상은 자동 skip 이라 재실행이 곧 resume).
import 'dotenv/config';
import { YouTubeProvider } from '../src/providers/youtube.provider.js';

function flag(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? '' : hit.slice(eq + 1);
}

async function main() {
  const apply = flag('apply') !== undefined;
  const wantChannel = flag('channel') || '탱고북스';
  const limit = Number(flag('limit') ?? '0') || Infinity;

  const channels = await YouTubeProvider.listChannels();
  if (channels.length === 0) throw new Error('연결된 YouTube 채널이 없습니다.');

  if (flag('list-channels') !== undefined) {
    console.log('연결된 채널:');
    for (const c of channels) console.log(`  - ${c.channelTitle || c.name} (${c.channelId})`);
    return;
  }

  const target =
    channels.find((c) => c.channelTitle === wantChannel || c.name === wantChannel) || channels[0];
  console.log(`▶ 대상 채널: ${target.channelTitle || target.name} (${target.channelId})`);
  console.log(`▶ 모드: ${apply ? 'APPLY(실제 전환)' : 'DRY-RUN(미리보기)'}\n`);

  const yt = await YouTubeProvider.getAuthenticatedClient(target.id);

  // 1) 업로드 재생목록 id
  const chRes = await yt.channels.list({ part: ['contentDetails'], mine: true });
  const uploadsPlaylist = chRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylist) throw new Error('업로드 재생목록을 찾을 수 없습니다.');

  // 2) 전체 영상 id 수집
  const videoIds: string[] = [];
  let pageToken: string | undefined;
  do {
    const pl = await yt.playlistItems.list({
      part: ['contentDetails'],
      playlistId: uploadsPlaylist,
      maxResults: 50,
      pageToken,
    });
    for (const it of pl.data.items ?? []) {
      const vid = it.contentDetails?.videoId;
      if (vid) videoIds.push(vid);
    }
    pageToken = pl.data.nextPageToken ?? undefined;
  } while (pageToken);
  console.log(`총 업로드 영상: ${videoIds.length}개`);

  // 3) 현재 상태 조회(50개씩, 1 unit/호출) → 아직 아동용 아닌 것만 추림
  const needFlip: { id: string; title: string; privacy: string }[] = [];
  let alreadyKids = 0;
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const res = await yt.videos.list({ part: ['status', 'snippet'], id: batch });
    for (const v of res.data.items ?? []) {
      const kids = v.status?.madeForKids ?? v.status?.selfDeclaredMadeForKids ?? false;
      if (kids) alreadyKids++;
      else
        needFlip.push({
          id: v.id!,
          title: v.snippet?.title ?? '',
          privacy: v.status?.privacyStatus ?? 'public',
        });
    }
  }
  console.log(`이미 아동용: ${alreadyKids}개 / 전환 필요: ${needFlip.length}개\n`);

  if (needFlip.length === 0) {
    console.log('✅ 전환할 영상이 없습니다.');
    return;
  }

  const targets = needFlip.slice(0, limit === Infinity ? needFlip.length : limit);
  if (!apply) {
    console.log(`[DRY-RUN] 아래 ${targets.length}개를 아동용으로 전환할 예정 (--apply 로 실행):`);
    for (const t of targets) console.log(`  · ${t.id}  "${t.title.slice(0, 40)}"`);
    if (targets.length < needFlip.length)
      console.log(`  … 외 ${needFlip.length - targets.length}개 (--limit 제한)`);
    return;
  }

  // 4) 실제 전환 (privacyStatus 보존 + selfDeclaredMadeForKids: true)
  let done = 0;
  for (const t of targets) {
    try {
      await yt.videos.update({
        part: ['status'],
        requestBody: {
          id: t.id,
          status: { privacyStatus: t.privacy, selfDeclaredMadeForKids: true },
        },
      });
      done++;
      console.log(`✅ ${done}/${targets.length}  ${t.id}  "${t.title.slice(0, 30)}"`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/quota/i.test(msg)) {
        console.error(
          `\n⛔ 쿼터 소진 — ${done}개 전환 완료. 내일 같은 명령을 다시 실행하면 이어서 처리됩니다.`
        );
        return;
      }
      console.error(`❌ ${t.id}: ${msg}`);
    }
  }
  console.log(`\n🎉 완료: ${done}개 아동용으로 전환.`);
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e);
  process.exit(1);
});
