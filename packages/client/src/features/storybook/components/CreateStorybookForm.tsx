import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/Button';
import { useGenerateStory, useGenerateStorybook } from '../hooks/useStorybookMutations';
import { useEditorStore } from '@/store/editor.store';
import { TARGET_AGES, ART_STYLES } from '@tangobook/shared';
import type { StoryDraftPage } from '@tangobook/shared';

// === Sortable Draft Page Card ===
interface DraftPageCardProps {
  page: StoryDraftPage;
  onTextChange: (pageNumber: number, text: string) => void;
  onSceneChange: (pageNumber: number, scene: string) => void;
  onDelete: (pageNumber: number) => void;
}

function DraftPageCard({ page, onTextChange, onSceneChange, onDelete }: DraftPageCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.pageNumber,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          title="드래그하여 순서 변경"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8-16a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
          </svg>
        </button>

        {/* Page number */}
        <span className="mt-2 text-sm font-semibold text-violet-600 min-w-[2rem]">
          {page.pageNumber}
        </span>

        {/* Content */}
        <div className="flex-1 space-y-2">
          {/* Text area */}
          <textarea
            value={page.text}
            onChange={(e) => onTextChange(page.pageNumber, e.target.value)}
            rows={3}
            placeholder="페이지 텍스트"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
          />
          {/* Scene description */}
          <textarea
            value={page.scene_description ?? ''}
            onChange={(e) => onSceneChange(page.pageNumber, e.target.value)}
            rows={2}
            placeholder="장면 설명 (한글, 삽화 생성용)"
            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none text-xs text-slate-500 dark:text-slate-400 dark:bg-slate-700 dark:border-slate-600"
          />
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDelete(page.pageNumber)}
          className="mt-2 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
          title="페이지 삭제"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// === Loading Spinner ===
function LoadingSpinner({
  message,
  sub,
  onCancel,
}: {
  message: string;
  sub: string;
  onCancel?: () => void;
}) {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
          <svg className="w-10 h-10 text-violet-600 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">{message}</h3>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4">
          <div className="bg-violet-600 h-2 rounded-full animate-pulse" style={{ width: '40%' }} />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{sub}</p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
          >
            취소
          </button>
        )}
      </div>
    </div>
  );
}

