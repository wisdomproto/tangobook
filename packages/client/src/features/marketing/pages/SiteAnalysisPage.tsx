import { SiteAnalysisDashboard } from '../components/analytics/SiteAnalysisDashboard';
import { useUIStore } from '../store/ui-store';

/**
 * Project-guarded entry point for /marketing/site-analysis.
 * Mirrors the IdeasPage / PublishPage guard pattern:
 * no selected project → "프로젝트를 선택하세요".
 */
export function SiteAnalysisPage() {
  const selectedProjectId = useUIStore((s) => s.selectedProjectId);

  if (!selectedProjectId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground break-keep">
        프로젝트를 선택하세요
      </div>
    );
  }

  return <SiteAnalysisDashboard projectId={selectedProjectId} />;
}
