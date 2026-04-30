import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/design-system';
import { ttsApi } from '../api/tts.api';
import { TTS_VOICES } from '@tangobook/shared';
import type { Storybook } from '@tangobook/shared';

interface TtsTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

export function TtsTab({ storybook, onUpdate, onSave }: TtsTabProps) {
  const [voice, setVoice] = useState<string>(TTS_VOICES[0].id);
  const [generatingPage, setGeneratingPage] = useState<number | null>(null);
  const pages = storybook.pages ?? [];

  const generateMutation = useMutation({
    mutationFn: (pageNumber: number) => {
      const page = pages.find((p) => p.pageNumber === pageNumber);
      if (!page) throw new Error('페이지를 찾을 수 없습니다.');
      return ttsApi.generate({
        text: page.text,
        provider: 'gemini',
        voice,
        storybookId: storybook.id,
        pageNumber,
      });
    },
    onSuccess: (data, pageNumber) => {
      onUpdate((draft) => {
        const page = draft.pages.find((p) => p.pageNumber === pageNumber);
        if (page) page.ttsUrl = data.audioUrl;
      });
      onSave();
      setGeneratingPage(null);
    },
    onError: () => setGeneratingPage(null),
  });

  const batchMutation = useMutation({
    mutationFn: () =>
      ttsApi.batch({
        pages: pages.map((p) => ({ pageNumber: p.pageNumber, text: p.text })),
        provider: 'gemini',
        voice,
        storybookId: storybook.id,
      }),
    onSuccess: (results) => {
      onUpdate((draft) => {
        for (const result of results) {
          if (result.success) {
            const page = draft.pages.find((p) => p.pageNumber === result.pageNumber);
            if (page) page.ttsUrl = result.audioUrl;
          }
        }
      });
      onSave();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          TTS (음성 생성)
        </h2>
        <Button size="sm" onClick={() => batchMutation.mutate()} loading={batchMutation.isPending}>
          모든 TTS 생성
        </Button>
      </div>

      {/* Voice selector */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              TTS 엔진
            </label>
            <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">Gemini TTS</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              음성
            </label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            >
              {TTS_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} ({v.description})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pages list */}
      <div className="space-y-2">
        {pages.map((page) => (
          <div
            key={page.pageNumber}
            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-3"
          >
            <span className="text-xs font-bold text-violet-600 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded flex-shrink-0">
              P{page.pageNumber}
            </span>
            <p className="flex-1 text-sm text-slate-600 dark:text-slate-300 truncate">
              {page.text}
            </p>

            {page.ttsUrl ? (
              <>
                <audio controls className="h-8 flex-shrink-0">
                  <source src={page.ttsUrl} type="audio/wav" />
                </audio>
                <span className="text-xs text-emerald-600 font-medium flex-shrink-0">생성됨</span>
              </>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                미생성
              </span>
            )}

            <Button
              size="sm"
              variant={page.ttsUrl ? 'secondary' : 'primary'}
              onClick={() => {
                setGeneratingPage(page.pageNumber);
                generateMutation.mutate(page.pageNumber);
              }}
              loading={generatingPage === page.pageNumber}
              disabled={generatingPage !== null || batchMutation.isPending}
            >
              {page.ttsUrl ? '재생성' : '생성'}
            </Button>
          </div>
        ))}
      </div>

      {(generateMutation.isError || batchMutation.isError) && (
        <p className="text-sm text-red-500">
          {generateMutation.error?.message ?? batchMutation.error?.message}
        </p>
      )}
    </div>
  );
}
