import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { translationApi } from '../api/translation.api';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';
import type { Storybook } from '@tangobook/shared';

interface TranslationTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

export function TranslationTab({ storybook, onUpdate, onSave }: TranslationTabProps) {
  const [language, setLanguage] = useState<string>(SUPPORTED_LANGUAGES[0].code);

  const batchMutation = useMutation({
    mutationFn: () =>
      translationApi.batch({
        pages: storybook.pages.map((p) => ({ pageNumber: p.pageNumber, text: p.text })),
        targetLanguage: language,
        storybookId: storybook.id,
      }),
    onSuccess: (results) => {
      onUpdate((draft) => {
        results.forEach((result, idx) => {
          const page = draft.pages[idx];
          if (!page) return;
          if (!page.translations) page.translations = {};
          page.translations[language] = { text: result.text };
        });
      });
      onSave();
    },
  });

  const langLabel = SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label ?? language;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">번역</h2>
        <Button size="sm" onClick={() => batchMutation.mutate()} loading={batchMutation.isPending}>
          모든 페이지 번역 ({langLabel})
        </Button>
      </div>

      {/* Language selector */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          활성 언어
        </label>
        <div className="flex gap-2 flex-wrap">
          <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            한국어 (원본)
          </span>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                language === lang.code
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pages with translations */}
      <div className="space-y-3">
        {storybook.pages.map((page) => {
          const translation = page.translations?.[language];
          return (
            <div
              key={page.pageNumber}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-violet-600 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded flex-shrink-0 mt-0.5">
                  P{page.pageNumber}
                </span>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">
                      한국어 (원본)
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{page.text}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">{langLabel}</p>
                    {translation ? (
                      <p className="text-sm text-blue-600 bg-blue-50 rounded px-3 py-2">
                        {translation.text}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">번역 없음</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {batchMutation.isError && (
        <p className="text-sm text-red-500">{batchMutation.error.message}</p>
      )}
    </div>
  );
}
