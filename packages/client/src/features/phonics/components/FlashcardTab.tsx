import { useState, useCallback, useRef, useEffect } from 'react';
import type { Storybook } from '@tangobook/shared';
import { Button } from '@/components/Button';
import { ImageLightbox } from '@/components/ImageLightbox';
import { ImageDropZone } from '@/components/ImageDropZone';
import { ImagePreview } from '@/components/ImagePreview';
import { DownloadButton } from '@/components/DownloadButton';
import { UploadMenu } from '@/components/UploadMenu';
import { ImageModelSelector } from '@/components/ImageModelSelector';
import { BatchProgressBar } from '@/components/BatchProgressBar';
import { pushImageHistory } from '@/lib/image-history';
import { usePhonicsCardActions } from '../hooks/usePhonicsCardActions';
import type { ImageTask, TtsTask } from '../hooks/usePhonicsCardActions';
import { TtsRow } from './TtsRow';
import { ImageDescriptionInput } from './ImageDescriptionInput';
import { ImageHistory } from './ImageHistory';
import { TracingPointEditorModal } from './TracingPointEditorModal';
import { TracingGamePreviewModal } from './TracingGamePreviewModal';

interface FlashcardTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

const stripBold = (s: string) => s.replace(/\*\*/g, '');

/** 단어를 음절(글자) 단위로 분리 — 라이브러리에서 개별 조회 후 연결 */
const toSyllables = (word: string) => word.split('').join(' ');

