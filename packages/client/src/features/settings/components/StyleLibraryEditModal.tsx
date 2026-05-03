import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/design-system';
import { settingsApi } from '../api/settings.api';
import type { SavedArtStyle } from '@tangobook/shared';

interface StyleLibraryEditModalProps {
  onClose: () => void;
}

const LIBRARY_KEY = ['art-style-library'];

/** open=true 일 때만 caller 가 mount 하도록 (conditional render). useQuery 무한 루프 방지. */
export function StyleLibraryEditModal({ onClose }: StyleLibraryEditModalProps) {
  const qc = useQueryClient();
  const { data: library, isLoading } = useQuery({
    queryKey: LIBRARY_KEY,
    queryFn: settingsApi.getArtStyleLibrary,
  });

  const items: SavedArtStyle[] = library ?? [];

  // 인라인 편집 / 새 추가용 로컬 입력 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { name?: string; prompt?: string } }) =>
      settingsApi.updateArtStyle(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: LIBRARY_KEY }),
  });
  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => settingsApi.reorderArtStyles(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: LIBRARY_KEY }),
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => settingsApi.removeArtStyle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: LIBRARY_KEY }),
  });
  const saveMutation = useMutation({
    mutationFn: (data: { name: string; prompt: string }) => settingsApi.saveArtStyle(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: LIBRARY_KEY }),
  });

  const move = (idx: number, delta: number) => {
    const next = [...items];
    const j = idx + delta;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    // optimistic cache 업데이트 (re-render 없이 즉시 반영)
    qc.setQueryData<SavedArtStyle[]>(LIBRARY_KEY, next);
    reorderMutation.mutate(next.map((s) => s.id));
  };

  const startEdit = (style: SavedArtStyle) => {
    setEditingId(style.id);
    setEditName(style.name);
    setEditPrompt(style.prompt);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPrompt('');
  };
  const commitEdit = (id: string) => {
    updateMutation.mutate(
      { id, patch: { name: editName.trim(), prompt: editPrompt.trim() } },
      { onSuccess: cancelEdit }
    );
  };

  const handleAdd = () => {
    if (!newName.trim() || !newPrompt.trim()) return;
    saveMutation.mutate(
      { name: newName.trim(), prompt: newPrompt.trim() },
      {
        onSuccess: () => {
          setNewName('');
          setNewPrompt('');
        },
      }
    );
  };

  const handleRemove = (style: SavedArtStyle) => {
    if (
      !window.confirm(
        `"${style.name}" 그림체를 라이브러리에서 제거할까요?\n(이미 책에 적용된 그림체는 그대로 남습니다.)`
      )
    )
      return;
    removeMutation.mutate(style.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            🎨 그림체 라이브러리 편집
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="닫기"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* 새 그림체 추가 form */}
              <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10 p-4">
                <div className="text-xs font-bold text-violet-700 dark:text-violet-300 mb-2">
                  + 새 그림체 추가
                </div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="이름 (예: 동양화)"
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-400"
                  />
                </div>
                <textarea
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="프롬프트 (영어 권장 — 예: Traditional Korean ink wash painting, ...)"
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-400 resize-none"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    disabled={!newName.trim() || !newPrompt.trim() || saveMutation.isPending}
                    loading={saveMutation.isPending}
                  >
                    추가
                  </Button>
                </div>
              </div>

              {/* 기존 그림체 목록 */}
              {items.length === 0 ? (
                <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">
                  저장된 그림체가 없어요.
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((style, idx) => {
                    const isEditing = editingId === style.id;
                    return (
                      <div
                        key={style.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-3"
                      >
                        <div className="flex items-start gap-2">
                          {/* ↑↓ 순서 버튼 */}
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              onClick={() => move(idx, -1)}
                              disabled={idx === 0 || reorderMutation.isPending}
                              className="w-6 h-6 rounded text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 disabled:opacity-30 disabled:hover:bg-transparent text-xs"
                              title="위로"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => move(idx, 1)}
                              disabled={idx === items.length - 1 || reorderMutation.isPending}
                              className="w-6 h-6 rounded text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 disabled:opacity-30 disabled:hover:bg-transparent text-xs"
                              title="아래로"
                            >
                              ▼
                            </button>
                          </div>

                          {/* 참고 이미지 */}
                          {style.referenceImageUrl && (
                            <img
                              src={style.referenceImageUrl}
                              alt={style.name}
                              className="w-14 h-14 object-cover rounded-lg shrink-0"
                            />
                          )}

                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full px-2 py-1 text-sm font-semibold rounded border border-violet-200 dark:border-violet-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-400 mb-1"
                                />
                                <textarea
                                  value={editPrompt}
                                  onChange={(e) => setEditPrompt(e.target.value)}
                                  rows={2}
                                  className="w-full px-2 py-1 text-xs rounded border border-violet-200 dark:border-violet-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-violet-400 resize-none"
                                />
                                <div className="mt-1 flex gap-1 justify-end">
                                  <button
                                    onClick={cancelEdit}
                                    className="px-2 py-1 text-xs rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                                  >
                                    취소
                                  </button>
                                  <Button
                                    size="sm"
                                    onClick={() => commitEdit(style.id)}
                                    loading={updateMutation.isPending}
                                  >
                                    저장
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-1">
                                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    {style.name}
                                  </p>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ({style.id})
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                  {style.prompt}
                                </p>
                              </>
                            )}
                          </div>

                          {/* action buttons */}
                          {!isEditing && (
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => startEdit(style)}
                                className="px-2 py-1 text-xs rounded text-violet-600 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-900/30"
                                title="수정"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleRemove(style)}
                                disabled={removeMutation.isPending}
                                className="px-2 py-1 text-xs rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                                title="삭제"
                              >
                                🗑
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
          💡 ART_STYLES preset (paper-craft, watercolor 등) 도 여기서 편집 가능. id 는 보존되어 기존
          책 자산은 영향 없어요.
        </div>
      </div>
    </div>
  );
}
