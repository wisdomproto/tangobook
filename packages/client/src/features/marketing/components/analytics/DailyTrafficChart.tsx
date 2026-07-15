import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { cn } from '../../lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { GA4DailyRow } from '../../types/analytics';

const WEEKDAY_COLOR = '#0F6E56';
const WEEKEND_COLOR = '#BFDBFE';

const fmtInt = (n: number) => Math.round(n).toLocaleString();
const fmt1 = (n: number) => n.toFixed(1);
const fmtDuration = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const sumBy = (rows: GA4DailyRow[], f: (r: GA4DailyRow) => number) =>
  rows.reduce((a, r) => a + f(r), 0);

type MetricKey = 'pv' | 'users' | 'new' | 'returning' | 'pvPerUser' | 'dwell' | 'dwellPerPv';

interface MetricDef {
  key: MetricKey;
  label: string;
  /** 하루치 막대 값 */
  value: (r: GA4DailyRow) => number;
  /** 하단 합계/평균 */
  aggregate: (rows: GA4DailyRow[]) => number;
  /** 합계인가(총) 평균인가(평균) */
  isAverage: boolean;
  format: (n: number) => string;
}

const returning = (r: GA4DailyRow) => Math.max(0, r.users - r.newUsers);

const METRICS: MetricDef[] = [
  {
    key: 'pv',
    label: 'PV',
    value: (r) => r.pv,
    aggregate: (rs) => sumBy(rs, (r) => r.pv),
    isAverage: false,
    format: fmtInt,
  },
  {
    key: 'users',
    label: '사용자',
    value: (r) => r.users,
    aggregate: (rs) => sumBy(rs, (r) => r.users),
    isAverage: false,
    format: fmtInt,
  },
  {
    key: 'new',
    label: '신규',
    value: (r) => r.newUsers,
    aggregate: (rs) => sumBy(rs, (r) => r.newUsers),
    isAverage: false,
    format: fmtInt,
  },
  {
    key: 'returning',
    label: '재방문',
    value: returning,
    aggregate: (rs) => sumBy(rs, returning),
    isAverage: false,
    format: fmtInt,
  },
  {
    key: 'pvPerUser',
    label: 'PV/사용자',
    value: (r) => (r.users > 0 ? r.pv / r.users : 0),
    aggregate: (rs) => {
      const u = sumBy(rs, (r) => r.users);
      return u > 0 ? sumBy(rs, (r) => r.pv) / u : 0;
    },
    isAverage: true,
    format: fmt1,
  },
  {
    key: 'dwell',
    label: '체류시간',
    value: (r) => r.avgSessionSec,
    // 체류시간 = 평균(값 있는 날들의 평균)
    aggregate: (rs) => {
      const d = rs.filter((r) => r.avgSessionSec > 0);
      return d.length ? sumBy(d, (r) => r.avgSessionSec) / d.length : 0;
    },
    isAverage: true,
    format: fmtDuration,
  },
  {
    key: 'dwellPerPv',
    label: 'PV당 체류',
    value: (r) => (r.pv > 0 ? r.engagementSec / r.pv : 0),
    aggregate: (rs) => {
      const pv = sumBy(rs, (r) => r.pv);
      return pv > 0 ? sumBy(rs, (r) => r.engagementSec) / pv : 0;
    },
    isAverage: true,
    format: (n) => `${n.toFixed(1)}초`,
  },
];

function isWeekend(yyyymmdd: string): boolean {
  const y = +yyyymmdd.slice(0, 4);
  const m = +yyyymmdd.slice(4, 6);
  const d = +yyyymmdd.slice(6, 8);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 || day === 6;
}

interface DailyTrafficChartProps {
  data: GA4DailyRow[];
  isLoading?: boolean;
}

/**
 * 날짜별 트래픽 막대차트 — 지표 pills(PV·사용자·신규·재방문·PV/사용자·체류시간·PV당 체류) 전환,
 * 평일(초록)/주말(하늘) 색 구분, 하단 합계(체류시간·비율 지표는 평균).
 */
export function DailyTrafficChart({ data, isLoading }: DailyTrafficChartProps) {
  const [metric, setMetric] = useState<MetricKey>('pv');
  const def = METRICS.find((m) => m.key === metric) ?? METRICS[0];

  const chartData = data.map((r) => ({
    label: `${r.date.slice(4, 6)}/${r.date.slice(6, 8)}`,
    value: def.value(r),
    weekend: isWeekend(r.date),
  }));
  const total = data.length ? def.aggregate(data) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold break-keep">📈 날짜별 트래픽</CardTitle>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors break-keep',
                metric === m.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[240px] animate-pulse rounded-lg bg-muted" />
        ) : !data.length ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground break-keep">
            아직 데이터가 없어요
          </div>
        ) : (
          <>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
                  <Tooltip formatter={(v: number) => [def.format(v), def.label]} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.weekend ? WEEKEND_COLOR : WEEKDAY_COLOR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between pt-2 text-xs">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <i
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: WEEKDAY_COLOR }}
                  />{' '}
                  평일
                </span>
                <span className="flex items-center gap-1">
                  <i
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: WEEKEND_COLOR }}
                  />{' '}
                  주말
                </span>
              </div>
              <span className="font-black text-foreground">
                {def.isAverage ? '평균' : '총'} {def.format(total)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