export function FlashcardTab({ storybook, onUpdate, onSave }: FlashcardTabProps) {
  const flashcards = storybook.flashcards ?? [];
  const isKorean = storybook.phonicsConfig?.language === 'korean';
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => onSave(), 600);
  }, [onSave]);
  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    []
  );
  const [tracingEditIdx, setTracingEditIdx] = useState<number | null>(null);
  const [tracingPreviewIdx, setTracingPreviewIdx] = useState<number | null>(null);

  const {
    isBusy,
    generatingImages,
    generatingTts,
    uploadingKey,
    lightboxUrl,
    setLightboxUrl,
    batchType,
    batchProgress,
    abortRef,
    ttsError,
    setTtsError,
    imageError,
    setImageError,
    getTtsText,
    setTtsText,
    imageMutation,
    generateTts,
    handleUpload,
    handleTtsUpload,
    runBatchImages,
    runBatchTts,
  } = usePhonicsCardActions({ storybook, onUpdate, onSave });

  // --- 플래시카드 히스토리 복원 ---
  const restoreFlashcardHistory = useCallback(
    (cardIdx: number, hIdx: number) => {
      onUpdate((d) => {
        const c = d.flashcards![cardIdx];
        const history = c.imageHistory ?? [];
        const restored = history[hIdx];
        if (!restored) return;
        if (c.imageUrl) history[hIdx] = c.imageUrl;
        else history.splice(hIdx, 1);
        c.imageUrl = restored;
        c.imageHistory = history;
      });
      onSave();
    },
    [onUpdate, onSave]
  );

  // --- 플래시카드 추가 ---
  const addFlashcard = useCallback(() => {
    onUpdate((d) => {
      if (!d.flashcards) d.flashcards = [];
      d.flashcards.push({
        word: '',
        localWord: '',
        phonemes: [],
        sentence: '',
        imageDescription: '',
      });
    });
    onSave();
  }, [onUpdate, onSave]);

  // --- 플래시카드 삭제 ---
  const deleteFlashcard = useCallback(
    (idx: number) => {
      onUpdate((d) => {
        if (d.flashcards) d.flashcards.splice(idx, 1);
      });
      onSave();
    },
    [onUpdate, onSave]
  );

  // --- 배치 이미지 생성 ---
  const handleBatchImages = useCallback(async () => {
    const tasks: ImageTask[] = [];
    flashcards.forEach((card, idx) => {
      if (!card.imageUrl && card.word) {
        tasks.push({
          word: card.word,
          description: card.imageDescription,
          isolatedObject: true,
          updater: (d, url) => {
            const c = d.flashcards![idx];
            c.imageHistory = pushImageHistory(c.imageHistory, c.imageUrl);
            c.imageUrl = url;
          },
        });
      }
    });
    await runBatchImages(tasks);
  }, [flashcards, runBatchImages]);

  // --- 배치 TTS 생성 ---
  const handleBatchTts = useCallback(async () => {
    const tasks: TtsTask[] = [];
    flashcards.forEach((card, idx) => {
      if (!card.ttsUrl && card.word) {
        tasks.push({
          word: getTtsText(`fc-${idx}`, toSyllables(card.word)),
          key: `fc-${idx}`,
          updater: (d, url) => {
            d.flashcards![idx].ttsUrl = url;
          },
        });
      }
      if (!card.sentenceTtsUrl && card.sentence) {
        tasks.push({
          word: getTtsText(`fc-sent-${idx}`, stripBold(card.sentence)),
          key: `fc-sent-${idx}`,
          updater: (d, url) => {
            d.flashcards![idx].sentenceTtsUrl = url;
          },
          useAiTts: true,
        });
      }
    });
    await runBatchTts(tasks);
  }, [flashcards, getTtsText, runBatchTts]);

  const missingImages = flashcards.filter((c) => !c.imageUrl && c.word).length;
  const missingTts = flashcards.reduce((n, c) => {
    if (!c.ttsUrl && c.word) n++;
    if (!c.sentenceTtsUrl && c.sentence) n++;
    return n;
  }, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          핵심단어 ({flashcards.length}개)
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="primary" onClick={addFlashcard} disabled={isBusy}>
            + 카드 추가
          </Button>
          {missingImages > 0 && (
            <Button size="sm" variant="secondary" onClick={handleBatchImages} disabled={isBusy}>
              이미지 전체 생성 ({missingImages})
            </Button>
          )}
          {missingTts > 0 && (
            <Button size="sm" variant="secondary" onClick={handleBatchTts} disabled={isBusy}>
              TTS 전체 생성 ({missingTts})
            </Button>
          )}
        </div>
      </div>

      {/* 이미지 모델 */}
      <ImageModelSelector
        value={storybook.imageModels?.phonics}
        onChange={(modelId) => {
          onUpdate((d) => {
            if (!d.imageModels) d.imageModels = {};
            d.imageModels.phonics = modelId;
          });
          onSave();
        }}
        label="이미지 모델"
      />

      {batchType && (
        <BatchProgressBar
          current={batchProgress.current}
          total={batchProgress.total}
          label={batchType === 'image' ? '이미지 생성' : 'TTS 생성'}
          onCancel={() => abortRef.current?.abort()}
        />
      )}

      {ttsError && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="flex-1 text-sm text-red-600 dark:text-red-400">{ttsError}</p>
          <button
            onClick={() => setTtsError(null)}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 text-xs font-medium"
          >
            닫기
          </button>
        </div>
      )}

      {imageError && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="flex-1 text-sm text-red-600 dark:text-red-400">{imageError}</p>
          <button
            onClick={() => setImageError(null)}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 text-xs font-medium"
          >
            닫기
          </button>
        </div>
      )}

      {flashcards.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <p className="text-lg mb-2">핵심단어가 없습니다</p>
          <p className="text-sm mb-4">
            파닉스 유닛을 생성하면 자동으로 포함되거나, 직접 추가할 수 있습니다.
          </p>
          <Button size="sm" variant="primary" onClick={addFlashcard}>
            + 카드 추가
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {flashcards.map((card, idx) => {
            const imgKey = `fc-img-${idx}`;
            const isGenImg = generatingImages.has(imgKey);
            const isUploading = uploadingKey === imgKey;
            const makeFcUpdater = (d: Storybook, url: string) => {
              const c = d.flashcards![idx];
              c.imageHistory = pushImageHistory(c.imageHistory, c.imageUrl);
              c.imageUrl = url;
            };
            return (
              <ImageDropZone
                key={card.id ?? idx}
                onFile={(f) => handleUpload(f, imgKey, makeFcUpdater)}
                disabled={isGenImg || isUploading}
                enablePaste={false}
              >
                {(openFilePicker) => (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* 헤더 */}
                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <input
                        key={`word-${card.id ?? idx}`}
                        defaultValue={card.word}
                        onChange={(e) => {
                          onUpdate((d) => {
                            d.flashcards![idx].word = e.target.value;
                          });
                          debouncedSave();
                        }}
                        onBlur={() => {
                          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                          onSave();
                        }}
                        className="w-28 text-lg font-bold text-slate-800 dark:text-slate-100 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:outline-none focus:border-violet-500"
                        placeholder={isKorean ? '단어' : '영어 단어'}
                      />
                      {!isKorean && (
                        <input
                          key={`local-${card.id ?? idx}`}
                          defaultValue={card.localWord}
                          onChange={(e) => {
                            onUpdate((d) => {
                              d.flashcards![idx].localWord = e.target.value;
                            });
                            debouncedSave();
                          }}
                          onBlur={() => {
                            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                            onSave();
                          }}
                          className="w-24 text-sm text-slate-500 dark:text-slate-400 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:outline-none focus:border-violet-400"
                          placeholder="한글 뜻"
                        />
                      )}
                      <div className="flex gap-1 flex-wrap">
                        {card.phonemes.map((p, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 text-xs rounded-full font-mono"
                          >
                            {p}
                          </span>
                        ))}
                        {card.phonicPattern && (
                          <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 text-xs rounded-full">
                            {card.phonicPattern}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteFlashcard(idx)}
                        disabled={isBusy}
                        className="ml-auto p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        title="삭제"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
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

                    <div className="p-5 flex flex-col sm:flex-row gap-5">
                      {/* 왼쪽: 이미지 */}
                      <div className="flex-shrink-0 w-full sm:w-48">
                        <div className="space-y-2">
                          <ImagePreview
                            src={card.imageUrl}
                            alt={card.word}
                            loading={isGenImg || isUploading}
                            size="sm"
                            aspectRatio="1/1"
                            emptyText={card.word || '?'}
                            onClick={() => card.imageUrl && setLightboxUrl(card.imageUrl)}
                            onDelete={
                              card.imageUrl
                                ? () => {
                                    onUpdate((d) => {
                                      d.flashcards![idx].imageUrl = undefined;
                                    });
                                    onSave();
                                  }
                                : undefined
                            }
                          />
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="flex-1"
                              onClick={() =>
                                imageMutation.mutate({
                                  word: card.word,
                                  description: card.imageDescription,
                                  key: imgKey,
                                  updater: makeFcUpdater,
                                  isolatedObject: true,
                                })
                              }
                              loading={isGenImg}
                              disabled={isBusy || !card.word}
                            >
                              {card.imageUrl ? '재생성' : '이미지 생성'}
                            </Button>
                            {card.imageUrl && (
                              <DownloadButton href={card.imageUrl} filename={`${card.word}.png`} />
                            )}
                            <UploadMenu
                              onFile={(f) => handleUpload(f, imgKey, makeFcUpdater)}
                              openFilePicker={openFilePicker}
                              disabled={isBusy}
                            />
                          </div>
                          <ImageDescriptionInput
                            value={card.imageDescription}
                            onChange={(v) => {
                              onUpdate((d) => {
                                d.flashcards![idx].imageDescription = v;
                              });
                              onSave();
                            }}
                          />
                          {card.imageHistory && card.imageHistory.length > 0 && (
                            <ImageHistory
                              history={card.imageHistory}
                              onRestore={(h) => restoreFlashcardHistory(idx, h)}
                            />
                          )}
                          {/* 점선 따라그리기 */}
                          {card.imageUrl && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full mt-1"
                              onClick={() => setTracingEditIdx(idx)}
                              disabled={isBusy}
                            >
                              {card.tracingPoints?.length
                                ? `점선 편집 (${card.tracingPoints.length})`
                                : '점선 그리기'}
                            </Button>
                          )}
                          {card.imageUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full"
                              onClick={() => setTracingPreviewIdx(idx)}
                              disabled={(card.tracingPoints?.length ?? 0) < 2}
                            >
                              따라그리기 미리보기
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* 오른쪽: 예문 + TTS */}
                      <div className="flex-1 min-w-0">
                        <input
                          key={`sent-${card.id ?? idx}`}
                          defaultValue={stripBold(card.sentence)}
                          onChange={(e) => {
                            onUpdate((d) => {
                              d.flashcards![idx].sentence = e.target.value;
                            });
                            debouncedSave();
                          }}
                          onBlur={() => {
                            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                            onSave();
                          }}
                          className="w-full text-sm text-slate-600 dark:text-slate-300 italic mb-4 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:outline-none focus:border-violet-400 px-1 py-0.5"
                          placeholder="예문 입력"
                        />
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                          TTS 에셋
                        </p>
                        <div className="space-y-1.5">
                          <TtsRow
                            label={card.word || '(단어 없음)'}
                            tag="어휘"
                            color="violet"
                            url={card.ttsUrl}
                            generating={generatingTts.has(`fc-${idx}`)}
                            disabled={isBusy || !card.word}
                            downloadFilename={`${card.word}.wav`}
                            editableText={getTtsText(`fc-${idx}`, toSyllables(card.word))}
                            onTextChange={(t) => setTtsText(`fc-${idx}`, t)}
                            onGenerate={() =>
                              generateTts(
                                getTtsText(`fc-${idx}`, toSyllables(card.word)),
                                `fc-${idx}`,
                                (d, url) => {
                                  d.flashcards![idx].ttsUrl = url;
                                }
                              )
                            }
                            onUpload={(f) =>
                              handleTtsUpload(f, `fc-${idx}`, (d, url) => {
                                d.flashcards![idx].ttsUrl = url;
                              })
                            }
                          />
                          <TtsRow
                            label={stripBold(card.sentence) || '(예문 없음)'}
                            tag="예문"
                            color="sky"
                            url={card.sentenceTtsUrl}
                            generating={generatingTts.has(`fc-sent-${idx}`)}
                            disabled={isBusy || !card.sentence}
                            downloadFilename={`${card.word}-sentence.wav`}
                            editableText={getTtsText(`fc-sent-${idx}`, stripBold(card.sentence))}
                            onTextChange={(t) => setTtsText(`fc-sent-${idx}`, t)}
                            onGenerate={() =>
                              generateTts(
                                getTtsText(`fc-sent-${idx}`, stripBold(card.sentence)),
                                `fc-sent-${idx}`,
                                (d, url) => {
                                  d.flashcards![idx].sentenceTtsUrl = url;
                                },
                                true
                              )
                            }
                            onUpload={(f) =>
                              handleTtsUpload(f, `fc-sent-${idx}`, (d, url) => {
                                d.flashcards![idx].sentenceTtsUrl = url;
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ImageDropZone>
            );
          })}
        </div>
      )}

      {lightboxUrl && (
        <ImageLightbox src={lightboxUrl} alt="핵심단어" onClose={() => setLightboxUrl(null)} />
      )}

      {tracingEditIdx !== null && flashcards[tracingEditIdx]?.imageUrl && (
        <TracingPointEditorModal
          imageUrl={flashcards[tracingEditIdx].imageUrl!}
          word={flashcards[tracingEditIdx].word}
          initialPoints={flashcards[tracingEditIdx].tracingPoints}
          aspectRatio="1/1"
          onSave={(points) => {
            onUpdate((d) => {
              d.flashcards![tracingEditIdx].tracingPoints = points;
            });
            onSave();
            setTracingEditIdx(null);
          }}
          onClose={() => setTracingEditIdx(null)}
        />
      )}

      {tracingPreviewIdx !== null &&
        flashcards[tracingPreviewIdx]?.imageUrl &&
        (flashcards[tracingPreviewIdx].tracingPoints?.length ?? 0) >= 2 && (
          <TracingGamePreviewModal
            imageUrl={flashcards[tracingPreviewIdx].imageUrl!}
            word={flashcards[tracingPreviewIdx].word}
            tracingPoints={flashcards[tracingPreviewIdx].tracingPoints!}
            ttsUrl={flashcards[tracingPreviewIdx].ttsUrl}
            onClose={() => setTracingPreviewIdx(null)}
          />
        )}
    </div>
  );
}
