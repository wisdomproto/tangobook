import { useUIStore } from '../store/ui-store';
import { ProjectSettings } from '../components/project/ProjectSettings';

export function SettingsPage() {
  const selectedProjectId = useUIStore((s) => s.selectedProjectId);

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-3">
        <p className="text-muted-foreground text-sm">
          좌측 사이드바에서 프로젝트를 선택하면 설정을 변경할 수 있습니다.
        </p>
      </div>
    );
  }

  return <ProjectSettings projectId={selectedProjectId} />;
}
