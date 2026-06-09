import type { GA4ContentRow } from '../../types/analytics';

interface ContentPerformanceProps {
  data: GA4ContentRow[];
}

/** Format seconds → "m:ss" (e.g. 125 → "2:05"). */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Per-page sessions contribution list (path / sessions / avgDuration / bounceRate).
 * Port of CF content-performance.tsx — typed with GA4ContentRow, top-10 entries.
 * Shows avgDuration and bounceRate in addition to CF's sessions-only view.
 */
export function ContentPerformance({ data }: ContentPerformanceProps) {
  if (!data.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 break-keep">콘텐츠별 유입 기여</h3>
        <p className="text-sm text-muted-foreground">데이터 없음</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3 break-keep">콘텐츠별 유입 기여</h3>
      <div className="space-y-2">
        {data.slice(0, 10).map((row, i) => (
          <div key={row.path} className="flex items-start gap-3 text-sm">
            <span className="text-muted-foreground w-5 text-right mt-0.5 flex-shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="truncate text-xs font-medium">{row.path}</div>
              <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                <span className="text-emerald-500 break-keep">
                  {row.sessions.toLocaleString()} 세션
                </span>
                <span className="break-keep">체류 {formatDuration(row.avgDuration)}</span>
                <span className="break-keep">이탈 {(row.bounceRate * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
