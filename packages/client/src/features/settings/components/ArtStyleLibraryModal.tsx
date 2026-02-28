import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button';
import { settingsApi } from '../api/settings.api';
import type { SavedArtStyle } from '@tangobook/shared';

interface ArtStyleLibraryModalProps {
  currentPrompt: string;
  onApply: (prompt: string) => void;
  onClose: () => void;
}

export function ArtStyleLibraryModal({
  currentPrompt,
  onApply,
  onClose,
}: ArtStyleLibraryModalProps) {
  const [library, setLibrary] = useState<SavedArtStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const fetchLibrary = useCallback(async () => {
    try {
      const data = await settingsApi.getArtStyleLibrary();
      setLibrary(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await settingsApi.removeArtStyle(id);
      setLibrary((prev) => prev.filter((s) => s.id !== id));
    } catch {
      /* silent */
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (library.length === 0) return;
    if (!window.confirm(`저장된 그림체 ${library.length}개를 모두 삭제하시겠습니까?`)) return;
    setDeletingAll(true);
    try {
      await settingsApi.removeAllArtStyles();
      setLibrary([]);
    } catch {
      /* silent */
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            그림체 라이브러리
          </h2>
          <div className="flex items-center gap-2">
            {library.length > 0 && (
              <button
                onClick={handleDeleteAll}
                disabled={deletingAll}
                className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
              >
                {deletingAll ? '삭제 중...' : `전체 삭제 (${library.length})`}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
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
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
            </div>
          ) : library.length === 0 ? (
            <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-12">
              저장된 그림체가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {library.map((style) => {
                const isActive = style.prompt === currentPrompt;
                return (
                  <div
                    key={style.id}
                    className={`rounded-xl border p-4 relative group transition-colors ${
                      isActive
                        ? 'border-violet-300 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-700'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
                    }`}
                  >
                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => handleDelete(style.id)}
                      disabled={deletingId === style.id}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:border-red-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
                      title="삭제"
                    >
                      {deletingId === style.id ? (
                        <div className="w-3 h-3 animate-spin border-2 border-red-400 border-t-transparent rounded-full" />
                      ) : (
                        <svg
                          className="w-3 h-3"
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
                      )}
                    </button>

                    <div className="flex gap-4">
                      {/* 참고 이미지 */}
                      {style.referenceImageUrl && (
                        <img
                          src={style.referenceImageUrl}
                          alt={style.name}
                          className="w-20 h-20 object-cover rounded-lg shrink-0"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        {/* 이름 */}
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {style.name}
                        </p>
                        {/* 프롬프트 */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {style.prompt}
                        </p>

                        {/* 적용 버튼 */}
                        <div className="mt-2">
                          {isActive ? (
                            <span className="inline-block px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                              사용 중
                            </span>
                          ) : (
                            <Button size="sm" onClick={() => onApply(style.prompt)}>
                              적용
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
