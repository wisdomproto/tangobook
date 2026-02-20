import { useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStorybook, useSaveStorybook } from '@/features/storybook';
import { EditorLayout } from '@/features/editor';
import { useEditorStore } from '@/store/editor.store';
import { Spinner } from '@/components/Spinner';
import type { Storybook } from '@tangobook/shared';

import { CharacterTab } from '@/features/character/components/CharacterTab';
import { CoverTab } from '@/features/cover/components/CoverTab';
import { PagesTab } from '@/features/illustration/components/PagesTab';
import { KeyObjectTab } from '@/features/key-object/components/KeyObjectTab';
import { QuizTab } from '@/features/quiz/components/QuizTab';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const activeTab = useEditorStore((s) => s.activeTab);
  const { data: storybook, isLoading, error } = useStorybook(id);
  const saveMutation = useSaveStorybook();

  const localRef = useRef<Storybook | null>(null);
  if (storybook && !localRef.current) {
    localRef.current = structuredClone(storybook);
  }
  if (storybook && localRef.current && localRef.current.id !== storybook.id) {
    localRef.current = structuredClone(storybook);
  }

  const handleUpdate = useCallback((updater: (draft: Storybook) => void) => {
    if (!localRef.current) return;
    updater(localRef.current);
  }, []);

  const handleSave = useCallback(() => {
    if (!localRef.current) return;
    saveMutation.mutate(localRef.current);
  }, [saveMutation]);

  if (isLoading) return <Spinner size="lg" className="mt-20" />;
  if (error || !storybook) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error?.message ?? '동화책을 찾을 수 없습니다.'}</p>
        <button onClick={() => navigate('/')} className="text-violet-600 hover:underline">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const local = localRef.current ?? storybook;

  const tabContent = () => {
    switch (activeTab) {
      case 'character':
        return <CharacterTab storybook={local} onUpdate={handleUpdate} onSave={handleSave} />;
      case 'cover':
        return <CoverTab storybook={local} onUpdate={handleUpdate} onSave={handleSave} />;
      case 'pages':
        return <PagesTab storybook={local} onUpdate={handleUpdate} onSave={handleSave} />;
      case 'key-objects':
        return <KeyObjectTab storybook={local} onUpdate={handleUpdate} onSave={handleSave} />;
      case 'quiz':
        return <QuizTab storybook={local} onUpdate={handleUpdate} onSave={handleSave} />;
    }
  };

  return (
    <EditorLayout
      storybook={local}
      saving={saveMutation.isPending}
      onSave={handleSave}
      onUpdate={handleUpdate}
    >
      {tabContent()}
    </EditorLayout>
  );
}
