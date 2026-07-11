import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { StorybookSummary } from '@tangobook/shared';
import type { WordDetail } from '../lib/aggregate';

interface Props {
  details: WordDetail[];
  storybooks: StorybookSummary[];
}

const stripVariant = (id: string) => id.replace(/__L[1-4]$/, '');
const INITIAL = 24;

/**
 * "학습한 단어" — 단어별 카드 그리드.
 * 각 카드: (책 표지) + 단어 + 만난 책 이름(+외 N권) + 📖 읽음 / 🎮 게임 배지.
 * 기본 INITIAL 개만 보이고 "전체 N개 보기" 로 전부 펼침.
 */
export function MetWordsCard({ details, storybooks }: Props) {
  const { t } = useTranslation('learning');
  const [expanded, setExpanded] = useState(false);

  const byId = useMemo(() => new Map(storybooks.map((s) => [s.id, s])), [storybooks]);
  const findBook = (id: string): StorybookSummary | undefined =>
    byId.get(id) ?? byId.get(stripVariant(id));

  if (details.length === 0) return null;

  const shown = expanded ? details : details.slice(0, INITIAL);

  return (
    <div>
      <h3 className="mb-2 text-base font-bold text-ink-900">
        <span>{t('metWords.title')}</span>
        <span className="ml-1.5 text-sm font-black text-coral-500">
          {t('metWords.count', { count: details.length })}
        </span>
      </h3>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((d) => {
          const primary = d.books[0] ? findBook(d.books[0].id) : undefined;
          const extra = d.books.length - 1;
          return (
            <div
              key={d.word}
              className="flex items-center gap-2.5 rounded-2xl bg-white/80 p-2.5 shadow-sm"
            >
              {/* 표지 썸네일 */}
              <div className="h-[52px] w-10 shrink-0 overflow-hidden rounded-lg bg-peach-100">
                {primary?.coverImage ? (
                  <img
                    src={primary.coverImage}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg">📖</div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black text-ink-900">{d.word}</div>
                <div className="truncate text-[11px] text-ink-500">
                  {primary ? primary.title : t('metWords.fallbackBook')}
                  {extra > 0 && (
                    <span className="text-ink-400">
                      {' '}
                      {t('metWords.extraBooks', { count: extra })}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {d.read && (
                    <span className="rounded-full bg-peach-100 px-1.5 py-0.5 text-[10px] font-bold text-coral-600">
                      {t('metWords.read')}
                    </span>
                  )}
                  {d.played && (
                    <span className="rounded-full bg-mint-100 px-1.5 py-0.5 text-[10px] font-bold text-mint-600">
                      {t('metWords.played')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {details.length > INITIAL && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2.5 w-full rounded-full bg-ink-100 py-2 text-xs font-bold text-ink-600 transition-colors hover:bg-ink-200"
        >
          {expanded ? t('metWords.collapse') : t('metWords.showAll', { count: details.length })}
        </button>
      )}
    </div>
  );
}
