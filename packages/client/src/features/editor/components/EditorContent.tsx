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
import type { Storybook } from '@tangobook/shared';

interface EditorContentProps {
  storybook: Storybook;
  saving?: boolean;
  onSave: () => void;
  onUpdate: (updater: (draft: Storybook) => void) => void;
}

export function EditorContent({ storybook, saving, onSave, onUpdate }: EditorContentProps) {
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
  ];

  const tabs = [
    ...commonStartTabs,
    ...(isPhonics ? phonicsAfterCharTabs : []),
    ...commonEndTabs,
    ...(isPhonics ? phonicsAfterCoverTabs : [...storybookOnlyTabs, ...storybookEndTabs]),
    ...sharedEndTabs,
  ];

  return (
    <div>
      <EditorHeader storybook={storybook} saving={saving} onSave={onSave} onUpdate={onUpdate} />
      <TabBar storybookType={storybook.type} />
      {tabs.map(({ id, el }) => (
        <div key={id} className="p-6" style={{ display: activeTab === id ? 'block' : 'none' }}>
          {el}
        </div>
      ))}
    </div>
  );
}
