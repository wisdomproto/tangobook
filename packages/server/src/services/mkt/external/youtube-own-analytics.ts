// 우리 채널의 YouTube **Analytics** API (OAuth, `yt-analytics.readonly`).
//
// `youtube-data.ts` 는 API 키로 공개 통계(조회수)만 본다 — 그것만으로는 "노출을 못 받나"와
// "영상이 지루한가"를 구분할 수 없어 진단에 추측이 섞였다. 이 모듈이 그 구분(시청지속률·
// 트래픽소스)을 준다. 🔴 노출수·CTR 은 Analytics API 에 없다(Studio 전용, `Unknown identifier
// (impressions)` 로 확인). 그 둘은 Studio 화면으로만 확인 가능.
import { google } from 'googleapis';
import { YouTubeProvider } from '../../../providers/youtube.provider.js';

export interface OwnVideoRow {
  id: string;
  title: string;
  seconds: number;
  isShort: boolean;
  views: number;
  avgViewDuration: number;
  avgViewPercentage: number;
  minutes: number;
  subscribersGained: number;
}

export interface FormatSummary {
  label: 'longform' | 'shorts';
  count: number;
  views: number;
  /** 조회수 가중 평균 — 단순 평균은 조회 1회 영상이 결과를 흔든다 */
  weightedAvgViewDuration: number;
  weightedAvgViewPercentage: number;
}

export interface OwnChannelAnalytics {
  available: true;
  channel: { id: string; title: string; channelId: string };
  period: { startDate: string; endDate: string };
  totals: {
    views: number;
    minutes: number;
    avgViewDuration: number;
    avgViewPercentage: number;
    subscribersGained: number;
  };
  traffic: { source: string; views: number; minutes: number }[];
  videos: OwnVideoRow[];
  formats: FormatSummary[];
  /** 노출수·CTR 은 API 미제공 — UI 가 이 사실을 표시해 "빠진 값"을 오해하지 않게 한다 */
  impressionsAvailable: false;
}

export interface OwnChannelAnalyticsUnavailable {
  available: false;
  /** 사용자에게 그대로 보여줄 한국어 사유 */
  reason: string;
  /** 조치 링크(GCP API 활성화 등) */
  actionUrl?: string;
}

/** ISO8601 duration → 초 */
function parseDuration(iso: string): number {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '');
  return m ? Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0) : 0;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 조회수 가중 요약 (PURE) */
export function summarizeFormats(videos: OwnVideoRow[]): FormatSummary[] {
  const out: FormatSummary[] = [];
  for (const label of ['longform', 'shorts'] as const) {
    const g = videos.filter((v) => (label === 'shorts' ? v.isShort : !v.isShort));
    if (!g.length) continue;
    const views = g.reduce((s, v) => s + v.views, 0);
    const w = views || 1;
    out.push({
      label,
      count: g.length,
      views,
      weightedAvgViewDuration: g.reduce((s, v) => s + v.avgViewDuration * v.views, 0) / w,
      weightedAvgViewPercentage: g.reduce((s, v) => s + v.avgViewPercentage * v.views, 0) / w,
    });
  }
  return out;
}

/** 구글 에러 → 사용자가 조치할 수 있는 한국어 사유 */
function explain(err: unknown): OwnChannelAnalyticsUnavailable {
  const msg = err instanceof Error ? err.message : String(err);
  if (/has not been used in project|is disabled/i.test(msg)) {
    const project = /project (\d+)/.exec(msg)?.[1];
    return {
      available: false,
      reason:
        'GCP 프로젝트에서 YouTube Analytics API 가 꺼져 있습니다. 활성화 후 몇 분 뒤 다시 시도하세요.',
      actionUrl: project
        ? `https://console.developers.google.com/apis/api/youtubeanalytics.googleapis.com/overview?project=${project}`
        : undefined,
    };
  }
  if (/insufficient|scope|forbidden|403/i.test(msg)) {
    return {
      available: false,
      reason:
        'yt-analytics.readonly 스코프가 없는 채널입니다. 채널을 재연동해야 지속률·트래픽소스를 볼 수 있습니다.',
    };
  }
  return { available: false, reason: msg.slice(0, 200) };
}

/**
 * 우리 채널의 지속률·트래픽소스를 뽑는다.
 * 실패는 throw 하지 않고 `available:false` + 한국어 사유로 돌려준다(대시보드가 통째로 죽지 않게).
 */
