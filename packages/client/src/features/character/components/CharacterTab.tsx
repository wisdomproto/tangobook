import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/Button';
import { ImageLightbox } from '@/components/ImageLightbox';
import { ImageDropZone } from '@/components/ImageDropZone';
import { ImagePreview } from '@/components/ImagePreview';
import { DownloadButton } from '@/components/DownloadButton';
import { ImageModelSelector } from '@/components/ImageModelSelector';
import { BatchProgressBar } from '@/components/BatchProgressBar';
import { UploadMenu } from '@/components/UploadMenu';
import { characterApi } from '../api/character.api';
import { pushImageHistory } from '@/lib/image-history';
import { CharacterLibraryModal } from './CharacterLibraryModal';
import type { Storybook, Character } from '@tangobook/shared';

interface CharacterTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

export function CharacterTab({ storybook, onUpdate, onSave }: CharacterTabProps) {
  const characters = storybook.characters ?? [];
  const [generatingSet, setGeneratingSet] = useState<Set<number>>(new Set());
  const [errorMap, setErrorMap] = useState<Map<number, string>>(new Map());
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);
  const [editingPrompt, setEditingPrompt] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [newChar, setNewChar] = useState({ name: '', role: '조연', description: '' });
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedIdx, setSavedIdx] = useState<number | null>(null);

  const isAnyGenerating = generatingSet.size > 0;
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(
    async (idx: number, signal?: AbortSignal) => {
      const char = (storybook.characters ?? [])[idx];
      if (!char) return;

      setGeneratingSet((prev) => new Set(prev).add(idx));
      setErrorMap((prev) => {
        const m = new Map(prev);
        m.delete(idx);
        return m;
      });

      try {
        const data = await characterApi.generate(
          {
            character: char,
            artStyle: storybook.artStyle,
            storybookId: storybook.id,
            storybookTitle: storybook.title,
            currentImageUrl: char.referenceImage,
            model: storybook.imageModels?.character,
          },
          signal
        );
        onUpdate((draft) => {
          const c = draft.characters[idx];
          c.imageHistory = pushImageHistory(c.imageHistory, c.referenceImage);
          c.referenceImage = data.imageUrl;
        });
        onSave();
        // 라이브러리 자동 동기화
        characterApi.updateInLibrary(char.name, { referenceImage: data.imageUrl }).catch(() => {});
      } catch (err) {
        if (signal?.aborted) return;
        setErrorMap((prev) =>
          new Map(prev).set(idx, err instanceof Error ? err.message : '생성 실패')
        );
      } finally {
        setGeneratingSet((prev) => {
          const s = new Set(prev);
          s.delete(idx);
          return s;
        });
      }
    },
    [storybook, onUpdate, onSave]
  );

  const handleGenerateAll = async () => {
    const ac = new AbortController();
    abortControllerRef.current = ac;
    const total = characters.length;
    let completed = 0;
    setBatchProgress({ current: 0, total });
    try {
      const CONCURRENCY = 3;
      const indices = characters.map((_, i) => i);
      for (let i = 0; i < indices.length; i += CONCURRENCY) {
        ac.signal.throwIfAborted();
        const batch = indices.slice(i, i + CONCURRENCY);
        await Promise.allSettled(batch.map((idx) => handleGenerate(idx, ac.signal)));
        completed += batch.length;
        setBatchProgress({ current: Math.min(completed, total), total });
      }
    } catch {
      // aborted
    } finally {
      abortControllerRef.current = null;
      setBatchProgress(null);
    }
  };

  const handleCancelAll = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleRestoreHistory = (charIdx: number, historyIdx: number) => {
    onUpdate((draft) => {
      const char = draft.characters[charIdx];
      const history = char.imageHistory ?? [];
      const restored = history[historyIdx];
      if (!restored) return;
      if (char.referenceImage) {
        history[historyIdx] = char.referenceImage;
      } else {
        history.splice(historyIdx, 1);
      }
      char.referenceImage = restored;
      char.imageHistory = history;
    });
    onSave();
  };

  const handleAddCharacter = () => {
    if (!newChar.name.trim()) return;
    const character: Character = {
      name: newChar.name.trim(),
      role: newChar.role,
      description: newChar.description.trim(),
      height: 100,
    };
    onUpdate((draft) => {
      draft.characters.push(character);
    });
    onSave();
    setNewChar({ name: '', role: '조연', description: '' });
    setShowAddForm(false);
  };

  const handleDeleteCharacter = (idx: number) => {
    onUpdate((draft) => {
      draft.characters.splice(idx, 1);
    });
    onSave();
  };

  const handleSaveToLibrary = async (idx: number) => {
    const char = (storybook.characters ?? [])[idx];
    if (!char) return;
    setSavingIdx(idx);
    try {
      await characterApi.saveToLibrary(char);
      setSavedIdx(idx);
      setTimeout(() => setSavedIdx(null), 2000);
    } catch {
      /* silent */
    } finally {
      setSavingIdx(null);
    }
  };

  const handleImportFromLibrary = (character: Character) => {
    onUpdate((draft) => {
      draft.characters.push(character);
    });
    onSave();
  };

  const handleUpload = useCallback(
    async (idx: number, file: File) => {
      const char = (storybook.characters ?? [])[idx];
      if (!char) return;
      setUploadingIdx(idx);
      try {
        const data = await characterApi.upload(file, storybook.id, storybook.title, char.name);
        onUpdate((draft) => {
          const c = draft.characters[idx];
          c.imageHistory = pushImageHistory(c.imageHistory, c.referenceImage);
          c.referenceImage = data.imageUrl;
        });
        onSave();
        // 라이브러리 자동 동기화
        characterApi.updateInLibrary(char.name, { referenceImage: data.imageUrl }).catch(() => {});
      } catch {
        setErrorMap((prev) => new Map(prev).set(idx, '업로드 실패'));
      } finally {
        setUploadingIdx(null);
      }
    },
    [storybook, onUpdate, onSave]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          캐릭터 ({characters.length}명)
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowLibrary(true)}>
            라이브러리
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowAddForm(!showAddForm)}>
            + 캐릭터 추가
          </Button>
          <Button size="sm" onClick={handleGenerateAll} disabled={isAnyGenerating}>
            {isAnyGenerating
              ? `생성 중 (${generatingSet.size}/${characters.length})`
              : '모든 레퍼런스 생성'}
          </Button>
        </div>
      </div>

      <ImageModelSelector
        value={storybook.imageModels?.character}
        onChange={(modelId) => {
          onUpdate((d) => {
            if (!d.imageModels) d.imageModels = {};
            d.imageModels.character = modelId;
          });
          onSave();
        }}
        label="모델"
      />

      {batchProgress && (
        <BatchProgressBar
          current={batchProgress.current}
          total={batchProgress.total}
          label="캐릭터 생성"
          onCancel={handleCancelAll}
        />
      )}

      {showAddForm && (
        <div className="bg-violet-50 dark:bg-violet-900/30 rounded-xl border border-violet-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-violet-800 dark:text-violet-300">
            새 캐릭터 추가
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={newChar.name}
              onChange={(e) => setNewChar({ ...newChar, name: e.target.value })}
              placeholder="이름"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            />
            <select
              value={newChar.role}
              onChange={(e) => setNewChar({ ...newChar, role: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            >
              <option value="주인공">주인공</option>
              <option value="조연">조연</option>
              <option value="악당">악당</option>
              <option value="동물">동물</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <textarea
            value={newChar.description}
            onChange={(e) => setNewChar({ ...newChar, description: e.target.value })}
            placeholder="캐릭터 설명"
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="secondary" onClick={() => setShowAddForm(false)}>
              취소
            </Button>
            <Button size="sm" onClick={handleAddCharacter} disabled={!newChar.name.trim()}>
              추가
            </Button>
          </div>
        </div>
      )}

      {characters.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">캐릭터가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {characters.map((char, idx) => (
            <ImageDropZone
              key={idx}
              onFile={(file) => handleUpload(idx, file)}
              disabled={generatingSet.has(idx) || uploadingIdx === idx}
              enablePaste={false}
            >
              {(openFilePicker) => (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center relative group">
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteCharacter(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:border-red-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
                    title="삭제"
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

                  {/* Image */}
                  <ImagePreview
                    src={char.referenceImage}
                    alt={char.name}
                    loading={generatingSet.has(idx)}
                    className="mb-2"
                    onClick={() => char.referenceImage && setLightboxUrl(char.referenceImage)}
                    onDelete={() => {
                      onUpdate((draft) => {
                        draft.characters[idx].referenceImage = undefined;
                      });
                      onSave();
                    }}
                  />

                  {/* Name & Role */}
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {char.name}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 font-medium">
                      {char.role}
                    </span>
                    {char.age && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {char.age}세
                      </span>
                    )}
                    {char.heightCm && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {char.heightCm}cm
                      </span>
                    )}
                  </div>
                  {char.description && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-1">
                      {char.description}
                    </p>
                  )}

                  {/* Prompt accordion */}
                  <button
                    onClick={() => {
                      const next = expandedPrompt === idx ? null : idx;
                      if (next !== null) setEditingPrompt(char.customPrompt ?? char.description);
                      setExpandedPrompt(next);
                    }}
                    className="text-xs text-violet-600 hover:text-violet-700 font-medium mt-1 flex items-center justify-center gap-0.5 w-full"
                  >
                    프롬프트
                    <svg
                      className={`w-3 h-3 transition-transform ${expandedPrompt === idx ? 'rotate-180' : ''}`}
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
                  {expandedPrompt === idx && (
                    <textarea
                      value={editingPrompt}
                      onChange={(e) => setEditingPrompt(e.target.value)}
                      onBlur={() => {
                        onUpdate((draft) => {
                          draft.characters[idx].customPrompt = editingPrompt;
                        });
                        onSave();
                      }}
                      rows={3}
                      className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none resize-none text-xs text-slate-600 dark:text-slate-300 text-left dark:bg-slate-700 dark:border-slate-600"
                      placeholder="캐릭터 이미지 생성 프롬프트 수정..."
                    />
                  )}

                  {/* History thumbnails */}
                  {char.imageHistory && char.imageHistory.length > 0 && (
                    <div className="mt-1.5">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                        히스토리 ({char.imageHistory.length})
                      </p>
                      <div className="flex gap-1 flex-wrap justify-center">
                        {char.imageHistory.map((url, hIdx) => (
                          <button
                            key={hIdx}
                            onClick={() => handleRestoreHistory(idx, hIdx)}
                            className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 overflow-hidden hover:ring-2 hover:ring-violet-400 transition"
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1 mt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleGenerate(idx)}
                      loading={generatingSet.has(idx) || uploadingIdx === idx}
                      disabled={generatingSet.has(idx) || uploadingIdx === idx}
                    >
                      {char.referenceImage ? '재생성' : '생성'}
                    </Button>
                    {char.referenceImage && (
                      <DownloadButton href={char.referenceImage} filename={`${char.name}.png`} />
                    )}
                    <UploadMenu
                      onFile={(file) => handleUpload(idx, file)}
                      openFilePicker={openFilePicker}
                      disabled={generatingSet.has(idx) || uploadingIdx === idx}
                    />
                    <button
                      onClick={() => handleSaveToLibrary(idx)}
                      disabled={savingIdx === idx}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-300 dark:hover:border-amber-600 text-slate-400 hover:text-amber-500 transition-colors disabled:opacity-50"
                      title="라이브러리에 저장"
                    >
                      {savingIdx === idx ? (
                        <div className="w-4 h-4 animate-spin border-2 border-amber-400 border-t-transparent rounded-full" />
                      ) : savedIdx === idx ? (
                        <svg
                          className="w-4 h-4 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {errorMap.has(idx) && (
                    <p className="text-xs text-red-500 mt-1">{errorMap.get(idx)}</p>
                  )}
                </div>
              )}
            </ImageDropZone>
          ))}
        </div>
      )}

      {lightboxUrl && (
        <ImageLightbox src={lightboxUrl} alt="캐릭터" onClose={() => setLightboxUrl(null)} />
      )}

      {showLibrary && (
        <CharacterLibraryModal
          existingNames={characters.map((c) => c.name)}
          onImport={handleImportFromLibrary}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}
