import { useState, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Storybook } from '@tangobook/shared';
import { phonicsApi } from '../api/phonics.api';

// --- 공통 타입 ---
type StorybookUpdater = (draft: Storybook, url: string) => void;

export interface ImageTask {
  word: string;
  description?: string;
  isolatedObject?: boolean;
  updater: StorybookUpdater;
}

export interface TtsTask {
  word: string;
  key: string;
  updater: StorybookUpdater;
  useAiTts?: boolean;
}

interface UsePhonicsCardActionsParams {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

/**
 * AlphabetCardTab / LearningCardTab 공통 액션 훅
 *
 * 이미지 생성/업로드, TTS 생성/업로드, 배치 처리 등
 * 두 탭에서 거의 동일한 로직을 하나로 통합.
 */
export function usePhonicsCardActions({
  storybook,
  onUpdate,
  onSave,
}: UsePhonicsCardActionsParams) {
  const aspectRatio = storybook.phonicsAspectRatio ?? '16:9';
  const charRefs = (storybook.characters ?? []).map((c) => ({
    name: c.name,
    description: c.description,
    descriptionEn: c.descriptionEn,
    referenceImage: c.referenceImage,
  }));

  // --- 상태 ---
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const [generatingTts, setGeneratingTts] = useState<Set<string>>(new Set());
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [batchType, setBatchType] = useState<'image' | 'tts' | null>(null);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [ttsTexts, setTtsTexts] = useState<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);

  // --- TTS 텍스트 편집 헬퍼 ---
  const getTtsText = (key: string, defaultText: string) => ttsTexts[key] ?? defaultText;
  const setTtsText = (key: string, text: string) =>
    setTtsTexts((prev) => ({ ...prev, [key]: text }));

  const setAspectRatio = (ratio: string) => {
    onUpdate((draft) => {
      draft.phonicsAspectRatio = ratio;
    });
    onSave();
  };

  const isBusy =
    !!batchType || generatingImages.size > 0 || generatingTts.size > 0 || !!uploadingKey;

  // --- 이미지 생성 (단건 mutation) ---
  const imageMutation = useMutation({
    mutationFn: async (params: {
      word: string;
      description?: string;
      key: string;
      updater: StorybookUpdater;
      isolatedObject?: boolean;
    }) => {
      const { imageUrl } = await phonicsApi.generateWordImage({
        word: params.word,
        description: params.description,
        artStyle: storybook.artStyle,
        storybookId: storybook.id,
        storybookTitle: storybook.title,
        model: storybook.imageModels?.phonics,
        aspectRatio,
        characterReferences: charRefs,
        isolatedObject: params.isolatedObject,
      });
      return { ...params, imageUrl };
    },
    onMutate: ({ key }) => {
      setImageError(null);
      setGeneratingImages((prev) => new Set(prev).add(key));
    },
    onSuccess: ({ updater, imageUrl, key }) => {
      onUpdate((draft) => updater(draft, imageUrl));
      onSave();
      setGeneratingImages((prev) => {
        const n = new Set(prev);
        n.delete(key);
        return n;
      });
    },
    onError: (err, { key, word }) => {
      setGeneratingImages((prev) => {
        const n = new Set(prev);
        n.delete(key);
        return n;
      });
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      setImageError(`이미지 생성 실패 (${word}): ${msg}`);
    },
  });

  // --- TTS 생성 (단건) ---
  const generateTts = useCallback(
    async (word: string, key: string, updater: StorybookUpdater, useAiTts?: boolean) => {
      setGeneratingTts((prev) => new Set(prev).add(key));
      setTtsError(null);
      try {
        let audioUrl: string;
        if (useAiTts) {
          const result = await phonicsApi.generateWordTts({
            text: word,
            provider: 'gemini',
            storybookId: storybook.id,
            identifier: `phonics-${key}`,
          });
          audioUrl = result.audioUrl;
        } else {
          const result = await phonicsApi.concatPhonicsAudio({
            text: word,
            storybookId: storybook.id,
            identifier: `phonics-${key}`,
          });
          audioUrl = result.audioUrl;
        }
        onUpdate((draft) => updater(draft, audioUrl));
        onSave();
      } catch (err) {
        const msg = err instanceof Error ? err.message : '알 수 없는 오류';
        setTtsError(`TTS 생성 실패 (${word}): ${msg}`);
      } finally {
        setGeneratingTts((prev) => {
          const n = new Set(prev);
          n.delete(key);
          return n;
        });
      }
    },
    [storybook.id, onUpdate, onSave]
  );

