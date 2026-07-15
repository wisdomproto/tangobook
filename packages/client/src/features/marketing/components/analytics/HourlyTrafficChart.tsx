import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, Tooltip } from 'recharts';
import type { GA4HourRow } from '../../types/analytics';

const BAR_COLOR = '#86EFAC'; // green-300 (일반 시간)
const PEAK_COLOR = '#0F6E56'; // 피크 시간 강조

interface HourlyTrafficChartProps {
  data: GA4HourRow[];
  isLoading?: boolean;
}

/**
 * 시간대별 세션 막대차트 — 0~23시 전부 채워 표시, 피크 시간 강조 + 하단 "피크: N시 (M세션)".
 */
export function HourlyTrafficChart({ data, isLoading }: HourlyTrafficChartProps) {
  // 0~23 채우기 (데이터 없는 시간 = 0).
  const byHour = new Map(data.map((r) => [r.hour, r.sessions]));
  const rows = Array.from({ length: 24 }, (_, h) => ({ hour: h, sessions: byHour.get(h) ?? 0 }));
  const peak = rows.reduce((a, b) => (b.sessions > a.sessions ? b : a), rows[0]);
  const hasData = rows.some((r) => r.sessions > 0);

  const chartData = rows.map((r) => ({
    hour: r.hour,
    label: r.hour % 6 === 0 ? `${r.hour}시` : '',
    sessions: r.sessions,
    isPeak: hasData && r.hour === peak.hour,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold break-keep">⏰ 시간대별 트래픽</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[160px] animate-pulse rounded-lg bg-muted" />
        ) : !hasData ? (
          <div className="flex h-[160px] items-center justify-center text-sm text-muted-foreground break-keep">
            아직 데이터가 없어요
          </div>
        ) : (
          <>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap={2}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v.toLocaleString()}세션`, '세션']}
                    labelFormatter={(_, p) => {
                      const h = (p?.[0]?.payload as { hour?: number })?.hour;
                      return typeof h === 'number' ? `${h}시` : '';
                    }}
                  />
                  <Bar dataKey="sessions" radius={[3, 3, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.isPeak ? PEAK_COLOR : BAR_COLOR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="pt-2 text-center text-xs font-semibold text-muted-foreground break-keep">
              피크: {peak.hour}~{peak.hour + 1}시 ({peak.sessions.toLocaleString()}세션)
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