export async function getOwnChannelAnalytics(opts: {
  channelName?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  top?: number;
}): Promise<OwnChannelAnalytics | OwnChannelAnalyticsUnavailable> {
  const days = opts.days ?? 28;
  const endDate = opts.endDate || ymd(new Date(Date.now() - 86400000));
  const startDate =
    opts.startDate || ymd(new Date(new Date(endDate).getTime() - (days - 1) * 86400000));
  const top = opts.top ?? 30;

  try {
    const channels = await YouTubeProvider.listChannels();
    if (!channels.length) return { available: false, reason: '연결된 YouTube 채널이 없습니다.' };
    const target = opts.channelName
      ? channels.find((c) => c.channelTitle === opts.channelName || c.name === opts.channelName)
      : channels[0];
    // 이름 불일치와 "연동 없음"을 구분한다 — 같은 메시지면 인코딩 사고를 연동 문제로 오진한다.
    if (!target)
      return {
        available: false,
        reason: `"${opts.channelName}" 채널을 찾을 수 없습니다. 연동된 채널: ${channels
          .map((c) => c.channelTitle ?? c.name)
          .join(', ')}`,
      };
    if (!target.channelId)
      return {
        available: false,
        reason: '채널 ID 가 저장되어 있지 않습니다. 재연동이 필요합니다.',
      };

    const auth = await YouTubeProvider.getOAuthClient(target.id);
    const ytA = google.youtubeAnalytics({ version: 'v2', auth });
    const yt = google.youtube({ version: 'v3', auth });
    const ids = `channel==${target.channelId}`;

    const [totalsRes, trafficRes, perVideoRes] = await Promise.all([
      ytA.reports.query({
        ids,
        startDate,
        endDate,
        metrics:
          'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained',
      }),
      ytA.reports.query({
        ids,
        startDate,
        endDate,
        dimensions: 'insightTrafficSourceType',
        metrics: 'views,estimatedMinutesWatched',
        sort: '-views',
      }),
      ytA.reports.query({
        ids,
        startDate,
        endDate,
        dimensions: 'video',
        metrics:
          'views,averageViewDuration,averageViewPercentage,estimatedMinutesWatched,subscribersGained',
        sort: '-views',
        maxResults: top,
      }),
    ]);

    const [views = 0, minutes = 0, avd = 0, avp = 0, subs = 0] = (totalsRes.data.rows?.[0] ??
      []) as number[];

    const rows = (perVideoRes.data.rows ?? []) as [
      string,
      number,
      number,
      number,
      number,
      number,
    ][];

    // 제목·길이는 Data API 에서 (Analytics 는 videoId 만 준다)
    const meta = new Map<string, { title: string; seconds: number }>();
    for (let i = 0; i < rows.length; i += 50) {
      const chunk = rows.slice(i, i + 50).map((r) => r[0]);
      const res = await yt.videos.list({ part: ['snippet', 'contentDetails'], id: chunk });
      for (const v of res.data.items ?? []) {
        if (!v.id) continue;
        meta.set(v.id, {
          title: v.snippet?.title ?? '',
          seconds: parseDuration(v.contentDetails?.duration ?? ''),
        });
      }
    }

    const videos: OwnVideoRow[] = rows.map(([id, vw, d, p, min, sg]) => {
      const m = meta.get(id);
      const seconds = m?.seconds ?? 0;
      return {
        id,
        title: m?.title ?? id,
        seconds,
        isShort: seconds > 0 && seconds <= 60,
        views: vw,
        avgViewDuration: d,
        avgViewPercentage: p,
        minutes: min,
        subscribersGained: sg,
      };
    });

    return {
      available: true,
      channel: {
        id: target.id,
        title: target.channelTitle ?? target.name,
        channelId: target.channelId,
      },
      period: { startDate, endDate },
      totals: {
        views,
        minutes,
        avgViewDuration: avd,
        avgViewPercentage: avp,
        subscribersGained: subs,
      },
      traffic: ((trafficRes.data.rows ?? []) as [string, number, number][]).map(
        ([source, v, min]) => ({ source: String(source), views: v, minutes: min })
      ),
      videos,
      formats: summarizeFormats(videos),
      impressionsAvailable: false,
    };
  } catch (err) {
    return explain(err);
  }
}
