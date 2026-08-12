import { useState } from 'react';
import { useYoutubeOwnAnalytics, useConnectedYoutubeChannels } from '../../api/use-analytics';

/** 초 → "0:51" */
function mmss(sec: number): string {
  const s = Math.round(sec || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Analytics API 의 트래픽소스 enum → 한국어 */
const TRAFFIC_LABEL: Record<string, string> = {
  SHORTS: '쇼츠 피드',
  RELATED_VIDEO: '추천 동영상',
  YT_SEARCH: 'YouTube 검색',
  SUBSCRIBER: '구독 피드',
  YT_CHANNEL: '채널 페이지',
  PLAYLIST: '재생목록',
  NO_LINK_OTHER: '직접 입력·기타',
  YT_OTHER_PAGE: '기타 YouTube',
  EXT_URL: '외부 링크',
  HASHTAGS: '해시태그',
  NOTIFICATION: '알림',
  PROMOTED: '광고',
};

const PERIODS = [
  { label: '7일', days: 7 },
  { label: '28일', days: 28 },
  { label: '90일', days: 90 },
];

interface Props {
  /** 연동된 채널 표시명. 미지정이면 첫 번째 채널 */
  channelName?: string;
}

/**
 * 우리 채널의 시청지속률·트래픽소스.
 * 🔴 노출수·CTR 은 Analytics API 에 없다(Studio 전용) — 그 사실을 화면에 명시해서
 *    "값이 비었다"를 데이터 없음으로 오해하지 않게 한다.
 */
export function YoutubeOwnPanel({ channelName }: Props) {
  const [days, setDays] = useState(28);
  const [picked, setPicked] = useState<string | undefined>(channelName);
  const { data: channels = [] } = useConnectedYoutubeChannels();

  // 미지정이면 연동 목록의 첫 채널. 목록이 오기 전에는 서버 기본값(첫 채널)을 그대로 쓴다.
  const active = picked ?? channels[0]?.channelTitle ?? channels[0]?.name;
  const { data, isLoading, error } = useYoutubeOwnAnalytics(active, days);

  // 🔴 선택기는 조기 return 위에 둔다 — 스코프·연동 문제로 데이터가 없을 때야말로
  //    다른 채널로 바꿔봐야 하는데, 아래에 두면 그 화면에서 선택기가 사라진다.
  const picker =
    channels.length > 1 ? (
      <div className="flex gap-1 flex-wrap">
        {channels.map((c) => {
          const name = c.channelTitle ?? c.name ?? '';
          return (
            <button
              key={c.id}
              onClick={() => setPicked(name)}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                name === active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:bg-accent'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    ) : null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {picker}
        <div className="text-center py-12 text-muted-foreground text-sm">
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block mb-2" />
          <p>내 채널 분석 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {picker}
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive break-keep">
          오류: {error instanceof Error ? error.message : '알 수 없는 오류'}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        {picker}
        <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground break-keep">
          YouTube 연동이 필요합니다.
        </div>
      </div>
    );
  }

  if (!data.available) {
    return (
      <div className="space-y-4">
        {picker}
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="text-sm font-medium break-keep">지속률 데이터를 볼 수 없습니다</div>
          <p className="text-sm text-muted-foreground break-keep">{data.reason}</p>
          {data.actionUrl && (
            <a
              href={data.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-primary underline break-all"
            >
              GCP 콘솔에서 활성화하기
            </a>
          )}
        </div>
      </div>
    );
  }

  const { totals, traffic, videos, formats, period } = data;
  const totalTrafficViews = traffic.reduce((s, t) => s + t.views, 0) || 1;
  const totalTrafficMinutes = traffic.reduce((s, t) => s + t.minutes, 0) || 1;

  return (
    <div className="space-y-4">
      {picker}
      {/* 기간 선택 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold break-keep">{data.channel.title}</span>
        <span className="text-xs text-muted-foreground">
          {period.startDate} ~ {period.endDate}
        </span>
        <div className="ml-auto flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={
                'px-3 min-h-[36px] rounded-md text-sm transition-colors ' +
                (days === p.days
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border hover:bg-accent')
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 합계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '조회수', value: totals.views.toLocaleString() },
          { label: '시청 시간', value: `${Math.round(totals.minutes).toLocaleString()}분` },
          {
            label: '평균 시청 지속',
            value: `${mmss(totals.avgViewDuration)} (${totals.avgViewPercentage.toFixed(1)}%)`,
          },
          { label: '구독 증가', value: `+${totals.subscribersGained}` },
        ].map((m) => (
          <div key={m.label} className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-xl font-bold break-keep">{m.value}</div>
            <div className="text-xs text-muted-foreground mt-1 break-keep">{m.label}</div>
          </div>
        ))}
      </div>

      {/* 포맷별 — 롱폼이 사람을 붙잡는가 */}
      {formats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {formats.map((f) => (
            <div key={f.label} className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm font-semibold break-keep">
                {f.label === 'longform' ? '롱폼' : '쇼츠'} · {f.count}편
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {f.weightedAvgViewPercentage.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground break-keep">
                  가중 지속률 · {mmss(f.weightedAvgViewDuration)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                조회 {f.views.toLocaleString()}
              </div>
            </div>
          ))}
          <p className="sm:col-span-2 text-xs text-muted-foreground break-keep">
            조회수로 가중한 평균입니다 — 조회 10회짜리 영상의 60%가 전체 결론을 흔들지 않게 합니다.
          </p>
        </div>
      )}

      {/* 트래픽 소스 — 조회수와 시청시간을 나란히 보여준다(쇼츠는 조회만 크고 시청시간이 없다) */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-semibold text-sm break-keep">
          트래픽 소스 — 조회수 vs 시청시간
        </div>
        <div className="divide-y divide-border">
          {traffic.map((t) => {
            const viewPct = (t.views / totalTrafficViews) * 100;
            const minPct = (t.minutes / totalTrafficMinutes) * 100;
            return (
              <div key={t.source} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                <div className="w-28 shrink-0 break-keep">
                  {TRAFFIC_LABEL[t.source] ?? t.source}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${viewPct}%` }} />
                    </div>
                    <span className="w-24 text-xs text-right shrink-0 tabular-nums">
                      조회 {t.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/40" style={{ width: `${minPct}%` }} />
                    </div>
                    <span className="w-24 text-xs text-right shrink-0 tabular-nums text-muted-foreground">
                      {Math.round(t.minutes).toLocaleString()}분
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 영상별 */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-semibold text-sm break-keep">
          영상별 지속률 ({videos.length}편)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="text-xs text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left px-4 py-2 font-medium">제목</th>
                <th className="text-right px-2 py-2 font-medium">조회</th>
                <th className="text-right px-2 py-2 font-medium">평균지속</th>
                <th className="text-right px-2 py-2 font-medium">지속률</th>
                <th className="text-right px-4 py-2 font-medium">구독</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {videos.map((v) => (
                <tr key={v.id} className="hover:bg-accent transition-colors">
                  <td className="px-4 py-2 max-w-[320px]">
                    <a
                      href={`https://www.youtube.com/watch?v=${v.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-1 hover:underline break-keep"
                    >
                      <span className="text-xs text-muted-foreground mr-1">
                        {v.isShort ? '쇼츠' : '롱폼'}
                      </span>
                      {v.title}
                    </a>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{v.views.toLocaleString()}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{mmss(v.avgViewDuration)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {v.avgViewPercentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {v.subscribersGained ? `+${v.subscribersGained}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground break-keep">
        🔴 노출수·클릭률(CTR)은 YouTube Analytics API 가 제공하지 않습니다(Studio 전용). 그 두 값은
        YouTube Studio → 채널 분석 → 도달범위에서 확인하세요.
      </p>
    </div>
  );
}
