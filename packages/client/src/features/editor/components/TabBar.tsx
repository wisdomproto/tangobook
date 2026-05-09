import { useEditorStore } from '@/store/editor.store';
import type { StorybookType } from '@tangobook/shared';

const STORYBOOK_TABS = [
  { id: 'meta' as const, label: '책 관리' },
  { id: 'settings' as const, label: '기본설정' },
  { id: 'character' as const, label: '캐릭터' },
  { id: 'cover' as const, label: '표지' },
  { id: 'key-objects' as const, label: '핵심단어' },
  { id: 'pages' as const, label: '페이지' },
  { id: 'quiz' as const, label: '퀴즈' },
  { id: 'games' as const, label: '학습게임' },
  { id: 'audiobook' as const, label: '오디오북' },
  { id: 'blog' as const, label: '블로그' },
  { id: 'card-news' as const, label: '카드뉴스' },
  { id: 'longform-video' as const, label: '동영상 제작' },
];

const PHONICS_TABS = [
  { id: 'meta' as const, label: '책 관리' },
  { id: 'settings' as const, label: '기본설정' },
  { id: 'character' as const, label: '캐릭터' },
  { id: 'flashcards' as const, label: '핵심단어' },
  { id: 'cover' as const, label: '표지' },
  { id: 'learning-cards' as const, label: '학습카드' },
  { id: 'chant' as const, label: '챈트' },
  { id: 'pages' as const, label: '동화책_페이지' },
  { id: 'games' as const, label: '학습게임' },
  { id: 'audiobook' as const, label: '오디오북' },
  { id: 'blog' as const, label: '블로그' },
  { id: 'card-news' as const, label: '카드뉴스' },
  { id: 'longform-video' as const, label: '동영상 제작' },
];

interface TabBarProps {
  storybookType?: StorybookType;
  /** 숨길 탭 ID 목록. /editor2 에서 마케팅 관련(quiz/blog/card-news) 등을 가릴 때 사용. /editor 는 미사용. */
  hiddenTabIds?: string[];
}

export function TabBar({ storybookType, hiddenTabIds }: TabBarProps) {
  const activeTab = useEditorStore((s) => s.activeTab);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);

  const baseTabs = storybookType === 'phonics' ? PHONICS_TABS : STORYBOOK_TABS;
  const tabs = hiddenTabIds?.length
    ? baseTabs.filter((t) => !hiddenTabIds.includes(t.id))
    : baseTabs;

  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 overflow-x-auto sticky top-[7.25rem] z-20">
      <div className="px-6 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
