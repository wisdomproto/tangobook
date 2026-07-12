import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import { LanguageSelector } from './LanguageSelector';
import { BaseArticlePanel } from './BaseArticlePanel';
import { BlogPanel } from './BlogPanel';
import { InternalBlogPanel } from './InternalBlogPanel';
import { ThreadsPanel } from './ThreadsPanel';
import { CardNewsPanel } from './CardNewsPanel';
import { YoutubePanel } from './YoutubePanel';
import { ReelsPanel } from './ReelsPanel';
import { useUIStore } from '../../store/ui-store';
import { useContent } from '../../api/use-contents';
import { useProject } from '../../api/use-projects';
import { useTranslateChannel } from '../../api/use-translations';
import { Loader2 } from 'lucide-react';
import {
  buildBlogCardsHtml,
  buildCardnewsHtml,
  buildThreadsHtml,
  buildYoutubeHtml,
  type ChannelKind,
} from '../../lib/channel-translator';
import type { ContentGraph } from '../../api/queries';

// ── resolveTranslationSource ───────────────────────────────────────────────

export interface TranslationSource {
  channel: ChannelKind;
  sourceHtml: string;
  isNaver: boolean;
}

/**
 * Resolve the active tab → (ChannelKind, source HTML) from the ContentGraph (spec §4.3 step 1-2).
 * Source HTML is built via the already-ported channel-translator builders. Returns null when the
 * tab is unsupported (shorts) or the channel has no source (caller alerts + aborts).
 * Loose blog separation (O-1): self_hosted vs naver_blog both live in blogContents; pick by the
 * `channel` field, falling back to [0].
 */
export function resolveTranslationSource(
  activeTab: string,
  graph: ContentGraph
): TranslationSource | null {
  const pickBlog = (channel: 'naver_blog' | 'self_hosted') =>
    graph.blogContents.find((bc) => (bc as { channel?: string }).channel === channel) ??
    graph.blogContents[0];

  switch (activeTab) {
    case 'base-article': {
      const sourceHtml = graph.baseArticle?.body ?? '';
      if (!sourceHtml.trim()) return null;
      return { channel: 'base', sourceHtml, isNaver: false };
    }
    case 'blog': {
      const bc = pickBlog('naver_blog');
      const sourceHtml = bc ? buildBlogCardsHtml(bc.cards) : '';
      if (!sourceHtml.trim()) return null;
      return { channel: 'naver_blog', sourceHtml, isNaver: true };
    }
    case 'self_hosted': {
      const bc = pickBlog('self_hosted');
      const sourceHtml = bc ? buildBlogCardsHtml(bc.cards) : '';
      if (!sourceHtml.trim()) return null;
      return { channel: 'self_hosted', sourceHtml, isNaver: false };
    }
    case 'cardnews': {
      const ic = graph.instagramContents[0];
      const sourceHtml = ic ? buildCardnewsHtml(ic.cards, ic.caption) : '';
      if (!sourceHtml.trim()) return null;
      return { channel: 'instagram', sourceHtml, isNaver: false };
    }
    case 'threads': {
      const tc = graph.threadsContents[0];
      const sourceHtml = tc ? buildThreadsHtml(tc.cards) : '';
      if (!sourceHtml.trim()) return null;
      return { channel: 'threads', sourceHtml, isNaver: false };
    }
    case 'youtube': {
      const yc = graph.youtubeContents[0];
      const sourceHtml = yc ? buildYoutubeHtml(yc.cards) : '';
      if (!sourceHtml.trim()) return null;
      return { channel: 'youtube', sourceHtml, isNaver: false };
    }
    default:
      return null; // shorts / unknown — unsupported
  }
}

// ── Tab definitions ────────────────────────────────────────────────────────

