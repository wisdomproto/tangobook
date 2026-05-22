import { useState, useCallback } from 'react';
import type { Storybook } from '@tangobook/shared';
import { getWordHotspots } from '@tangobook/shared';
import { Button } from '@/design-system';
import { ImageLightbox } from '@/components/ImageLightbox';
import { ImageDropZone } from '@/components/ImageDropZone';
import { ImagePreview } from '@/components/ImagePreview';
import { DownloadButton } from '@/components/DownloadButton';
import { UploadMenu } from '@/components/UploadMenu';
import { BatchProgressBar } from '@/components/BatchProgressBar';
import { pushImageHistory } from '@/lib/image-history';
import { phonicsApi } from '../api/phonics.api';
import { usePhonicsCardActions } from '../hooks/usePhonicsCardActions';
import type { ImageTask, TtsTask } from '../hooks/usePhonicsCardActions';
import { TtsRow } from './TtsRow';
import { ImageDescriptionInput } from './ImageDescriptionInput';
import { ImageHistory } from './ImageHistory';
import { WritingPracticeSection } from './WritingPracticeSection';
import { ImageConfigPanel } from './ImageConfigPanel';
import { HotspotEditorModal } from './HotspotEditorModal';
import { LearningCardPreviewModal } from './LearningCardPreviewModal';
import { TracingPointEditorModal } from './TracingPointEditorModal';
import { TracingGamePreviewModal } from './TracingGamePreviewModal';
import { LetterTracingPointEditorModal } from './LetterTracingPointEditorModal';

/**
 * Level 1 전용 학습 카드 탭 (알파벳 음가)
 *
 * 글자별 구성:
 * - 전체 장면 삽화 (글자의 단어들이 자연으로 등장하는 한 장면)
 * - 글자 음원 (대문자/소문자/음가 TTS)
 * - 단어 목록 (wordFamilies) + 개별 TTS
 */

/**
 * 학습 카드의 `blend` 표기를 phonics 라이브러리 음원 key 로 정규화.
 * 영어 알파벳 학습 표기 (`Aa`, `Bb`, `BB`) 처럼 같은 영문자만으로 구성된 경우
 * 라이브러리의 단일 소문자 키 (`a`, `b`) 로 압축. 아니면 원본 유지 (한글 음절·라임 등).
 */
function letterSoundForBlend(blend: string): string {
  if (/^[A-Za-z]+$/.test(blend)) {
    const lower = blend.toLowerCase();
    const unique = Array.from(new Set(lower));
    if (unique.length === 1) return unique[0];
  }
  return blend;
}

interface AlphabetCardTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

