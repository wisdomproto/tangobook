import { MetaAnalyticsDashboard } from '../components/analytics/MetaAnalyticsDashboard';
import { useUIStore } from '../store/ui-store';

/**
 * Project-guarded entry point for /marketing/meta-analytics.
 * Mirrors the SiteAnalysisPage / IdeasPage guard pattern.
 */
export function MetaAnalyticsPage() {
  const selectedProjectId = useUIStore((s) => s.selectedProjectId);

  if (!selectedProjectId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground break-keep">
        프로젝트를 선택하세요
      </div>
    );
  }

  return <MetaAnalyticsDashboard projectId={selectedProjectId} />;
}