// === Main Component ===
export function CreateStorybookForm() {
  const storyMutation = useGenerateStory();
  const generateMutation = useGenerateStorybook();
  const setSelectedId = useEditorStore((s) => s.setSelectedStorybookId);
  const setShowCreateForm = useEditorStore((s) => s.setShowCreateForm);

  const [title, setTitle] = useState('');
  const [targetAge, setTargetAge] = useState<(typeof TARGET_AGES)[number]>(TARGET_AGES[0]);
  const [referenceContent, setReferenceContent] = useState('');
  const [refOpen, setRefOpen] = useState(false);

  // Step 2: draft pages from AI
  const [draftPages, setDraftPages] = useState<StoryDraftPage[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Step 1: Generate story text only
  const handleGenerateStory = () => {
    if (!title.trim()) return;
    storyMutation.mutate(
      { title: title.trim(), targetAge, referenceContent: referenceContent.trim() || undefined },
      {
        onSuccess: (pages) => {
          setDraftPages(pages);
        },
      }
    );
  };

  // Step 2: Generate full storybook from confirmed draft
  const handleGenerateStorybook = () => {
    if (!draftPages?.length) return;

    generateMutation.mutate(
      {
        title: title.trim(),
        targetAge,
        artStyle: ART_STYLES[0].prompt,
        referenceContent: referenceContent.trim() || undefined,
        draftPages,
      },
      {
        onSuccess: (data) => {
          setSelectedId(data.id);
        },
      }
    );
  };

  // Draft page editing
  const handleTextChange = useCallback((pageNumber: number, text: string) => {
    setDraftPages(
      (prev) => prev?.map((p) => (p.pageNumber === pageNumber ? { ...p, text } : p)) ?? null
    );
  }, []);

  const handleSceneChange = useCallback((pageNumber: number, scene_description: string) => {
    setDraftPages(
      (prev) =>
        prev?.map((p) => (p.pageNumber === pageNumber ? { ...p, scene_description } : p)) ?? null
    );
  }, []);

  const handleDeletePage = useCallback((pageNumber: number) => {
    setDraftPages((prev) => {
      if (!prev) return null;
      const filtered = prev.filter((p) => p.pageNumber !== pageNumber);
      return filtered.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
  }, []);

  const handleAddPage = () => {
    setDraftPages((prev) => {
      if (!prev) return null;
      return [...prev, { pageNumber: prev.length + 1, text: '' }];
    });
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDraftPages((prev) => {
      if (!prev) return null;
      const oldIndex = prev.findIndex((p) => p.pageNumber === active.id);
      const newIndex = prev.findIndex((p) => p.pageNumber === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;

      const next = [...prev];
      const [moved] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, moved);
      return next.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
  }, []);

  const handleResetStory = () => {
    setDraftPages(null);
    storyMutation.reset();
  };

  // Loading states
  if (storyMutation.isPending) {
    return (
      <LoadingSpinner
        message="AI가 스토리를 만들고 있어요..."
        sub="10-20초 정도 걸려요"
        onCancel={() => {
          storyMutation.reset();
        }}
      />
    );
  }
  if (generateMutation.isPending) {
    return (
      <LoadingSpinner
        message="AI가 동화책을 만들고 있어요..."
        sub="30-60초 정도 걸려요"
        onCancel={() => {
          generateMutation.reset();
        }}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">새 동화책 만들기</h1>
      </div>

      <div className="space-y-6">
        {/* 기본 정보 */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
            기본 정보
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                동화책 제목 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 용감한 토끼의 모험"
                disabled={!!draftPages}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                대상 연령 *
              </label>
              <div className="flex gap-2">
                {TARGET_AGES.map((age) => (
                  <button
                    key={age}
                    onClick={() => setTargetAge(age)}
                    disabled={!!draftPages}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      targetAge === age
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    } disabled:opacity-60`}
                  >
                    {age}세
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 참고 내용 (접을 수 있는 아코디언) */}
        {!draftPages && (
          <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setRefOpen(!refOpen)}
              className="w-full px-5 py-4 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              <span>참고 내용 (선택)</span>
              <svg
                className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${refOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {refOpen && (
              <div className="px-5 pb-4">
                <textarea
                  value={referenceContent}
                  onChange={(e) => setReferenceContent(e.target.value)}
                  placeholder="기존 스토리나 참고할 내용을 입력하세요"
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                />
              </div>
            )}
          </section>
        )}

        {/* 에러 */}
        {storyMutation.isError && (
          <p className="text-sm text-red-500">{storyMutation.error.message}</p>
        )}
        {generateMutation.isError && (
          <p className="text-sm text-red-500">{generateMutation.error.message}</p>
        )}

        {/* Step 1: 스토리 만들기 버튼 (draft가 없을 때) */}
        {!draftPages && (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-shrink-0"
              onClick={() => setShowCreateForm(false)}
            >
              취소
            </Button>
            <Button
              className="flex-1"
              size="lg"
              onClick={handleGenerateStory}
              disabled={!title.trim()}
            >
              스토리 만들기
            </Button>
          </div>
        )}

        {/* Step 2: 스토리 검토/수정 (draft가 있을 때) */}
        {draftPages && (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  스토리 미리보기 ({draftPages.length}페이지)
                </h2>
                <Button size="sm" variant="secondary" onClick={handleAddPage}>
                  + 페이지 추가
                </Button>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500">
                페이지를 드래그하여 순서를 변경하고, 텍스트를 수정할 수 있습니다.
              </p>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={draftPages.map((p) => p.pageNumber)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {draftPages.map((page) => (
                      <DraftPageCard
                        key={page.pageNumber}
                        page={page}
                        onTextChange={handleTextChange}
                        onSceneChange={handleSceneChange}
                        onDelete={handleDeletePage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </section>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-shrink-0" onClick={handleResetStory}>
                스토리 다시 만들기
              </Button>
              <Button
                className="flex-1"
                size="lg"
                onClick={handleGenerateStorybook}
                disabled={!draftPages.length || draftPages.every((p) => !p.text.trim())}
              >
                AI로 동화책 생성하기
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
