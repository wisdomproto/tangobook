import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { ImageLightbox } from '@/components/ImageLightbox';
import { ImageDropZone } from '@/components/ImageDropZone';
import { ImagePreview } from '@/components/ImagePreview';
import { DownloadButton } from '@/components/DownloadButton';
import { ImageModelSelector } from '@/components/ImageModelSelector';
import { UploadMenu } from '@/components/UploadMenu';
import { coverApi } from '../api/cover.api';
import { apiClient } from '@/lib/axios';
import { pushImageHistory } from '@/lib/image-history';
import { settingsApi, type TitleTemplate } from '@/features/settings/api/settings.api';
import { ASPECT_RATIOS } from '@tangobook/shared';
import type { Storybook, CoverImageItem, ImageGenerationResult } from '@tangobook/shared';

interface CoverTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

/** 레거시 → coverImages 마이그레이션 */
function migrateLegacyCover(sb: Storybook): CoverImageItem[] {
  if (sb.coverImages && sb.coverImages.length > 0) return sb.coverImages;
  if (!sb.coverImage) return [];
  return [
    {
      id: Date.now().toString(),
      imageUrl: sb.coverImage,
      prompt: sb.coverPrompt,
      characterRefs: sb.coverCharacterRefs,
      history: sb.coverImageHistory,
    },
  ];
}

