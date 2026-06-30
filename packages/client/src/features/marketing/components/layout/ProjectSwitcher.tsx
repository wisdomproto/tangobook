import type { Project } from '../../types/database';

interface ProjectSwitcherProps {
  projects: Project[];
  selectedProjectId: string | null;
}

/**
 * 고정 프로젝트(탱고북 동화책) 정적 표시.
 * 단일 프로젝트 운영이라 선택 드롭다운 없이 현재 프로젝트명만 노출한다.
 */
export function ProjectSwitcher({ projects, selectedProjectId }: ProjectSwitcherProps) {
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const name = selectedProject?.name ?? '탱고북 동화책';

  return (
    <div className="p-3 border-b border-border">
      <div className="w-full flex items-center gap-2 bg-accent/50 px-3 py-2 rounded-lg">
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
          {name.charAt(0)}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-semibold truncate">{name}</div>
        </div>
      </div>
    </div>
  );
}
