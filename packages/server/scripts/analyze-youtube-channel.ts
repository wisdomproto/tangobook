// 연결된 유튜브 채널의 영상별 성과를 덤프한다(조회수·좋아요·길이·발행일).
// ⚠️ youtube.readonly 스코프라 공개 통계만 가능. 노출수/CTR/시청지속시간(YouTube Analytics API)은
//    yt-analytics.readonly 스코프 재인증이 필요하다.
//
// 실행:
//   pnpm --filter @tangobook/server exec tsx scripts/analyze-youtube-channel.ts
//   옵션: --channel="탱고북스"  --json  (원본 JSON 출력)
import 'dotenv/config';
import { YouTubeProvider } from '../src/providers/youtube.provider.js';

function flag(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? '' : hit.slice(eq + 1);
}

/** PT1M30S → 90 */
function parseDuration(iso: string): number {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '');
  if (!m) return 0;
  return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
}

/** 제목·태그로 시리즈 추정 */
function seriesOf(title: string, tags: string[]): string {
  const t = title + ' ' + tags.join(' ');
  if (/공룡|사우루스|랩터|티라노|람포린쿠스|프테라|고생물/.test(t)) return '공룡';
  if (/호리|생활동화|치카치카|골고루|뽀득/.test(t)) return '생활동화(호리)';
  if (/잠자리|오디오북|명작/.test(t)) return '명작/오디오북';
  if (/강아지|고양이|나무|풀|꽃|자연|관찰|동물|곤충/.test(t)) return '자연관찰';
  return '기타';
}

