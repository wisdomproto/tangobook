import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import type { GA4TrafficSource } from '../../types/analytics';

interface TrafficChartProps {
  data: GA4TrafficSource[];
}

/**
 * Traffic-by-source horizontal bar chart.
 * Port of CF traffic-chart.tsx — recharts 2.x vertical BarChart (layout="vertical").
 * Renders empty state when data is empty.
 */
export function TrafficChart({ data }: TrafficChartProps) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold break-keep">트래픽 소스</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
            데이터 없음
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold break-keep">트래픽 소스</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="channel" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="sessions" fill="#0F6E56" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
