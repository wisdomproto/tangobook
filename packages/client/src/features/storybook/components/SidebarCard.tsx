import { useState, useRef, useEffect, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { StorybookSummary } from '@tangobook/shared';
import { useEditorStore, type CategoryTab } from '@/store/editor.store';

interface SidebarCardProps {
  storybook: StorybookSummary;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onView: () => void;
  onCopy: () => void;
  onTogglePublic: (id: string, isPublic: boolean) => void;
  onChangeCategory: (id: string, category: string | undefined) => void;
  onRename: (id: string, title: string) => void;
  /** /editor2 모드에서 base 책에 붙는 variant 개수 — 0/undefined 면 미표시 */
  variantCount?: number;
}

export function SidebarCard({
  storybook,
  selected,
  onSelect,
  onDelete,
  onView,
  onCopy,
  onTogglePublic,
  onChangeCategory,
  onRename,
  variantCount,
}: SidebarCardProps) {
  const categoriesByTab = useEditorStore((s) => s.categoriesByTab);
  const getCategoriesForTab = useEditorStore((s) => s.getCategoriesForTab);
  const categoryOptions = useMemo(() => {
    const tab: CategoryTab =
      storybook.type === 'phonics'
        ? storybook.phonicsLanguage === 'english'
          ? 'phonics-en'
          : 'phonics-ko'
        : 'storybook';
    const items = getCategoriesForTab(tab);
    // 책에 이미 할당된 카테고리가 store 목록에 없어도 표시 (옵션이 사라지지 않게)
    const merged =
      storybook.category && !items.includes(storybook.category)
        ? [...items, storybook.category]
        : items;
    return [{ value: '', label: '없음' }, ...merged.map((c) => ({ value: c, label: c }))];
  }, [
    storybook.type,
    storybook.phonicsLanguage,
    storybook.category,
    categoriesByTab,
    getCategoriesForTab,
  ]);

  const [hovered, setHovered] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(storybook.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commitRename = () => {
    const trimmed = editTitle.trim();
    setEditing(false);
    if (trimmed && trimmed !== storybook.title) {
      onRename(storybook.id, trimmed);
    } else {
      setEditTitle(storybook.title);
    }
  };

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: storybook.id,
    data: { storybook },
  });

  const pageCount = storybook.pageCount ?? 0;
  const category = storybook.category || '';

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50, opacity: 0.8 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setShowCategoryMenu(false);
      }}
      style={style}
      className={`relative px-3 py-2.5 cursor-pointer border-l-3 transition-colors ${
        isDragging ? 'bg-violet-50 dark:bg-violet-900/30 shadow-lg' : ''
      } ${
        selected
          ? 'bg-violet-50 dark:bg-violet-900/30 border-l-violet-600'
          : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-700'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* 썸네일 */}
        <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
          {storybook.coverImage ? (
            <img src={storybook.coverImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') {
                  setEditing(false);
                  setEditTitle(storybook.title);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-slate-800 dark:text-slate-100 w-full bg-white dark:bg-slate-700 border border-violet-400 rounded px-1 py-0 outline-none focus:ring-1 focus:ring-violet-500"
            />
          ) : (
            <p
              className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditTitle(storybook.title);
                setEditing(true);
              }}
            >
              {storybook.title}
            </p>
          )}
          <div className="flex items-center gap-1 mt-0.5">
            {storybook.type === 'phonics' && (
              <span className="text-[9px] px-1 py-px rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                P
              </span>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {storybook.targetAge}세 · {pageCount}쪽
            </p>
            {variantCount !== undefined && variantCount > 0 && (
              <span
                className="text-[9px] px-1 py-px rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-bold"
                title={`레벨 variant ${variantCount}개`}
              >
                +{variantCount}
              </span>
            )}
            {/* 카테고리 배지 - 클릭하면 변경 메뉴 */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCategoryMenu(!showCategoryMenu);
                }}
                className={`text-[10px] px-1 py-px rounded transition-colors ${
                  category
                    ? 'text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/40'
                    : 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {category || '카테고리'}
              </button>
              {showCategoryMenu && (
                <div className="absolute left-0 top-full mt-0.5 z-50 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-lg py-0.5 w-24">
                  {categoryOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeCategory(storybook.id, opt.value || undefined);
                        setShowCategoryMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        (storybook.category || '') === opt.value
                          ? 'text-violet-600 font-medium'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* isPublic 체크박스 */}
            <label
              className="flex items-center gap-0.5 ml-auto"
              onClick={(e) => e.stopPropagation()}
              title={storybook.isPublic ? '공개' : '비공개'}
            >
              <input
                type="checkbox"
                checked={!!storybook.isPublic}
                onChange={(e) => onTogglePublic(storybook.id, e.target.checked)}
                className="w-3 h-3 accent-violet-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {storybook.isPublic ? '공개' : '비공개'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 호버 시 액션 버튼들 */}
      {hovered && !isDragging && (
        <div className="absolute top-1.5 right-1.5 flex gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="p-1 rounded hover:bg-violet-50 dark:hover:bg-violet-900/30 text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            title="보기"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className="p-1 rounded hover:bg-violet-50 dark:hover:bg-violet-900/30 text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            title="복사"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
            title="삭제"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
