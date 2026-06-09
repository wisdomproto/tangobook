import { StrategyDashboard } from '../components/strategy/StrategyDashboard';
import { useUIStore } from '../store/ui-store';

/**
 * Project-guarded entry point for /marketing/strategy.
 * Mirrors the IdeasPage / CompetitorsPage guard pattern.
 */
export function StrategyPage() {
  const selectedProjectId = useUIStore((s) => s.selectedProjectId);

  if (!selectedProjectId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground break-keep">
        프로젝트를 선택하세요
      </div>
    );
  }

  return <StrategyDashboard projectId={selectedProjectId} />;
}
