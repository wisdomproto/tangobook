import { useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import { LanguageSelector } from './LanguageSelector';
import { BaseArticlePanel } from './BaseArticlePanel';
import { useUIStore } from '../../store/ui-store';
import { useContent } from '../../api/use-contents';
import { useProject } from '../../api/use-projects';
import { Loader2 } from 'lucide-react';

// ── Tab definitions ────────────────────────────────────────────────────────

const TABS = [
  { id: 'base-article', label: '기본글', active: true },
  { id: 'blog', label: 'N 블로그', active: true },
  { id: 'self_hosted', label: '내부 블로그', active: true },
  { id: 'cardnews', label: '카드뉴스', active: false },
  { id: 'threads', label: '스레드', active: false },
  { id: 'youtube', label: '롱폼', active: false },
  { id: 'shorts', label: '숏폼', active: false },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── Placeholder for not-yet-implemented panels ─────────────────────────────

function ComingSoonPanel({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-2 p-8">
        <p className="text-lg font-medium text-muted-foreground">준비 중</p>
        <p className="text-sm text-muted-foreground">{label} 패널은 곧 추가됩니다.</p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ContentTabs() {
  const { selectedContentId, selectedProjectId, selectedLanguage, setSelectedLanguage } =
    useUIStore();

  const { data: contentGraph, isLoading: contentLoading } = useContent(selectedContentId);
  const { data: project, isLoading: projectLoading } = useProject(selectedProjectId);

  const content = contentGraph?.content;

  // When language is not ko, blog tab is not available — auto-switch to base-article
  const handleTabChange = (tabId: string) => {
    if (tabId === 'blog' && selectedLanguage !== 'ko') {
      // no-op — blog tab hidden when non-ko
      return;
    }
  };

  // If currently on blog tab and language switched to non-ko, switch to base-article
  useEffect(() => {
    // This is handled at the tab level via conditional rendering
  }, [selectedLanguage]);

  if (contentLoading || projectLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!content || !project) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        콘텐츠를 선택하세요
      </div>
    );
  }

  const targetLanguages = project.target_languages ?? ['ko'];

  return (
    <div className="flex flex-col h-full">
      {/* Language selector (shown when project has multiple languages) */}
      <LanguageSelector
        targetLanguages={targetLanguages}
        onTranslate={(lang) => {
          // Phase 1b: translation generation — stub for now
          alert(`번역은 곧 지원됩니다 (Phase 1b) — ${lang}`);
        }}
      />

      {/* Content tabs */}
      <Tabs
        defaultValue="base-article"
        className="flex flex-col flex-1 min-h-0"
        onValueChange={handleTabChange}
      >
        <TabsList className="justify-start rounded-none border-b px-3 py-0 h-auto bg-transparent gap-0 shrink-0">
          {TABS.map((tab) => {
            // Hide blog tab when language !== ko
            if (tab.id === 'blog' && selectedLanguage !== 'ko') return null;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-sm"
              >
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ── base-article ── */}
        <TabsContent value="base-article" className="flex-1 min-h-0 m-0 overflow-hidden">
          <BaseArticlePanel content={content} project={project} />
        </TabsContent>

        {/* ── blog (N 블로그) — Chunk 4 ── */}
        <TabsContent value="blog" className="flex-1 min-h-0 m-0 overflow-hidden">
          <ComingSoonPanel label="N 블로그" />
        </TabsContent>

        {/* ── self_hosted (내부 블로그) — Chunk 5 ── */}
        <TabsContent value="self_hosted" className="flex-1 min-h-0 m-0 overflow-hidden">
          <ComingSoonPanel label="내부 블로그" />
        </TabsContent>

        {/* ── placeholders ── */}
        <TabsContent value="cardnews" className="flex-1 min-h-0 m-0 overflow-hidden">
          <ComingSoonPanel label="카드뉴스" />
        </TabsContent>
        <TabsContent value="threads" className="flex-1 min-h-0 m-0 overflow-hidden">
          <ComingSoonPanel label="스레드" />
        </TabsContent>
        <TabsContent value="youtube" className="flex-1 min-h-0 m-0 overflow-hidden">
          <ComingSoonPanel label="롱폼 (YouTube)" />
        </TabsContent>
        <TabsContent value="shorts" className="flex-1 min-h-0 m-0 overflow-hidden">
          <ComingSoonPanel label="숏폼" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
