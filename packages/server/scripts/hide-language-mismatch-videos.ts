// 채널 언어와 제목 언어가 어긋난 발행분을 비공개(private)로 내린다.
//
// 왜: 언어축 = 채널축이다(ko=탱고북스 / en=tango books). 잘못된 채널에 올라간 영상은
// 그 채널의 시청자층 신호를 섞어버리고, 새로 시작한 라인의 도달 판단까지 오염시킨다.
// 실측 사고(2026-07-25): 영어 채널 67편 중 11편이 한국어 쇼츠였다(예약은 draft 로 취소됐지만
// **이미 발행된 것들은 그대로 남아 있었다**).
//
// 삭제하지 않고 private 로 내린다 — 되돌릴 수 있고, 조회 이력도 남는다.
// `setPrivacy` 가 아동용(selfDeclaredMadeForKids)도 함께 재선언하므로 그 플래그가 초기화되지 않는다.
//
// 실행:
//   tsx scripts/hide-language-mismatch-videos.ts --channel="tango books"            # dry-run(기본)
//   tsx scripts/hide-language-mismatch-videos.ts --channel="tango books" --apply
//   옵션: --expect=en   채널이 기대하는 언어(en=한글 제목을 걷어냄 / ko=한글 아닌 제목)
//         --limit=50   쿼터 절약(videos.update = 영상당 50 units, 일일 10,000)
import 'dotenv/config';
import { YouTubeProvider } from '../src/providers/youtube.provider.js';

function flag(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? '' : hit.slice(eq + 1);
}

const HANGUL = /[가-힣]/;

async function main() {
  const apply = flag('apply') !== undefined;
  const wantChannel = flag('channel');
  const expect = flag('expect') || 'en';
  const limit = Number(flag('limit') ?? '0') || Infinity;
  if (!wantChannel) throw new Error('--channel="채널명" 이 필요합니다.');

  const channels = await YouTubeProvider.listChannels();
  const target = channels.find((c) => c.channelTitle === wantChannel || c.name === wantChannel);
  if (!target) {
    throw new Error(
      `"${wantChannel}" 채널을 찾을 수 없습니다. 연동: ${channels.map((c) => c.channelTitle ?? c.name).join(', ')}`
    );
  }

  const yt = await YouTubeProvider.getAuthenticatedClient(target.id);
  const ch = await yt.channels.list({ part: ['contentDetails'], mine: true });
  const uploads = ch.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error('업로드 재생목록을 찾지 못했습니다.');

  const ids: string[] = [];
  let page: string | undefined;
  do {
    const pl = await yt.playlistItems.list({
      part: ['contentDetails'],
      playlistId: uploads,
      maxResults: 50,
      pageToken: page,
    });
    ids.push(...(pl.data.items ?? []).map((i) => i.contentDetails!.videoId!));
    page = pl.data.nextPageToken ?? undefined;
  } while (page);

  const videos: { id: string; title: string; privacy: string; kids: boolean }[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const r = await yt.videos.list({ part: ['snippet', 'status'], id: ids.slice(i, i + 50) });
    for (const v of r.data.items ?? []) {
      videos.push({
        id: v.id!,
        title: v.snippet?.title ?? '',
        privacy: v.status?.privacyStatus ?? '',
        kids: !!v.status?.madeForKids,
      });
    }
  }

  // 어긋난 것 = 기대 언어가 en 이면 한글 제목, ko 면 한글 없는 제목. 이미 private 인 건 건너뛴다.
  const mismatched = videos.filter((v) => {
    if (v.privacy === 'private') return false;
    const hasHangul = HANGUL.test(v.title);
    return expect === 'ko' ? !hasHangul : hasHangul;
  });

  console.log(
    `${target.channelTitle ?? target.name} · 총 ${videos.length}편 · 기대 언어 ${expect} · 어긋난 발행분 ${mismatched.length}편`
  );
  for (const v of mismatched.slice(0, limit === Infinity ? undefined : limit)) {
    console.log(`  ${apply ? '→ private' : '[dry]'} ${v.id}  ${v.title.slice(0, 52)}`);
  }
  if (!mismatched.length) return;
  if (!apply) {
    console.log('\nDry-run — 실제 변경 없음. 적용은 --apply.');
    return;
  }

  let done = 0;
  for (const v of mismatched) {
    if (done >= limit) break;
    try {
      await YouTubeProvider.setPrivacy(v.id, 'private', target.id);
      done++;
    } catch (e) {
      console.error(`  ❌ ${v.id}: ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`\n완료 — ${done}편 private 전환 (쿼터 ${done * 50} units)`);
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e);
  process.exit(1);
});
