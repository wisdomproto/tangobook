import { useCallback, useRef } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from '@/features/storybook/components/Sidebar';
import { EmptyState } from './EmptyState';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { useEditorStore } from '@/store/editor.store';
import { useStorybook, useSaveStorybook } from '@/features/storybook';
import { CreateStorybookForm } from '@/features/storybook/components/CreateStorybookForm';
import { CreatePhonicsBookForm } from '@/features/storybook/components/CreatePhonicsBookForm';
import { EditorContent } from '@/features/editor/components/EditorContent';
import type { Storybook } from '@tangobook/shared';

export function AppLayout() {
  const selectedId = useEditorStore((s) => s.selectedStorybookId);
  const showCreateForm = useEditorStore((s) => s.showCreateForm);
  const setShowCreateForm = useEditorStore((s) => s.setShowCreateForm);
  const createFormType = useEditorStore((s) => s.createFormType);
  const setCreateFormType = useEditorStore((s) => s.setCreateFormType);
  const typeFilter = useEditorStore((s) => s.sidebarTypeFilter);

  return (
    <div className="min-h-screen">
      <TopBar />
      <Sidebar />
      <main className="ml-72 mt-14 min-h-[calc(100vh-3.5rem)]">
        {showCreateForm ? (
          createFormType === 'phonics' ? (
            <CreatePhonicsBookForm />
          ) : (
            <CreateStorybookForm />
          )
        ) : selectedId ? (
          <EditorPanel storybookId={selectedId} />
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
            <EmptyState
              icon={
                <svg
                  className="w-16 h-16 text-slate-300 dark:text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              }
              title={
                typeFilter !== 'storybook' ? '파닉스 유닛을 선택하세요' : '동화책을 선택하세요'
              }
              description={
                typeFilter !== 'storybook'
                  ? '왼쪽 목록에서 파닉스 유닛을 선택하거나, 새 유닛을 만들어보세요.'
                  : '왼쪽 목록에서 동화책을 선택하거나, 새 동화책을 만들어보세요.'
              }
              action={
                typeFilter !== 'storybook' ? (
                  <button
                    onClick={() => {
                      setCreateFormType('phonics');
                      setShowCreateForm(true);
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    + 새 파닉스 유닛 만들기
                  </button>
                ) : (
                  <Button
                    onClick={() => {
                      setCreateFormType('storybook');
                      setShowCreateForm(true);
                    }}
                  >
                    + 새 동화책 만들기
                  </Button>
                )
              }
            />
          </div>
        )}
      </main>
    </div>
  );
}

function EditorPanel({ storybookId }: { storybookId: string }) {
  const { data: storybook, isLoading, error } = useStorybook(storybookId);
  const saveMutation = useSaveStorybook();
  const setSelectedId = useEditorStore((s) => s.setSelectedStorybookId);

  const localRef = useRef<Storybook | null>(null);
  const prevIdRef = useRef<string | null>(null);

  // Reset local ref when storybook changes
  if (storybook && prevIdRef.current !== storybook.id) {
    localRef.current = structuredClone(storybook);
    prevIdRef.current = storybook.id;
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
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)]">
        <p className="text-red-500 mb-4">{error?.message ?? '동화책을 찾을 수 없습니다.'}</p>
        <button
          onClick={() => setSelectedId(null)}
          className="text-violet-600 hover:underline text-sm"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const local = localRef.current ?? storybook;

  return (
    <EditorContent
      storybook={local}
      saving={saveMutation.isPending}
      onSave={handleSave}
      onUpdate={handleUpdate}
    />
  );
}
