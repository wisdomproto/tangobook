import { useMemo, useState } from 'react';
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
import { STORYBOOK_CATEGORIES, PHONICS_CATEGORIES } from '@tangobook/shared';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import { SidebarCard } from './SidebarCard';
import { DeleteConfirmModal } from './DeleteConfirmModal';

function DroppableFolder({
  folderId,
  label,
  count,
  isActive,
  isOver,
  onClick,
  onDelete,
}: {
  folderId: string;
  label: string;
  count: number;
  isActive: boolean;
  isOver: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) {
  const { setNodeRef, isOver: dropping } = useDroppable({ id: `folder:${folderId}` });
  const highlighted = isOver || dropping;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={setNodeRef}
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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
      {onDelete && hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
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
  );
}

export function Sidebar() {
  const { data: storybooks, isLoading } = useStorybooks();
  const deleteMutation = useDeleteStorybook();
  const patchMutation = usePatchStorybook();
  const copyMutation = useCopyStorybook();

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
  const folder = useEditorStore((s) => s.sidebarFolder);
  const setFolder = useEditorStore((s) => s.setSidebarFolder);
  const customFolders = useEditorStore((s) => s.customFolders);
  const addCustomFolder = useEditorStore((s) => s.addCustomFolder);
  const removeCustomFolder = useEditorStore((s) => s.removeCustomFolder);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // 타입별 카테고리 목록
  const categories = useMemo(() => {
    const items = typeFilter === 'phonics' ? PHONICS_CATEGORIES : STORYBOOK_CATEGORIES;
    return [{ value: 'all', label: '전체' }, ...items.map((c) => ({ value: c, label: c }))];
  }, [typeFilter]);

  // Require 8px movement to start drag (prevents conflict with click)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Extract unique folders from storybooks + custom folders
  const folders = useMemo(() => {
    const set = new Set<string>();
    storybooks?.forEach((s) => {
      if (s.folder) set.add(s.folder);
    });
    customFolders.forEach((f) => set.add(f));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [storybooks, customFolders]);

  // Folder counts
  const folderCounts = useMemo(() => {
    if (!storybooks) return {};
    const counts: Record<string, number> = {};
    storybooks.forEach((s) => {
      const f = s.folder || '';
      counts[f] = (counts[f] || 0) + 1;
    });
    return counts;
  }, [storybooks]);

  const filtered = useMemo(() => {
    if (!storybooks) return [];
    let list = [...storybooks];

    // Type filter
    list = list.filter((s) => (s.type ?? 'storybook') === typeFilter);

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
  }, [storybooks, search, category, visibility, sort, folder, typeFilter]);

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
          {(['storybook', 'phonics'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTypeFilter(t);
                setCategory('all');
              }}
              className={`flex-1 py-3 text-sm font-semibold text-center transition-colors border-b-2 ${
                typeFilter === t
                  ? t === 'phonics'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-violet-600 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {t === 'storybook' ? '동화책' : '파닉스 유닛'}
            </button>
          ))}
        </div>

        {/* 새로 만들기 버튼 (선택된 탭에 맞는 것만) */}
        <div className="p-3">
          {typeFilter === 'phonics' ? (
            <button
              onClick={() => {
                setCreateFormType('phonics');
                setShowCreateForm(true);
              }}
              className="w-full px-3 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              + 새 파닉스 유닛 만들기
            </button>
          ) : (
            <Button
              className="w-full"
              onClick={() => {
                setCreateFormType('storybook');
                setShowCreateForm(true);
              }}
            >
              + 새 동화책 만들기
            </Button>
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
          <div className="space-y-0.5">
            <DroppableFolder
              folderId="all"
              label="전체"
              count={storybooks?.length ?? 0}
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
                selected={selectedId === sb.id}
                onSelect={() => setSelectedId(sb.id)}
                onDelete={() => setDeleteTarget({ id: sb.id, title: sb.title })}
                onView={() => handleView(sb.id)}
                onCopy={() => handleCopy(sb.id)}
                onTogglePublic={handleTogglePublic}
                onChangeCategory={handleChangeCategory}
                onRename={handleRename}
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
