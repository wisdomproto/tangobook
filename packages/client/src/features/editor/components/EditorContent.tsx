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
import type { Storybook } from '@tangobook/shared';

interface EditorContentProps {
  storybook: Storybook;
  saving?: boolean;
  onSave: () => void;
  onUpdate: (updater: (draft: Storybook) => void) => void;
}

export function EditorContent({ storybook, saving, onSave, onUpdate }: EditorContentProps) {
  const activeTab = useEditorStore((s) => s.activeTab);

  const tabs = [
    {
      id: 'settings',
      el: <SettingsTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />,
    },
    {
      id: 'character',
      el: <CharacterTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />,
    },
    { id: 'cover', el: <CoverTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} /> },
    { id: 'pages', el: <PagesTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} /> },
    {
      id: 'key-objects',
      el: <KeyObjectTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />,
    },
    { id: 'quiz', el: <QuizTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} /> },
    {
      id: 'audiobook',
      el: <AudiobookTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />,
    },
  ] as const;

  return (
    <div>
      <EditorHeader storybook={storybook} saving={saving} onSave={onSave} onUpdate={onUpdate} />
      <TabBar />
      {tabs.map(({ id, el }) => (
        <div key={id} className="p-6" style={{ display: activeTab === id ? 'block' : 'none' }}>
          {el}
        </div>
      ))}
    </div>
  );
}
