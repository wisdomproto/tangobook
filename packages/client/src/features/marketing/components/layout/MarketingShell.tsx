import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useMarketingTheme } from '../../theme/useMarketingTheme';
import { useUIStore } from '../../store/ui-store';
import { useProjects } from '../../api/use-projects';
import { CreateProjectDialog } from '../project/CreateProjectDialog';

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

  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const { selectedProjectId, setSelectedProjectId } = useUIStore();
  const { data: projects = [] } = useProjects();

  return (
    <div className="marketing-scope h-screen flex overflow-hidden">
      <Sidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onCreateNewProject={() => setCreateProjectOpen(true)}
      />

      {/* Right column: top bar + scrollable main */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <CreateProjectDialog open={createProjectOpen} onOpenChange={setCreateProjectOpen} />
    </div>
  );
}
