import { MonitoringDashboard } from '../components/monitoring/MonitoringDashboard';
import { useUIStore } from '../store/ui-store';

/**
 * Project-guarded entry point for /marketing/monitoring.
 * Mirrors the CompetitorsPage / IdeasPage guard pattern.
 */
export function MonitoringPage() {
  const selectedProjectId = useUIStore((s) => s.selectedProjectId);

  if (!selectedProjectId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground break-keep">
        프로젝트를 선택하세요
      </div>
    );
  }

  return <MonitoringDashboard projectId={selectedProjectId} />;
}
