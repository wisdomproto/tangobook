import type { GA4TrafficSource } from '../../types/analytics';

interface BreakdownCardProps {
  title: string;
  data: GA4TrafficSource[];
  isLoading?: boolean;
  emptyText?: string;
  /** 라벨 치환 맵 (예: 언어코드 ko→한국어). 없으면 원본 채널값 표시. */
  labelMap?: Record<string, string>;
}

/**
 * 세션 분포 리스트 카드 (유입 소스·언어 등 공용). `GA4TrafficSource[]`(channel/sessions/percentage)를
 * 세션 내림차순 막대 + 퍼센트로 렌더. 데이터 없으면 빈 상태 문구.
 */
export function BreakdownCard({ title, data, isLoading, emptyText, labelMap }: BreakdownCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-black mb-3 break-keep">{title}</h3>
      {isLoading ? (
        <div className="h-24 animate-pulse bg-muted rounded-lg" />
      ) : data.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground break-keep">
          {emptyText ?? '아직 데이터가 없어요'}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {data.map((row, i) => (
            <li key={`${row.channel}-${i}`}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-semibold text-foreground" title={row.channel}>
                  {labelMap?.[row.channel] ?? row.channel}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {row.sessions.toLocaleString()} · {row.percentage}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${row.percentage}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
