import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/Button';
import { ImageLightbox } from '@/components/ImageLightbox';
import { ImageDropZone } from '@/components/ImageDropZone';
import { ImagePreview } from '@/components/ImagePreview';
import { DownloadButton } from '@/components/DownloadButton';
import { UploadMenu } from '@/components/UploadMenu';
import { illustrationApi } from '../api/illustration.api';
import { ttsApi } from '@/features/tts/api/tts.api';
import { translationApi } from '@/features/translation/api/translation.api';
import { pushImageHistory } from '@/lib/image-history';
import { TTS_VOICES } from '@tangobook/shared';
import type { Storybook, Page } from '@tangobook/shared';

interface PageCardProps {
  page: Page;
  pageIndex: number;
  storybook: Storybook;
  activeLang: string;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
  onDelete: () => void;
}

export function PageCard({
  page,
  pageIndex,
  storybook,
  activeLang,
  onUpdate,
  onSave,
  onDelete,
}: PageCardProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(page.text);
  const [modifications, setModifications] = useState(page.customModifications ?? '');
  const [showScene, setShowScene] = useState(false);
  const [showMods, setShowMods] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [voice, setVoice] = useState<string>(TTS_VOICES[0].id);

  const isKorean = activeLang === 'ko';

  // --- Sortable ---
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.pageNumber,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // --- Illustration ---
  const generateMutation = useMutation({
    mutationFn: () => {
      const charRefs = (storybook.characters ?? [])
        .filter((c) => c.referenceImage)
        .map((c) => ({
          ...c,
          imageUrl: c.referenceImage,
        }));
      const prevPage = pageIndex > 0 ? (storybook.pages ?? [])[pageIndex - 1] : undefined;
      return illustrationApi.generate({
        page: { ...page, customModifications: modifications || undefined },
        artStyle: storybook.artStyle,
        characterReferences: charRefs,
        previousIllustrationUrl: prevPage?.illustrationUrl,
        currentImageUrl: page.illustrationUrl,
        settings: { aspectRatio: storybook.illustrationAspectRatio ?? '16:9' },
        storybookId: storybook.id,
        storybookTitle: storybook.title,
        model: storybook.imageModels?.illustration,
      });
    },
    onSuccess: (data) => {
      onUpdate((draft) => {
        const p = draft.pages[pageIndex];
        p.illustrationHistory = pushImageHistory(p.illustrationHistory, p.illustrationUrl, 10);
        p.illustrationUrl = data.imageUrl;
        p.customModifications = modifications || undefined;
      });
      onSave();
    },
  });

  // --- Upload ---
  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      illustrationApi.upload(file, storybook.id, storybook.title, page.pageNumber),
    onSuccess: (url) => {
      onUpdate((draft) => {
        const p = draft.pages[pageIndex];
        p.illustrationHistory = pushImageHistory(p.illustrationHistory, p.illustrationUrl, 10);
        p.illustrationUrl = url;
      });
      onSave();
    },
  });

  const handleFileUpload = (file: File) => uploadMutation.mutate(file);

  // --- TTS ---
  const ttsMutation = useMutation({
    mutationFn: () => {
      const ttsText = isKorean ? page.text : page.translations?.[activeLang]?.text;
      if (!ttsText) throw new Error('텍스트가 없습니다.');
      return ttsApi.generate({
        text: ttsText,
        provider: 'gemini',
        voice,
        language: activeLang,
        storybookId: storybook.id,
        pageNumber: page.pageNumber,
      });
    },
    onSuccess: (data) => {
      onUpdate((draft) => {
        const p = draft.pages[pageIndex];
        if (isKorean) {
          p.ttsUrl = data.audioUrl;
        } else {
          if (!p.translations) p.translations = {};
          if (!p.translations[activeLang]) p.translations[activeLang] = { text: '' };
          p.translations[activeLang].ttsUrl = data.audioUrl;
        }
      });
      onSave();
    },
  });

  // --- Translation ---
  const translateMutation = useMutation({
    mutationFn: () =>
      translationApi.page({
        text: page.text,
        targetLanguage: activeLang,
        storybookId: storybook.id,
        pageNumber: page.pageNumber,
      }),
    onSuccess: (data) => {
      onUpdate((draft) => {
        const p = draft.pages[pageIndex];
        if (!p.translations) p.translations = {};
        const existing = p.translations[activeLang];
        p.translations[activeLang] = { text: data.text, ttsUrl: existing?.ttsUrl };
      });
      onSave();
    },
  });

  const handleSaveText = () => {
    onUpdate((draft) => {
      draft.pages[pageIndex].text = text;
    });
    onSave();
    setEditing(false);
  };

  const imageUrl = page.illustrationUrl;
  const currentText = isKorean ? page.text : (page.translations?.[activeLang]?.text ?? null);
  const currentTtsUrl = isKorean ? page.ttsUrl : page.translations?.[activeLang]?.ttsUrl;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
    >
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={`Page ${page.pageNumber}`}
          onClose={() => setLightboxSrc(null)}
        />
      )}
      <div className="flex gap-4">
        {/* Drag handle */}
        <div
          className="flex-shrink-0 flex items-start pt-1 cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500"
          {...attributes}
          {...listeners}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.5" />
            <circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" />
            <circle cx="11" cy="13" r="1.5" />
          </svg>
        </div>

        {/* Illustration */}
        <ImageDropZone
          onFile={handleFileUpload}
          disabled={generateMutation.isPending || uploadMutation.isPending}
          enablePaste={false}
          className="flex-shrink-0 w-64"
        >
          {(openFilePicker) => (
            <div>
              <ImagePreview
                src={imageUrl}
                alt={`Page ${page.pageNumber}`}
                aspectRatio={(storybook.illustrationAspectRatio ?? '16:9').replace(':', '/')}
                className="rounded-lg border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-violet-400 transition"
                onClick={() => imageUrl && setLightboxSrc(imageUrl)}
                onDelete={() => {
                  onUpdate((draft) => {
                    draft.pages[pageIndex].illustrationUrl = undefined;
                  });
                  onSave();
                }}
              />

              {/* History */}
              {page.illustrationHistory && page.illustrationHistory.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {page.illustrationHistory.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onUpdate((draft) => {
                          const p = draft.pages[pageIndex];
                          const history = p.illustrationHistory ?? [];
                          const restored = history[i];
                          if (!restored) return;
                          if (p.illustrationUrl) history[i] = p.illustrationUrl;
                          else history.splice(i, 1);
                          p.illustrationUrl = restored;
                          p.illustrationHistory = history;
                        });
                        onSave();
                      }}
                      className="w-10 h-8 rounded border border-slate-200 dark:border-slate-700 overflow-hidden hover:ring-2 hover:ring-violet-400 transition"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Image action buttons */}
              <div className="mt-2 flex gap-1">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => generateMutation.mutate()}
                  loading={generateMutation.isPending || uploadMutation.isPending}
                >
                  {imageUrl ? '재생성' : '삽화 생성'}
                </Button>
                {imageUrl && (
                  <DownloadButton href={imageUrl} filename={`page-${page.pageNumber}.png`} />
                )}
                <UploadMenu
                  onFile={handleFileUpload}
                  openFilePicker={openFilePicker}
                  disabled={generateMutation.isPending || uploadMutation.isPending}
                />
              </div>
            </div>
          )}
        </ImageDropZone>

        {/* Right content */}
        <div className="flex-1 space-y-3">
          {/* Page number + scene accordions + delete */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-violet-600 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded">
              Page {page.pageNumber}
            </span>
            <button
              onClick={() => setShowScene(!showScene)}
              className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 flex items-center gap-0.5"
            >
              장면
              <svg
                className={`w-3 h-3 transition-transform ${showScene ? 'rotate-180' : ''}`}
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
            <button
              onClick={() => setShowMods(!showMods)}
              className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 flex items-center gap-0.5"
            >
              수정사항
              <svg
                className={`w-3 h-3 transition-transform ${showMods ? 'rotate-180' : ''}`}
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
            <div className="flex-1" />
            <button
              onClick={onDelete}
              className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition p-0.5"
              title="페이지 삭제"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </button>
          </div>

          {/* Scene accordion */}
          {showScene && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-2 text-xs">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                {page.scene_description}
              </p>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  캐릭터 & 행동:
                </span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {page.scene_structure?.characters}
                </p>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-300">배경:</span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {page.scene_structure?.background}
                </p>
              </div>
              {page.scene_structure?.atmosphere && (
                <div>
                  <span className="font-medium text-slate-600 dark:text-slate-300">분위기:</span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {page.scene_structure.atmosphere}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Modifications accordion */}
          {showMods && (
            <input
              type="text"
              value={modifications}
              onChange={(e) => setModifications(e.target.value)}
              placeholder="삽화 생성 시 추가 지시사항 (선택)"
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-violet-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            />
          )}

          {(generateMutation.isError || uploadMutation.isError) && (
            <p className="text-xs text-red-500">
              {generateMutation.error?.message ?? uploadMutation.error?.message}
            </p>
          )}

          {/* Text content based on activeLang */}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-2">
            {isKorean ? (
              editing ? (
                <div className="space-y-2">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none resize-none text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveText}>
                      확인
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setText(page.text);
                        setEditing(false);
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <p
                  className="text-sm text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 rounded p-2 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                  onClick={() => setEditing(true)}
                >
                  {page.text || '(텍스트를 입력하세요)'}
                </p>
              )
            ) : currentText ? (
              <div className="space-y-1">
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed p-2 bg-slate-50/50 dark:bg-slate-900/50 rounded">
                  {page.text}
                </p>
                <p className="text-sm text-blue-700 bg-blue-50/50 dark:bg-blue-900/20 rounded p-2">
                  {currentText}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => translateMutation.mutate()}
                  loading={translateMutation.isPending}
                >
                  재번역
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed p-2 bg-slate-50/50 dark:bg-slate-900/50 rounded">
                  {page.text}
                </p>
                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded">
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic flex-1">
                    번역이 없습니다.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => translateMutation.mutate()}
                    loading={translateMutation.isPending}
                    disabled={!page.text}
                  >
                    번역
                  </Button>
                </div>
              </div>
            )}

            {translateMutation.isError && (
              <p className="text-xs text-red-500">{translateMutation.error.message}</p>
            )}

            {/* TTS */}
            <div className="flex items-center gap-2 pt-1">
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-violet-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              >
                {TTS_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={() => ttsMutation.mutate()}
                loading={ttsMutation.isPending}
                disabled={!isKorean && !currentText}
              >
                {currentTtsUrl ? 'TTS 재생성' : 'TTS 생성'}
              </Button>
              {currentTtsUrl && (
                <audio controls className="h-8 flex-1 min-w-0">
                  <source src={currentTtsUrl} type="audio/wav" />
                </audio>
              )}
              {!currentTtsUrl && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500">TTS 미생성</span>
              )}
            </div>
            {ttsMutation.isError && (
              <p className="text-xs text-red-500">{ttsMutation.error.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
