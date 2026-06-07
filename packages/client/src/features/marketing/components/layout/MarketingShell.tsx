import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useMarketingTheme } from '../../theme/useMarketingTheme';
import { useUIStore } from '../../store/ui-store';
import { useProjects, useCreateProject } from '../../api/use-projects';

/**
 * Marketing operator shell.
 * Renders: Sidebar (left) + TopBar + routed body (right column).
 *
 * The `.marketing-scope` class on the root div is the CSS boundary that
 * scopes marketing design tokens — it MUST NOT be removed.
 */
export function MarketingShell() {
  // Mount the theme hook so the saved light/dark preference is applied on load.
  useMarketingTheme();

  const { selectedProjectId, setSelectedProjectId } = useUIStore();
  const { data: projects = [] } = useProjects();
  const createProject = useCreateProject();

  /**
   * Temporary create handler — Chunk 6 will replace this with a proper
   * CreateProjectDialog. For now, prompt for a name so the shell is
   * end-to-end functional without the dialog.
   */
  function handleCreateNew() {
    const name = window.prompt('새 프로젝트 이름을 입력하세요', '새 프로젝트');
    if (!name?.trim()) return;
    createProject.mutate({ name: name.trim() });
  }

  return (
    <div className="marketing-scope h-screen flex overflow-hidden">
      <Sidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onCreateNewProject={handleCreateNew}
      />

      {/* Right column: top bar + scrollable main */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
