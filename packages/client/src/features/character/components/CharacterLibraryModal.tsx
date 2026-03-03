import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button';
import { ImageDropZone } from '@/components/ImageDropZone';
import { characterApi } from '../api/character.api';
import type { SavedCharacter, Character } from '@tangobook/shared';

interface CharacterLibraryModalProps {
  existingNames: string[];
  onImport: (character: Character) => void;
  onClose: () => void;
}

export function CharacterLibraryModal({
  existingNames,
  onImport,
  onClose,
}: CharacterLibraryModalProps) {
  const [library, setLibrary] = useState<SavedCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [applyingEn, setApplyingEn] = useState(false);

  const fetchLibrary = useCallback(async () => {
    try {
      const data = await characterApi.getLibrary();
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
      await characterApi.removeFromLibrary(id);
      setLibrary((prev) => prev.filter((c) => c.id !== id));
    } catch {
      /* silent */
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (library.length === 0) return;
    if (!window.confirm(`저장된 캐릭터 ${library.length}개를 모두 삭제하시겠습니까?`)) return;
    setDeletingAll(true);
    try {
      await characterApi.removeAllFromLibrary();
      setLibrary([]);
    } catch {
      /* silent */
    } finally {
      setDeletingAll(false);
    }
  };

  const handleImport = (saved: SavedCharacter) => {
    const { id: _id, createdAt: _createdAt, ...character } = saved;
    onImport(character);
  };

  const startEditing = (char: SavedCharacter) => {
    setEditingId(char.id);
    setEditName(char.name);
    setEditNameEn(char.nameEn ?? '');
  };

  const handleSaveName = async (char: SavedCharacter) => {
    const updates: Partial<Character> = {};
    if (editName.trim() && editName.trim() !== char.name) updates.name = editName.trim();
    if (editNameEn.trim() !== (char.nameEn ?? '')) updates.nameEn = editNameEn.trim() || undefined;
    if (Object.keys(updates).length > 0) {
      try {
        await characterApi.updateInLibrary(char.name, updates);
        setLibrary((prev) => prev.map((c) => (c.id === char.id ? { ...c, ...updates } : c)));
      } catch {
        /* silent */
      }
    }
    setEditingId(null);
  };

  const handleApplyEnglishNames = async () => {
    setApplyingEn(true);
    try {
      await characterApi.applyEnglishNames();
      await fetchLibrary();
    } catch {
      /* silent */
    } finally {
      setApplyingEn(false);
    }
  };

  const handleImageDelete = async (char: SavedCharacter) => {
    setUploadingId(char.id);
    try {
      await characterApi.updateInLibrary(char.name, { referenceImage: undefined });
      setLibrary((prev) =>
        prev.map((c) => (c.id === char.id ? { ...c, referenceImage: undefined } : c))
      );
    } catch {
      /* silent */
    } finally {
      setUploadingId(null);
    }
  };

  const handleImageUpload = async (char: SavedCharacter, file: File) => {
    setUploadingId(char.id);
    try {
      const data = await characterApi.upload(file, 'library', 'character-library', char.name);
      await characterApi.updateInLibrary(char.name, { referenceImage: data.imageUrl });
      setLibrary((prev) =>
        prev.map((c) => (c.id === char.id ? { ...c, referenceImage: data.imageUrl } : c))
      );
    } catch {
      /* silent */
    } finally {
      setUploadingId(null);
    }
  };

  const existingSet = new Set(existingNames.map((n) => n.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            캐릭터 라이브러리
          </h2>
          <div className="flex items-center gap-2">
            {library.length > 0 && (
              <>
                <button
                  onClick={handleApplyEnglishNames}
                  disabled={applyingEn}
                  className="px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-50"
                >
                  {applyingEn ? '적용 중...' : '영어이름 자동적용'}
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deletingAll}
                  className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                >
                  {deletingAll ? '삭제 중...' : `전체 삭제 (${library.length})`}
                </button>
              </>
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
              저장된 캐릭터가 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {library.map((char) => {
                const alreadyAdded = existingSet.has(char.name.toLowerCase());
                const isUploading = uploadingId === char.id;
                return (
                  <ImageDropZone
                    key={char.id}
                    onFile={(file) => handleImageUpload(char, file)}
                    disabled={isUploading}
                    enablePaste={false}
                  >
                    {(openFilePicker) => (
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center relative group">
                        {/* 삭제 버튼 */}
                        <button
                          onClick={() => handleDelete(char.id)}
                          disabled={deletingId === char.id}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:border-red-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
                          title="삭제"
                        >
                          {deletingId === char.id ? (
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

                        {/* 이미지 */}
                        {isUploading ? (
                          <div className="w-full aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg mb-2 flex items-center justify-center">
                            <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
                          </div>
                        ) : char.referenceImage ? (
                          <div
                            className="relative cursor-pointer"
                            onClick={openFilePicker}
                            title="클릭하거나 이미지를 드래그해서 변경"
                          >
                            <img
                              src={char.referenceImage}
                              alt={char.name}
                              className="w-full aspect-square object-cover rounded-lg mb-2"
                            />
                            <div className="absolute inset-0 rounded-lg bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center mb-2">
                              <svg
                                className="w-6 h-6 text-white opacity-0 group-hover:opacity-70 transition-opacity"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            {/* 이미지 삭제 버튼 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageDelete(char);
                              }}
                              className="absolute bottom-3 left-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
                              title="이미지 삭제"
                            >
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={openFilePicker}
                            className="w-full aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg mb-2 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            title="클릭하거나 이미지를 드래그해서 추가"
                          >
                            <svg
                              className="w-6 h-6 mb-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-[10px]">이미지 추가</span>
                          </div>
                        )}

                        {/* 이름 & 영어이름 */}
                        {editingId === char.id ? (
                          <div className="space-y-1 mt-1">
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="한글 이름"
                              className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-slate-100 outline-none focus:ring-1 focus:ring-violet-400"
                            />
                            <input
                              value={editNameEn}
                              onChange={(e) => setEditNameEn(e.target.value)}
                              placeholder="English name"
                              className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-slate-100 outline-none focus:ring-1 focus:ring-violet-400"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleSaveName(char)}
                                className="flex-1 px-2 py-1 text-[10px] font-medium bg-violet-500 text-white rounded hover:bg-violet-600 transition-colors"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex-1 px-2 py-1 text-[10px] font-medium bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer"
                            onClick={() => startEditing(char)}
                            title="클릭하여 이름 수정"
                          >
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                              {char.name}
                            </p>
                            {char.nameEn && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate">
                                {char.nameEn}
                              </p>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 font-medium">
                              {char.role}
                            </span>
                          </div>
                        )}
                        {editingId !== char.id && char.description && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-1">
                            {char.description}
                          </p>
                        )}

                        {/* 불러오기 버튼 */}
                        <div className="mt-2">
                          {alreadyAdded ? (
                            <span className="inline-block px-3 py-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg">
                              추가됨
                            </span>
                          ) : (
                            <Button size="sm" className="w-full" onClick={() => handleImport(char)}>
                              불러오기
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </ImageDropZone>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
