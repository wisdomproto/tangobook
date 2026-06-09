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
} from '../../api/use-analytics';
import { OverviewCards } from './OverviewCards';
import { PageviewsChart } from './PageviewsChart';
import { TrafficChart } from './TrafficChart';
import { TopPagesTable } from './TopPagesTable';
import { CountryTraffic } from './CountryTraffic';
import { ContentPerformance } from './ContentPerformance';
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
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');

  const ga4Config = (project?.ga4_config ?? null) as GA4Config | null;
  const funnelConfig = (project?.funnel_config ?? null) as FunnelConfig | null;
  const hasGa4 = !!ga4Config?.propertyId;

  const enabled = hasGa4 && !!projectId;

  const overview = useGa4Overview(projectId, period, enabled);
  const traffic = useGa4Traffic(projectId, period, enabled);
  const topPages = useGa4TopPages(projectId, period, enabled);
  const country = useGa4Country(projectId, period, enabled);
  const content = useGa4Content(projectId, period, enabled);

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
            <button
              className={`px-3 py-1.5 text-xs font-semibold transition-colors break-keep ${
                period === '7d' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              onClick={() => setPeriod('7d')}
            >
              7일
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-semibold transition-colors break-keep ${
                period === '30d' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              onClick={() => setPeriod('30d')}
            >
              30일
            </button>
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