export function CoverTab({ storybook, onUpdate, onSave }: CoverTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const aspectRatio = storybook.coverAspectRatio ?? '3:4';
  const characters = storybook.characters ?? [];

  const coverImages = storybook.coverImages ?? [];
  const isPhonics = storybook.type === 'phonics';

  // 파닉스 표지 정보 (level + unit 제목, 블렌딩 단어, 캐릭터명)
  const phonicsCoverInfo = useMemo(() => {
    if (!isPhonics) return null;
    const cfg = storybook.phonicsConfig;
    const lesson = storybook.phonicsLesson;
    if (!cfg) return null;
    const levelLabel = cfg.level.replace(/^book/, 'Level ').replace(/^step/, 'Step ');
    const unitLabel = cfg.targetUnit || 'Unit 1';
    const titleText = `${levelLabel} - ${unitLabel}`;
    const blendingWords = (lesson?.blending ?? []).flatMap(
      (b) => [b.exampleWord, b.exampleWord2].filter(Boolean) as string[]
    );
    const charNames = (storybook.characters ?? []).map((c) => c.name);
    return { titleText, blendingWords, characters: charNames };
  }, [isPhonics, storybook.phonicsConfig, storybook.phonicsLesson, storybook.characters]);

  // 레거시 마이그레이션: coverImages가 없고 coverImage가 있으면 자동 생성
  useEffect(() => {
    if ((!storybook.coverImages || storybook.coverImages.length === 0) && storybook.coverImage) {
      const migrated = migrateLegacyCover(storybook);
      onUpdate((draft) => {
        draft.coverImages = migrated;
      });
      onSave();
      setSelectedId(migrated[0]?.id ?? null);
    }
  }, []);

  // 선택된 표지가 없으면 첫 번째 자동 선택
  useEffect(() => {
    if (coverImages.length > 0 && (!selectedId || !coverImages.find((c) => c.id === selectedId))) {
      setSelectedId(coverImages[0].id);
    }
  }, [coverImages, selectedId]);

  const selected = coverImages.find((c) => c.id === selectedId) ?? null;

  // 파닉스 기본 프롬프트 생성
  const defaultPhonicsPrompt = useMemo(() => {
    if (!phonicsCoverInfo) return '';
    const charPart =
      phonicsCoverInfo.characters.length > 0
        ? `${phonicsCoverInfo.characters.join(', ')}가 `
        : '귀여운 동물 캐릭터들이 ';
    const wordSample = phonicsCoverInfo.blendingWords.slice(0, 4);
    const wordPart =
      wordSample.length > 0 ? `${wordSample.join(', ')} 등의 단어와 관련된 사물들과 함께 ` : '';
    return `${charPart}${wordPart}즐겁게 학습하는 모습`;
  }, [phonicsCoverInfo]);

  // 선택된 표지의 로컬 프롬프트/캐릭터 refs 상태
  const defaultChars = isPhonics ? characters.map((_, i) => i) : [];
  const [coverPrompt, setCoverPrompt] = useState(selected?.prompt || defaultPhonicsPrompt);
  const [selectedChars, setSelectedChars] = useState<number[]>(
    selected?.characterRefs ?? defaultChars
  );

  // 선택 변경 시 로컬 상태 동기화
  useEffect(() => {
    setCoverPrompt(selected?.prompt || defaultPhonicsPrompt);
    setSelectedChars(selected?.characterRefs ?? defaultChars);
  }, [selectedId]);

  const updateCoverItem = useCallback(
    (itemId: string, updater: (item: CoverImageItem) => void) => {
      onUpdate((draft) => {
        const item = draft.coverImages?.find((c) => c.id === itemId);
        if (item) updater(item);
      });
    },
    [onUpdate]
  );

  // 대표 표지 설정
  const setPrimary = (itemId: string) => {
    const item = coverImages.find((c) => c.id === itemId);
    if (item) {
      onUpdate((draft) => {
        draft.coverImage = item.imageUrl;
      });
      onSave();
    }
  };

  // 표지 추가
  const addCover = () => {
    const newId = Date.now().toString();
    onUpdate((draft) => {
      if (!draft.coverImages) draft.coverImages = [];
      draft.coverImages.push({ id: newId, imageUrl: '' });
    });
    setSelectedId(newId);
  };

  // 표지 삭제
  const deleteCover = (itemId: string) => {
    onUpdate((draft) => {
      if (!draft.coverImages) return;
      draft.coverImages = draft.coverImages.filter((c) => c.id !== itemId);
      // 대표 표지였으면 첫 번째 남은 표지로 대체
      const deleted = coverImages.find((c) => c.id === itemId);
      if (deleted && draft.coverImage === deleted.imageUrl) {
        draft.coverImage = draft.coverImages[0]?.imageUrl || undefined;
      }
    });
    onSave();
    if (selectedId === itemId) {
      const remaining = coverImages.filter((c) => c.id !== itemId);
      setSelectedId(remaining[0]?.id ?? null);
    }
  };

  const setAspectRatio = (ratio: string) => {
    onUpdate((draft) => {
      draft.coverAspectRatio = ratio;
    });
    onSave();
  };

  // 표지 생성
  const generateMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error('표지를 선택해주세요');
      const refs = selectedChars.map((i) => characters[i]).filter(Boolean);
      return coverApi.generate({
        storybook: {
          title: storybook.title,
          coverPrompt: coverPrompt || undefined,
          artStyle: storybook.artStyle,
        },
        characterReferences: refs,
        settings: { aspectRatio },
        currentImageUrl: selected.imageUrl || undefined,
        model: storybook.imageModels?.cover,
        phonicsCover: phonicsCoverInfo ?? undefined,
        titleTemplateUrl: selectedTemplateUrl,
      });
    },
    onSuccess: (data) => {
      if (!selected) return;
      onUpdate((draft) => {
        const item = draft.coverImages?.find((c) => c.id === selected.id);
        if (item) {
          item.history = pushImageHistory(item.history, item.imageUrl || undefined);
          item.imageUrl = data.imageUrl;
          item.prompt = coverPrompt;
          item.characterRefs = selectedChars;
        }
        // 대표 표지이거나 대표가 없으면 업데이트
        if (draft.coverImage === selected.imageUrl || !draft.coverImage) {
          draft.coverImage = data.imageUrl;
        }
      });
      onSave();
    },
  });

  // 히스토리 복원
  const handleRestoreHistory = (historyIdx: number) => {
    if (!selected) return;
    onUpdate((draft) => {
      const item = draft.coverImages?.find((c) => c.id === selected.id);
      if (!item) return;
      const history = item.history ?? [];
      const restored = history[historyIdx];
      if (!restored) return;
      const wasPrimary = draft.coverImage === item.imageUrl;
      if (item.imageUrl) history[historyIdx] = item.imageUrl;
      else history.splice(historyIdx, 1);
      item.imageUrl = restored;
      item.history = history;
      if (wasPrimary) draft.coverImage = restored;
    });
    onSave();
  };

  const toggleChar = (idx: number) => {
    setSelectedChars((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // 업로드
  const handleUpload = async (file: File) => {
    if (!selected) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('storybookId', storybook.id);
      form.append('storybookTitle', storybook.title);
      form.append('type', 'cover');
      const res = await apiClient.post<{ success: true; data: ImageGenerationResult }>(
        '/images/upload',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const imageUrl = res.data.data.imageUrl;
      onUpdate((draft) => {
        const item = draft.coverImages?.find((c) => c.id === selected.id);
        if (item) {
          item.history = pushImageHistory(item.history, item.imageUrl || undefined);
          item.imageUrl = imageUrl;
        }
        if (draft.coverImage === selected.imageUrl || !draft.coverImage) {
          draft.coverImage = imageUrl;
        }
      });
      onSave();
    } catch {
      // handled silently
    } finally {
      setUploading(false);
    }
  };

  // --- 제목 템플릿 (전역) ---
  const queryClient = useQueryClient();
  const { data: titleTemplates = [] } = useQuery({
    queryKey: ['title-templates'],
    queryFn: settingsApi.getTitleTemplates,
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const addTemplateMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('image', file);
      form.append('storybookId', storybook.id);
      form.append('storybookTitle', storybook.title);
      form.append('type', 'cover-template');
      const res = await apiClient.post<{ success: true; data: ImageGenerationResult }>(
        '/images/upload',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const imageUrl = res.data.data.imageUrl;
      return settingsApi.addTitleTemplate(imageUrl);
    },
    onSuccess: (template) => {
      queryClient.setQueryData<TitleTemplate[]>(['title-templates'], (old) => [
        ...(old ?? []),
        template,
      ]);
      setSelectedTemplateId(template.id);
      setTemplateModalOpen(false);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => settingsApi.deleteTitleTemplate(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<TitleTemplate[]>(['title-templates'], (old) =>
        (old ?? []).filter((t) => t.id !== id)
      );
      if (selectedTemplateId === id) setSelectedTemplateId(null);
    },
  });

  const uploadingTemplate = addTemplateMutation.isPending;
  const selectedTemplateUrl = titleTemplates.find((t) => t.id === selectedTemplateId)?.imageUrl;

  const isPrimary = (itemId: string) => {
    const item = coverImages.find((c) => c.id === itemId);
    return item ? storybook.coverImage === item.imageUrl && !!item.imageUrl : false;
  };

  return (
    <ImageDropZone
      onFile={handleUpload}
      disabled={uploading || generateMutation.isPending || !selected || templateModalOpen}
      enablePaste
    >
      {(openFilePicker) => (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              표지 이미지
            </h2>
            <Button variant="secondary" size="sm" onClick={addCover}>
              + 표지 추가
            </Button>
          </div>

          {/* 표지 목록 */}
          {coverImages.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              {coverImages.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`relative group cursor-pointer rounded-lg border-2 p-1 transition-colors ${
                    selectedId === item.id
                      ? 'border-violet-500 ring-2 ring-violet-200 dark:ring-violet-800'
                      : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
                  }`}
                >
                  <div className="w-24 h-28 rounded overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400">비어있음</span>
                    )}
                  </div>

                  {/* 대표 표시 / 선택 */}
                  <div className="mt-1 flex items-center justify-between px-0.5">
                    <label
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="radio"
                        name="primaryCover"
                        checked={isPrimary(item.id)}
                        onChange={() => setPrimary(item.id)}
                        disabled={!item.imageUrl}
                        className="text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">대표</span>
                    </label>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCover(item.id);
                      }}
                      className="text-slate-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 선택된 표지 편집 */}
          {selected && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview */}
              <div>
                <ImagePreview
                  src={selected.imageUrl || undefined}
                  alt="표지"
                  size="lg"
                  aspectRatio="16/9"
                  objectFit="contain"
                  emptyText="이미지를 드래그하거나 붙여넣기 (Ctrl+V)"
                  onClick={() => selected.imageUrl && setLightboxUrl(selected.imageUrl)}
                  onDelete={() => {
                    const wasPrimary = storybook.coverImage === selected.imageUrl;
                    updateCoverItem(selected.id, (item) => {
                      item.imageUrl = '';
                    });
                    if (wasPrimary) {
                      onUpdate((draft) => {
                        const alt = draft.coverImages?.find(
                          (c) => c.id !== selected.id && c.imageUrl
                        );
                        draft.coverImage = alt?.imageUrl || undefined;
                      });
                    }
                    onSave();
                  }}
                />

                {/* History */}
                {selected.history && selected.history.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">히스토리</p>
                    <div className="flex gap-1 flex-wrap">
                      {selected.history.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => handleRestoreHistory(i)}
                          className="w-14 h-18 rounded border border-slate-200 dark:border-slate-700 overflow-hidden hover:ring-2 hover:ring-violet-400"
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    이미지 비율
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {ASPECT_RATIOS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setAspectRatio(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          aspectRatio === r
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-300'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <ImageModelSelector
                  value={storybook.imageModels?.cover}
                  onChange={(modelId) => {
                    onUpdate((d) => {
                      if (!d.imageModels) d.imageModels = {};
                      d.imageModels.cover = modelId;
                    });
                    onSave();
                  }}
                  layout="block"
                />

                {/* 제목 템플릿 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                    제목 스타일 템플릿
                  </label>
                  <div className="flex gap-2 flex-wrap items-center">
                    {titleTemplates.map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() =>
                          setSelectedTemplateId(selectedTemplateId === tpl.id ? null : tpl.id)
                        }
                        className={`relative group cursor-pointer rounded-lg border-2 p-0.5 transition-all ${
                          selectedTemplateId === tpl.id
                            ? 'border-violet-500 ring-2 ring-violet-200 dark:ring-violet-800'
                            : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
                        }`}
                      >
                        <img src={tpl.imageUrl} alt="" className="w-20 h-20 rounded object-cover" />
                        {selectedTemplateId === tpl.id && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px]">✓</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplateMutation.mutate(tpl.id);
                          }}
                          className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                          title="삭제"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setTemplateModalOpen(true)}
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:border-violet-400 hover:text-violet-500 transition-colors"
                    >
                      <span className="text-lg leading-none">+</span>
                      <span className="text-[10px] mt-0.5">추가</span>
                    </button>
                  </div>
                  {titleTemplates.length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      제목 스타일 참고 이미지를 추가하세요
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    표지 프롬프트
                  </label>
                  <textarea
                    value={coverPrompt}
                    onChange={(e) => setCoverPrompt(e.target.value)}
                    rows={4}
                    placeholder="표지에 대한 설명을 입력하세요"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                    참조 캐릭터
                  </label>
                  <div className="space-y-2">
                    {characters.map((char, idx) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedChars.includes(idx)}
                          onChange={() => toggleChar(idx)}
                          className="rounded border-slate-300 dark:border-slate-600 text-violet-600 focus:ring-violet-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-200">
                          {char.name}
                        </span>
                        {char.referenceImage && (
                          <img
                            src={char.referenceImage}
                            alt=""
                            className="w-6 h-6 rounded object-cover"
                          />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => generateMutation.mutate()}
                    loading={generateMutation.isPending || uploading}
                    className="flex-1"
                  >
                    표지 생성
                  </Button>
                  {selected.imageUrl && (
                    <DownloadButton
                      href={selected.imageUrl}
                      filename={`cover-${storybook.title}.png`}
                      size="md"
                    />
                  )}
                  <UploadMenu
                    onFile={handleUpload}
                    openFilePicker={openFilePicker}
                    disabled={uploading || generateMutation.isPending}
                    size="md"
                  />
                </div>

                {generateMutation.isError && (
                  <p className="text-sm text-red-500">{generateMutation.error.message}</p>
                )}
              </div>
            </div>
          )}

          {/* 표지 없을 때 안내 */}
          {coverImages.length === 0 && (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <p>아직 표지가 없습니다.</p>
              <p className="text-sm mt-1">"+ 표지 추가" 버튼을 눌러 표지를 만들어보세요.</p>
            </div>
          )}

          {lightboxUrl && (
            <ImageLightbox src={lightboxUrl} alt="표지" onClose={() => setLightboxUrl(null)} />
          )}

          {/* 템플릿 업로드 모달 */}
          {templateModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              onClick={() => !uploadingTemplate && setTemplateModalOpen(false)}
            >
              <div
                className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  제목 템플릿 추가
                </h3>
                <ImageDropZone
                  onFile={(f) => addTemplateMutation.mutate(f)}
                  disabled={uploadingTemplate}
                >
                  {(openPicker) => (
                    <div
                      onClick={() => !uploadingTemplate && openPicker()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-violet-400 transition-colors"
                    >
                      {uploadingTemplate ? (
                        <p className="text-sm text-violet-600 animate-pulse">업로드 중...</p>
                      ) : (
                        <>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
                            이미지를 드래그하거나 클릭하여 업로드
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            제목 레이아웃/타이포그래피 참고용
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </ImageDropZone>
                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setTemplateModalOpen(false)}
                    disabled={uploadingTemplate}
                  >
                    닫기
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </ImageDropZone>
  );
}
