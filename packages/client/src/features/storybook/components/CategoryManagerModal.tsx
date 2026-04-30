import { useState, useMemo } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/design-system';
import { useEditorStore, type CategoryTab } from '@/store/editor.store';
import { usePatchStorybook, useStorybooks } from '@/features/storybook';

interface CategoryManagerModalProps {
  open: boolean;
  onClose: () => void;
  tab: CategoryTab;
}

export function CategoryManagerModal({ open, onClose, tab }: CategoryManagerModalProps) {
  const { data: storybooks } = useStorybooks();
  const patchMutation = usePatchStorybook();
  const categoriesByTab = useEditorStore((s) => s.categoriesByTab);
  const addCategoryForTab = useEditorStore((s) => s.addCategoryForTab);
  const removeCategoryForTab = useEditorStore((s) => s.removeCategoryForTab);
  const moveCategoryForTab = useEditorStore((s) => s.moveCategoryForTab);
  const renameCategoryForTab = useEditorStore((s) => s.renameCategoryForTab);
  const resetCategoriesForTab = useEditorStore((s) => s.resetCategoriesForTab);
  const getCategoriesForTab = useEditorStore((s) => s.getCategoriesForTab);

  // categoriesByTab 변경 시 리렌더 트리거 (subscribe to map ref)
  const categories = useMemo(
    () => getCategoriesForTab(tab),
    [getCategoriesForTab, tab, categoriesByTab]
  );

  const [newName, setNewName] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');

  const usageCount = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!storybooks) return counts;
    const filterFn = (s: { type?: string; phonicsLanguage?: string }) => {
      if (tab === 'storybook') return (s.type ?? 'storybook') === 'storybook';
      if (tab === 'phonics-ko') return s.type === 'phonics' && s.phonicsLanguage === 'korean';
      return s.type === 'phonics' && s.phonicsLanguage === 'english';
    };
    storybooks.filter(filterFn).forEach((s) => {
      const c = s.category;
      if (c) counts[c] = (counts[c] ?? 0) + 1;
    });
    return counts;
  }, [storybooks, tab]);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      alert('이미 같은 이름의 카테고리가 있어요.');
      return;
    }
    addCategoryForTab(tab, trimmed);
    setNewName('');
  };

  const handleRemove = (name: string) => {
    const count = usageCount[name] ?? 0;
    const message =
      count > 0
        ? `'${name}' 카테고리에 책 ${count}권이 있어요.\n삭제하면 그 책들의 카테고리가 비워집니다. 계속할까요?`
        : `'${name}' 카테고리를 삭제할까요?`;
    if (!confirm(message)) return;
    if (storybooks && count > 0) {
      const filterFn = (s: { type?: string; phonicsLanguage?: string }) => {
        if (tab === 'storybook') return (s.type ?? 'storybook') === 'storybook';
        if (tab === 'phonics-ko') return s.type === 'phonics' && s.phonicsLanguage === 'korean';
        return s.type === 'phonics' && s.phonicsLanguage === 'english';
      };
      storybooks.filter(filterFn).forEach((s) => {
        if (s.category === name) {
          patchMutation.mutate({ id: s.id, patch: { category: undefined } });
        }
      });
    }
    removeCategoryForTab(tab, name);
  };

  const startRename = (name: string) => {
    setEditingCat(name);
    setEditingDraft(name);
  };
  const commitRename = () => {
    if (!editingCat) return;
    const oldName = editingCat;
    const trimmed = editingDraft.trim();
    setEditingCat(null);
    if (!trimmed || trimmed === oldName) return;
    if (categories.includes(trimmed)) {
      alert('이미 같은 이름의 카테고리가 있어요.');
      return;
    }
    // 책들의 category 필드 일괄 patch
    if (storybooks) {
      const filterFn = (s: { type?: string; phonicsLanguage?: string }) => {
        if (tab === 'storybook') return (s.type ?? 'storybook') === 'storybook';
        if (tab === 'phonics-ko') return s.type === 'phonics' && s.phonicsLanguage === 'korean';
        return s.type === 'phonics' && s.phonicsLanguage === 'english';
      };
      storybooks.filter(filterFn).forEach((s) => {
        if (s.category === oldName) {
          patchMutation.mutate({ id: s.id, patch: { category: trimmed } });
        }
      });
    }
    renameCategoryForTab(tab, oldName, trimmed);
  };
  const cancelRename = () => setEditingCat(null);

  const handleReset = () => {
    if (
      !confirm(
        '카테고리 목록을 기본값으로 되돌릴까요?\n(책에 이미 할당된 카테고리는 그대로 유지됩니다.)'
      )
    )
      return;
    resetCategoriesForTab(tab);
  };

  return (
    <Modal open={open} onClose={onClose} title="카테고리 관리">
      <div className="space-y-4">
        {/* 카테고리 리스트 */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          {categories.length === 0 ? (
            <p className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">
              카테고리가 없습니다. 아래에서 추가하세요.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {categories.map((cat, idx) => (
                <li
                  key={cat}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  <span className="text-xs text-slate-400 dark:text-slate-500 w-6 text-center font-mono">
                    {idx + 1}
                  </span>
                  {editingCat === cat ? (
                    <input
                      value={editingDraft}
                      onChange={(e) => setEditingDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) commitRename();
                        else if (e.key === 'Escape') cancelRename();
                      }}
                      onBlur={commitRename}
                      autoFocus
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 min-w-0 px-2 py-1 text-sm border border-violet-300 dark:border-violet-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  ) : (
                    <button
                      onClick={() => startRename(cat)}
                      className="flex-1 min-w-0 text-left text-sm text-slate-700 dark:text-slate-200 truncate"
                      title="클릭하여 이름 변경"
                    >
                      {cat}
                    </button>
                  )}
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                    {usageCount[cat] ?? 0}권
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => moveCategoryForTab(tab, cat, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="위로 이동"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveCategoryForTab(tab, cat, 'down')}
                      disabled={idx === categories.length - 1}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="아래로 이동"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRemove(cat)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-500 hover:text-red-500"
                      title="카테고리 삭제"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 추가 input */}
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd();
            }}
            placeholder="새 카테고리 이름"
            className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
          />
          <Button onClick={handleAdd} disabled={!newName.trim()}>
            + 추가
          </Button>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          이름을 클릭하면 변경할 수 있어요. 카테고리를 삭제하면 그 카테고리에 속한 책들의 카테고리가
          비워집니다.
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleReset}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline"
          >
            기본값으로 되돌리기
          </button>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </Modal>
  );
}
