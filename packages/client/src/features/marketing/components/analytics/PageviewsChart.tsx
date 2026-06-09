import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface PageviewsChartProps {
  data: { date: string; views: number }[];
}

/**
 * Daily pageviews time-series line chart.
 * Port of CF pageviews-chart.tsx — recharts 2.x API (no 'use client').
 * GA4 date format is YYYYMMDD → formatted as MM/DD for X-axis.
 */
export function PageviewsChart({ data }: PageviewsChartProps) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold break-keep">일별 페이지뷰</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
            데이터 없음
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: `${d.date.slice(4, 6)}/${d.date.slice(6, 8)}`,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold break-keep">일별 페이지뷰</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#0F6E56" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