  // --- 이미지 업로드 ---
  const handleUpload = useCallback(
    async (file: File, key: string, updater: StorybookUpdater) => {
      setUploadingKey(key);
      try {
        const { imageUrl } = await phonicsApi.uploadImage(file, storybook.id, storybook.title, key);
        onUpdate((draft) => updater(draft, imageUrl));
        onSave();
      } catch {
        /* silent */
      } finally {
        setUploadingKey(null);
      }
    },
    [storybook.id, storybook.title, onUpdate, onSave]
  );

  // --- TTS 업로드 ---
  const handleTtsUpload = useCallback(
    async (file: File, key: string, updater: StorybookUpdater) => {
      setGeneratingTts((prev) => new Set(prev).add(key));
      try {
        const { audioUrl } = await phonicsApi.uploadTts(file, storybook.id, `phonics-${key}`);
        onUpdate((d) => updater(d, audioUrl));
        onSave();
      } catch (err) {
        const msg = err instanceof Error ? err.message : '알 수 없는 오류';
        setTtsError(`TTS 업로드 실패: ${msg}`);
      } finally {
        setGeneratingTts((prev) => {
          const n = new Set(prev);
          n.delete(key);
          return n;
        });
      }
    },
    [storybook.id, onUpdate, onSave]
  );

  // --- 배치 이미지 생성 ---
  const runBatchImages = useCallback(
    async (tasks: ImageTask[]) => {
      if (!tasks.length) return;
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setBatchType('image');
      setBatchProgress({ current: 0, total: tasks.length });
      setImageError(null);
      let done = 0;
      for (let i = 0; i < tasks.length; i += 3) {
        if (ctrl.signal.aborted) break;
        const chunk = tasks.slice(i, i + 3);
        const results = await Promise.allSettled(
          chunk.map(async (t) => {
            const { imageUrl } = await phonicsApi.generateWordImage({
              word: t.word,
              description: t.description,
              artStyle: storybook.artStyle,
              storybookId: storybook.id,
              storybookTitle: storybook.title,
              model: storybook.imageModels?.phonics,
              aspectRatio,
              characterReferences: charRefs,
              isolatedObject: t.isolatedObject,
            });
            return { ...t, imageUrl };
          })
        );
        for (const r of results) {
          done++;
          setBatchProgress({ current: done, total: tasks.length });
          if (r.status === 'fulfilled') {
            onUpdate((d) => r.value.updater(d, r.value.imageUrl));
          } else {
            const msg = r.reason instanceof Error ? r.reason.message : '알 수 없는 오류';
            setImageError((prev) => (prev ? `${prev}\n${msg}` : msg));
          }
        }
        onSave();
      }
      setBatchType(null);
      abortRef.current = null;
    },
    [storybook, onUpdate, onSave]
  );

  // --- 배치 TTS 생성 ---
  const runBatchTts = useCallback(
    async (tasks: TtsTask[]) => {
      if (!tasks.length) return;
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setBatchType('tts');
      setBatchProgress({ current: 0, total: tasks.length });
      setTtsError(null);
      let done = 0;
      for (let i = 0; i < tasks.length; i += 3) {
        if (ctrl.signal.aborted) break;
        const chunk = tasks.slice(i, i + 3);
        const results = await Promise.allSettled(
          chunk.map(async (t) => {
            let audioUrl: string;
            if (t.useAiTts) {
              const result = await phonicsApi.generateWordTts({
                text: t.word,
                provider: 'gemini',
                storybookId: storybook.id,
                identifier: `phonics-${t.key}`,
              });
              audioUrl = result.audioUrl;
            } else {
              const result = await phonicsApi.concatPhonicsAudio({
                text: t.word,
                storybookId: storybook.id,
                identifier: `phonics-${t.key}`,
              });
              audioUrl = result.audioUrl;
            }
            return { ...t, audioUrl };
          })
        );
        for (const r of results) {
          done++;
          setBatchProgress({ current: done, total: tasks.length });
          if (r.status === 'fulfilled') {
            onUpdate((d) => r.value.updater(d, r.value.audioUrl));
          } else {
            const msg = r.reason instanceof Error ? r.reason.message : '알 수 없는 오류';
            setTtsError((prev) => (prev ? `${prev}\n${msg}` : msg));
          }
        }
        onSave();
      }
      setBatchType(null);
      abortRef.current = null;
    },
    [storybook, onUpdate, onSave]
  );

  return {
    // 파생 값
    aspectRatio,
    charRefs,
    isBusy,
    // 상태
    generatingImages,
    generatingTts,
    uploadingKey,
    lightboxUrl,
    setLightboxUrl,
    batchType,
    batchProgress,
    ttsError,
    setTtsError,
    imageError,
    setImageError,
    ttsTexts,
    abortRef,
    // TTS 텍스트 편집
    getTtsText,
    setTtsText,
    // 설정
    setAspectRatio,
    // 액션
    imageMutation,
    generateTts,
    handleUpload,
    handleTtsUpload,
    runBatchImages,
    runBatchTts,
  };
}
