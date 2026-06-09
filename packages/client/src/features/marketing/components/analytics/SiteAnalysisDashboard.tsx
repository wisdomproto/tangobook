import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useProject } from '../../api/use-projects';
import { MarketingLanguageTabs } from '../ideas/MarketingLanguageTabs';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { SeoDashboard } from './seo/SeoDashboard';

type TabId = 'ga4' | 'seo';

interface SiteAnalysisDashboardProps {
  projectId: string;
}

/**
 * 2-sub-tab wrapper: "GA4 트래픽" | "SEO 분석".
 * Uses MarketingLanguageTabs (display-only lang context — the language row is
 * shown here for visual parity with the CF design; it does not filter GA4 data
 * which is site-global, not per-language).
 * Port of CF analytics/site-analysis-dashboard.tsx.
 */
export function SiteAnalysisDashboard({ projectId }: SiteAnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('ga4');
  const [selectedLang, setSelectedLang] = useState('ko');
  const { data: project } = useProject(projectId);

  const targetLanguages = (project?.target_languages as string[] | undefined) ?? [];

  return (
    <div className="p-6 max-w-6xl space-y-4">
      {/* Language row (display-only context for the dashboard) */}
      <MarketingLanguageTabs
        targetLanguages={targetLanguages}
        selectedLang={selectedLang}
        onLangChange={setSelectedLang}
      />

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
