import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import { ASPECT_RATIOS } from '@tangobook/shared';
import type { Storybook, ImageGenerationResult } from '@tangobook/shared';

interface CoverTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

export function CoverTab({ storybook, onUpdate, onSave }: CoverTabProps) {
  const [selectedChars, setSelectedChars] = useState<number[]>(storybook.coverCharacterRefs ?? []);
  const [coverPrompt, setCoverPrompt] = useState(storybook.coverPrompt ?? '');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const aspectRatio = storybook.coverAspectRatio ?? '3:4';
  const [uploading, setUploading] = useState(false);

  const setAspectRatio = (ratio: string) => {
    onUpdate((draft) => {
      draft.coverAspectRatio = ratio;
    });
    onSave();
  };

  const generateMutation = useMutation({
    mutationFn: () => {
      const refs = selectedChars.map((i) => storybook.characters[i]).filter(Boolean);
      return coverApi.generate({
        storybook: {
          title: storybook.title,
          coverPrompt: coverPrompt || undefined,
          artStyle: storybook.artStyle,
        },
        characterReferences: refs,
        settings: { aspectRatio },
        currentImageUrl: storybook.coverImage,
        model: storybook.imageModels?.cover,
      });
    },
    onSuccess: (data) => {
      onUpdate((draft) => {
        draft.coverImageHistory = pushImageHistory(draft.coverImageHistory, draft.coverImage);
        draft.coverImage = data.imageUrl;
        draft.coverPrompt = coverPrompt;
        draft.coverCharacterRefs = selectedChars;
      });
      onSave();
    },
  });

  const handleRestoreHistory = (historyIdx: number) => {
    onUpdate((draft) => {
      const history = draft.coverImageHistory ?? [];
      const restored = history[historyIdx];
      if (!restored) return;
      if (draft.coverImage) history[historyIdx] = draft.coverImage;
      else history.splice(historyIdx, 1);
      draft.coverImage = restored;
      draft.coverImageHistory = history;
    });
    onSave();
  };

  const toggleChar = (idx: number) => {
    setSelectedChars((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleUpload = async (file: File) => {
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
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      const imageUrl = res.data.data.imageUrl;
      onUpdate((draft) => {
        draft.coverImageHistory = pushImageHistory(draft.coverImageHistory, draft.coverImage);
        draft.coverImage = imageUrl;
      });
      onSave();
    } catch {
      // handled silently
    } finally {
      setUploading(false);
    }
  };

  return (
    <ImageDropZone
      onFile={handleUpload}
      disabled={uploading || generateMutation.isPending}
      enablePaste
    >
      {(openFilePicker) => (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">표지 이미지</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preview */}
            <div>
              <ImagePreview
                src={storybook.coverImage}
                alt="표지"
                size="lg"
                aspectRatio="16/9"
                objectFit="contain"
                emptyText="이미지를 드래그하거나 붙여넣기 (Ctrl+V)"
                onClick={() => storybook.coverImage && setLightboxUrl(storybook.coverImage)}
                onDelete={() => {
                  onUpdate((draft) => {
                    draft.coverImage = undefined;
                  });
                  onSave();
                }}
              />

              {/* History */}
              {storybook.coverImageHistory && storybook.coverImageHistory.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">히스토리</p>
                  <div className="flex gap-1 flex-wrap">
                    {storybook.coverImageHistory.map((url, i) => (
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
                  {storybook.characters.map((char, idx) => (
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
                {storybook.coverImage && (
                  <DownloadButton
                    href={storybook.coverImage}
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

          {lightboxUrl && (
            <ImageLightbox src={lightboxUrl} alt="표지" onClose={() => setLightboxUrl(null)} />
          )}
        </div>
      )}
    </ImageDropZone>
  );
}
