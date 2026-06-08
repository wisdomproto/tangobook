import { IdeasDashboard } from '../components/ideas/IdeasDashboard';
import { useUIStore } from '../store/ui-store';

export function IdeasPage() {
  const selectedProjectId = useUIStore((s) => s.selectedProjectId);
  if (!selectedProjectId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        프로젝트를 선택하세요
      </div>
    );
  }
  return <IdeasDashboard projectId={selectedProjectId} />;
}
