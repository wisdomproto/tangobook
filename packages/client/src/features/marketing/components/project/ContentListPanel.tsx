import { CSSProperties, useState } from 'react';
import { Plus, FileText, MoreHorizontal, Trash2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useContents, useDeleteContent, useReorderContents } from '../../api/use-contents';
import { ContentStatusPanel } from '../content/ContentStatusPanel';
import { useUIStore } from '../../store/ui-store';
import { CreateContentDialog } from './CreateContentDialog';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../ui/dropdown-menu';
import { cn } from '../../lib/utils';
import type { Content } from '../../types/database';

// ---------------------------------------------------------------------------
// Category color map (first letter of category string)
// ---------------------------------------------------------------------------

const CAT_COLORS: Record<string, string> = {
  A: 'bg-blue-500/20 text-blue-600',
  B: 'bg-pink-500/20 text-pink-600',
  C: 'bg-green-500/20 text-green-600',
  D: 'bg-orange-500/20 text-orange-600',
  E: 'bg-purple-500/20 text-purple-600',
};

function getCatLetter(category: string | null): string {
  return category?.charAt(0).toUpperCase() ?? '';
}

// ---------------------------------------------------------------------------
// Sortable item
// ---------------------------------------------------------------------------

interface SortableContentItemProps {
  content: Content;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

function SortableContentItem({
  content,
  isSelected,
  onSelect,
  onDelete,
  disabled = false,
}: SortableContentItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: content.id,
    disabled,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const catLetter = getCatLetter(content.category);

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="content-item"
      className="group flex items-center overflow-hidden rounded-lg"
    >
      {/* Drag handle (제목순 정렬 중엔 숨김 — 순서 고정) */}
      {disabled ? (
        <span className="shrink-0 px-1 w-[20px]" aria-hidden />
      ) : (
        <button
          {...attributes}
          {...listeners}
          aria-label="드래그 핸들"
          className="shrink-0 px-1 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground"
        >
          <GripVertical size={12} />
        </button>
      )}

      {/* Main select button */}
      <button
        onClick={onSelect}
        className={cn(
          'flex-1 min-w-0 flex items-center gap-1.5 px-2 py-1.5 text-sm transition-colors rounded-lg hover:bg-accent',
          isSelected && 'bg-primary/10'
        )}
      >
        {catLetter ? (
          <span
            title={content.category ?? ''}
            className={cn(
              'text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center shrink-0',
              CAT_COLORS[catLetter] ?? 'bg-muted text-muted-foreground'
            )}
          >
            {catLetter}
          </span>
        ) : (
          <FileText size={14} className="shrink-0 text-muted-foreground" />
        )}

        <span className="flex-1 min-w-0 text-left truncate text-xs" title={content.title}>
          {content.title}
        </span>
      </button>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="콘텐츠 옵션"
            className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal size={12} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4}>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 size={14} /> 삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ContentListPanel
// ---------------------------------------------------------------------------

export function ContentListPanel() {
  const [createOpen, setCreateOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [sortByTitle, setSortByTitle] = useState(false);

  const {
    selectedProjectId,
    selectedContentId,
    setSelectedContentId,
    contentKindTab,
    setContentKindTab,
  } = useUIStore();
  const { data: contents = [] } = useContents(selectedProjectId);
  const deleteContent = useDeleteContent();
  const reorderContents = useReorderContents();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isAd = contentKindTab === 'ad';

  // Sort by sort_order, then split by kind (정규 / 광고)
  const sorted = [...contents]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((c) => (c.content_kind ?? 'regular') === contentKindTab);

  // Counts per kind (for tab badges)
  const regularCount = contents.filter((c) => (c.content_kind ?? 'regular') === 'regular').length;
  const adCount = contents.filter((c) => c.content_kind === 'ad').length;

  // Unique categories present in the list (광고 탭은 카테고리 미사용)
  const categories = isAd
    ? []
    : ([...new Set(sorted.map((c) => c.category).filter(Boolean))] as string[]);

  // Apply category filter
  const filtered = catFilter
    ? sorted.filter((c) => getCatLetter(c.category) === catFilter)
    : sorted;

  // 제목순 정렬(옵션) — numeric 인식(01·02·10 정확 정렬). 카테고리 필터 안에서 동작.
  const displayed = sortByTitle
    ? [...filtered].sort((a, b) =>
        (a.title ?? '').localeCompare(b.title ?? '', 'ko', { numeric: true })
      )
    : filtered;

  function switchKind(kind: 'regular' | 'ad') {
    setContentKindTab(kind);
    setCatFilter(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (sortByTitle) return; // 제목순 정렬 중엔 수동 재정렬 비활성
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = filtered.findIndex((c) => c.id === active.id);
    const newIdx = filtered.findIndex((c) => c.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(filtered, oldIdx, newIdx);
    if (selectedProjectId) {
      reorderContents.mutate({
        projectId: selectedProjectId,
        contentIds: reordered.map((c) => c.id),
      });
    }
  }

  function handleDelete(content: Content) {
    deleteContent.mutate({ id: content.id, projectId: content.project_id });
  }

  // Empty state: no project selected
  if (!selectedProjectId) {
    return (
      <aside className="w-64 border-r border-border flex flex-col h-full bg-background shrink-0">
        <div className="flex-1 flex items-center justify-center p-4 text-xs text-muted-foreground text-center">
          프로젝트를 선택하세요
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside className="w-64 border-r border-border flex flex-col h-full bg-background shrink-0">
        {/* 정규 / 광고 탭 */}
        <div className="flex shrink-0 border-b border-border">
          {[
            { kind: 'regular' as const, label: '정규 콘텐츠', count: regularCount },
            { kind: 'ad' as const, label: '광고 콘텐츠', count: adCount },
          ].map((t) => (
            <button
              key={t.kind}
              onClick={() => switchKind(t.kind)}
              className={cn(
                'flex-1 px-2 py-2 text-xs font-semibold border-b-2 transition-colors',
                contentKindTab === t.kind
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t.kind === 'ad' ? '📣 ' : ''}
              {t.label}
              <span className="ml-1 font-normal text-muted-foreground">({t.count})</span>
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">
              {isAd ? '광고' : '콘텐츠'}{' '}
              <span className="text-muted-foreground font-normal">({sorted.length})</span>
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  'h-7 px-1.5 text-[11px]',
                  sortByTitle && 'bg-primary/10 text-foreground'
                )}
                onClick={() => setSortByTitle((v) => !v)}
                title={sortByTitle ? '제목순 정렬 (클릭 시 수동 순서로)' : '제목순으로 정렬'}
                aria-pressed={sortByTitle}
              >
                🔤 제목순
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-1.5 text-[11px]"
                onClick={() => setStatusOpen(true)}
                title="콘텐츠 현황 (언어 × 채널 준비/배포 상태)"
              >
                📊 현황
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setCreateOpen(true)}
                title="새 콘텐츠"
                aria-label="새 콘텐츠"
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>

          {/* Category filter chips */}
          {categories.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setCatFilter(null)}
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded transition-colors',
                  !catFilter
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                전체
              </button>
              {categories.sort().map((cat) => {
                const letter = getCatLetter(cat);
                return (
                  <button
                    key={cat}
                    title={cat}
                    onClick={() => setCatFilter(catFilter === letter ? null : letter)}
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded transition-colors',
                      catFilter === letter
                        ? 'bg-primary text-primary-foreground'
                        : (CAT_COLORS[letter] ?? 'bg-muted text-muted-foreground')
                    )}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-1 py-2 space-y-0.5">
          {displayed.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              {isAd ? '광고 콘텐츠가 없습니다' : '콘텐츠가 없습니다'}
              <br />
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-2 text-primary hover:underline"
              >
                {isAd ? '+ 새 광고 만들기' : '+ 새 콘텐츠 만들기'}
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayed.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {displayed.map((content) => (
                  <SortableContentItem
                    key={content.id}
                    content={content}
                    isSelected={selectedContentId === content.id}
                    onSelect={() => setSelectedContentId(content.id)}
                    onDelete={() => handleDelete(content)}
                    disabled={sortByTitle}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </aside>

      <CreateContentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={selectedProjectId}
        kind={contentKindTab}
      />

      {statusOpen && (
        <ContentStatusPanel
          contents={sorted}
          projectId={selectedProjectId}
          onClose={() => setStatusOpen(false)}
        />
      )}
    </>
  );
}