const TABS = [
  { id: 'base-article', label: '기본글', active: true },
  { id: 'blog', label: 'N 블로그', active: true },
  { id: 'self_hosted', label: '내부 블로그', active: true },
  { id: 'cardnews', label: '카드뉴스', active: true },
  { id: 'threads', label: '스레드', active: true },
  { id: 'youtube', label: '롱폼', active: true },
  { id: 'shorts', label: '릴스', active: true },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── Main component ─────────────────────────────────────────────────────────

// Korean-only tabs — auto-switch away when language changes to non-ko
const KO_ONLY_TABS: TabId[] = ['blog'];

// 광고 콘텐츠는 릴스(영상) 중심 — 릴스 + 캡션용 카드뉴스만 노출, 기본은 릴스.
const AD_TAB_IDS: TabId[] = ['cardnews', 'shorts'];

export function ContentTabs() {
  const { selectedContentId, selectedProjectId, selectedLanguage } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabId>('base-article');
  const [translationStatuses, setTranslationStatuses] = useState<Record<string, string>>({});

  const { data: contentGraph, isLoading: contentLoading } = useContent(selectedContentId);
  const { data: project, isLoading: projectLoading } = useProject(selectedProjectId);
  const translateChannel = useTranslateChannel();

  const content = contentGraph?.content;
  const isAd = content?.content_kind === 'ad';

  // 광고 콘텐츠는 릴스/카드뉴스만, 정규는 전체 탭.
  const visibleTabs = isAd ? TABS.filter((t) => AD_TAB_IDS.includes(t.id)) : TABS;

  // When language is not ko, blog tab is not available — auto-switch to base-article
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as TabId);
  };

  // If currently on a Korean-only tab and language switched to non-ko, switch to base-article
  useEffect(() => {
    if (selectedLanguage !== 'ko' && KO_ONLY_TABS.includes(activeTab)) {
      setActiveTab('base-article');
    }
  }, [selectedLanguage, activeTab]);

  // 콘텐츠 성격이 바뀌어 현재 탭이 노출 목록에 없으면 기본 탭으로 이동
  // (광고 선택 시 → 릴스, 정규 선택 시 → 기본글).
  useEffect(() => {
    if (!content) return;
    const allowed = content.content_kind === 'ad' ? AD_TAB_IDS : TABS.map((t) => t.id);
    if (!allowed.includes(activeTab)) {
      setActiveTab(content.content_kind === 'ad' ? 'shorts' : 'base-article');
    }
  }, [content, activeTab]);

  const handleTranslate = async (lang: string) => {
    if (lang === 'ko') return;
    if (!contentGraph || !project) return;
    const resolved = resolveTranslationSource(activeTab, contentGraph);
    if (!resolved) {
      alert('번역할 내용이 없습니다. 먼저 이 채널의 콘텐츠를 생성해 주세요.');
      return;
    }
    setTranslationStatuses((s) => ({ ...s, [lang]: 'translating' }));
    try {
      await translateChannel.mutateAsync({
        projectId: project.id,
        contentId: contentGraph.content.id,
        project,
        targetLang: lang,
        channel: resolved.channel,
        sourceHtml: resolved.sourceHtml,
        isNaver: resolved.isNaver,
      });
      setTranslationStatuses((s) => ({ ...s, [lang]: 'completed' }));
    } catch (err) {
      setTranslationStatuses((s) => ({ ...s, [lang]: 'none' }));
      alert(`번역 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

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
        translationStatuses={translationStatuses}
        onTranslate={handleTranslate}
      />

      {/* Content tabs */}
      <Tabs
        value={activeTab}
        className="flex flex-col flex-1 min-h-0"
        onValueChange={handleTabChange}
      >
        <TabsList className="justify-start rounded-none border-b px-3 py-0 h-auto bg-transparent gap-0 shrink-0">
          {visibleTabs.map((tab) => {
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
          <BlogPanel content={content} project={project} />
        </TabsContent>

        {/* ── self_hosted (내부 블로그) — Chunk 5 ── */}
        <TabsContent value="self_hosted" className="flex-1 min-h-0 m-0 overflow-hidden">
          <InternalBlogPanel content={content} project={project} />
        </TabsContent>

        {/* ── cardnews ── */}
        <TabsContent value="cardnews" className="flex-1 min-h-0 m-0 overflow-hidden">
          <CardNewsPanel content={content} project={project} />
        </TabsContent>
        <TabsContent value="threads" className="flex-1 min-h-0 m-0 overflow-hidden">
          <ThreadsPanel content={content} project={project} />
        </TabsContent>
        <TabsContent value="youtube" className="flex-1 min-h-0 m-0 overflow-hidden">
          <YoutubePanel content={content} project={project} />
        </TabsContent>
        <TabsContent value="shorts" className="flex-1 min-h-0 m-0 overflow-hidden">
          <ReelsPanel content={content} project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
