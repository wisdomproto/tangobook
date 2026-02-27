import { useMemo } from 'react';
import type { GameConfigPanelProps } from '../../registry/game-registry';
import type { WordWritingConfig } from '@tangobook/shared';

interface WordOption {
  key: string; // 식별자 (영어 word)
  english: string;
  korean: string;
  imageUrl?: string;
}

export function WordWritingConfigPanel({ storybook, config, onChange }: GameConfigPanelProps) {
  const c = config as WordWritingConfig;
  const hasPhonics = storybook.type === 'phonics';

  // 단어 소스별 사용 가능한 단어 목록
  const availableWords = useMemo<WordOption[]>(() => {
    if (c.wordSource === 'vocabulary') {
      const vocab = storybook.educational_content?.vocabulary ?? [];
      return vocab.map((v) => {
        const vocabImg = (storybook.vocabularyImages ?? []).find(
          (vi) => vi.word === v.word && vi.success && vi.imageUrl
        );
        return { key: v.word, english: v.word, korean: v.korean, imageUrl: vocabImg?.imageUrl };
      });
    }
    if (c.wordSource === 'phonics') {
      const flashcards = storybook.flashcards ?? [];
      return flashcards.map((f) => ({
        key: f.word,
        english: f.word,
        korean: f.localWord,
        imageUrl: f.imageUrl,
      }));
    }
    return [];
  }, [c.wordSource, storybook]);

  const selected = c.selectedWords ?? [];
  const allSelected = availableWords.length > 0 && selected.length === availableWords.length;

  const toggleWord = (key: string) => {
    const next = selected.includes(key) ? selected.filter((w) => w !== key) : [...selected, key];
    onChange({ ...c, selectedWords: next });
  };

  const toggleAll = () => {
    onChange({
      ...c,
      selectedWords: allSelected ? [] : availableWords.map((w) => w.key),
    });
  };

  return (
    <div className="space-y-4">
      {/* 언어 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          언어
        </label>
        <div className="flex gap-2">
          {(['korean', 'english'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => onChange({ ...c, language: lang })}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                c.language === lang
                  ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {{ korean: '한국어', english: '영어' }[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* 단어 소스 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          단어 소스
        </label>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'vocabulary' as const, label: '어휘 단어' },
            ...(hasPhonics ? [{ value: 'phonics' as const, label: '파닉스 단어' }] : []),
            { value: 'custom' as const, label: '직접 입력' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...c, wordSource: opt.value, selectedWords: [] })}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                c.wordSource === opt.value
                  ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 직접 입력 */}
      {c.wordSource === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            단어 (쉼표로 구분)
          </label>
          <input
            type="text"
            value={c.customWords?.join(', ') ?? ''}
            onChange={(e) =>
              onChange({
                ...c,
                customWords: e.target.value
                  .split(',')
                  .map((w) => w.trim())
                  .filter(Boolean),
              })
            }
            placeholder="사과, 바나나, 포도"
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      )}

      {/* 단어 선택 (vocabulary / phonics) */}
      {c.wordSource !== 'custom' && availableWords.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              단어 선택 ({selected.length}/{availableWords.length})
            </label>
            <button
              onClick={toggleAll}
              className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
            >
              {allSelected ? '전체 해제' : '전체 선택'}
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
            {availableWords.map((w) => {
              const isSelected = selected.includes(w.key);
              return (
                <label
                  key={w.key}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    isSelected ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleWord(w.key)}
                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  {w.imageUrl && (
                    <img
                      src={w.imageUrl}
                      alt={w.english}
                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <span className="text-sm text-slate-800 dark:text-slate-100">{w.english}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-1.5">
                      ({w.korean})
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
          {selected.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              단어를 선택하지 않으면 전체 단어가 포함됩니다.
            </p>
          )}
        </div>
      )}

      {c.wordSource !== 'custom' && availableWords.length === 0 && (
        <p className="text-xs text-red-500">사용 가능한 단어가 없습니다.</p>
      )}

      {/* 가이드 표시 */}
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={c.showGuide}
          onChange={(e) => onChange({ ...c, showGuide: e.target.checked })}
          className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
        />
        글자 가이드 표시
      </label>
    </div>
  );
}
