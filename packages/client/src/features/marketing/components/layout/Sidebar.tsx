import { SidebarNavItem } from './SidebarNavItem';
import { ProjectSwitcher } from './ProjectSwitcher';
import type { Project } from '../../types/database';

interface SidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
}

const navGroups = [
  {
    label: '오가닉 마케팅',
    items: [
      { to: '/marketing/ideas', icon: '💡', label: '키워드 / 아이디어' },
      { to: '/marketing/content', icon: '📝', label: '콘텐츠 생성' },
      { to: '/marketing/publish', icon: '🚀', label: '발행' },
      { to: '/marketing/pipeline', icon: '🗼', label: '파이프라인' },
    ],
  },
  {
    label: '성장',
    items: [{ to: '/marketing/monitoring', icon: '💬', label: '모니터링 / 댓글' }],
  },
  {
    label: '유료 마케팅',
    items: [
      { to: '/marketing/ads', icon: '📢', label: '광고 관리' },
      { to: '/marketing/landings', icon: '🎯', label: '광고 랜딩' },
    ],
  },
  {
    label: '분석',
    items: [
      { to: '/marketing/site-analysis', icon: '📊', label: '사이트 분석' },
      { to: '/marketing/meta-analytics', icon: '📱', label: '채널 분석' },
      { to: '/marketing/competitors', icon: '🎯', label: '경쟁사' },
    ],
  },
  {
    label: '전략',
    items: [{ to: '/marketing/strategy', icon: '💡', label: '마케팅 전략' }],
  },
  {
    label: '사용자',
    items: [
      { to: '/marketing/members', icon: '👥', label: '회원 관리' },
      { to: '/marketing/feedback', icon: '💬', label: '건의함' },
    ],
  },
] as const;

export function Sidebar({ projects, selectedProjectId }: SidebarProps) {
  return (
    <aside className="w-56 bg-card border-r border-border flex flex-col h-full shrink-0">
      <ProjectSwitcher projects={projects} selectedProjectId={selectedProjectId} />

      <nav className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Project Settings — always first */}
        <div className="space-y-0.5">
          <SidebarNavItem to="/marketing/settings" icon="⚙️" label="프로젝트 설정" />
        </div>

        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarNavItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
