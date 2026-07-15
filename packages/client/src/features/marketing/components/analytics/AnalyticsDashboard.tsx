import { useState } from 'react';
import { RefreshCw, Settings } from 'lucide-react';
import { Button } from '../../ui/button';
import { useProject } from '../../api/use-projects';
import { useQueryClient } from '@tanstack/react-query';
import { mktKeys } from '../../api/queries';
import {
  useGa4Overview,
  useGa4Traffic,
  useGa4TopPages,
  useGa4Country,
  useGa4Content,
  useGa4Source,
  useGa4Language,
  useGa4NewReturning,
  useGa4Membership,
} from '../../api/use-analytics';
import { OverviewCards } from './OverviewCards';
import { PageviewsChart } from './PageviewsChart';
import { TrafficChart } from './TrafficChart';
import { TopPagesTable } from './TopPagesTable';
import { CountryTraffic } from './CountryTraffic';
import { ContentPerformance } from './ContentPerformance';
import { BreakdownCard } from './BreakdownCard';

// 앱 UI 언어코드 → 표시 라벨 (customUser:app_language 값 = i18n.language).
const LANG_LABELS: Record<string, string> = {
  ko: '🇰🇷 한국어',
  en: '🇺🇸 English',
  vi: '🇻🇳 Tiếng Việt',
  zh: '🇨🇳 中文',
  th: '🇹🇭 ภาษาไทย',
};
// GA4 newVsReturning 값 → 라벨
const NEWRET_LABELS: Record<string, string> = { new: '🆕 신규', returning: '🔁 재방문' };
// 커스텀 membership 값 → 라벨
const MEMBER_LABELS: Record<string, string> = { member: '👤 회원', guest: '🚶 비회원' };
import type { GA4Config, FunnelConfig } from '../../types/analytics';

interface AnalyticsDashboardProps {
  projectId: string;
}

/**
 * GA4 analytics page: period toggle + refresh + graceful GA4-not-configured empty state
 * + 6 data panels wired to server-proxy TanStack hooks.
 * Port of CF analytics/analytics-dashboard.tsx — adapted to the worktree's server-proxy
 * data layer (hooks fire via Express /api/mkt/analytics/*; only projectId is sent).
 */
export function AnalyticsDashboard({ projectId }: AnalyticsDashboardProps) {
  const { data: project } = useProject(projectId);
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<'today' | 'yesterday' | '7d' | '30d'>('today');

  const ga4Config = (project?.ga4_config ?? null) as GA4Config | null;
  const funnelConfig = (project?.funnel_config ?? null) as FunnelConfig | null;
  const hasGa4 = !!ga4Config?.propertyId;

  const enabled = hasGa4 && !!projectId;

  const overview = useGa4Overview(projectId, period, enabled);
  const traffic = useGa4Traffic(projectId, period, enabled);
  const topPages = useGa4TopPages(projectId, period, enabled);
  const country = useGa4Country(projectId, period, enabled);
  const content = useGa4Content(projectId, period, enabled);
  const source = useGa4Source(projectId, period, enabled);
  const language = useGa4Language(projectId, period, enabled);
  const newReturning = useGa4NewReturning(projectId, period, enabled);
  const membership = useGa4Membership(projectId, period, enabled);

  // Surface first error as a banner (GA4 quota / 429 → banner, not crash)
  const firstError =
    overview.error ?? traffic.error ?? topPages.error ?? country.error ?? content.error;

  function handleRefresh() {
    void queryClient.invalidateQueries({
      predicate: (q) => {
        const key = q.queryKey as string[];
        return (
          Array.isArray(key) &&
          key[0] === 'mkt' &&
          key[1] === 'analytics' &&
          key[2] !== 'meta' &&
          key[2] !== 'yt-channel'
        );
      },
    });
  }

  // ── GA4 not configured: empty state ────────────────────────────────────────
  if (!hasGa4) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <Settings size={48} className="text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-black mb-2 break-keep">GA4 연동이 필요합니다</h3>
        <p className="text-sm text-muted-foreground break-keep">
          프로젝트 설정 &gt; 퍼널·분석에서 Google Analytics 4를 연결하세요
        </p>
      </div>
    );
  }

  const isLoading = overview.isLoading || traffic.isLoading;

  return (
    <div className="space-y-4">
      {/* Header: title + period toggle + refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight break-keep">GA4 사이트 분석</h2>
          {funnelConfig?.websiteUrl && (
            <p className="text-xs text-muted-foreground">{funnelConfig.websiteUrl}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            {(
              [
                ['today', '오늘'],
                ['yesterday', '어제'],
                ['7d', '7일'],
                ['30d', '30일'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors break-keep ${
                  period === val ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
                onClick={() => setPeriod(val)}
              >
                {label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {firstError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 break-keep">
          {(firstError as Error).message}
        </div>
      )}

      {/* Data panels (render when overview is available) */}
      {overview.data && (
        <>
          <OverviewCards data={overview.data} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PageviewsChart data={overview.data.dailyPageviews} />
            <TrafficChart data={traffic.data ?? []} />
          </div>
          {/* 사용자 구분 — 신규/재방문 + 회원/비회원 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BreakdownCard
              title="신규 vs 재방문 (사용자)"
              data={newReturning.data ?? []}
              isLoading={newReturning.isLoading}
              labelMap={NEWRET_LABELS}
              emptyText="아직 방문 데이터가 없어요"
            />
            <BreakdownCard
              title="회원 vs 비회원 (사용자)"
              data={membership.data ?? []}
              isLoading={membership.isLoading}
              labelMap={MEMBER_LABELS}
              emptyText="회원/비회원 데이터 없음 — GA4에 커스텀 측정기준 'membership' 등록 + 방문 누적 후 표시"
            />
          </div>
          {/* 유입 소스(메타/구글/직접 등) + 앱 UI 언어별 분포 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BreakdownCard
              title="유입 소스 (소스/매체)"
              data={source.data ?? []}
              isLoading={source.isLoading}
              emptyText="아직 유입 데이터가 없어요 (광고/트래픽 유입 시 facebook·google 등으로 표시)"
            />
            <BreakdownCard
              title="언어별 (앱에서 고른 언어)"
              data={language.data ?? []}
              isLoading={language.isLoading}
              labelMap={LANG_LABELS}
              emptyText="언어별 데이터 없음 — GA4에 커스텀 측정기준 'app_language' 등록 + 방문 누적 후 표시"
            />
          </div>
          <TopPagesTable
            pages={topPages.data ?? []}
            websiteUrl={funnelConfig?.websiteUrl ?? undefined}
          />
          <div className="grid grid-cols-2 gap-4 mt-6">
            <ContentPerformance data={content.data ?? []} />
            <CountryTraffic data={country.data ?? []} />
          </div>
        </>
      )}

      {/* Loading skeleton: overview not yet loaded but GA4 is configured */}
      {!overview.data && !firstError && isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="h-[200px] bg-muted rounded-xl" />
        </div>
      )}
    </div>
  );
}
