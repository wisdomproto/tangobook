import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useYoutubeChannel } from '../../api/use-analytics';

function formatNumber(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return n.toLocaleString();
  return String(n);
}

interface Props {
  projectId: string;
}

export function YoutubeChannelPanel({ projectId }: Props) {
  const [input, setInput] = useState('');
  const mutation = useYoutubeChannel(projectId);
  const { data, isPending, error } = mutation;

  function handleAnalyze() {
    if (!input.trim()) return;
    mutation.mutate(input.trim());
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="YouTube 채널 URL 또는 채널 이름"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary break-keep"
        />
        <button
          onClick={handleAnalyze}
          disabled={isPending}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {isPending ? '분석 중...' : '채널 분석'}
        </button>
      </div>

      {isPending && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block mb-2" />
          <p>YouTube 채널 분석 중...</p>
        </div>
      )}

      {error && !isPending && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
          오류: {error instanceof Error ? error.message : '알 수 없는 오류'}
        </div>
      )}

      {data && !isPending && (
        <>
          {/* Channel info card */}
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            {data.channel.thumbnail && (
              <img
                src={data.channel.thumbnail}
                alt={data.channel.title}
                className="w-16 h-16 rounded-full shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold break-keep">{data.channel.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2 break-keep">
                {data.channel.description?.substring(0, 120)}
              </div>
            </div>
            <div className="ml-auto text-right shrink-0">
              <div className="text-sm font-bold">
                {formatNumber(data.channel.subscribers)} 구독자
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {formatNumber(data.channel.videoCount)} 동영상 ·{' '}
                {formatNumber(data.channel.viewCount)} 조회
              </div>
            </div>
          </div>

          {/* Overview stat cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: '구독자', value: data.channel.subscribers },
              { label: '총 조회수', value: data.channel.viewCount },
              { label: '동영상', value: data.channel.videoCount },
              { label: '평균 조회수', value: data.channel.avgViews },
            ].map((m) => (
              <div
                key={m.label}
                className="bg-card border border-border rounded-lg p-4 text-center"
              >
                <div className="text-2xl font-bold">{formatNumber(m.value)}</div>
                <div className="text-xs text-muted-foreground mt-1 break-keep">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Recent videos */}
          {data.videos.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border font-semibold text-sm">
                최근 동영상 ({data.videos.length}개)
              </div>
              <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
                {data.videos.map((v) => (
                  <a
                    key={v.id}
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 p-3 hover:bg-accent transition-colors"
                  >
                    {v.thumbnail && (
                      <img
                        src={v.thumbnail}
                        alt={v.title}
                        className="w-28 h-16 object-cover rounded shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm line-clamp-2 font-medium break-keep">{v.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex gap-3 flex-wrap">
                        <span>👁️ {formatNumber(v.views)}</span>
                        <span>❤️ {formatNumber(v.likes)}</span>
                        <span>💬 {formatNumber(v.comments)}</span>
                        <span>{v.publishedAt}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!data && !isPending && !error && (
        <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-lg">
          <p className="text-4xl mb-4">🎬</p>
          <p className="text-sm font-medium break-keep">YouTube 채널 URL 또는 이름을 입력하세요</p>
          <p className="text-xs mt-1 opacity-70 break-keep">
            구독자, 조회수, 최근 영상 성과를 분석합니다
          </p>
        </div>
      )}
    </div>
  );
}

export { cn };
