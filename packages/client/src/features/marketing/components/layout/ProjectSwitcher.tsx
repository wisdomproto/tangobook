import { ChevronDown, Check, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../ui';
import type { Project } from '../../types/database';

interface ProjectSwitcherProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
}

export function ProjectSwitcher({
  projects,
  selectedProjectId,
  onSelect,
  onCreateNew,
}: ProjectSwitcherProps) {
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="p-3 border-b border-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-2 bg-accent/50 hover:bg-accent px-3 py-2 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
              {selectedProject?.name?.charAt(0) ?? '?'}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold truncate">
                {selectedProject?.name ?? '프로젝트 선택'}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64">
          {projects.length === 0 && (
            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
              프로젝트가 없습니다
            </div>
          )}
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => onSelect(project.id)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {project.name.charAt(0)}
              </div>
              <span className="flex-1 truncate">{project.name}</span>
              {project.id === selectedProjectId && (
                <Check className="w-4 h-4 text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onCreateNew}
            className="flex items-center gap-2 cursor-pointer text-muted-foreground"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>새 프로젝트</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
