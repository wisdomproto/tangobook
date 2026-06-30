import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useMarketingTheme } from '../../theme/useMarketingTheme';
import { useUIStore } from '../../store/ui-store';
import { useProjects } from '../../api/use-projects';

/** 고정 프로젝트명 — 마케팅은 단일 프로젝트(탱고북 동화책)로 운영. */
const FIXED_PROJECT_NAME = '탱고북 동화책';

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

  // 단일 프로젝트 고정: 항상 "탱고북 동화책"(없으면 첫 프로젝트)을 선택 상태로 유지.
  useEffect(() => {
    if (projects.length === 0) return;
    const fixed = projects.find((p) => p.name === FIXED_PROJECT_NAME) ?? projects[0];
    if (fixed.id !== selectedProjectId) {
      setSelectedProjectId(fixed.id);
    }
  }, [projects, selectedProjectId, setSelectedProjectId]);

  return (
    <div className="marketing-scope h-screen flex overflow-hidden">
      <Sidebar projects={projects} selectedProjectId={selectedProjectId} />

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
