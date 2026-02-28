import { useState, useCallback, useRef } from 'react';
import type { Storybook, BlendingExercise } from '@tangobook/shared';
import { Button } from '@/components/Button';
import { ImageLightbox } from '@/components/ImageLightbox';
import { BatchProgressBar } from '@/components/BatchProgressBar';
import { pushImageHistory } from '@/lib/image-history';
import { usePhonicsCardActions } from '../hooks/usePhonicsCardActions';
import type { ImageTask, TtsTask } from '../hooks/usePhonicsCardActions';
import { TtsRow } from './TtsRow';
import { WritingPracticeSection } from './WritingPracticeSection';
import { ImageConfigPanel } from './ImageConfigPanel';
import { ExampleWordCard } from './ExampleWordCard';
import { LearningCardPreviewModal } from './LearningCardPreviewModal';
import { TracingPointEditorModal } from './TracingPointEditorModal';
import { TracingGamePreviewModal } from './TracingGamePreviewModal';

interface LearningCardTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

export function LearningCardTab({ storybook, onUpdate, onSave }: LearningCardTabProps) {
  const lesson = storybook.phonicsLesson;

  const {
    aspectRatio,
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
    setAspectRatio,
    imageMutation,
    generateTts,
    handleUpload,
    handleTtsUpload,
    runBatchImages,
    runBatchTts,
  } = usePhonicsCardActions({ storybook, onUpdate, onSave });

  const [writingPractice, setWritingPractice] = useState<{ idx: number; letter: string } | null>(
    null
  );
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [tracingEdit, setTracingEdit] = useState<{ idx: number; wordNum: 1 | 2 } | null>(null);
  const [tracingPreview, setTracingPreview] = useState<{ idx: number; wordNum: 1 | 2 } | null>(
    null
  );

  // 편집 중인 이미지 설명 draft를 실시간 추적 (저장 전에도 재생성에서 참조)
  const liveDescs = useRef<Record<string, string | undefined>>({});

  // --- 블렌딩 히스토리 복원 ---
  const restoreBlendingHistory = useCallback(
    (blendIdx: number, wordNum: 1 | 2, hIdx: number) => {
      onUpdate((draft) => {
        if (!draft.phonicsLesson) return;
        const b = draft.phonicsLesson.blending[blendIdx];
        if (wordNum === 1) {
          const history = b.exampleWordImageHistory ?? [];
          const restored = history[hIdx];
          if (!restored) return;
          if (b.exampleWordImageUrl) history[hIdx] = b.exampleWordImageUrl;
          else history.splice(hIdx, 1);
          b.exampleWordImageUrl = restored;
          b.exampleWordImageHistory = history;
        } else {
          const history = b.exampleWord2ImageHistory ?? [];
          const restored = history[hIdx];
          if (!restored) return;
          if (b.exampleWord2ImageUrl) history[hIdx] = b.exampleWord2ImageUrl;
          else history.splice(hIdx, 1);
          b.exampleWord2ImageUrl = restored;
          b.exampleWord2ImageHistory = history;
        }
      });
      onSave();
    },
    [onUpdate, onSave]
  );

  // --- 배치 이미지 생성 ---
  const handleBatchImages = useCallback(async () => {
    const tasks: ImageTask[] = [];
    if (lesson) {
      lesson.blending.forEach((item, idx) => {
        // 예시단어 1
        if (!item.exampleWordImageUrl) {
          tasks.push({
            word: item.exampleWord,
            description: liveDescs.current[`${idx}-1`] ?? item.exampleWordImageDescription,
            isolatedObject: true,
            updater: (d, url) => {
              if (!d.phonicsLesson) return;
              const b = d.phonicsLesson.blending[idx];
              b.exampleWordImageHistory = pushImageHistory(
                b.exampleWordImageHistory,
                b.exampleWordImageUrl
              );
              b.exampleWordImageUrl = url;
            },
          });
        }
        // 예시단어 2
        if (item.exampleWord2 && !item.exampleWord2ImageUrl) {
          tasks.push({
            word: item.exampleWord2,
            description: liveDescs.current[`${idx}-2`] ?? item.exampleWord2ImageDescription,
            isolatedObject: true,
            updater: (d, url) => {
              if (!d.phonicsLesson) return;
              const b = d.phonicsLesson.blending[idx];
              b.exampleWord2ImageHistory = pushImageHistory(
                b.exampleWord2ImageHistory,
                b.exampleWord2ImageUrl
              );
              b.exampleWord2ImageUrl = url;
            },
          });
        }
      });
    }
    await runBatchImages(tasks);
  }, [lesson, runBatchImages]);

  // --- 배치 TTS 생성 ---
  const handleBatchTts = useCallback(async () => {
    const tasks: TtsTask[] = [];
    if (lesson) {
      lesson.blending.forEach((item, idx) => {
        if (!item.vowelTtsUrl) {
          tasks.push({
            word: getTtsText(`vowel-${idx}`, item.vowel),
            key: `vowel-${idx}`,
            updater: (d, url) => {
              if (d.phonicsLesson) d.phonicsLesson.blending[idx].vowelTtsUrl = url;
            },
          });
        }
        if (!item.consonantTtsUrl) {
          tasks.push({
            word: getTtsText(`consonant-${idx}`, item.consonant),
            key: `consonant-${idx}`,
            updater: (d, url) => {
              if (d.phonicsLesson) d.phonicsLesson.blending[idx].consonantTtsUrl = url;
            },
          });
        }
        if (!item.blendTtsUrl) {
          tasks.push({
            word: getTtsText(`blend-${idx}`, item.blend),
            key: `blend-${idx}`,
            updater: (d, url) => {
              if (d.phonicsLesson) d.phonicsLesson.blending[idx].blendTtsUrl = url;
            },
          });
        }
        if (!item.blendingSequenceTtsUrl) {
          tasks.push({
            word: getTtsText(`seq-${idx}`, `${item.vowel} ${item.consonant} ${item.blend}`),
            key: `seq-${idx}`,
            updater: (d, url) => {
              if (d.phonicsLesson) d.phonicsLesson.blending[idx].blendingSequenceTtsUrl = url;
            },
          });
        }
        if (!item.exampleWordTtsUrl) {
          tasks.push({
            word: getTtsText(`exword-${idx}`, item.exampleWord),
            key: `exword-${idx}`,
            updater: (d, url) => {
              if (d.phonicsLesson) d.phonicsLesson.blending[idx].exampleWordTtsUrl = url;
            },
          });
        }
        // onset TTS (예: c, f)
        {
          const onset1 = getOnset(item.exampleWord, item.blend);
          if (onset1 && !item.exampleWordOnsetTtsUrl) {
            tasks.push({
              word: getTtsText(`onset-${idx}`, onset1),
              key: `onset-${idx}`,
              updater: (d, url) => {
                if (d.phonicsLesson) d.phonicsLesson.blending[idx].exampleWordOnsetTtsUrl = url;
              },
            });
          }
        }
        if (item.exampleWord2 && !item.exampleWord2TtsUrl) {
          tasks.push({
            word: getTtsText(`exword2-${idx}`, item.exampleWord2),
            key: `exword2-${idx}`,
            updater: (d, url) => {
              if (d.phonicsLesson) d.phonicsLesson.blending[idx].exampleWord2TtsUrl = url;
            },
          });
        }
        if (item.exampleWord2) {
          const onset2 = getOnset(item.exampleWord2, item.blend);
          if (onset2 && !item.exampleWord2OnsetTtsUrl) {
            tasks.push({
              word: getTtsText(`onset2-${idx}`, onset2),
              key: `onset2-${idx}`,
              updater: (d, url) => {
                if (d.phonicsLesson) d.phonicsLesson.blending[idx].exampleWord2OnsetTtsUrl = url;
              },
            });
          }
        }
      });
    }
    await runBatchTts(tasks);
  }, [lesson, getTtsText, runBatchTts]);

  const hasBlending = !!lesson && lesson.blending.length > 0;

  if (!hasBlending) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        <p className="text-lg mb-2">학습 카드가 없습니다</p>
        <p className="text-sm">파닉스 유닛을 생성하면 블렌딩 연습이 자동으로 포함됩니다.</p>
      </div>
    );
  }

  const missingImages = countMissingImages(lesson?.blending ?? []);
  const missingTts = countMissingTts(lesson?.blending ?? []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {lesson?.title ?? '학습 카드'}
        </h2>
        <div className="flex gap-2 flex-wrap">
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

      {/* 이미지 모델 + 비율 선택 */}
      <ImageConfigPanel
        modelValue={storybook.imageModels?.phonics}
        onModelChange={(modelId) => {
          onUpdate((d) => {
            if (!d.imageModels) d.imageModels = {};
            d.imageModels.phonics = modelId;
          });
          onSave();
        }}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
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

      {/* === 블렌딩 연습 === */}
      {hasBlending && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-bold">
              Learn
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">음가 블렌딩</span>
          </div>
          <div className="space-y-4">
            {lesson!.blending.map((item, idx) => {
              const imgKey1 = `blend-img-${idx}`;
              const imgKey2 = `blend-img2-${idx}`;
              const isGenImg1 = generatingImages.has(imgKey1);
              const isGenImg2 = generatingImages.has(imgKey2);
              const isUploading1 = uploadingKey === imgKey1;
              const isUploading2 = uploadingKey === imgKey2;
              const makeUpdater1 = (d: Storybook, url: string) => {
                if (!d.phonicsLesson) return;
                const b = d.phonicsLesson.blending[idx];
                b.exampleWordImageHistory = pushImageHistory(
                  b.exampleWordImageHistory,
                  b.exampleWordImageUrl
                );
                b.exampleWordImageUrl = url;
              };
              const makeUpdater2 = (d: Storybook, url: string) => {
                if (!d.phonicsLesson) return;
                const b = d.phonicsLesson.blending[idx];
                b.exampleWord2ImageHistory = pushImageHistory(
                  b.exampleWord2ImageHistory,
                  b.exampleWord2ImageUrl
                );
                b.exampleWord2ImageUrl = url;
              };
              const onset1 = getOnset(item.exampleWord, item.blend);
              const onset2 = item.exampleWord2 ? getOnset(item.exampleWord2, item.blend) : '';
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  {/* 상단: 블렌딩 공식 — vowel + consonant = blend */}
                  <div className="px-5 py-4 bg-sky-50 dark:bg-sky-900/20 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-center gap-3">
                      <span className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 shadow-sm text-2xl font-bold text-slate-800 dark:text-slate-100">
                        <input
                          value={item.vowel}
                          onChange={(e) => {
                            onUpdate((d) => {
                              if (d.phonicsLesson)
                                d.phonicsLesson.blending[idx].vowel = e.target.value;
                            });
                            onSave();
                          }}
                          className="w-10 text-2xl font-bold text-center bg-transparent focus:outline-none"
                        />
                      </span>
                      <span className="text-lg text-slate-400 font-bold">+</span>
                      <span className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 shadow-sm text-2xl font-bold text-slate-800 dark:text-slate-100">
                        <input
                          value={item.consonant}
                          onChange={(e) => {
                            onUpdate((d) => {
                              if (d.phonicsLesson)
                                d.phonicsLesson.blending[idx].consonant = e.target.value;
                            });
                            onSave();
                          }}
                          className="w-10 text-2xl font-bold text-center bg-transparent focus:outline-none"
                        />
                      </span>
                      <span className="text-lg text-slate-400 font-bold">&rarr;</span>
                      <span className="px-5 py-2 rounded-full bg-white dark:bg-slate-800 shadow-sm text-2xl font-black text-slate-800 dark:text-slate-100">
                        <input
                          value={item.blend}
                          onChange={(e) => {
                            onUpdate((d) => {
                              if (d.phonicsLesson)
                                d.phonicsLesson.blending[idx].blend = e.target.value;
                            });
                            onSave();
                          }}
                          className="w-14 text-2xl font-black text-center bg-transparent focus:outline-none"
                        />
                      </span>
                      <button
                        onClick={() => setPreviewIdx(idx)}
                        className="ml-4 px-2.5 py-1 text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 rounded-md hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
                      >
                        미리보기
                      </button>
                    </div>
                  </div>

                  {/* 하단: 예시단어 2개 */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    <ExampleWordCard
                      word={item.exampleWord}
                      onset={onset1}
                      blend={item.blend}
                      imageUrl={item.exampleWordImageUrl}
                      imageDescription={
                        liveDescs.current[`${idx}-1`] ?? item.exampleWordImageDescription
                      }
                      imageHistory={item.exampleWordImageHistory}
                      wordTtsUrl={item.exampleWordTtsUrl}
                      onsetTtsUrl={item.exampleWordOnsetTtsUrl}
                      imgKey={imgKey1}
                      wordTtsKey={`exword-${idx}`}
                      onsetTtsKey={`onset-${idx}`}
                      imageUpdater={makeUpdater1}
                      wordTtsUpdater={(d, url) => {
                        if (d.phonicsLesson) d.phonicsLesson.blending[idx].exampleWordTtsUrl = url;
                      }}
                      onsetTtsUpdater={(d, url) => {
                        if (d.phonicsLesson)
                          d.phonicsLesson.blending[idx].exampleWordOnsetTtsUrl = url;
                      }}
                      onWordChange={(v) => {
                        onUpdate((d) => {
                          if (d.phonicsLesson) d.phonicsLesson.blending[idx].exampleWord = v;
                        });
                        onSave();
                      }}
                      onImageDelete={() => {
                        onUpdate((d) => {
                          if (d.phonicsLesson)
                            d.phonicsLesson.blending[idx].exampleWordImageUrl = undefined;
                        });
                        onSave();
                      }}
                      onImageDescChange={(v) => {
                        onUpdate((d) => {
                          if (d.phonicsLesson)
                            d.phonicsLesson.blending[idx].exampleWordImageDescription = v;
                        });
                        onSave();
                      }}
                      onImageDescDraft={(v) => {
                        liveDescs.current[`${idx}-1`] = v;
                      }}
                      onHistoryRestore={(h) => restoreBlendingHistory(idx, 1, h)}
                      isBusy={isBusy}
                      generatingImage={isGenImg1}
                      uploading={isUploading1}
                      generatingWordTts={generatingTts.has(`exword-${idx}`)}
                      generatingOnsetTts={generatingTts.has(`onset-${idx}`)}
                      tracingPoints={item.exampleWordTracingPoints}
                      onTracingEdit={() => setTracingEdit({ idx, wordNum: 1 })}
                      onTracingPreview={() => setTracingPreview({ idx, wordNum: 1 })}
                      imageMutate={imageMutation.mutate}
                      handleUpload={handleUpload}
                      generateTts={generateTts}
                      handleTtsUpload={handleTtsUpload}
                      getTtsText={getTtsText}
                      setTtsText={setTtsText}
                      setLightboxUrl={setLightboxUrl}
                    />
                    {/* 예시단어 2 */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-bold">
                          {onset2}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">+</span>
                        <span className="px-3 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-red-500 dark:text-red-400 text-sm font-bold">
                          {item.blend}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">&rarr;</span>
                        <input
                          value={item.exampleWord2 ?? ''}
                          onChange={(e) => {
                            onUpdate((d) => {
                              if (d.phonicsLesson)
                                d.phonicsLesson.blending[idx].exampleWord2 = e.target.value;
                            });
                            onSave();
                          }}
                          placeholder="예시단어 2"
                          className="w-28 text-lg font-bold text-slate-800 dark:text-slate-100 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      {item.exampleWord2 ? (
                        <ExampleWordCard
                          showHeader={false}
                          word={item.exampleWord2}
                          onset={onset2}
                          blend={item.blend}
                          imageUrl={item.exampleWord2ImageUrl}
                          imageDescription={
                            liveDescs.current[`${idx}-2`] ?? item.exampleWord2ImageDescription
                          }
                          imageHistory={item.exampleWord2ImageHistory}
                          wordTtsUrl={item.exampleWord2TtsUrl}
                          onsetTtsUrl={item.exampleWord2OnsetTtsUrl}
                          imgKey={imgKey2}
                          wordTtsKey={`exword2-${idx}`}
                          onsetTtsKey={`onset2-${idx}`}
                          imageUpdater={makeUpdater2}
                          wordTtsUpdater={(d, url) => {
                            if (d.phonicsLesson)
                              d.phonicsLesson.blending[idx].exampleWord2TtsUrl = url;
                          }}
                          onsetTtsUpdater={(d, url) => {
                            if (d.phonicsLesson)
                              d.phonicsLesson.blending[idx].exampleWord2OnsetTtsUrl = url;
                          }}
                          onWordChange={(v) => {
                            onUpdate((d) => {
                              if (d.phonicsLesson) d.phonicsLesson.blending[idx].exampleWord2 = v;
                            });
                            onSave();
                          }}
                          onImageDelete={() => {
                            onUpdate((d) => {
                              if (d.phonicsLesson)
                                d.phonicsLesson.blending[idx].exampleWord2ImageUrl = undefined;
                            });
                            onSave();
                          }}
                          onImageDescChange={(v) => {
                            onUpdate((d) => {
                              if (d.phonicsLesson)
                                d.phonicsLesson.blending[idx].exampleWord2ImageDescription = v;
                            });
                            onSave();
                          }}
                          onImageDescDraft={(v) => {
                            liveDescs.current[`${idx}-2`] = v;
                          }}
                          onHistoryRestore={(h) => restoreBlendingHistory(idx, 2, h)}
                          isBusy={isBusy}
                          generatingImage={isGenImg2}
                          uploading={isUploading2}
                          generatingWordTts={generatingTts.has(`exword2-${idx}`)}
                          generatingOnsetTts={generatingTts.has(`onset2-${idx}`)}
                          tracingPoints={item.exampleWord2TracingPoints}
                          onTracingEdit={() => setTracingEdit({ idx, wordNum: 2 })}
                          onTracingPreview={() => setTracingPreview({ idx, wordNum: 2 })}
                          imageMutate={imageMutation.mutate}
                          handleUpload={handleUpload}
                          generateTts={generateTts}
                          handleTtsUpload={handleTtsUpload}
                          getTtsText={getTtsText}
                          setTtsText={setTtsText}
                          setLightboxUrl={setLightboxUrl}
                        />
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                          예시단어 2를 입력하면 이미지/TTS 에셋을 생성할 수 있습니다.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 블렌딩 TTS 에셋 */}
                  <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                      블렌딩 TTS 에셋
                    </p>
                    <div className="space-y-1.5">
                      <TtsRow
                        label={item.vowel}
                        tag="모음"
                        color="amber"
                        url={item.vowelTtsUrl}
                        generating={generatingTts.has(`vowel-${idx}`)}
                        disabled={isBusy}
                        downloadFilename={`${item.vowel}.wav`}
                        editableText={getTtsText(`vowel-${idx}`, item.vowel)}
                        onTextChange={(t) => setTtsText(`vowel-${idx}`, t)}
                        onGenerate={() =>
                          generateTts(
                            getTtsText(`vowel-${idx}`, item.vowel),
                            `vowel-${idx}`,
                            (d, url) => {
                              if (d.phonicsLesson) d.phonicsLesson.blending[idx].vowelTtsUrl = url;
                            }
                          )
                        }
                        onUpload={(f) =>
                          handleTtsUpload(f, `vowel-${idx}`, (d, url) => {
                            if (d.phonicsLesson) d.phonicsLesson.blending[idx].vowelTtsUrl = url;
                          })
                        }
                      />
                      <TtsRow
                        label={item.consonant}
                        tag="자음"
                        color="sky"
                        url={item.consonantTtsUrl}
                        generating={generatingTts.has(`consonant-${idx}`)}
                        disabled={isBusy}
                        downloadFilename={`${item.consonant}.wav`}
                        editableText={getTtsText(`consonant-${idx}`, item.consonant)}
                        onTextChange={(t) => setTtsText(`consonant-${idx}`, t)}
                        onGenerate={() =>
                          generateTts(
                            getTtsText(`consonant-${idx}`, item.consonant),
                            `consonant-${idx}`,
                            (d, url) => {
                              if (d.phonicsLesson)
                                d.phonicsLesson.blending[idx].consonantTtsUrl = url;
                            }
                          )
                        }
                        onUpload={(f) =>
                          handleTtsUpload(f, `consonant-${idx}`, (d, url) => {
                            if (d.phonicsLesson)
                              d.phonicsLesson.blending[idx].consonantTtsUrl = url;
                          })
                        }
                      />
                      <TtsRow
                        label={item.blend}
                        tag="블렌드"
                        color="violet"
                        url={item.blendTtsUrl}
                        generating={generatingTts.has(`blend-${idx}`)}
                        disabled={isBusy}
                        downloadFilename={`${item.blend}.wav`}
                        editableText={getTtsText(`blend-${idx}`, item.blend)}
                        onTextChange={(t) => setTtsText(`blend-${idx}`, t)}
                        onGenerate={() =>
                          generateTts(
                            getTtsText(`blend-${idx}`, item.blend),
                            `blend-${idx}`,
                            (d, url) => {
                              if (d.phonicsLesson) d.phonicsLesson.blending[idx].blendTtsUrl = url;
                            }
                          )
                        }
                        onUpload={(f) =>
                          handleTtsUpload(f, `blend-${idx}`, (d, url) => {
                            if (d.phonicsLesson) d.phonicsLesson.blending[idx].blendTtsUrl = url;
                          })
                        }
                      />
                      <TtsRow
                        label={`${item.vowel} → ${item.consonant} → ${item.blend}`}
                        tag="시퀀스"
                        color="purple"
                        url={item.blendingSequenceTtsUrl}
                        generating={generatingTts.has(`seq-${idx}`)}
                        disabled={isBusy}
                        downloadFilename={`${item.blend}-sequence.wav`}
                        editableText={getTtsText(
                          `seq-${idx}`,
                          `${item.vowel} ${item.consonant} ${item.blend}`
                        )}
                        onTextChange={(t) => setTtsText(`seq-${idx}`, t)}
                        onGenerate={() =>
                          generateTts(
                            getTtsText(
                              `seq-${idx}`,
                              `${item.vowel} ${item.consonant} ${item.blend}`
                            ),
                            `seq-${idx}`,
                            (d, url) => {
                              if (d.phonicsLesson)
                                d.phonicsLesson.blending[idx].blendingSequenceTtsUrl = url;
                            }
                          )
                        }
                        onUpload={(f) =>
                          handleTtsUpload(f, `seq-${idx}`, (d, url) => {
                            if (d.phonicsLesson)
                              d.phonicsLesson.blending[idx].blendingSequenceTtsUrl = url;
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* 글자 쓰기 연습 */}
                  <div className="px-5 pb-5 pt-3">
                    <WritingPracticeSection
                      vowel={item.vowel}
                      consonant={item.consonant}
                      idx={idx}
                      active={writingPractice}
                      onToggle={setWritingPractice}
                      correctSoundUrl={storybook.systemSounds?.correctUrl}
                      incorrectSoundUrl={storybook.systemSounds?.incorrectUrl}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {lightboxUrl && (
        <ImageLightbox src={lightboxUrl} alt="학습 카드" onClose={() => setLightboxUrl(null)} />
      )}

      {/* 학습카드 미리보기 모달 */}
      {previewIdx !== null && lesson && lesson.blending[previewIdx] && (
        <LearningCardPreviewModal
          key={previewIdx}
          item={lesson.blending[previewIdx]}
          wordFamily={lesson.wordFamilies[previewIdx]}
          systemSounds={storybook.systemSounds}
          aspectRatio={aspectRatio.replace(':', '/')}
          onClose={() => setPreviewIdx(null)}
        />
      )}

      {/* 점선 따라그리기 편집 모달 */}
      {tracingEdit !== null &&
        (() => {
          const item = lesson!.blending[tracingEdit.idx];
          const imgUrl =
            tracingEdit.wordNum === 1 ? item.exampleWordImageUrl : item.exampleWord2ImageUrl;
          const word = tracingEdit.wordNum === 1 ? item.exampleWord : (item.exampleWord2 ?? '');
          const points =
            tracingEdit.wordNum === 1
              ? item.exampleWordTracingPoints
              : item.exampleWord2TracingPoints;
          if (!imgUrl) return null;
          return (
            <TracingPointEditorModal
              imageUrl={imgUrl}
              word={word}
              initialPoints={points}
              aspectRatio="1/1"
              onSave={(pts) => {
                onUpdate((d) => {
                  if (!d.phonicsLesson) return;
                  const b = d.phonicsLesson.blending[tracingEdit.idx];
                  if (tracingEdit.wordNum === 1) {
                    b.exampleWordTracingPoints = pts;
                  } else {
                    b.exampleWord2TracingPoints = pts;
                  }
                });
                onSave();
                setTracingEdit(null);
              }}
              onClose={() => setTracingEdit(null)}
            />
          );
        })()}

      {/* 따라그리기 게임 미리보기 */}
      {tracingPreview !== null &&
        (() => {
          const item = lesson!.blending[tracingPreview.idx];
          const imgUrl =
            tracingPreview.wordNum === 1 ? item.exampleWordImageUrl : item.exampleWord2ImageUrl;
          const w = tracingPreview.wordNum === 1 ? item.exampleWord : (item.exampleWord2 ?? '');
          const points =
            tracingPreview.wordNum === 1
              ? item.exampleWordTracingPoints
              : item.exampleWord2TracingPoints;
          const tts =
            tracingPreview.wordNum === 1 ? item.exampleWordTtsUrl : item.exampleWord2TtsUrl;
          if (!imgUrl || !points || points.length < 2) return null;
          return (
            <TracingGamePreviewModal
              imageUrl={imgUrl}
              word={w}
              tracingPoints={points}
              ttsUrl={tts}
              systemSounds={storybook.systemSounds}
              onClose={() => setTracingPreview(null)}
            />
          );
        })()}
    </div>
  );
}

// --- 유틸리티 함수 ---

function getOnset(word: string, blend: string): string {
  if (word.endsWith(blend)) return word.slice(0, -blend.length);
  return word[0] ?? '';
}

function countMissingImages(blending: BlendingExercise[]) {
  let c = 0;
  for (const b of blending) {
    if (!b.exampleWordImageUrl) c++;
    if (b.exampleWord2 && !b.exampleWord2ImageUrl) c++;
  }
  return c;
}

function countMissingTts(blending: BlendingExercise[]) {
  let c = 0;
  for (const b of blending) {
    if (!b.vowelTtsUrl) c++;
    if (!b.consonantTtsUrl) c++;
    if (!b.blendTtsUrl) c++;
    if (!b.blendingSequenceTtsUrl) c++;
    if (!b.exampleWordTtsUrl) c++;
    if (!b.exampleWordOnsetTtsUrl) c++;
    if (b.exampleWord2 && !b.exampleWord2TtsUrl) c++;
    if (b.exampleWord2 && !b.exampleWord2OnsetTtsUrl) c++;
  }
  return c;
}
