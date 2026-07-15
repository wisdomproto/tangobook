import { useState } from 'react';
import { cn } from '../../lib/utils';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { SeoDashboard } from './seo/SeoDashboard';

type TabId = 'ga4' | 'seo';

interface SiteAnalysisDashboardProps {
  projectId: string;
}

/**
 * 2-sub-tab wrapper: "GA4 트래픽" | "SEO 분석".
 * (상단 언어 탭은 GA4 가 사이트 전역이라 필터가 안 돼 아무 기능이 없어 제거함 — 2026-07-14.
 *  언어별 분포는 AnalyticsDashboard 의 "언어별" 카드(app_language 커스텀 디멘션)로 대체.)
 */
export function SiteAnalysisDashboard({ projectId }: SiteAnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('ga4');

  return (
    <div className="p-6 max-w-6xl space-y-4">
      {/* Sub-tab bar */}
      <div className="flex gap-1 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab('ga4')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors rounded-t-md break-keep',
            activeTab === 'ga4'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          GA4 트래픽
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors rounded-t-md break-keep',
            activeTab === 'seo'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          SEO 분석
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'ga4' && <AnalyticsDashboard projectId={projectId} />}
      {activeTab === 'seo' && <SeoDashboard projectId={projectId} />}
    </div>
  );
}
