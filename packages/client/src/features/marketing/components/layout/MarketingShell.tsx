import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useMarketingTheme } from '../../theme/useMarketingTheme';
import { useUIStore } from '../../store/ui-store';

/**
 * Marketing operator shell.
 * Renders: Sidebar (left) + TopBar + routed body (right column).
 *
 * The `.marketing-scope` class on the root div is the CSS boundary that
 * scopes marketing design tokens — it MUST NOT be removed.
 *
 * TODO(Chunk 4): wire useProjects — swap the empty projects array and no-op
 * handlers below with real data from the projects query hook.
 */
export function MarketingShell() {
  // Mount the theme hook so the saved light/dark preference is applied on load.
  useMarketingTheme();

  const { selectedProjectId, setSelectedProjectId } = useUIStore();

  return (
    <div className="marketing-scope h-screen flex overflow-hidden">
      <Sidebar
        projects={[]} // TODO(Chunk 4): wire useProjects
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onCreateNewProject={() => {}} // TODO(Chunk 4): open create-project dialog
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
