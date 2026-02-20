import { useState, useMemo } from 'react';
import { Button } from '@/components/Button';
import { useStorybooks } from '@/features/storybook';
import type { Storybook } from '@tangobook/shared';

interface EditorHeaderProps {
  storybook: Storybook;
  saving?: boolean;
  onSave: () => void;
  onUpdate: (updater: (draft: Storybook) => void) => void;
}

export function EditorHeader({ storybook, saving, onSave, onUpdate }: EditorHeaderProps) {
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [newFolder, setNewFolder] = useState('');
  const { data: allStorybooks } = useStorybooks();

  // Collect all existing folder names
  const existingFolders = useMemo(() => {
    if (!allStorybooks) return [];
    const set = new Set<string>();
    allStorybooks.forEach((s) => {
      if (s.folder) set.add(s.folder);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [allStorybooks]);

  const handleSetFolder = (folder: string | undefined) => {
    onUpdate((draft) => {
      draft.folder = folder;
    });
    onSave();
    setShowFolderMenu(false);
  };

  const handleCreateAndSet = () => {
    if (!newFolder.trim()) return;
    handleSetFolder(newFolder.trim());
    setNewFolder('');
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-14 z-30">
      <div className="px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {storybook.title}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {storybook.targetAge}세 · {storybook.pages.length}쪽 ·{' '}
              {new Date(storybook.createdAt).toLocaleDateString('ko-KR')}
            </p>
            {storybook.category && (
              <span className="text-[10px] text-violet-500 bg-violet-50 dark:bg-violet-900/30 px-1.5 py-px rounded">
                {storybook.category}
              </span>
            )}
            {/* Folder badge/selector */}
            <div className="relative">
              <button
                onClick={() => setShowFolderMenu(!showFolderMenu)}
                className="text-[10px] px-1.5 py-px rounded border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-violet-300 hover:text-violet-600 flex items-center gap-0.5 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                {storybook.folder || '폴더 없음'}
              </button>
              {showFolderMenu && (
                <div className="absolute left-0 top-full mt-1 z-40 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg py-1 w-48">
                  <button
                    onClick={() => handleSetFolder(undefined)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 ${!storybook.folder ? 'text-violet-600 font-medium' : 'text-slate-600 dark:text-slate-300'}`}
                  >
                    폴더 없음
                  </button>
                  {existingFolders.map((f) => (
                    <button
                      key={f}
                      onClick={() => handleSetFolder(f)}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 ${storybook.folder === f ? 'text-violet-600 font-medium' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      {f}
                    </button>
                  ))}
                  <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1 px-2 pb-1">
                    <div className="flex gap-1">
                      <input
                        value={newFolder}
                        onChange={(e) => setNewFolder(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateAndSet()}
                        placeholder="새 폴더..."
                        className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-violet-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                      />
                      <button
                        onClick={handleCreateAndSet}
                        disabled={!newFolder.trim()}
                        className="px-2 py-1 text-[10px] bg-violet-600 text-white rounded disabled:opacity-50"
                      >
                        추가
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onSave} loading={saving}>
            저장
          </Button>
        </div>
      </div>
    </header>
  );
}
