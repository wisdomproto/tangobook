import { AdsDashboard } from '../components/ads/AdsDashboard';
import { useUIStore } from '../store/ui-store';

/**
 * Project-guarded entry point for /marketing/ads.
 * Mirrors the CompetitorsPage / SiteAnalysisPage guard pattern.
 */
export function AdsPage() {
  const selectedProjectId = useUIStore((s) => s.selectedProjectId);

  if (!selectedProjectId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground break-keep">
        프로젝트를 선택하세요
      </div>
    );
  }

  return <AdsDashboard projectId={selectedProjectId} />;
}
