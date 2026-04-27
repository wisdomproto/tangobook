import { useEditorStore } from '@/store/editor.store';
import { EditorHeader } from './EditorHeader';
import { TabBar } from './TabBar';
import { CharacterTab } from '@/features/character/components/CharacterTab';
import { CoverTab } from '@/features/cover/components/CoverTab';
import { PagesTab } from '@/features/illustration/components/PagesTab';
import { KeyObjectTab } from '@/features/key-object/components/KeyObjectTab';
import { QuizTab } from '@/features/quiz/components/QuizTab';
import { AudiobookTab } from '@/features/audiobook';
import { SettingsTab } from '@/features/settings';
import { ChantTab, LearningCardTab, AlphabetCardTab, FlashcardTab } from '@/features/phonics';
import { GamesTab } from '@/features/games';
import { BlogTab } from '@/features/blog';
import { CardNewsTab } from '@/features/card-news';
import { LongformVideoTab } from '@/features/longform-video';
import type { Storybook } from '@tangobook/shared';

interface EditorContentProps {
  storybook: Storybook;
  saving?: boolean;
  onSave: () => void;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  /** 헤더 우측 (저장 버튼 옆) 추가 액션. /editor2 의 삭제 버튼 등에 사용. /editor 는 사용 안 함. */
  headerExtraActions?: import('react').ReactNode;
  /** 헤더 한 줄 모드 (/editor2). 기본 false 는 기존 2줄 (/editor). */
  compactHeader?: boolean;
  /** 숨길 탭 ID 배열. /editor2 에서 quiz/blog/card-news 등 마케팅 관련 탭 가림. /editor 미사용. */
  hiddenTabIds?: string[];
}

export function EditorContent({
  storybook,
  saving,
  onSave,
  onUpdate,
  headerExtraActions,
  compactHeader = false,
  hiddenTabIds,
}: EditorContentProps) {
  const activeTab = useEditorStore((s) => s.activeTab);
  const isPhonics = storybook.type === 'phonics';
  const isLetterSounds = storybook.phonicsConfig?.bookType === 'letter-sounds';

  const commonStartTabs = [
    {
      id: 'settings',
      el: <SettingsTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />,
    },
    {
      id: 'character',
      el: <CharacterTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />,
    },
  ];

  const commonEndTabs = [
    { id: 'cover', el: <CoverTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} /> },
    { id: 'pages', el: <PagesTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} /> },
  ];

  const storybookOnlyTabs = [
    {
      id: 'key-objects',
      el: <KeyObjectTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />,
    },
  ];

  const phonicsAfterCharTabs = [
    {
      id: 'flashcards',
      el: <FlashcardTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />,
    },
  ];

  const phonicsAfterCoverTabs = [
    {
      id: 'learning-cards',
      el: isLetterSounds ? (
        <AlphabetCardTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />
      ) : (
        <LearningCardTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />
      ),
    },
    {
      id: 'chant',
      el: <ChantTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />,
    },
  ];

  const storybookEndTabs = [
    { id: 'quiz', el: <QuizTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} /> },
  ];

  const sharedEndTabs = [
    { id: 'games', el: <GamesTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} /> },
    {
      id: 'audiobook',
      el: <AudiobookTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />,
    },
    { id: 'blog', el: <BlogTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} /> },
    {
      id: 'card-news',
      el: <CardNewsTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />,
    },
    {
      id: 'longform-video',
      el: <LongformVideoTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />,
    },
  ];

  const allTabs = [
    ...commonStartTabs,
    ...(isPhonics ? phonicsAfterCharTabs : []),
    ...commonEndTabs,
    ...(isPhonics ? phonicsAfterCoverTabs : [...storybookOnlyTabs, ...storybookEndTabs]),
    ...sharedEndTabs,
  ];
  // hiddenTabIds 적용 — /editor2 에서 quiz/blog/card-news 등 마케팅 관련 가림
  const tabs = hiddenTabIds?.length ? allTabs.filter((t) => !hiddenTabIds.includes(t.id)) : allTabs;

  return (
    <div>
      <EditorHeader
        storybook={storybook}
        saving={saving}
        onSave={onSave}
        onUpdate={onUpdate}
        extraActions={headerExtraActions}
        compact={compactHeader}
      />
      <TabBar storybookType={storybook.type} hiddenTabIds={hiddenTabIds} />
      {tabs.map(({ id, el }) => (
        <div key={id} className="p-6" style={{ display: activeTab === id ? 'block' : 'none' }}>
          {el}
        </div>
      ))}
    </div>
  );
}
