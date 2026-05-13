import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { useEditorLang } from '@/contexts/EditorLangContext';
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
} from '@dnd-kit/sortable';
import { PageCard } from './PageCard';
import { Button } from '@/design-system';
import { BatchProgressBar } from '@/components/BatchProgressBar';
import { ImageModelSelector } from '@/components/ImageModelSelector';
import { illustrationApi } from '../api/illustration.api';
import { ttsApi } from '@/features/tts/api/tts.api';
import { translationApi } from '@/features/translation/api/translation.api';
import { storybookApi } from '@/features/storybook/api/storybook.api';
import { pushImageHistory } from '@/lib/image-history';
import { TTS_VOICES, SUPPORTED_LANGUAGES, ASPECT_RATIOS } from '@tangobook/shared';
import type { Storybook, Page } from '@tangobook/shared';

const ALL_LANGS = SUPPORTED_LANGUAGES;

interface PagesTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

export function PagesTab({ storybook, onUpdate, onSave }: PagesTabProps) {
  const pages = storybook.pages ?? [];
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Language sub-tab — /editor2 에서 외부 Provider 로 활성 언어 주입 시 그것을 따름
  // (v1 /editor 처럼 Provider 없으면 내부 state 로 fallback)
  const externalLang = useEditorLang();
  const [internalLang, setInternalLang] = useState('ko');
  const isControlled = externalLang !== null;
  const activeLang = externalLang ?? internalLang;
  const setActiveLang = useCallback(
    (code: string) => {
      if (!isControlled) setInternalLang(code);
    },
    [isControlled]
  );
  // 외부 변경에 동기화 (controlled 모드에선 내부 state 도 업데이트해서 의존하는 메모리만 일관 유지)
  useEffect(() => {
    if (externalLang) setInternalLang(externalLang);
  }, [externalLang]);

  // Batch state
  const [globalVoice, setGlobalVoice] = useState<string>(TTS_VOICES[0].id);
  const [batchProgress, setBatchProgress] = useState<{
    type: string;
    current: number;
    total: number;
  } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Dropdown visibility
  const [showTtsDropdown, setShowTtsDropdown] = useState(false);

  // Bulk text input
  const [showBulkText, setShowBulkText] = useState(false);
  const [bulkTextValue, setBulkTextValue] = useState('');

  // Bulk prompt input
  const [showBulkPrompt, setShowBulkPrompt] = useState(false);
  const [bulkPromptValue, setBulkPromptValue] = useState('');

  const isBatchRunning = batchProgress !== null;
  const isKorean = activeLang === 'ko';
  const [downloading, setDownloading] = useState<'images' | null>(null);

  const downloadAllImages = async () => {
    const imagePages = pages.filter((p) => p.illustrationUrl);
    if (imagePages.length === 0) return alert('다운로드할 이미지가 없습니다.');

    setDownloading('images');
    try {
      const safeName = storybook.title.replace(/[<>:"/\\|?*]+/g, '_').slice(0, 50);
      const images = imagePages.map((p) => {
        const ext = p.illustrationUrl!.split('.').pop()?.split('?')[0] || 'jpg';
        return {
          url: p.illustrationUrl!,
          name: `page-${String(p.pageNumber).padStart(2, '0')}.${ext}`,
        };
      });
      const res = await apiClient.post(
        '/images/download-zip',
        {
          images,
          filename: `${safeName}_images.zip`,
        },
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}_images.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('이미지 다운로드 중 오류가 발생했습니다.');
    } finally {
      setDownloading(null);
    }
  };

  const downloadAllText = () => {
    if (pages.length === 0) return alert('다운로드할 텍스트가 없습니다.');

    const lines = pages.map((p) => `[${p.pageNumber}페이지]\n${p.text}`).join('\n\n');
    const content = `${storybook.title}\n${'='.repeat(40)}\n\n${lines}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const safeName = storybook.title.replace(/[<>:"/\\|?*]+/g, '_').slice(0, 50);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}_text.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      onUpdate((draft) => {
        const oldIndex = draft.pages.findIndex((p) => p.pageNumber === active.id);
        const newIndex = draft.pages.findIndex((p) => p.pageNumber === over.id);
        if (oldIndex < 0 || newIndex < 0) return;

        const [moved] = draft.pages.splice(oldIndex, 1);
        draft.pages.splice(newIndex, 0, moved);
        draft.pages.forEach((p, i) => {
          p.pageNumber = i + 1;
        });
      });
      onSave();
    },
    [onUpdate, onSave]
  );

  const handleAddPage = () => {
    onUpdate((draft) => {
      const newPageNumber = draft.pages.length + 1;
      const newPage: Page = {
        pageNumber: newPageNumber,
        text: '',
        scene_description: '',
        scene_structure: { characters: '', background: '', atmosphere: '' },
      };
      draft.pages.push(newPage);
    });
    onSave();
  };

  const handleDeletePage = useCallback(
    (pageIndex: number) => {
      onUpdate((draft) => {
        const deletedPageNumber = pageIndex + 1;
        draft.pages.splice(pageIndex, 1);
        draft.pages.forEach((p, i) => {
          p.pageNumber = i + 1;
        });

        // 다른 그림체들의 pageIllustrations 도 같이 cleanup + reindex
        // (삭제된 pageNumber 는 drop, 그 위 번호들은 -1 shift) — 안 그러면
        // 그림체 전환 시 옛 일러스트가 새 page slot 에 어긋나게 매핑됨.
        if (draft.styleAssets) {
          for (const style of Object.keys(draft.styleAssets)) {
            const pi = draft.styleAssets[style]?.pageIllustrations;
            if (!pi) continue;
            const next: typeof pi = {};
            for (const [key, value] of Object.entries(pi)) {
              const n = Number(key);
              if (!Number.isFinite(n) || n === deletedPageNumber) continue;
              next[n > deletedPageNumber ? n - 1 : n] = value;
            }
            draft.styleAssets[style]!.pageIllustrations = next;
          }
        }
      });
      onSave();
    },
    [onUpdate, onSave]
  );

  // === Batch: Generate All Illustrations ===
  const batchIllustrationMutation = useMutation({
    mutationFn: async () => {
      const ac = new AbortController();
      abortControllerRef.current = ac;
      const pages = storybook.pages ?? [];
      const charRefs = (storybook.characters ?? [])
        .filter((c) => c.referenceImage)
        .map((c) => ({ ...c, imageUrl: c.referenceImage }));

      let prevIllUrl: string | undefined;
      for (let i = 0; i < pages.length; i++) {
        ac.signal.throwIfAborted();
        setBatchProgress({ type: '삽화 생성', current: i + 1, total: pages.length });
        const data = await illustrationApi.generate(
          {
            page: pages[i],
            artStyle: storybook.artStyle,
            characterReferences: charRefs,
            previousIllustrationUrl: prevIllUrl,
            currentImageUrl: pages[i].illustrationUrl,
            settings: { aspectRatio: storybook.illustrationAspectRatio ?? '16:9' },
            storybookId: storybook.id,
            storybookTitle: storybook.title,
            model: storybook.imageModels?.illustration,
          },
          ac.signal
        );
        prevIllUrl = data.imageUrl;
        onUpdate((draft) => {
          const p = draft.pages[i];
          p.illustrationHistory = pushImageHistory(p.illustrationHistory, p.illustrationUrl);
          p.illustrationUrl = data.imageUrl;
        });
      }
    },
    onSettled: () => {
      abortControllerRef.current = null;
      setBatchProgress(null);
      onSave();
    },
  });

  // === Batch: Generate All TTS (for current activeLang) ===
  // 삽화 배치와 동일한 패턴: 클라이언트에서 페이지별 순차 호출 + 실시간 진행률
  const batchTtsMutation = useMutation({
    mutationFn: async ({ lang, voice }: { lang: string; voice: string }) => {
      const ac = new AbortController();
      abortControllerRef.current = ac;
      const pages = (storybook.pages ?? [])
        .map((p) => {
          const text = lang === 'ko' ? p.text : p.translations?.[lang]?.text;
          return text ? { pageNumber: p.pageNumber, text } : null;
        })
        .filter((p): p is { pageNumber: number; text: string } => p !== null);

      for (let i = 0; i < pages.length; i++) {
        ac.signal.throwIfAborted();
        setBatchProgress({ type: 'TTS 생성', current: i + 1, total: pages.length });
        try {
          const result = await ttsApi.generate({
            text: pages[i].text,
            provider: 'gemini',
            voice,
            language: lang,
            storybookId: storybook.id,
            pageNumber: pages[i].pageNumber,
          });
          onUpdate((draft) => {
            const page = draft.pages.find((p) => p.pageNumber === pages[i].pageNumber);
            if (!page) return;
            if (lang === 'ko') {
              page.ttsUrl = result.audioUrl;
            } else {
              if (!page.translations) page.translations = {};
              if (!page.translations[lang]) page.translations[lang] = { text: '' };
              page.translations[lang].ttsUrl = result.audioUrl;
            }
          });
        } catch (err) {
          console.error(`[TTS batch] page ${pages[i].pageNumber} failed:`, err);
          // 실패한 페이지는 건너뛰고 계속 진행
        }
      }
    },
    onSettled: () => {
      abortControllerRef.current = null;
      setBatchProgress(null);
      onSave();
    },
  });

  // === Batch: Translate All Pages (for current activeLang) ===
  const batchTranslateMutation = useMutation({
    mutationFn: (lang: string) => {
      const pages = (storybook.pages ?? [])
        .filter((p) => p.text)
        .map((p) => ({ pageNumber: p.pageNumber, text: p.text }));

      setBatchProgress({ type: '번역', current: 0, total: pages.length });
      return translationApi.batch({
        pages,
        targetLanguage: lang,
        storybookId: storybook.id,
      });
    },
    onSuccess: (results, lang) => {
      onUpdate((draft) => {
        const pagesWithText = draft.pages.filter((p) => p.text);
        results.forEach((r, i) => {
          const page = pagesWithText[i];
          if (!page) return;
          if (!page.translations) page.translations = {};
          const existing = page.translations[lang];
          page.translations[lang] = { text: r.text, ttsUrl: existing?.ttsUrl };
        });
      });
      onSave();
    },
    onSettled: () => setBatchProgress(null),
  });

  // === Batch: Generate All Scene Prompts ===
  const batchScenePromptMutation = useMutation({
    mutationFn: async () => {
      const ac = new AbortController();
      abortControllerRef.current = ac;
      const allPages = storybook.pages ?? [];
      const pagesWithText = allPages.filter((p) => p.text);
      const total = pagesWithText.length;

      for (let i = 0; i < total; i++) {
        ac.signal.throwIfAborted();
        setBatchProgress({ type: '장면 프롬프트 생성', current: i + 1, total });
        const p = pagesWithText[i];
        const results = await storybookApi.generateScenePrompts([
          { pageNumber: p.pageNumber, text: p.text, imageUrl: p.illustrationUrl },
        ]);
        const r = results[0];
        if (!r) continue;
        onUpdate((draft) => {
          const page = draft.pages.find((dp) => dp.pageNumber === r.pageNumber);
          if (!page) return;
          page.scene_description = r.scene_description;
          page.scene_description_en = r.scene_description_en;
          page.scene_structure = r.scene_structure;
        });
      }
    },
    onSettled: () => {
      abortControllerRef.current = null;
      setBatchProgress(null);
      onSave();
    },
  });

  const handleCancelBatch = () => {
    abortControllerRef.current?.abort();
  };

  // Bulk prompt: parse and apply
  const handleApplyBulkPrompt = () => {
    const chunks = bulkPromptValue.split('---').map((s) => s.trim());
    const applyCount = Math.min(chunks.length, pages.length);
    if (applyCount === 0) return;

    onUpdate((draft) => {
      for (let i = 0; i < applyCount; i++) {
        draft.pages[i].scene_description = chunks[i];
      }
    });
    onSave();
    setShowBulkPrompt(false);
    setBulkPromptValue('');
  };

  // Bulk text: parse and apply
  const handleApplyBulkText = () => {
    const chunks = bulkTextValue.split('---').map((s) => s.trim());
    const applyCount = Math.min(chunks.length, pages.length);
    if (applyCount === 0) return;

    onUpdate((draft) => {
      for (let i = 0; i < applyCount; i++) {
        draft.pages[i].text = chunks[i];
      }
    });
    onSave();
    setShowBulkText(false);
    setBulkTextValue('');
  };

  // Count how many pages have translation for a given lang
  const langStatus = (code: string) => {
    if (code === 'ko') return pages.length;
    return pages.filter((p) => p.translations?.[code]?.text).length;
  };

  return (
    <div className="space-y-4">
      {/* Header with page count + action buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          페이지 ({pages.length}쪽)
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={downloadAllImages}
            disabled={downloading === 'images' || pages.length === 0}
            loading={downloading === 'images'}
          >
            전체 이미지 다운로드
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={downloadAllText}
            disabled={pages.length === 0}
          >
            전체 텍스트 다운로드
          </Button>
          <Button size="sm" variant="secondary" onClick={handleAddPage}>
            + 페이지 추가
          </Button>
        </div>
      </div>

      {/* Language sub-tabs — /editor2 에서 외부 언어 탭이 제어할 땐 숨김 (중복 방지) */}
      {!isControlled && (
        <div className="flex items-center gap-1 flex-wrap border-b border-slate-200 dark:border-slate-700 pb-2">
          {ALL_LANGS.map((lang) => {
            const isActive = activeLang === lang.code;
            const count = langStatus(lang.code);
            const hasContent = lang.code === 'ko' || count > 0;
            return (
              <button
                key={lang.code}
                onClick={() => setActiveLang(lang.code)}
                className={`px-3 py-1.5 rounded-t text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-violet-600 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30'
                    : hasContent
                      ? 'border-transparent text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-900/20'
                      : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-500'
                }`}
              >
                {lang.label}
                {lang.code !== 'ko' && count > 0 && (
                  <span className="ml-1 text-[10px] text-violet-500">
                    {count}/{pages.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Illustration aspect ratio selector (Korean tab only) */}
      {isKorean && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">삽화 비율</span>
          <div className="flex gap-1">
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r}
                onClick={() => {
                  onUpdate((draft) => {
                    draft.illustrationAspectRatio = r;
                  });
                  onSave();
                }}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  (storybook.illustrationAspectRatio ?? '16:9') === r
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 삽화 모델 선택 */}
      {isKorean && (
        <ImageModelSelector
          value={storybook.imageModels?.illustration}
          onChange={(modelId) => {
            onUpdate((d) => {
              if (!d.imageModels) d.imageModels = {};
              d.imageModels.illustration = modelId;
            });
            onSave();
          }}
          label="삽화 모델"
        />
      )}

      {/* Batch action buttons - contextual based on active language */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Always show: Generate all illustrations (only on Korean tab) */}
        {isKorean && (
          <Button
            size="sm"
            onClick={() => batchIllustrationMutation.mutate()}
            disabled={isBatchRunning || pages.length === 0}
            loading={batchIllustrationMutation.isPending}
          >
            전체 삽화 생성
          </Button>
        )}

        {/* Generate all scene prompts (Korean tab only) */}
        {isKorean && (
          <Button
            size="sm"
            onClick={() => batchScenePromptMutation.mutate()}
            disabled={isBatchRunning || pages.length === 0}
            loading={batchScenePromptMutation.isPending}
          >
            전체 장면 프롬프트 생성
          </Button>
        )}

        {/* Not Korean: Translate all */}
        {!isKorean && (
          <Button
            size="sm"
            onClick={() => batchTranslateMutation.mutate(activeLang)}
            disabled={isBatchRunning || pages.length === 0}
            loading={batchTranslateMutation.isPending}
          >
            전체 번역
          </Button>
        )}

        {/* Bulk text input (Korean tab only) */}
        {isKorean && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (!showBulkText) {
                // Pre-fill with current page texts
                const current = pages.map((p) => p.text || '').join('\n---\n');
                setBulkTextValue(current);
              }
              setShowBulkText(!showBulkText);
            }}
            disabled={isBatchRunning || pages.length === 0}
          >
            텍스트 일괄 입력
          </Button>
        )}

        {/* Bulk prompt input (Korean tab only) */}
        {isKorean && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (!showBulkPrompt) {
                const current = pages.map((p) => p.scene_description || '').join('\n---\n');
                setBulkPromptValue(current);
              }
              setShowBulkPrompt(!showBulkPrompt);
            }}
            disabled={isBatchRunning || pages.length === 0}
          >
            프롬프트 일괄 입력
          </Button>
        )}

        {/* TTS: dropdown with voice selector */}
        <div className="relative">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowTtsDropdown(!showTtsDropdown)}
            disabled={isBatchRunning}
          >
            전체 TTS 생성 ▾
          </Button>
          {showTtsDropdown && (
            <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg p-3 w-64 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  목소리
                </label>
                <select
                  value={globalVoice}
                  onChange={(e) => setGlobalVoice(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                >
                  {TTS_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} ({v.description})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                현재 탭:{' '}
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {ALL_LANGS.find((l) => l.code === activeLang)?.label}
                </span>
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  setShowTtsDropdown(false);
                  batchTtsMutation.mutate({ lang: activeLang, voice: globalVoice });
                }}
              >
                TTS 생성 시작
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk text editor */}
      {showBulkText && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              페이지 텍스트 일괄 입력
            </p>
            <p className="text-xs text-slate-400">
              <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">---</code> 로 페이지
              구분
            </p>
          </div>
          <textarea
            value={bulkTextValue}
            onChange={(e) => setBulkTextValue(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-y dark:bg-slate-700 dark:text-slate-100"
            placeholder={`1페이지 텍스트\n---\n2페이지 텍스트\n---\n3페이지 텍스트`}
          />
          {(() => {
            const chunks = bulkTextValue.split('---').map((s) => s.trim());
            const applyCount = Math.min(chunks.length, pages.length);
            const overflow = chunks.length > pages.length;
            return (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {applyCount}개 페이지에 텍스트 적용
                  {overflow && (
                    <span className="text-amber-500 ml-1">
                      (입력 {chunks.length}개 중 {chunks.length - pages.length}개 초과분 무시)
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setShowBulkText(false);
                      setBulkTextValue('');
                    }}
                  >
                    취소
                  </Button>
                  <Button size="sm" onClick={handleApplyBulkText} disabled={applyCount === 0}>
                    적용
                  </Button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Bulk prompt editor */}
      {showBulkPrompt && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              페이지 프롬프트 일괄 입력
            </p>
            <p className="text-xs text-slate-400">
              <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">---</code> 로 페이지
              구분
            </p>
          </div>
          <textarea
            value={bulkPromptValue}
            onChange={(e) => setBulkPromptValue(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-y dark:bg-slate-700 dark:text-slate-100"
            placeholder={`1페이지 이미지 프롬프트\n---\n2페이지 이미지 프롬프트\n---\n3페이지 이미지 프롬프트`}
          />
          {(() => {
            const chunks = bulkPromptValue.split('---').map((s) => s.trim());
            const applyCount = Math.min(chunks.length, pages.length);
            const overflow = chunks.length > pages.length;
            return (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {applyCount}개 페이지에 프롬프트 적용
                  {overflow && (
                    <span className="text-amber-500 ml-1">
                      (입력 {chunks.length}개 중 {chunks.length - pages.length}개 초과분 무시)
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setShowBulkPrompt(false);
                      setBulkPromptValue('');
                    }}
                  >
                    취소
                  </Button>
                  <Button size="sm" onClick={handleApplyBulkPrompt} disabled={applyCount === 0}>
                    적용
                  </Button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Progress bar */}
      {batchProgress && (
        <BatchProgressBar
          current={batchProgress.current}
          total={batchProgress.total}
          label={batchProgress.type}
          onCancel={handleCancelBatch}
        />
      )}

      {/* Error display */}
      {(batchIllustrationMutation.isError ||
        batchTtsMutation.isError ||
        batchTranslateMutation.isError ||
        batchScenePromptMutation.isError) && (
        <p className="text-sm text-red-500">
          {batchIllustrationMutation.error?.message ||
            batchTtsMutation.error?.message ||
            batchScenePromptMutation.error?.message ||
            batchTranslateMutation.error?.message}
        </p>
      )}

      {/* Page list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={pages.map((p) => p.pageNumber)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {pages.map((page, idx) => (
              <PageCard
                key={page.pageNumber}
                page={page}
                pageIndex={idx}
                storybook={storybook}
                activeLang={activeLang}
                onUpdate={onUpdate}
                onSave={onSave}
                onDelete={() => handleDeletePage(idx)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
