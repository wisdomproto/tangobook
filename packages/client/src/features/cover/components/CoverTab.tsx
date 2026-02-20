import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { ImageLightbox } from '@/components/ImageLightbox';
import { ImageDropZone } from '@/components/ImageDropZone';
import { UploadMenu } from '@/components/UploadMenu';
import { coverApi } from '../api/cover.api';
import { apiClient } from '@/lib/axios';
import {
  MAX_IMAGE_HISTORY,
  ASPECT_RATIOS,
  IMAGE_MODELS,
  DEFAULT_IMAGE_MODEL,
} from '@tangobook/shared';
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
        if (draft.coverImage) {
          draft.coverImageHistory = [draft.coverImage, ...(draft.coverImageHistory ?? [])].slice(
            0,
            MAX_IMAGE_HISTORY
          );
        }
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
        if (draft.coverImage) {
          draft.coverImageHistory = [draft.coverImage, ...(draft.coverImageHistory ?? [])].slice(
            0,
            MAX_IMAGE_HISTORY
          );
        }
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
              <div
                className={`relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-violet-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center group/img ${storybook.coverImage ? 'cursor-pointer' : ''}`}
                style={{ aspectRatio: '16/9' }}
                onClick={() => storybook.coverImage && setLightboxUrl(storybook.coverImage)}
              >
                {storybook.coverImage ? (
                  <>
                    <img
                      src={storybook.coverImage}
                      alt="표지"
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate((draft) => {
                          draft.coverImage = undefined;
                        });
                        onSave();
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition hover:bg-red-500"
                      title="이미지 삭제"
                    >
                      <svg
                        className="w-3.5 h-3.5"
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
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-600 gap-2">
                    <svg
                      className="w-16 h-16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                      />
                    </svg>
                    <span className="text-sm">이미지를 드래그하거나 붙여넣기 (Ctrl+V)</span>
                  </div>
                )}
              </div>

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

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  이미지 모델
                </label>
                <select
                  value={storybook.imageModels?.cover ?? DEFAULT_IMAGE_MODEL}
                  onChange={(e) => {
                    onUpdate((d) => {
                      if (!d.imageModels) d.imageModels = {};
                      d.imageModels.cover = e.target.value;
                    });
                    onSave();
                  }}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                >
                  {IMAGE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} - {m.description}
                    </option>
                  ))}
                </select>
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
                  <a
                    href={storybook.coverImage}
                    download={`cover-${storybook.title}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                    title="다운로드"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </a>
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
