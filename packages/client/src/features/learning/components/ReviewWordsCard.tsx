import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { StorybookSummary } from '@tangobook/shared';
import { BookCover } from '@/design-system';
import type { WordDetail } from '../lib/aggregate';

interface Props {
  words: WordDetail[];
  storybooks: StorybookSummary[];
}

/** 화면에 올릴 개수 — 부모가 **오늘 밤 실제로 해볼 수 있는** 만큼만. */
const MAX = 5;

/**
 * 「다시 한번 보면 좋을 단어」 — 리포트에서 **유일하게 행동이 되는 카드**.
 *
 * 🔴 틀린 횟수는 이미 세고 있었는데(`WordDetail.wrong`) 화면 어디에도 안 썼다. 부모에게
 *    "137개 만났어요" 는 자랑이지 정보가 아니고, 정작 "오늘 밤 뭘 같이 볼까" 에는 답을 못 했다.
 * 🔴 「못하는 단어」 같은 낙인 표현을 쓰지 않는다 — 부모가 아이에게 그대로 옮긴다.
 * 🔴 틀린 게 없으면 **카드를 아예 그리지 않는다**(빈 카드가 있으면 옆 카드 신뢰까지 깎는다).
 */
export function ReviewWordsCard({ words, storybooks }: Props) {
  const { t, i18n } = useTranslation('learning');

  const findBook = (id: string) =>
    storybooks.find((s) => s.id === id) ??
    storybooks.find((s) => s.id === id.replace(/__L\d+$/, ''));

  // 틀린 적이 있고, 맞춘 횟수보다 적지 않게 틀린 단어 — 최근에 만난 순.
  const picks = words
    .filter((w) => w.wrong >= 1 && w.wrong >= w.correct)
    .sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''))
    .slice(0, MAX)
    .flatMap((w) => {
      const book = w.books[0] ? findBook(w.books[0].id) : undefined;
      return book ? [{ word: w, book }] : [];
    });

  if (picks.length === 0) return null;

  return (
    <div className="rounded-3xl border-2 border-peach-200 bg-white/70 p-4 sm:p-5">
      <h3 className="mb-1 text-base font-bold text-ink-900">{t('reviewWords.title')}</h3>
      <p className="mb-3 text-xs font-semibold text-ink-500 break-keep">{t('reviewWords.hint')}</p>
      <ul className="space-y-2">
        {picks.map(({ word, book }) => (
          <li key={word.word}>
            <Link
              to={`/library/${book.id}`}
              className="flex items-center gap-3 rounded-2xl bg-white p-2 shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop"
            >
              <span className="h-[52px] w-10 shrink-0 overflow-hidden rounded-lg bg-peach-100">
                <BookCover book={book} lang={i18n.language} overlayTitle={false} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-black text-ink-900">{word.word}</span>
                <span className="block truncate text-xs font-semibold text-ink-500">
                  {book.titleTranslations?.[i18n.language] ?? book.title}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-coral-500 px-3 py-1.5 text-xs font-black text-white">
                {t('reviewWords.open')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
