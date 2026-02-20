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

  const tabContent = () => {
    switch (activeTab) {
      case 'settings':
        return <SettingsTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />;
      case 'character':
        return <CharacterTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />;
      case 'cover':
        return <CoverTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />;
      case 'pages':
        return <PagesTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />;
      case 'key-objects':
        return <KeyObjectTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />;
      case 'quiz':
        return <QuizTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />;
      case 'audiobook':
        return <AudiobookTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />;
    }
  };

  return (
    <div>
      <EditorHeader storybook={storybook} saving={saving} onSave={onSave} onUpdate={onUpdate} />
      <TabBar />
      <div className="p-6">{tabContent()}</div>
    </div>
  );
}
