// 발행된 유튜브 영상의 제목 **꼬리 문구만** 일괄 교체한다(재업로드 없음, `videos.update`).
//
// 왜: 네이버 검색광고 실측(2026-07-28) — 우리가 명작 27편에 쓰던 꼬리 「어린이 동화 읽어주기」는
// 월 **190회**짜리 문구였다. 「동화」 10,150 · 「오디오북」 6,420 에 비해 사실상 수요가 없다.
// 제목 앞부분(작품명)은 그대로 두고 꼬리만 바꾸므로 되돌리기도 같은 명령 한 줄이다.
//
// ⚠️ 쿼터: videos.update = 영상당 50 units(일일 10,000). 27편이면 1,350.
// ⚠️ `videos.update` 는 snippet 을 통째로 덮으므로 categoryId·description·tags 를 같이 실어야
//    지워지지 않는다(스니펫 부분 업데이트가 없다).
//
// 실행:
//   tsx scripts/retitle-youtube-tails.ts --channel="탱고북스" --from="어린이 동화 읽어주기" --to="세계 명작 동화 오디오북"
//   ... --apply     실제 반영 (기본 dry-run)
import dotenv from 'dotenv';
dotenv.config({ override: true }); // 세션 환경변수에 옛 값이 남아 있어도 .env 가 이기게
const { YouTubeProvider } = await import('../src/providers/youtube.provider.js');

function flag(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? '' : hit.slice(eq + 1);
}

const apply = flag('apply') !== undefined;
const wantChannel = flag('channel') || '탱고북스';
const FROM = flag('from');
const TO = flag('to');
if (!FROM || TO === undefined) throw new Error('--from="옛 꼬리" --to="새 꼬리" 가 필요합니다.');

const channels = await YouTubeProvider.listChannels();
const target = channels.find((c) => c.channelTitle === wantChannel || c.name === wantChannel);
if (!target) throw new Error(`"${wantChannel}" 채널을 찾을 수 없습니다.`);

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

const videos: any[] = [];
for (let i = 0; i < ids.length; i += 50) {
  const r = await yt.videos.list({ part: ['snippet', 'status'], id: ids.slice(i, i + 50) });
  videos.push(...(r.data.items ?? []));
}

const hits = videos.filter(
  (v) => v.status?.privacyStatus === 'public' && String(v.snippet?.title ?? '').endsWith(FROM)
);
console.log(
  `${target.channelTitle ?? target.name} · 공개 ${videos.length}편 중 「${FROM}」 로 끝나는 ${hits.length}편`
);
for (const v of hits.slice(0, 5))
  console.log(`  ${apply ? '→' : '[dry]'} ${String(v.snippet.title).slice(0, 46)}…`);
if (hits.length > 5) console.log(`  … 외 ${hits.length - 5}편`);
console.log(`\n새 꼬리: 「${TO}」  (쿼터 ${hits.length * 50} units)`);

if (!apply) {
  console.log('\nDry-run — 실제 변경 없음. 적용은 --apply.');
} else {
  let done = 0;
  for (const v of hits) {
    const title = String(v.snippet.title).slice(0, -FROM.length) + TO;
    if (title.length > 100) {
      console.error(`  ❌ ${v.id}: 제목 100자 초과(${title.length}) — 건너뜀`);
      continue;
    }
    try {
      // snippet 통째 덮어쓰기라 기존 필드를 같이 실어야 한다.
      await yt.videos.update({
        part: ['snippet'],
        requestBody: {
          id: v.id,
          snippet: {
            title,
            description: v.snippet.description,
            tags: v.snippet.tags,
            categoryId: v.snippet.categoryId,
            defaultLanguage: v.snippet.defaultLanguage,
          },
        },
      });
      done++;
    } catch (e) {
      console.error(`  ❌ ${v.id}: ${e instanceof Error ? e.message.slice(0, 80) : e}`);
    }
  }
  console.log(`\n완료 — ${done}/${hits.length}편 교체`);
}
