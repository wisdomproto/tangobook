import { CompetitorsDashboard } from '../components/competitors/CompetitorsDashboard';
import { useUIStore } from '../store/ui-store';

/**
 * Project-guarded entry point for /marketing/competitors.
 * Mirrors the SiteAnalysisPage / MetaAnalyticsPage guard pattern.
 */
export function CompetitorsPage() {
  const selectedProjectId = useUIStore((s) => s.selectedProjectId);

  if (!selectedProjectId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground break-keep">
        프로젝트를 선택하세요
      </div>
    );
  }

  return <CompetitorsDashboard projectId={selectedProjectId} />;
}
