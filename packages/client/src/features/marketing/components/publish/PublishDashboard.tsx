import { ChannelCards } from './ChannelCards';
import { PublishQueue } from './PublishQueue';
import { NaverCopySection } from './NaverCopySection';
import { Button } from '../../ui/button';
import { useProject } from '../../api/use-projects';

interface Props {
  projectId: string;
}

export function PublishDashboard({ projectId }: Props) {
  const { data: project } = useProject(projectId);

  if (!project) {
    return <div className="p-6 text-sm text-muted-foreground">프로젝트를 불러오는 중...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold break-keep">발행 관리</h2>
          <p className="text-xs text-muted-foreground mt-0.5 break-keep">
            연결된 채널과 발행 기록을 관리합니다
          </p>
        </div>
        {/* Display-only button — faithful port of CF, no handler */}
        <Button size="sm">+ 채널 연결</Button>
      </div>

      <ChannelCards project={project} />

      <PublishQueue projectId={project.id} />

      <NaverCopySection />
    </div>
  );
}