export function AlphabetCardTab({ storybook, onUpdate, onSave }: AlphabetCardTabProps) {
  const lesson = storybook.phonicsLesson;
  const sightWords = lesson?.sightWords ?? [];
  const isKorean = storybook.phonicsConfig?.language === 'korean';

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
    ttsTexts,
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
  const [hotspotEditIdx, setHotspotEditIdx] = useState<number | null>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [tracingEditIdx, setTracingEditIdx] = useState<number | null>(null);
  const [tracingPreviewIdx, setTracingPreviewIdx] = useState<number | null>(null);
  // 글자 따라쓰기 점 편집 — (idx, case) ex: { idx: 0, case: 'upper' } = blending[0] 대문자
  const [letterTracingEdit, setLetterTracingEdit] = useState<{
    idx: number;
    case: 'upper' | 'lower';
  } | null>(null);

  // --- 삽화 히스토리 복원 ---
  const restoreIllustrationHistory = useCallback(
    (blendIdx: number, hIdx: number) => {
      onUpdate((draft) => {
        if (!draft.phonicsLesson) return;
        const b = draft.phonicsLesson.blending[blendIdx];
        const history = b.illustrationHistory ?? [];
        const restored = history[hIdx];
        if (!restored) return;
        if (b.illustrationUrl) history[hIdx] = b.illustrationUrl;
        else history.splice(hIdx, 1);
        b.illustrationUrl = restored;
        b.illustrationHistory = history;
      });
      onSave();
    },
    [onUpdate, onSave]
  );

  // 레거시 이미지 히스토리 복원 (exampleWordImageUrl용)
  const restoreLegacyHistory = useCallback(
    (blendIdx: number, hIdx: number) => {
      onUpdate((draft) => {
        if (!draft.phonicsLesson) return;
        const b = draft.phonicsLesson.blending[blendIdx];
        const history = b.exampleWordImageHistory ?? [];
        const restored = history[hIdx];
        if (!restored) return;
        if (b.exampleWordImageUrl) history[hIdx] = b.exampleWordImageUrl;
        else history.splice(hIdx, 1);
        b.exampleWordImageUrl = restored;
        b.exampleWordImageHistory = history;
      });
      onSave();
    },
    [onUpdate, onSave]
  );

  // --- 배치 삽화 생성 ---
  const handleBatchImages = useCallback(async () => {
    const tasks: ImageTask[] = [];
    if (lesson) {
      lesson.blending.forEach((item, idx) => {
        if (!item.illustrationUrl && !item.exampleWordImageUrl) {
          tasks.push({
            word: item.exampleWord,
            description: item.illustrationDescription ?? item.exampleWordImageDescription,
            updater: (d, url) => {
              if (!d.phonicsLesson) return;
              const b = d.phonicsLesson.blending[idx];
              b.illustrationHistory = pushImageHistory(b.illustrationHistory, b.illustrationUrl);
              b.illustrationUrl = url;
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
      lesson.wordFamilies.forEach((wf, wfIdx) => {
        const blend = letterSoundForBlend((lesson.blending[wfIdx]?.blend ?? '').replace(/\//g, ''));
        wf.words.forEach((w, wIdx) => {
          if (!w.ttsUrl) {
            const displayWord = isKorean ? (w.korean ?? w.word) : w.word;
            const defaultText = blend ? `${blend} ${blend} ${displayWord}` : displayWord;
            tasks.push({
              word: ttsTexts[`wf-${wfIdx}-${wIdx}`] ?? defaultText,
              key: `wf-${wfIdx}-${wIdx}`,
              updater: (d, url) => {
                if (d.phonicsLesson) d.phonicsLesson.wordFamilies[wfIdx].words[wIdx].ttsUrl = url;
              },
            });
          }
        });
      });
    }
    await runBatchTts(tasks);
  }, [lesson, ttsTexts, runBatchTts]);

  const letters = lesson?.blending ?? [];
  const wordFamilies = lesson?.wordFamilies ?? [];
  const hasLetters = letters.length > 0;

  if (!hasLetters) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        <p className="text-lg mb-2">학습 카드가 없습니다</p>
        <p className="text-sm">파닉스 유닛을 생성하면 알파벳 음가 카드가 자동으로 포함됩니다.</p>
      </div>
    );
  }

  const missingImages = countMissing(letters, wordFamilies, 'image');
  const missingTts = countMissing(letters, wordFamilies, 'tts');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {lesson?.title ?? '알파벳 음가'}
        </h2>
        <div className="flex gap-2 flex-wrap">
          {missingImages > 0 && (
            <Button size="sm" variant="secondary" onClick={handleBatchImages} disabled={isBusy}>
              삽화 전체 생성 ({missingImages})
            </Button>
          )}
          {missingTts > 0 && (
            <Button size="sm" variant="secondary" onClick={handleBatchTts} disabled={isBusy}>
              TTS 전체 생성 ({missingTts})
            </Button>
          )}
        </div>
      </div>

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
          label={batchType === 'image' ? '삽화 생성' : 'TTS 생성'}
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

      {/* === 글자별 카드 === */}
      {hasLetters && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-bold">
              Learn
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">알파벳 음가</span>
          </div>
          <div className="space-y-6">
            {letters.map((item, idx) => {
              const imgKey = `letter-illust-${idx}`;
              const isGenImg = generatingImages.has(imgKey);
              const isUploading = uploadingKey === imgKey;
              const wf = wordFamilies[idx];

              // 삽화 이미지 (신규 illustrationUrl 우선, 레거시 exampleWordImageUrl 폴백)
              const displayImageUrl = item.illustrationUrl ?? item.exampleWordImageUrl;
              const displayDescription =
                item.illustrationDescription ?? item.exampleWordImageDescription;
              const displayHistory = item.illustrationHistory ?? item.exampleWordImageHistory;
              const isNewFormat = !!item.illustrationUrl || !item.exampleWordImageUrl;

              const cleanBlend = letterSoundForBlend(item.blend.replace(/\//g, ''));

              const makeUpdater = (d: Storybook, url: string) => {
                if (!d.phonicsLesson) return;
                const b = d.phonicsLesson.blending[idx];
                b.illustrationHistory = pushImageHistory(b.illustrationHistory, b.illustrationUrl);
                b.illustrationUrl = url;
              };

              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  {/* 헤더: 글자 표시 */}
                  <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <input
                      value={item.vowel}
                      onChange={(e) => {
                        onUpdate((d) => {
                          if (d.phonicsLesson) d.phonicsLesson.blending[idx].vowel = e.target.value;
                        });
                        onSave();
                      }}
                      className="text-3xl font-black text-amber-600 dark:text-amber-400 bg-transparent border-b border-dashed border-amber-300 dark:border-amber-600 w-12 text-center focus:outline-none"
                    />
                    <input
                      value={item.consonant}
                      onChange={(e) => {
                        onUpdate((d) => {
                          if (d.phonicsLesson)
                            d.phonicsLesson.blending[idx].consonant = e.target.value;
                        });
                        onSave();
                      }}
                      className="text-3xl font-black text-sky-600 dark:text-sky-400 bg-transparent border-b border-dashed border-sky-300 dark:border-sky-600 w-12 text-center focus:outline-none"
                    />
                    <input
                      value={item.blend}
                      onChange={(e) => {
                        onUpdate((d) => {
                          if (d.phonicsLesson) d.phonicsLesson.blending[idx].blend = e.target.value;
                        });
                        onSave();
                      }}
                      className="text-lg text-slate-400 dark:text-slate-500 font-mono ml-1 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 w-16 text-center focus:outline-none"
                    />
                    <input
                      value={item.exampleWord}
                      onChange={(e) => {
                        onUpdate((d) => {
                          if (d.phonicsLesson)
                            d.phonicsLesson.blending[idx].exampleWord = e.target.value;
                        });
                        onSave();
                      }}
                      className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 w-24 focus:outline-none"
                      placeholder="단어"
                    />
                    <button
                      onClick={() => setPreviewIdx(idx)}
                      className="ml-auto px-2.5 py-1 text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 rounded-md hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
                    >
                      미리보기
                    </button>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* 삽화 (와이드) */}
                    <ImageDropZone
                      onFile={(f) => handleUpload(f, imgKey, makeUpdater)}
                      disabled={isBusy}
                      enablePaste={false}
                    >
                      {(openFilePicker) => (
                        <div className="space-y-2">
                          {/* 삽화 + 핫스팟 미리보기 */}
                          <div className="relative">
                            <ImagePreview
                              src={displayImageUrl}
                              alt={`${item.vowel}${item.consonant} illustration`}
                              loading={isGenImg || isUploading}
                              size="lg"
                              aspectRatio={aspectRatio.replace(':', '/')}
                              emptyText={`${item.vowel}${item.consonant} 장면 삽화`}
                              onClick={() => displayImageUrl && setLightboxUrl(displayImageUrl)}
                              onDelete={
                                displayImageUrl
                                  ? () => {
                                      // 현재 이미지 + 히스토리 이미지 모두 서버에서 삭제
                                      const urlsToDelete = [
                                        displayImageUrl,
                                        ...(displayHistory ?? []),
                                      ];
                                      onUpdate((d) => {
                                        if (!d.phonicsLesson) return;
                                        const b = d.phonicsLesson.blending[idx];
                                        if (b.illustrationUrl) {
                                          b.illustrationUrl = undefined;
                                          b.illustrationHistory = [];
                                        } else if (b.exampleWordImageUrl) {
                                          b.exampleWordImageUrl = undefined;
                                          b.exampleWordImageHistory = [];
                                        }
                                      });
                                      onSave();
                                      for (const url of urlsToDelete) {
                                        phonicsApi.deleteImage(url).catch(() => {});
                                      }
                                    }
                                  : undefined
                              }
                            />
                            {/* 핫스팟 미리보기 오버레이 — 단어당 multi-hotspot */}
                            {displayImageUrl &&
                              wf &&
                              wf.words.some((w) => getWordHotspots(w).length > 0) && (
                                <div className="absolute inset-0 pointer-events-none">
                                  <svg
                                    className="w-full h-full"
                                    viewBox="0 0 1 1"
                                    preserveAspectRatio="none"
                                  >
                                    {wf.words.flatMap((w, wIdx) =>
                                      getWordHotspots(w).map((h, hIdx) => (
                                        <rect
                                          key={`${wIdx}-${hIdx}`}
                                          x={h.x}
                                          y={h.y}
                                          width={h.w}
                                          height={h.h}
                                          fill="rgba(16,185,129,0.15)"
                                          stroke="#10b981"
                                          strokeWidth={0.003}
                                          rx={0.005}
                                        />
                                      ))
                                    )}
                                  </svg>
                                </div>
                              )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="flex-1"
                              onClick={() =>
                                imageMutation.mutate({
                                  word: item.exampleWord,
                                  description: displayDescription,
                                  key: imgKey,
                                  updater: makeUpdater,
                                })
                              }
                              loading={isGenImg}
                              disabled={isBusy}
                            >
                              {displayImageUrl ? '삽화 재생성' : '삽화 생성'}
                            </Button>
                            {displayImageUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setHotspotEditIdx(idx)}
                                disabled={isBusy}
                              >
                                핫스팟
                              </Button>
                            )}
                            {displayImageUrl && (
                              <DownloadButton
                                href={displayImageUrl}
                                filename={`${item.vowel}${item.consonant}-illustration.png`}
                              />
                            )}
                            <UploadMenu
                              onFile={(f) => handleUpload(f, imgKey, makeUpdater)}
                              openFilePicker={openFilePicker}
                              disabled={isBusy}
                            />
                          </div>
                          <ImageDescriptionInput
                            value={displayDescription}
                            onChange={(v) => {
                              onUpdate((d) => {
                                if (d.phonicsLesson)
                                  d.phonicsLesson.blending[idx].illustrationDescription = v;
                              });
                              onSave();
                            }}
                          />
                          {displayHistory && displayHistory.length > 0 && (
                            <ImageHistory
                              history={displayHistory}
                              onRestore={(h) =>
                                isNewFormat
                                  ? restoreIllustrationHistory(idx, h)
                                  : restoreLegacyHistory(idx, h)
                              }
                            />
                          )}
                          {/* 점선 따라그리기 */}
                          {displayImageUrl && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full mt-2"
                              onClick={() => setTracingEditIdx(idx)}
                              disabled={isBusy}
                            >
                              {item.exampleWordTracingPoints?.length
                                ? `점선 편집 (${item.exampleWordTracingPoints.length})`
                                : '점선 그리기'}
                            </Button>
                          )}
                          {displayImageUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full"
                              onClick={() => setTracingPreviewIdx(idx)}
                              disabled={(item.exampleWordTracingPoints?.length ?? 0) < 2}
                            >
                              따라그리기 미리보기
                            </Button>
                          )}
                        </div>
                      )}
                    </ImageDropZone>

                    {/* 단어 목록 (wordFamilies) */}
                    {wf && wf.words.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                          단어 ({wf.words.length}개)
                        </p>
                        <div className="space-y-2">
                          {wf.words.map((w, wIdx) => {
                            const primaryWord = isKorean ? (w.korean ?? '') : w.word;
                            const secondaryWord = isKorean ? w.word : (w.korean ?? '');
                            return (
                              <div key={wIdx} className="space-y-0.5">
                                <div className="flex items-center gap-2 px-3">
                                  <input
                                    defaultValue={primaryWord}
                                    key={`primary-${idx}-${wIdx}-${primaryWord}`}
                                    onBlur={(e) => {
                                      const val = isKorean
                                        ? e.target.value || undefined
                                        : e.target.value;
                                      const field = isKorean ? 'korean' : 'word';
                                      if (val === (isKorean ? w.korean : w.word)) return;
                                      onUpdate((d) => {
                                        if (d.phonicsLesson)
                                          (d.phonicsLesson.wordFamilies[idx].words[wIdx] as any)[
                                            field
                                          ] = val;
                                      });
                                      onSave();
                                    }}
                                    className="text-sm font-bold font-mono bg-transparent border-b border-dashed border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 w-24 focus:outline-none"
                                  />
                                  <input
                                    defaultValue={secondaryWord}
                                    key={`secondary-${idx}-${wIdx}-${secondaryWord}`}
                                    onBlur={(e) => {
                                      const val = isKorean
                                        ? e.target.value
                                        : e.target.value || undefined;
                                      const field = isKorean ? 'word' : 'korean';
                                      if (val === (isKorean ? w.word : w.korean)) return;
                                      onUpdate((d) => {
                                        if (d.phonicsLesson)
                                          (d.phonicsLesson.wordFamilies[idx].words[wIdx] as any)[
                                            field
                                          ] = val;
                                      });
                                      onSave();
                                    }}
                                    className="text-xs bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 w-24 focus:outline-none"
                                    placeholder={isKorean ? '영어' : '한글'}
                                  />
                                </div>
                                <TtsRow
                                  label={`${cleanBlend} ${cleanBlend} ${isKorean ? (w.korean ?? w.word) : w.word}`}
                                  tag="단어"
                                  color="emerald"
                                  url={w.ttsUrl}
                                  generating={generatingTts.has(`wf-${idx}-${wIdx}`)}
                                  disabled={isBusy}
                                  downloadFilename={`${isKorean ? (w.korean ?? w.word) : w.word}.wav`}
                                  editableText={getTtsText(
                                    `wf-${idx}-${wIdx}`,
                                    `${cleanBlend} ${cleanBlend} ${isKorean ? (w.korean ?? w.word) : w.word}`
                                  )}
                                  onTextChange={(t) => setTtsText(`wf-${idx}-${wIdx}`, t)}
                                  onGenerate={() =>
                                    generateTts(
                                      getTtsText(
                                        `wf-${idx}-${wIdx}`,
                                        `${cleanBlend} ${cleanBlend} ${isKorean ? (w.korean ?? w.word) : w.word}`
                                      ),
                                      `wf-${idx}-${wIdx}`,
                                      (d, url) => {
                                        if (d.phonicsLesson)
                                          d.phonicsLesson.wordFamilies[idx].words[wIdx].ttsUrl =
                                            url;
                                      }
                                    )
                                  }
                                  onUpload={(f) =>
                                    handleTtsUpload(f, `wf-${idx}-${wIdx}`, (d, url) => {
                                      if (d.phonicsLesson)
                                        d.phonicsLesson.wordFamilies[idx].words[wIdx].ttsUrl = url;
                                    })
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 글자 따라쓰기 스트로크 편집 — 학습자 ABC 써보기 모달이 이 데이터로 stroke 단위 채점 */}
                    {(() => {
                      const upperLetter = item.vowel.toUpperCase() || item.blend?.[0] || '';
                      const lowerLetter = (
                        item.consonant?.toLowerCase() ||
                        item.vowel?.toLowerCase() ||
                        ''
                      ).toLowerCase();
                      const upperCount = item.letterTracingUpper?.strokes?.length ?? 0;
                      const lowerCount = item.letterTracingLower?.strokes?.length ?? 0;
                      return (
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                            글자 따라쓰기 스트로크 (학습자 써보기 모달용)
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setLetterTracingEdit({ idx, case: 'upper' })}
                              disabled={isBusy || !upperLetter}
                            >
                              {upperCount > 0
                                ? `대문자 ${upperLetter} (${upperCount} stroke)`
                                : `대문자 ${upperLetter} stroke 만들기`}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setLetterTracingEdit({ idx, case: 'lower' })}
                              disabled={isBusy || !lowerLetter}
                            >
                              {lowerCount > 0
                                ? `소문자 ${lowerLetter} (${lowerCount} stroke)`
                                : `소문자 ${lowerLetter} stroke 만들기`}
                            </Button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 글자 쓰기 연습 */}
                    <WritingPracticeSection
                      vowel={item.vowel}
                      consonant={item.consonant}
                      blend={item.blend}
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

      {/* === 사이트 워드 === */}
      {sightWords.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-bold">
              Sight Words
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {sightWords.map((word, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {word}
              </span>
            ))}
          </div>
        </section>
      )}

      {lightboxUrl && (
        <ImageLightbox src={lightboxUrl} alt="학습 카드" onClose={() => setLightboxUrl(null)} />
      )}

      {/* 핫스팟 편집 모달 */}
      {hotspotEditIdx !== null &&
        (() => {
          const blendItem = letters[hotspotEditIdx];
          const wfItem = wordFamilies[hotspotEditIdx];
          const imgUrl = blendItem?.illustrationUrl ?? blendItem?.exampleWordImageUrl;
          if (!imgUrl || !wfItem) return null;
          return (
            <HotspotEditorModal
              imageUrl={imgUrl}
              aspectRatio={aspectRatio.replace(':', '/')}
              words={wfItem.words.map((w) => ({
                word: w.word,
                korean: w.korean,
                hotspots: getWordHotspots(w),
              }))}
              onSave={(hotspotsByWord, order) => {
                onUpdate((d) => {
                  if (!d.phonicsLesson) return;
                  const wf = d.phonicsLesson.wordFamilies[hotspotEditIdx];
                  // 단어별 hotspots[] 반영 — legacy single `hotspot` 필드는 제거
                  hotspotsByWord.forEach((list, i) => {
                    const ww = wf.words[i];
                    if (!ww) return;
                    ww.hotspots = list.length > 0 ? list : undefined;
                    ww.hotspot = undefined;
                  });
                  // 레이어 순서에 따라 단어 배열 재정렬
                  const isReordered = order.some((v, i) => v !== i);
                  if (isReordered) {
                    const snapshot = wf.words.slice();
                    order.forEach((origIdx, newPos) => {
                      wf.words[newPos] = snapshot[origIdx];
                    });
                  }
                });
                onSave();
                setHotspotEditIdx(null);
              }}
              onClose={() => setHotspotEditIdx(null)}
            />
          );
        })()}

      {/* 학습카드 미리보기 모달 */}
      {previewIdx !== null && lesson && letters[previewIdx] && (
        <LearningCardPreviewModal
          item={letters[previewIdx]}
          wordFamily={wordFamilies[previewIdx]}
          systemSounds={storybook.systemSounds}
          aspectRatio={aspectRatio.replace(':', '/')}
          onClose={() => setPreviewIdx(null)}
        />
      )}

      {/* 점선 따라그리기 편집 모달 */}
      {tracingEditIdx !== null &&
        (() => {
          const blendItem = letters[tracingEditIdx];
          const imgUrl = blendItem?.illustrationUrl ?? blendItem?.exampleWordImageUrl;
          if (!imgUrl) return null;
          return (
            <TracingPointEditorModal
              imageUrl={imgUrl}
              word={blendItem.exampleWord}
              initialPoints={blendItem.exampleWordTracingPoints}
              aspectRatio={aspectRatio.replace(':', '/')}
              onSave={(points) => {
                onUpdate((d) => {
                  if (d.phonicsLesson)
                    d.phonicsLesson.blending[tracingEditIdx].exampleWordTracingPoints = points;
                });
                onSave();
                setTracingEditIdx(null);
              }}
              onClose={() => setTracingEditIdx(null)}
            />
          );
        })()}

      {/* 따라그리기 게임 미리보기 */}
      {tracingPreviewIdx !== null &&
        (() => {
          const blendItem = letters[tracingPreviewIdx];
          const imgUrl = blendItem?.illustrationUrl ?? blendItem?.exampleWordImageUrl;
          const points = blendItem?.exampleWordTracingPoints;
          if (!imgUrl || !points || points.length < 2) return null;
          return (
            <TracingGamePreviewModal
              imageUrl={imgUrl}
              word={blendItem.exampleWord}
              tracingPoints={points}
              systemSounds={storybook.systemSounds}
              onClose={() => setTracingPreviewIdx(null)}
            />
          );
        })()}

      {/* 글자 따라쓰기 스트로크 편집 모달 — 대/소문자 분리. 학습자 ABC 써보기 모달이 stroke 단위 채점에 활용. */}
      {letterTracingEdit !== null &&
        (() => {
          const { idx: editIdx, case: editCase } = letterTracingEdit;
          const blendItem = letters[editIdx];
          if (!blendItem) return null;
          const upperLetter = blendItem.vowel.toUpperCase() || blendItem.blend?.[0] || '';
          const lowerLetter = (
            blendItem.consonant?.toLowerCase() ||
            blendItem.vowel?.toLowerCase() ||
            ''
          ).toLowerCase();
          const letter = editCase === 'upper' ? upperLetter : lowerLetter;
          const initial =
            editCase === 'upper' ? blendItem.letterTracingUpper : blendItem.letterTracingLower;
          return (
            <LetterTracingPointEditorModal
              letter={letter}
              pairLabel={`${upperLetter}${lowerLetter}`}
              initialData={initial}
              onSave={(data) => {
                onUpdate((d) => {
                  if (!d.phonicsLesson) return;
                  const b = d.phonicsLesson.blending[editIdx];
                  if (editCase === 'upper') b.letterTracingUpper = data;
                  else b.letterTracingLower = data;
                });
                onSave();
                setLetterTracingEdit(null);
              }}
              onClose={() => setLetterTracingEdit(null)}
            />
          );
        })()}
    </div>
  );
}

// --- 유틸리티 ---
function countMissing(
  letters: { illustrationUrl?: string; exampleWordImageUrl?: string }[],
  wordFamilies: { words: { ttsUrl?: string }[] }[],
  type: 'image' | 'tts'
) {
  let c = 0;
  if (type === 'image') {
    for (const b of letters) if (!b.illustrationUrl && !b.exampleWordImageUrl) c++;
  } else {
    for (const wf of wordFamilies) {
      for (const w of wf.words) if (!w.ttsUrl) c++;
    }
  }
  return c;
}