async function main() {
  const wantChannel = flag('channel') || '탱고북스';
  const channels = await YouTubeProvider.listChannels();
  if (channels.length === 0) throw new Error('연결된 YouTube 채널이 없습니다.');
  const target =
    channels.find((c) => c.channelTitle === wantChannel || c.name === wantChannel) || channels[0];
  // 내 채널 자격증명으로 공개 데이터도 조회한다(경쟁 채널 = 인증 불필요, 우리 토큰이면 충분).
  const yt = await YouTubeProvider.getAuthenticatedClient(target.id);

  // ── 검색 모드: --search="키워드" → 채널을 찾아 헤드라인 통계만 나열(벤치마크 후보 발굴) ──
  // 🔴 핸들 추측(@tangobooks 가 남의 채널로 잡히는 사고)을 피하려 검색 API로 정확한 channelId 확보.
  const searchQuery = flag('search');
  if (searchQuery !== undefined) {
    const region = flag('region'); // 예: KR, US — 지역 편향
    const relLang = flag('lang'); // 예: ko, en
    const sr = await yt.search.list({
      part: ['snippet'],
      q: searchQuery,
      type: ['channel'],
      maxResults: Number(flag('max') ?? '15'),
      ...(region ? { regionCode: region } : {}),
      ...(relLang ? { relevanceLanguage: relLang } : {}),
    });
    const chIds = (sr.data.items ?? []).map((i) => i.snippet?.channelId!).filter(Boolean);
    if (!chIds.length) {
      console.log('검색 결과 없음');
      return;
    }
    const stats = await yt.channels.list({
      part: ['snippet', 'statistics'],
      id: chIds,
      maxResults: 50,
    });
    const rows = (stats.data.items ?? []).map((c) => ({
      title: c.snippet?.title ?? '',
      handle: c.snippet?.customUrl ?? '',
      id: c.id ?? '',
      subs: Number(c.statistics?.subscriberCount ?? 0),
      views: Number(c.statistics?.viewCount ?? 0),
      videos: Number(c.statistics?.videoCount ?? 0),
    }));
    rows.sort((a, b) => b.subs - a.subs);
    console.log(
      `🔎 "${searchQuery}" (region=${region ?? '-'} lang=${relLang ?? '-'}) — 채널 ${rows.length}개\n`
    );
    console.log('구독자     총조회      영상   편당    핸들 / 제목');
    for (const r of rows) {
      const avg = r.videos ? Math.round(r.views / r.videos) : 0;
      console.log(
        `${String(r.subs).padStart(8)} ${String(r.views).padStart(11)} ${String(r.videos).padStart(5)} ${String(avg).padStart(7)}  ${(r.handle || r.id).padEnd(22)} ${r.title}`
      );
    }
    return;
  }

  // --handle=@someChannel 또는 --channel-id=UC... 면 그 공개 채널을 분석. 없으면 내 채널(mine).
  const handle = flag('handle');
  const channelId = flag('channel-id');
  const limit = Number(flag('limit') ?? '0') || Infinity; // 대형 채널: 최근 N개만
  const chRes = await yt.channels.list(
    handle
      ? { part: ['contentDetails', 'statistics', 'snippet'], forHandle: handle }
      : channelId
        ? { part: ['contentDetails', 'statistics', 'snippet'], id: [channelId] }
        : { part: ['contentDetails', 'statistics', 'snippet'], mine: true }
  );
  const ch = chRes.data.items?.[0];
  const uploads = ch?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error('업로드 재생목록을 찾을 수 없습니다.');

  console.log(`▶ 채널: ${ch?.snippet?.title || target.channelTitle || target.name}`);
  console.log(
    `▶ 구독자 ${ch?.statistics?.subscriberCount ?? '?'} · 총 조회수 ${ch?.statistics?.viewCount ?? '?'} · 영상 ${ch?.statistics?.videoCount ?? '?'}\n`
  );

  // video id 수집(최근순, limit 있으면 그만큼만)
  const ids: string[] = [];
  let pageToken: string | undefined;
  do {
    const pl = await yt.playlistItems.list({
      part: ['contentDetails'],
      playlistId: uploads,
      maxResults: 50,
      pageToken,
    });
    for (const it of pl.data.items ?? []) {
      const v = it.contentDetails?.videoId;
      if (v) ids.push(v);
    }
    pageToken = pl.data.nextPageToken ?? undefined;
  } while (pageToken && ids.length < limit);
  if (ids.length > limit) ids.length = limit; // 최근 N개만
  if (limit !== Infinity) console.log(`(최근 ${ids.length}개만 분석)\n`);

  type Row = {
    id: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
    sec: number;
    isShort: boolean;
    published: string;
    series: string;
    privacy: string;
  };
  const rows: Row[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const res = await yt.videos.list({
      part: ['snippet', 'statistics', 'contentDetails', 'status'],
      id: ids.slice(i, i + 50),
    });
    for (const v of res.data.items ?? []) {
      const sec = parseDuration(v.contentDetails?.duration ?? '');
      const title = v.snippet?.title ?? '';
      const tags = v.snippet?.tags ?? [];
      rows.push({
        id: v.id!,
        title,
        views: Number(v.statistics?.viewCount ?? 0),
        likes: Number(v.statistics?.likeCount ?? 0),
        comments: Number(v.statistics?.commentCount ?? 0),
        sec,
        isShort: sec > 0 && sec <= 60,
        published: (v.snippet?.publishedAt ?? '').slice(0, 10),
        series: seriesOf(title, tags),
        privacy: v.status?.privacyStatus ?? '',
      });
    }
  }

  if (flag('json') !== undefined) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  rows.sort((a, b) => b.views - a.views);
  console.log('=== 영상별 (조회수 순) ===');
  console.log('조회수  좋아요 댓글  길이  발행일      형식    시리즈          제목');
  for (const r of rows) {
    console.log(
      `${String(r.views).padStart(6)} ${String(r.likes).padStart(5)} ${String(r.comments).padStart(4)} ` +
        `${String(r.sec).padStart(5)}s ${r.published} ${(r.isShort ? '쇼츠' : '롱폼').padEnd(5)} ` +
        `${r.series.padEnd(14)} ${r.title.slice(0, 45)}`
    );
  }

  const agg = (key: (r: Row) => string) => {
    const m = new Map<string, { n: number; views: number }>();
    for (const r of rows) {
      const k = key(r);
      const cur = m.get(k) ?? { n: 0, views: 0 };
      cur.n++;
      cur.views += r.views;
      m.set(k, cur);
    }
    return [...m.entries()].sort((a, b) => b[1].views / b[1].n - a[1].views / a[1].n);
  };

  console.log('\n=== 형식별 ===');
  for (const [k, v] of agg((r) => (r.isShort ? '쇼츠' : '롱폼')))
    console.log(
      `${k.padEnd(6)} ${String(v.n).padStart(3)}개  총 ${v.views}  평균 ${Math.round(v.views / v.n)}`
    );

  console.log('\n=== 시리즈별 ===');
  for (const [k, v] of agg((r) => r.series))
    console.log(
      `${k.padEnd(14)} ${String(v.n).padStart(3)}개  총 ${v.views}  평균 ${Math.round(v.views / v.n)}`
    );

  console.log('\n=== 월별 발행 ===');
  for (const [k, v] of agg((r) => r.published.slice(0, 7)).sort((a, b) => a[0].localeCompare(b[0])))
    console.log(
      `${k}  ${String(v.n).padStart(3)}개  총 ${v.views}  평균 ${Math.round(v.views / v.n)}`
    );

  const zero = rows.filter((r) => r.views === 0).length;
  const under10 = rows.filter((r) => r.views < 10).length;
  console.log(
    `\n조회수 0: ${zero}개 / 10 미만: ${under10}개 / 전체 ${rows.length}개 · 총 조회 ${rows.reduce((s, r) => s + r.views, 0)}`
  );
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e);
  process.exit(1);
});
