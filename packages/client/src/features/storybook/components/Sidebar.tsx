import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  useStorybooks,
  useDeleteStorybook,
  usePatchStorybook,
  useCopyStorybook,
} from '@/features/storybook';
import { useEditorStore } from '@/store/editor.store';
import { Button } from '@/design-system';
import { Spinner } from '@/components/Spinner';
import { SidebarCard } from './SidebarCard';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { CategoryManagerModal } from './CategoryManagerModal';

function DroppableFolder({
  folderId,
  label,
  count,
  isActive,
  isOver,
  onClick,
  onDelete,
  onRename,
}: {
  folderId: string;
  label: string;
  count: number;
  isActive: boolean;
  isOver: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onRename?: (newName: string) => void;
}) {
  const { setNodeRef, isOver: dropping } = useDroppable({ id: `folder:${folderId}` });
  const highlighted = isOver || dropping;
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  const startRename = () => {
    setDraft(label);
    setEditing(true);
  };
  const commitRename = () => {
    if (!editing) return;
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== label && onRename) onRename(trimmed);
  };
  const cancelRename = () => {
    setEditing(false);
    setDraft(label);
  };

  return (
    <div
      ref={setNodeRef}
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {editing ? (
        <div
          className={`w-full px-2 py-1 rounded text-xs flex items-center gap-1.5 ${
            isActive ? 'bg-violet-50 dark:bg-violet-900/30' : 'bg-slate-50 dark:bg-slate-700/60'
          }`}
        >
          <svg
            className="w-3.5 h-3.5 flex-shrink-0 text-slate-500 dark:text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) commitRename();
              else if (e.key === 'Escape') cancelRename();
            }}
            onBlur={commitRename}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 min-w-0 bg-transparent outline-none border-b border-violet-400 text-slate-700 dark:text-slate-100"
          />
        </div>
      ) : (
        <button
          onClick={onClick}
          className={`w-full text-left px-2 py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
            highlighted
              ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 ring-2 ring-violet-400'
              : isActive
                ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <span className="truncate">{label}</span>
          <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500">{count}</span>
        </button>
      )}
      {!editing && hovered && (onRename || onDelete) && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {onRename && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startRename();
              }}
              className="p-0.5 rounded hover:bg-violet-50 dark:hover:bg-violet-900/30 text-slate-300 dark:text-slate-600 hover:text-violet-500 transition-colors"
              title="폴더 이름 수정"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
              title="폴더 삭제"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { data: storybooks, isLoading } = useStorybooks();
  const deleteMutation = useDeleteStorybook();
  const patchMutation = usePatchStorybook();
  const copyMutation = useCopyStorybook();
  const location = useLocation();
  // /editor2 모드 — variant sibling 들 (`bid__L1` 등) 사이드바에서 숨김 (base 만 표시)
  // /editor (백업) 은 기존처럼 모든 책 flat 으로 표시
  const groupVariants = location.pathname.startsWith('/editor2');

  const selectedId = useEditorStore((s) => s.selectedStorybookId);
  const setSelectedId = useEditorStore((s) => s.setSelectedStorybookId);
  const setShowCreateForm = useEditorStore((s) => s.setShowCreateForm);
  const setCreateFormType = useEditorStore((s) => s.setCreateFormType);
  const typeFilter = useEditorStore((s) => s.sidebarTypeFilter);
  const setTypeFilter = useEditorStore((s) => s.setSidebarTypeFilter);
  const search = useEditorStore((s) => s.sidebarSearch);
  const setSearch = useEditorStore((s) => s.setSidebarSearch);
  const category = useEditorStore((s) => s.sidebarCategory);
  const setCategory = useEditorStore((s) => s.setSidebarCategory);
  const visibility = useEditorStore((s) => s.sidebarVisibility);
  const setVisibility = useEditorStore((s) => s.setSidebarVisibility);
  const sort = useEditorStore((s) => s.sidebarSort);
  const setSort = useEditorStore((s) => s.setSidebarSort);
  const foldersByTab = useEditorStore((s) => s.foldersByTab);
  const setFolderForTab = useEditorStore((s) => s.setFolderForTab);
  const addCustomFolderForTab = useEditorStore((s) => s.addCustomFolderForTab);
  const removeCustomFolderForTab = useEditorStore((s) => s.removeCustomFolderForTab);
  const renameCustomFolderForTab = useEditorStore((s) => s.renameCustomFolderForTab);
  const categoriesByTab = useEditorStore((s) => s.categoriesByTab);
  const getCategoriesForTab = useEditorStore((s) => s.getCategoriesForTab);

  // Per-tab folder state
  const tabFolderState = foldersByTab[typeFilter] ?? { folder: 'all', customFolders: [] };
  const folder = tabFolderState.folder;
  const setFolder = (f: string) => setFolderForTab(typeFilter, f);
  const customFolders = tabFolderState.customFolders;
  const addCustomFolder = (f: string) => addCustomFolderForTab(typeFilter, f);
  const removeCustomFolder = (f: string) => removeCustomFolderForTab(typeFilter, f);
  const renameCustomFolder = (oldName: string, newName: string) =>
    renameCustomFolderForTab(typeFilter, oldName, newName);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // 타입별 카테고리 목록 (사용자 정의 가능)
  const categories = useMemo(() => {
    const items = getCategoriesForTab(typeFilter);
    return [{ value: 'all', label: '전체' }, ...items.map((c) => ({ value: c, label: c }))];
    // categoriesByTab dep 으로 store 변경 시 재계산
  }, [typeFilter, categoriesByTab, getCategoriesForTab]);

  // Require 8px movement to start drag (prevents conflict with click)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Filter storybooks by active type tab
  const typeFiltered = useMemo(() => {
    if (!storybooks) return [];
    if (typeFilter === 'storybook') {
      return storybooks.filter((s) => (s.type ?? 'storybook') === 'storybook');
    }
    const lang = typeFilter === 'phonics-ko' ? 'korean' : 'english';
    return storybooks.filter((s) => s.type === 'phonics' && s.phonicsLanguage === lang);
  }, [storybooks, typeFilter]);

  // Extract unique folders from type-filtered storybooks + custom folders
  const folders = useMemo(() => {
    const set = new Set<string>();
    typeFiltered.forEach((s) => {
      if (s.folder) set.add(s.folder);
    });
    customFolders.forEach((f) => set.add(f));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [typeFiltered, customFolders]);

  // Folder counts (scoped to active type)
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    typeFiltered.forEach((s) => {
      const f = s.folder || '';
      counts[f] = (counts[f] || 0) + 1;
    });
    return counts;
  }, [typeFiltered]);

  // /editor2 mode — variant 카운트 (base id → 자식 variant 개수)
  const variantCountByBaseId = useMemo(() => {
    if (!groupVariants) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const s of typeFiltered) {
      const m = s.id.match(/^(.+)__L[1-4]$/);
      if (m) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
    }
    return counts;
  }, [typeFiltered, groupVariants]);

  const filtered = useMemo(() => {
    let list = [...typeFiltered];

    // /editor2 mode — variant sibling (`bid__L1` 등) 숨김, base 만 노출
    if (groupVariants) {
      list = list.filter((s) => !/__L[1-4]$/.test(s.id));
    }

    // Folder filter
    if (folder !== 'all') {
      if (folder === '__none__') {
        list = list.filter((s) => !s.folder);
      } else {
        list = list.filter((s) => s.folder === folder);
      }
    }

    // Category filter
    if (category !== 'all') {
      list = list.filter((s) => (s.category || '') === category);
    }

    // Visibility filter
    if (visibility === 'public') {
      list = list.filter((s) => s.isPublic);
    } else if (visibility === 'private') {
      list = list.filter((s) => !s.isPublic);
    }

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q));
    }

    // Sort
    if (sort === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    }

    return list;
  }, [typeFiltered, search, category, visibility, sort, folder]);

  const draggingStorybook = useMemo(() => {
    if (!draggingId || !storybooks) return null;
    return storybooks.find((s) => s.id === draggingId) ?? null;
  }, [draggingId, storybooks]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        if (selectedId === deleteTarget.id) setSelectedId(null);
      },
    });
  };

  const handleCopy = (id: string) => {
    copyMutation.mutate(id, {
      onSuccess: (data) => setSelectedId(data.id),
    });
  };

  const handleView = (id: string) => {
    window.open(`/viewer/${id}`, '_blank');
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    addCustomFolder(newFolderName.trim());
    setFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = event;
    if (!over) return;

    const overId = over.id as string;
    if (!overId.startsWith('folder:')) return;

    const targetFolder = overId.replace('folder:', '');
    // "전체"에 드롭하면 무시
    if (targetFolder === 'all') return;

    const storybookId = active.id as string;
    const sb = storybooks?.find((s) => s.id === storybookId);
    if (!sb) return;

    // "__none__" → remove folder, else set folder
    const newFolder = targetFolder === '__none__' ? undefined : targetFolder;
    if (sb.folder === newFolder || (!sb.folder && !newFolder)) return;

    patchMutation.mutate({ id: storybookId, patch: { folder: newFolder } });
  };

  const handleDeleteFolder = (folderName: string) => {
    // 해당 폴더의 모든 동화책을 미분류로 변경
    const inFolder = storybooks?.filter((s) => s.folder === folderName) ?? [];
    inFolder.forEach((s) => {
      patchMutation.mutate({ id: s.id, patch: { folder: undefined } });
    });
    removeCustomFolder(folderName);
    if (folder === folderName) setFolder('all');
  };

  const handleRenameFolder = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    if (folders.includes(trimmed)) {
      alert('이미 같은 이름의 폴더가 있어요.');
      return;
    }
    // 해당 폴더의 모든 동화책 folder 필드 일괄 변경 (R2 저장)
    const inFolder = storybooks?.filter((s) => s.folder === oldName) ?? [];
    inFolder.forEach((s) => {
      patchMutation.mutate({ id: s.id, patch: { folder: trimmed } });
    });
    // 사용자 정의 폴더 + 활성 폴더 동기화
    renameCustomFolder(oldName, trimmed);
  };

  const handleTogglePublic = (id: string, isPublic: boolean) => {
    patchMutation.mutate({ id, patch: { isPublic } });
  };

  const handleChangeCategory = (id: string, cat: string | undefined) => {
    patchMutation.mutate({ id, patch: { category: cat } });
  };

  const handleRename = (id: string, title: string) => {
    patchMutation.mutate({ id, patch: { title } });
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <aside className="w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed top-14 left-0 bottom-0 flex flex-col z-30">
        {/* 타입 탭 */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {(
            [
              { key: 'storybook', label: '동화책', color: 'violet' },
              { key: 'phonics-ko', label: '한글파닉스', color: 'emerald' },
              { key: 'phonics-en', label: '영어파닉스', color: 'blue' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTypeFilter(t.key);
                setCategory('all');
              }}
              className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 ${
                typeFilter === t.key
                  ? t.color === 'emerald'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : t.color === 'blue'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-violet-600 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 새로 만들기 버튼 (선택된 탭에 맞는 것만) */}
        <div className="p-3">
          {typeFilter === 'storybook' ? (
            <Button
              className="w-full"
              onClick={() => {
                setCreateFormType('storybook');
                setShowCreateForm(true);
              }}
            >
              + 새 동화책 만들기
            </Button>
          ) : (
            <button
              onClick={() => {
                setCreateFormType('phonics');
                setShowCreateForm(true);
              }}
              className={`w-full px-3 py-2 text-sm font-medium rounded-lg text-white transition-colors ${
                typeFilter === 'phonics-en'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              + 새 {typeFilter === 'phonics-ko' ? '한글' : '영어'} 파닉스 만들기
            </button>
          )}
        </div>

        {/* 검색 */}
        <div className="px-3 pb-2">
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-violet-500 focus:border-violet-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            />
          </div>
        </div>

        {/* 폴더 */}
        <div className="px-3 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              폴더
            </span>
            <button
              onClick={() => setShowNewFolder(!showNewFolder)}
              className="text-[11px] text-violet-500 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium"
            >
              + 새 폴더
            </button>
          </div>
          {showNewFolder && (
            <div className="flex gap-1 mb-1.5">
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && !e.nativeEvent.isComposing && handleCreateFolder()
                }
                placeholder="폴더 이름"
                className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-violet-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                autoFocus
              />
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-2 py-1 text-xs bg-violet-600 text-white rounded disabled:opacity-50"
              >
                추가
              </button>
            </div>
          )}
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            <DroppableFolder
              folderId="all"
              label="전체"
              count={typeFiltered.length}
              isActive={folder === 'all'}
              isOver={false}
              onClick={() => setFolder('all')}
            />
            {folders.map((f) => (
              <DroppableFolder
                key={f}
                folderId={f}
                label={f}
                count={folderCounts[f] ?? 0}
                isActive={folder === f}
                isOver={false}
                onClick={() => setFolder(f)}
                onDelete={() => handleDeleteFolder(f)}
                onRename={(newName) => handleRenameFolder(f, newName)}
              />
            ))}
            {(folderCounts[''] ?? 0) > 0 && (
              <DroppableFolder
                folderId="__none__"
                label="미분류"
                count={folderCounts[''] ?? 0}
                isActive={folder === '__none__'}
                isOver={false}
                onClick={() => setFolder('__none__')}
              />
            )}
          </div>
        </div>

        {/* 필터 + 정렬 + 카운트 */}
        <div className="px-3 pb-1 flex items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500">{filtered.length}권</span>
          <div className="flex items-center gap-1">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-[11px] text-slate-400 dark:text-slate-500 border-none outline-none bg-transparent cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowCategoryManager(true)}
              className="p-0.5 rounded text-slate-400 dark:text-slate-500 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="카테고리 관리"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'all' | 'public' | 'private')}
              className="text-[11px] text-slate-400 dark:text-slate-500 border-none outline-none bg-transparent cursor-pointer"
            >
              <option value="all">전체</option>
              <option value="public">공개</option>
              <option value="private">비공개</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'latest' | 'title')}
              className="text-[11px] text-slate-400 dark:text-slate-500 border-none outline-none bg-transparent cursor-pointer"
            >
              <option value="latest">최신순</option>
              <option value="title">제목순</option>
            </select>
          </div>
        </div>

        {/* 동화책 목록 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <Spinner size="sm" className="mt-8" />
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-8 px-3">
              {search ? '검색 결과가 없습니다.' : '동화책이 없습니다.'}
            </p>
          ) : (
            filtered.map((sb) => (
              <SidebarCard
                key={sb.id}
                storybook={sb}
                selected={
                  selectedId === sb.id ||
                  (groupVariants && selectedId?.startsWith(`${sb.id}__L`)) ||
                  false
                }
                onSelect={() => setSelectedId(sb.id)}
                onDelete={() => setDeleteTarget({ id: sb.id, title: sb.title })}
                onView={() => handleView(sb.id)}
                onCopy={() => handleCopy(sb.id)}
                onTogglePublic={handleTogglePublic}
                onChangeCategory={handleChangeCategory}
                onRename={handleRename}
                variantCount={groupVariants ? variantCountByBaseId.get(sb.id) : undefined}
              />
            ))
          )}
        </div>

        <DeleteConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title={deleteTarget?.title ?? ''}
          loading={deleteMutation.isPending}
        />

        <CategoryManagerModal
          open={showCategoryManager}
          onClose={() => setShowCategoryManager(false)}
          tab={typeFilter}
        />
      </aside>

      {/* Drag overlay - shows a ghost card while dragging */}
      <DragOverlay dropAnimation={null}>
        {draggingStorybook ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-violet-300 dark:border-violet-500 px-3 py-2 w-64 opacity-90">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                {draggingStorybook.coverImage ? (
                  <img
                    src={draggingStorybook.coverImage}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                {draggingStorybook.title}
              </p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
