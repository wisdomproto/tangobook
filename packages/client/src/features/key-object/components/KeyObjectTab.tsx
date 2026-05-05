import { useState, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/design-system';
import { ImageLightbox } from '@/components/ImageLightbox';
import { ImageDropZone } from '@/components/ImageDropZone';
import { ImagePreview } from '@/components/ImagePreview';
import { DownloadButton } from '@/components/DownloadButton';
import { ImageModelSelector } from '@/components/ImageModelSelector';
import { BatchProgressBar } from '@/components/BatchProgressBar';
import { UploadMenu } from '@/components/UploadMenu';
import { KeyObjectDotEditorModal } from './KeyObjectDotEditorModal';
import { keyObjectApi } from '../api/keyObject.api';
import { apiClient } from '@/lib/axios';
import { useEditorLang } from '@/contexts/EditorLangContext';
import { translationApi } from '@/features/translation/api/translation.api';
import { ttsApi } from '@/features/tts/api/tts.api';
import { OtherStyleReference } from '@/features/editor/components/OtherStyleReference';
import { TTS_VOICES } from '@tangobook/shared';
import type { Storybook, KeyObject, ImageGenerationResult } from '@tangobook/shared';

/** 활성 언어에 맞는 핵심사물 표시 이름 */
function getKeyObjectName(obj: KeyObject, lang: string): string {
  if (lang === 'ko') return obj.korean || obj.name;
  if (lang === 'en') return obj.nameEn || obj.name;
  return obj.nameTranslations?.[lang] || obj.name;
}

function setKeyObjectName(obj: KeyObject, lang: string, value: string): void {
  if (lang === 'ko') {
    obj.korean = value || undefined;
  } else if (lang === 'en') {
    obj.nameEn = value || undefined;
  } else {
    if (!obj.nameTranslations) obj.nameTranslations = {};
    if (value.trim()) obj.nameTranslations[lang] = value;
    else delete obj.nameTranslations[lang];
  }
}

/** 활성 언어에 맞는 핵심사물 TTS URL */
function getKeyObjectTts(obj: KeyObject, lang: string): string | undefined {
  if (lang === 'ko') return obj.ttsUrl;
  return obj.ttsUrls?.[lang];
}

function setKeyObjectTts(obj: KeyObject, lang: string, url: string): void {
  if (lang === 'ko') {
    obj.ttsUrl = url;
  } else {
    if (!obj.ttsUrls) obj.ttsUrls = {};
    obj.ttsUrls[lang] = url;
  }
}

interface KeyObjectTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

export function KeyObjectTab({ storybook, onUpdate, onSave }: KeyObjectTabProps) {
  const keyObjects = storybook.key_objects ?? [];
  const keyObjectImages = storybook.keyObjectImages ?? [];
  const externalLang = useEditorLang();
  const isControlled = externalLang !== null;
  const isNonKo = isControlled && externalLang !== 'ko';
  const [translatingNames, setTranslatingNames] = useState(false);

  // 모든 핵심사물 이름 일괄 번역 (ko → externalLang)
  const handleTranslateAllNames = useCallback(async () => {
    if (!externalLang || externalLang === 'ko' || keyObjects.length === 0) return;
    setTranslatingNames(true);
    try {
      const sources = keyObjects.map((obj, idx) => ({
        pageNumber: idx + 1,
        text: obj.korean || obj.name,
      }));
      const results = await translationApi.batch({
        pages: sources,
        targetLanguage: externalLang,
        storybookId: storybook.id,
      });
      onUpdate((draft) => {
        const objs = draft.key_objects ?? [];
        results.forEach((r, i) => {
          const o = objs[i];
          if (!o) return;
          if (externalLang === 'en') {
            o.nameEn = r.text;
          } else {
            if (!o.nameTranslations) o.nameTranslations = {};
            o.nameTranslations[externalLang] = r.text;
          }
        });
      });
      onSave();
    } catch (e) {
      console.error('[KeyObjectTab] batch translate failed:', e);
      alert('일괄 번역 실패: ' + (e as Error).message);
    } finally {
      setTranslatingNames(false);
    }
  }, [externalLang, keyObjects, onUpdate, onSave, storybook.id]);

  // === TTS ===
  const ttsLang = externalLang ?? 'ko';
  const [ttsGeneratingIdx, setTtsGeneratingIdx] = useState<number | null>(null);
  const [ttsBatch, setTtsBatch] = useState<{ current: number; total: number } | null>(null);
  const [ttsVoice, setTtsVoice] = useState<string>(TTS_VOICES[0].id);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const playTts = useCallback((url: string) => {
    if (ttsAudioRef.current) ttsAudioRef.current.pause();
    const audio = new Audio(url);
    ttsAudioRef.current = audio;
    audio.play().catch(() => {});
  }, []);

  /** 단일 KeyObject의 특정 언어 TTS 생성 + 저장. ko/en 같은 핵심 언어는 voice를 그대로 활용. */
  const generateTtsForLang = useCallback(
    async (idx: number, lang: string): Promise<string | null> => {
      const obj = keyObjects[idx];
      if (!obj) return null;
      const name = getKeyObjectName(obj, lang);
      if (!name?.trim()) return null;
      try {
        const result = await ttsApi.generate({
          text: name,
          provider: 'gemini',
          voice: ttsVoice,
          language: lang,
          storybookId: storybook.id,
          pageNumber: idx + 1,
        });
        onUpdate((draft) => {
          const o = draft.key_objects?.[idx];
          if (o) setKeyObjectTts(o, lang, result.audioUrl);
        });
        return result.audioUrl;
      } catch (e) {
        console.error(`[KeyObjectTab] TTS generate failed (idx=${idx}, lang=${lang}):`, e);
        return null;
      }
    },
    [keyObjects, ttsVoice, onUpdate, storybook.id]
  );

  const generateOneTts = useCallback(
    async (idx: number) => {
      setTtsGeneratingIdx(idx);
      try {
        const url = await generateTtsForLang(idx, ttsLang);
        if (!url) return;
        onSave();
        playTts(url);
      } finally {
        setTtsGeneratingIdx(null);
      }
    },
    [generateTtsForLang, ttsLang, onSave, playTts]
  );

  /** 활성 언어 1개에 대해 일괄 생성. */
  const generateAllTts = useCallback(async () => {
    const targets = keyObjects
      .map((obj, idx) => ({ idx, name: getKeyObjectName(obj, ttsLang) }))
      .filter((t) => t.name?.trim());
    if (targets.length === 0) return;
    if (!confirm(`${targets.length}개 핵심사물 이름의 ${ttsLang} TTS를 생성합니다. 계속할까요?`))
      return;
    setTtsBatch({ current: 0, total: targets.length });
    for (let i = 0; i < targets.length; i++) {
      setTtsBatch({ current: i + 1, total: targets.length });
      await generateTtsForLang(targets[i].idx, ttsLang);
      onSave();
    }
    setTtsBatch(null);
  }, [keyObjects, ttsLang, generateTtsForLang, onSave]);

  /** 한·영 모두 한 번에 — ko 누락 + en 누락 채움. 이미 있는 건 skip. */
  const generateAllTtsBoth = useCallback(async () => {
    type Job = { idx: number; lang: 'ko' | 'en' };
    const jobs: Job[] = [];
    keyObjects.forEach((obj, idx) => {
      const koName = getKeyObjectName(obj, 'ko');
      const enName = getKeyObjectName(obj, 'en');
      if (koName?.trim() && !obj.ttsUrl) jobs.push({ idx, lang: 'ko' });
      if (enName?.trim() && !obj.ttsUrls?.en) jobs.push({ idx, lang: 'en' });
    });
    if (jobs.length === 0) {
      alert('이미 모든 한·영 TTS가 생성되어 있어요.');
      return;
    }
    if (!confirm(`누락된 한·영 TTS ${jobs.length}개를 일괄 생성합니다. 계속할까요?`)) return;
    setTtsBatch({ current: 0, total: jobs.length });
    for (let i = 0; i < jobs.length; i++) {
      setTtsBatch({ current: i + 1, total: jobs.length });
      await generateTtsForLang(jobs[i].idx, jobs[i].lang);
      onSave();
    }
    setTtsBatch(null);
  }, [keyObjects, generateTtsForLang, onSave]);

  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);
  const [editingPrompt, setEditingPrompt] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newObj, setNewObj] = useState({ name: '', nameEn: '', description: '' });
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [dotEditIdx, setDotEditIdx] = useState<number | null>(null);

  const generateMutation = useMutation({
    mutationFn: (idx: number) => {
      const obj = keyObjects[idx];
      const existingImage = storybook.keyObjectImages?.find(
        (o) => o.objectName === obj.name
      )?.imageUrl;
      return keyObjectApi.generate({
        keyObject: obj,
        artStyle: storybook.artStyle,
        storybookId: storybook.id,
        storybookTitle: storybook.title,
        currentImageUrl: existingImage,
        model: storybook.imageModels?.keyObject,
      });
    },
    onSuccess: (data, idx) => {
      onUpdate((draft) => {
        if (!draft.keyObjectImages) draft.keyObjectImages = [];
        const existing = draft.keyObjectImages.findIndex(
          (o) => o.objectName === keyObjects[idx].name
        );
        const entry = {
          objectName: keyObjects[idx].name,
          imageUrl: data.imageUrl,
          success: true,
          keypoints: undefined,
        };
        if (existing >= 0) draft.keyObjectImages[existing] = entry;
        else draft.keyObjectImages.push(entry);
      });
      onSave();
      setGeneratingIdx(null);
    },
    onError: () => setGeneratingIdx(null),
  });

  const handleGenerate = (idx: number) => {
    setGeneratingIdx(idx);
    generateMutation.mutate(idx);
  };

  const [generatingAll, setGeneratingAll] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateAllMutation = useMutation({
    mutationFn: async () => {
      const ac = new AbortController();
      abortControllerRef.current = ac;
      let completed = 0;
      setBatchProgress({ current: 0, total: keyObjects.length });

      const promises = keyObjects.map((obj) =>
        keyObjectApi
          .generate(
            {
              keyObject: obj,
              artStyle: storybook.artStyle,
              storybookId: storybook.id,
              storybookTitle: storybook.title,
              model: storybook.imageModels?.keyObject,
            },
            ac.signal
          )
          .then((data) => {
            completed++;
            setBatchProgress({ current: completed, total: keyObjects.length });
            onUpdate((draft) => {
              if (!draft.keyObjectImages) draft.keyObjectImages = [];
              const existing = draft.keyObjectImages.findIndex((o) => o.objectName === obj.name);
              const entry = {
                objectName: obj.name,
                imageUrl: data.imageUrl,
                success: true,
                keypoints: undefined,
              };
              if (existing >= 0) draft.keyObjectImages[existing] = entry;
              else draft.keyObjectImages.push(entry);
            });
          })
      );

      await Promise.allSettled(promises);
    },
    onSettled: () => {
      abortControllerRef.current = null;
      setBatchProgress(null);
      setGeneratingAll(false);
      onSave();
    },
  });

  const handleGenerateAll = () => {
    setGeneratingAll(true);
    generateAllMutation.mutate();
  };

  const handleCancelAll = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleAddObject = () => {
    if (!newObj.name.trim()) return;
    const obj: KeyObject = {
      name: newObj.name.trim(),
      nameEn: newObj.nameEn.trim() || undefined,
      description: newObj.description.trim(),
      pages: [],
    };
    onUpdate((draft) => {
      if (!draft.key_objects) draft.key_objects = [];
      draft.key_objects.push(obj);
    });
    onSave();
    // 신규 KeyObject 의 새 인덱스 = 추가 직전 길이. 자동으로 한·영 TTS 동시 생성 (fire-and-forget).
    const newIdx = keyObjects.length;
    void (async () => {
      const langs: string[] = ['ko'];
      if (obj.nameEn) langs.push('en');
      for (const lang of langs) {
        await generateTtsForLang(newIdx, lang);
      }
      onSave();
    })();
    setNewObj({ name: '', nameEn: '', description: '' });
    setShowAddForm(false);
  };

  const handleDeleteObject = (idx: number) => {
    const obj = keyObjects[idx];
    if (!obj) return;
    const objName = obj.name;
    if (
      !confirm(
        `"${getKeyObjectName(obj, ttsLang)}" 핵심사물을 모든 그림체·언어에서 삭제할까요?\n` +
          `(이미지·번역·TTS 포함)`
      )
    )
      return;
    onUpdate((draft) => {
      // 1) 핵심사물 자체 제거
      if (draft.key_objects) draft.key_objects.splice(idx, 1);
      // 2) top-level 이미지 제거
      if (draft.keyObjectImages) {
        draft.keyObjectImages = draft.keyObjectImages.filter((img) => img.objectName !== objName);
      }
      // 3) 모든 styleAssets 의 keyObjectImages 에서도 제거 (그림체별 자산)
      if (draft.styleAssets) {
        for (const style of Object.keys(draft.styleAssets)) {
          const sa = draft.styleAssets[style];
          if (sa?.keyObjectImages) {
            sa.keyObjectImages = sa.keyObjectImages.filter((img) => img.objectName !== objName);
          }
        }
      }
      // KeyObject 자체가 사라지므로 nameTranslations·ttsUrls·ttsUrl 은 자동 소거됨
    });
    onSave();
  };

  const handleUpload = async (idx: number, file: File) => {
    const obj = keyObjects[idx];
    if (!obj) return;
    setUploadingIdx(idx);
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('storybookId', storybook.id);
      form.append('storybookTitle', storybook.title);
      form.append('type', 'keyobj');
      form.append('characterName', obj.name);
      const res = await apiClient.post<{ success: true; data: ImageGenerationResult }>(
        '/images/upload',
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      const imageUrl = res.data.data.imageUrl;
      onUpdate((draft) => {
        if (!draft.keyObjectImages) draft.keyObjectImages = [];
        const existing = draft.keyObjectImages.findIndex((o) => o.objectName === obj.name);
        const entry = { objectName: obj.name, imageUrl, success: true, keypoints: undefined };
        if (existing >= 0) draft.keyObjectImages[existing] = entry;
        else draft.keyObjectImages.push(entry);
      });
      onSave();
    } catch {
      // handled silently
    } finally {
      setUploadingIdx(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 flex-wrap">
          핵심 사물 ({keyObjects.length}개)
          {isControlled && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
              {externalLang === 'ko' ? '🇰🇷' : externalLang === 'en' ? '🇺🇸' : '🌐'}{' '}
              <strong>{externalLang}</strong> 이름 편집
              <span className="opacity-70 font-normal"> · 이미지는 공유</span>
            </span>
          )}
        </h2>
        <div className="flex gap-2 flex-wrap">
          {isNonKo && keyObjects.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleTranslateAllNames}
              disabled={translatingNames}
              loading={translatingNames}
              title={`Gemini 로 모든 사물 이름을 ${externalLang} 으로 번역`}
            >
              🤖 이름 일괄 번역
            </Button>
          )}
          {keyObjects.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={generateAllTts}
              disabled={!!ttsBatch || ttsGeneratingIdx !== null}
              loading={!!ttsBatch}
              title={`${ttsLang} 으로 모든 핵심사물 이름 TTS 일괄 생성`}
            >
              {ttsBatch
                ? `🎙 TTS 생성 중 (${ttsBatch.current}/${ttsBatch.total})`
                : `🎙 이름 TTS 일괄 생성 (${ttsLang})`}
            </Button>
          )}
          {keyObjects.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={generateAllTtsBoth}
              disabled={!!ttsBatch || ttsGeneratingIdx !== null}
              loading={!!ttsBatch}
              title="한국어·영어 누락된 TTS 모두 채움 (이미 있는 건 skip)"
            >
              🌐 한·영 TTS 누락 채움
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => setShowAddForm(!showAddForm)}>
            + 사물 추가
          </Button>
          <Button
            size="sm"
            onClick={handleGenerateAll}
            disabled={generatingAll || generatingIdx !== null || keyObjects.length === 0}
            loading={generatingAll}
          >
            전체 생성
          </Button>
        </div>
      </div>

      <ImageModelSelector
        value={storybook.imageModels?.keyObject}
        onChange={(modelId) => {
          onUpdate((d) => {
            if (!d.imageModels) d.imageModels = {};
            d.imageModels.keyObject = modelId;
          });
          onSave();
        }}
        label="모델"
      />

      {batchProgress && (
        <BatchProgressBar
          current={batchProgress.current}
          total={batchProgress.total}
          label="사물 생성"
          onCancel={handleCancelAll}
        />
      )}

      {showAddForm && (
        <div className="bg-violet-50 dark:bg-violet-900/30 rounded-xl border border-violet-200 dark:border-violet-800 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-violet-800 dark:text-violet-200">
            새 핵심 사물 추가
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={newObj.name}
              onChange={(e) => setNewObj({ ...newObj, name: e.target.value })}
              placeholder="사물 이름 (한글)"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            />
            <input
              value={newObj.nameEn}
              onChange={(e) => setNewObj({ ...newObj, nameEn: e.target.value })}
              placeholder="영어 이름 (선택)"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            />
          </div>
          <textarea
            value={newObj.description}
            onChange={(e) => setNewObj({ ...newObj, description: e.target.value })}
            placeholder="사물 설명"
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="secondary" onClick={() => setShowAddForm(false)}>
              취소
            </Button>
            <Button size="sm" onClick={handleAddObject} disabled={!newObj.name.trim()}>
              추가
            </Button>
          </div>
        </div>
      )}

      {keyObjects.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">핵심 사물이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {keyObjects.map((obj, idx) => {
            const img = keyObjectImages.find((o) => o.objectName === obj.name);
            return (
              <ImageDropZone
                key={idx}
                onFile={(file) => handleUpload(idx, file)}
                disabled={generatingIdx === idx || uploadingIdx === idx}
                enablePaste={false}
              >
                {(openFilePicker) => (
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center relative group">
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteObject(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:border-red-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      title="삭제"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>

                    <ImagePreview
                      src={img?.imageUrl}
                      alt={obj.name}
                      className="mb-2"
                      onClick={() => img?.imageUrl && setLightboxUrl(img.imageUrl)}
                      onDelete={() => {
                        onUpdate((draft) => {
                          const imgs = draft.keyObjectImages ?? [];
                          const i = imgs.findIndex((o) => o.objectName === obj.name);
                          if (i >= 0) imgs.splice(i, 1);
                        });
                        onSave();
                      }}
                    />

                    {/* 다른 그림체의 같은 사물 이미지 참고 */}
                    <div className="mb-2">
                      <OtherStyleReference
                        storybook={storybook}
                        slot={{ kind: 'keyObject', objectName: obj.name }}
                        label={`🎨 다른 그림체`}
                        thumbSize={64}
                      />
                    </div>

                    {/* 활성 언어 이름 표시 — controlled 시 인라인 편집 */}
                    {isNonKo ? (
                      <>
                        <input
                          type="text"
                          value={getKeyObjectName(obj, externalLang!)}
                          onChange={(e) => {
                            const v = e.target.value;
                            onUpdate((draft) => {
                              const o = draft.key_objects?.[idx];
                              if (o) setKeyObjectName(o, externalLang!, v);
                            });
                          }}
                          onBlur={() => onSave()}
                          placeholder={`${obj.name} (${externalLang} 번역)`}
                          className="w-full text-sm font-medium text-slate-700 dark:text-slate-200 truncate bg-transparent border-b border-sky-300 dark:border-sky-700 focus:outline-none focus:border-sky-500 px-0.5 py-0.5"
                        />
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          🇰🇷 {obj.korean || obj.name}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {obj.korean || obj.name}
                      </p>
                    )}

                    {/* TTS — 활성 언어 이름 발음 */}
                    {(() => {
                      const ttsUrl = getKeyObjectTts(obj, ttsLang);
                      const generating = ttsGeneratingIdx === idx;
                      return (
                        <div className="mt-1 flex items-center justify-center gap-1">
                          {ttsUrl ? (
                            <>
                              <button
                                onClick={() => playTts(ttsUrl)}
                                disabled={generating}
                                className="px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded"
                                title={`${ttsLang} 발음 재생`}
                              >
                                ▶ {ttsLang}
                              </button>
                              <button
                                onClick={() => generateOneTts(idx)}
                                disabled={generating}
                                className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                title="TTS 다시 생성"
                              >
                                {generating ? '⟳' : '🔄'}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => generateOneTts(idx)}
                              disabled={generating}
                              className="px-1.5 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded disabled:opacity-50"
                              title={`${ttsLang} TTS 생성`}
                            >
                              {generating ? '⟳ 생성 중' : `🎙 ${ttsLang} TTS`}
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {obj.description && obj.description !== obj.name && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-left leading-relaxed">
                        {obj.description}
                      </p>
                    )}
                    {obj.pages?.length > 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        등장: P{obj.pages.join(', P')}
                      </p>
                    )}

                    {/* Prompt accordion */}
                    <button
                      onClick={() => {
                        const next = expandedPrompt === idx ? null : idx;
                        if (next !== null) setEditingPrompt(obj.customPrompt ?? '');
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
                            const objs = draft.key_objects ?? [];
                            if (objs[idx]) objs[idx].customPrompt = editingPrompt;
                          });
                          onSave();
                        }}
                        rows={3}
                        className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none resize-none text-xs text-slate-600 text-left dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                        placeholder="이미지 생성 시 참조할 프롬프트..."
                      />
                    )}

                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleGenerate(idx)}
                        loading={generatingIdx === idx || uploadingIdx === idx}
                        disabled={generatingIdx !== null || generatingAll || uploadingIdx !== null}
                      >
                        {img?.imageUrl ? '재생성' : '생성'}
                      </Button>
                      {img?.imageUrl && (
                        <DownloadButton
                          href={img.imageUrl}
                          filename={`${obj.korean || obj.name}.png`}
                        />
                      )}
                      <UploadMenu
                        onFile={(file) => handleUpload(idx, file)}
                        openFilePicker={openFilePicker}
                        disabled={generatingIdx === idx || uploadingIdx === idx}
                      />
                    </div>
                    {img?.imageUrl && (
                      <button
                        onClick={() => setDotEditIdx(idx)}
                        className="w-full mt-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-300 hover:text-violet-600"
                      >
                        {(img.keypoints?.length ?? 0) > 0
                          ? `점 ${img.keypoints!.length}개`
                          : '점 등록'}
                      </button>
                    )}
                  </div>
                )}
              </ImageDropZone>
            );
          })}
        </div>
      )}

      {(generateMutation.isError || generateAllMutation.isError) && (
        <p className="text-sm text-red-500">
          {generateMutation.error?.message || generateAllMutation.error?.message}
        </p>
      )}

      {lightboxUrl && (
        <ImageLightbox src={lightboxUrl} alt="핵심 사물" onClose={() => setLightboxUrl(null)} />
      )}

      {dotEditIdx !== null &&
        (() => {
          const obj = keyObjects[dotEditIdx];
          const img = keyObjectImages.find((o) => o.objectName === obj?.name);
          if (!obj || !img?.imageUrl) return null;
          return (
            <KeyObjectDotEditorModal
              objectName={obj.korean || obj.name}
              imageUrl={img.imageUrl}
              initialKeypoints={img.keypoints ?? []}
              onSave={(keypoints) => {
                onUpdate((draft) => {
                  const target = (draft.keyObjectImages ?? []).find(
                    (o) => o.objectName === obj.name
                  );
                  if (target) target.keypoints = keypoints;
                });
                onSave();
                setDotEditIdx(null);
              }}
              onClose={() => setDotEditIdx(null)}
            />
          );
        })()}
    </div>
  );
}
