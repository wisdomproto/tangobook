import { useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { useMarketingTheme } from '../../theme/useMarketingTheme';

const PAGE_TITLES: Record<string, string> = {
  '/marketing/content': '콘텐츠 생성',
  '/marketing/ideas': '키워드 / 아이디어',
  '/marketing/publish': '발행 관리',
  '/marketing/monitoring': '모니터링',
  '/marketing/ads': '광고 관리',
  '/marketing/site-analysis': '사이트 분석',
  '/marketing/meta-analytics': '채널 분석',
  '/marketing/competitors': '경쟁사',
  '/marketing/strategy': '마케팅 전략',
  '/marketing/settings': '프로젝트 설정',
};

export function TopBar() {
  const { pathname } = useLocation();
  const { theme, toggle } = useMarketingTheme();
  const title = PAGE_TITLES[pathname] ?? '';

  return (
    <div className="h-12 border-b border-border flex items-center justify-between px-5 shrink-0">
      <h1 className="text-sm font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <SaveStatusIndicator />
        <button
          type="button"
          onClick={toggle}
          className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
          aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </div>
  );
}
