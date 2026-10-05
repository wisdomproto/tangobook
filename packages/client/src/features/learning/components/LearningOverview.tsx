import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Lang, LearningEvent, StorybookSummary } from '@tangobook/shared';
import { Mascot } from '@/design-system';
import {
  eventLanguage,
  localDateKey,
  normalizeWord,
  periodStart,
  phonicsTargets,
  summarizeWords,
  type WordLearning,
} from '../lib/word-learning';
import { completedPhonicsUnitIds } from '../lib/phonics-progress';
import { recommendPhonics } from '../lib/phonics-recommendation';

interface Props {
  events: LearningEvent[];
  storybooks: StorybookSummary[];
  capped?: boolean;
}
const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'ko', label: '한국어' },
  { id: 'en', label: 'English' },
  { id: 'vi', label: 'Tiếng Việt' },
  { id: 'zh', label: '中文' },
  { id: 'th', label: 'ไทย' },
];

export function LearningOverview({ events, storybooks, capped = false }: Props) {
  const { t, i18n } = useTranslation('learning');
  const [lang, setLang] = useState<Lang>('ko');
  const [period, setPeriod] = useState<'today' | 'week'>('week');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'seen' | 'practiced' | 'target'>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [limit, setLimit] = useState(12);
  const words = useMemo(() => summarizeWords(events, lang), [events, lang]);
  const start = periodStart(period).getTime();
  const end = Date.now();
  const inPeriod = (date: string) => Date.parse(date) >= start && Date.parse(date) <= end;
  const hasUnknownLanguage = events.some(
    (event) => event.word && event.event_type.startsWith('word_') && !eventLanguage(event)
  );
  const newWords = words.filter((word) => inPeriod(word.firstAt)).length;
  const practiced = words.filter((word) =>
    word.events.some(
      (event) =>
        inPeriod(event.created_at) &&
        (event.event_type === 'word_correct' || event.event_type === 'word_wrong')
    )
  ).length;
  const days = new Set(
    events
      .filter((event) => eventLanguage(event) === lang && inPeriod(event.created_at))
      .map((event) => localDateKey(event.created_at))
  ).size;
  const shown = words.filter(
    (word) =>
      normalizeWord(word.word, lang).includes(normalizeWord(search, lang)) &&
      (filter === 'all' ||
        (filter === 'seen' && !word.practices) ||
        (filter === 'practiced' && word.practices > 0) ||
        (filter === 'target' && phonicsTargets(word.word, lang).length > 0))
  );
  const selectedWord = words.find((word) => word.key === selected);
  const recommendation = recommendPhonics(words);
  const recommended = recommendation?.word;
  const target = recommendation?.target;
  const completed =
    lang === 'ko' || lang === 'en' ? completedPhonicsUnitIds(events, lang) : new Set<string>();
  const label = (word: WordLearning) => t(word.practices ? 'overview.practiced' : 'overview.seen');
  const findBook = (word: WordLearning) => {
    const id = word.events.find((event) => event.storybook_id)?.storybook_id;
    return storybooks.find((book) => book.id === id || book.id === id?.replace(/__L[1-4]$/, ''));
  };

  return (
    <div className="space-y-5" data-testid="learning-overview">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-bold text-ink-600">
          {t('overview.language')}
          <select
            value={lang}
            onChange={(event) => {
              setLang(event.target.value as Lang);
              setSelected(null);
              setSearch('');
              setLimit(12);
            }}
            className="min-h-11 max-w-[180px] rounded-xl border border-peach-200 bg-white px-3 text-base text-ink-900"
          >
            {LANGUAGES.map((language) => (
              <option key={language.id} value={language.id}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
        <div
          className="flex rounded-full bg-white p-1 shadow-soft"
          aria-label={t('overview.period')}
        >
          {(['today', 'week'] as const).map((value) => (
            <button
              key={value}
              aria-pressed={period === value}
              onClick={() => setPeriod(value)}
              className={`min-h-11 rounded-full px-4 text-sm font-bold ${period === value ? 'bg-coral-500 text-white' : 'text-ink-600'}`}
            >
              {t(`overview.${value}`)}
            </button>
          ))}
        </div>
      </div>
      {hasUnknownLanguage && (
        <p className="rounded-2xl bg-cream-50 p-4 text-sm leading-relaxed text-ink-600">
          {t('overview.unknownLanguage')}
        </p>
      )}
      {capped && (
        <p
          role="status"
          className="rounded-2xl bg-amber-50 p-4 text-sm leading-relaxed text-ink-700"
        >
          {t('overview.partial')}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-peach-100 via-cream-50 to-coral-100 p-5 sm:p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-coral-600">{t(`overview.${period}`)}</p>
              <h2 className="mt-2 text-xl sm:text-2xl font-black leading-snug text-ink-900">
                {t(words.length ? 'overview.hero' : 'overview.emptyHero')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{t('overview.heroNote')}</p>
            </div>
            <div className="shrink-0">
              <Mascot state="reading" size="sm" character="hori" />
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-2">
            {[
              { key: capped ? 'recordedWords' : 'newWords', count: newWords },
              { key: 'directWords', count: practiced },
              { key: 'days', count: days },
            ].map((stat) => (
              <div key={stat.key} className="min-w-0 rounded-2xl bg-white/80 px-2 py-4 text-center">
                <dd className="text-3xl font-black tabular-nums text-ink-900">{stat.count}</dd>
                <dt className="mt-1 text-xs sm:text-sm leading-snug text-ink-600">
                  {t(`overview.${stat.key}`)}
                </dt>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-ink-500">{t('overview.countNote')}</p>
        </section>
        <section className="flex flex-col justify-center rounded-3xl border border-mint-200 bg-mint-50 p-5 sm:p-6">
          <p className="text-sm font-bold text-mint-700">{t('overview.nextPlay')}</p>
          <h2 className="mt-2 text-xl font-black text-ink-900 break-words">
            {target && recommended
              ? t('overview.targetTitle', { word: recommended.word })
              : t('overview.nextTitle')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {t(
              recommendation?.reason === 'needs-review'
                ? 'overview.reviewNote'
                : target
                  ? 'overview.targetNote'
                  : 'overview.nextNote'
            )}
          </p>
          <Link
            to={
              target
                ? `/library/phonics/${target.lang === 'ko' ? 'korean' : 'english'}/${target.id}`
                : '/library'
            }
            className="mt-4 inline-flex min-h-11 items-center justify-center self-start rounded-full bg-white px-5 py-3 text-sm font-black text-mint-700 shadow-soft"
          >
            {t(target ? 'overview.phonicsLink' : 'overview.libraryLink')} →
          </Link>
        </section>
      </div>
      <section className="rounded-3xl bg-white p-4 sm:p-6 shadow-soft">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-black text-ink-900">{t('overview.words')}</h2>
          <span className="text-sm font-bold text-coral-600">
            {t('overview.wordCount', { count: words.length })}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-ink-500">{t('overview.lifetimeNote')}</p>
        <label className="mt-4 block">
          <span className="sr-only">{t('overview.search')}</span>
          <input
            type="search"
            value={search}
            placeholder={t('overview.search')}
            onChange={(event) => {
              setSearch(event.target.value);
              setLimit(12);
            }}
            className="min-h-12 w-full rounded-2xl border border-peach-200 bg-cream-50 px-4 text-base text-ink-900"
          />
        </label>
        <div className="my-3 flex flex-wrap gap-2">
          {(['all', 'seen', 'practiced', 'target'] as const).map((value) => (
            <button
              key={value}
              aria-pressed={filter === value}
              onClick={() => {
                setFilter(value);
                setLimit(12);
              }}
              className={`min-h-11 rounded-full px-3 py-2 text-sm font-bold ${filter === value ? 'bg-ink-900 text-white' : 'bg-cream-50 text-ink-600'}`}
            >
              {t(`overview.${value}`)}
            </button>
          ))}
        </div>
        {!shown.length ? (
          <div className="py-8 text-center">
            <p className="font-bold text-ink-700">
              {t(words.length ? 'overview.noMatches' : 'overview.noWords')}
            </p>
            {!words.length && (
              <Link
                to="/library"
                className="mt-3 inline-flex min-h-11 items-center text-coral-600 font-bold"
              >
                {t('overview.libraryLink')} →
              </Link>
            )}
          </div>
        ) : (
          <ul className="grid gap-2 lg:grid-cols-2">
            {shown.slice(0, limit).map((word) => {
              const book = findBook(word);
              return (
                <li key={word.key}>
                  <button
                    onClick={() => setSelected(word.key)}
                    className="flex min-h-20 w-full items-center gap-3 rounded-2xl border border-peach-100 p-3 text-left transition hover:bg-cream-50 focus-visible:outline-coral-500"
                  >
                    <div className="flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-peach-50">
                      {book?.coverImage ? (
                        <img
                          src={book.coverImage}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span aria-hidden="true" className="text-2xl">
                          📖
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-lg font-black text-ink-900">{word.word}</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-500">
                        {t('overview.rowCounts', {
                          exposure: word.exposures,
                          practice: word.practices,
                        })}
                      </p>
                    </div>
                    <div className="max-w-[105px] shrink-0 text-right">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-bold ${word.practices ? 'bg-mint-100 text-mint-700' : 'bg-peach-100 text-coral-600'}`}
                      >
                        {label(word)}
                      </span>
                      {phonicsTargets(word.word, lang).length > 0 && (
                        <p className="mt-1 text-xs text-ink-500">{t('overview.targetBadge')}</p>
                      )}
                    </div>
                    <span aria-hidden="true" className="text-ink-400">
                      ›
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {shown.length > limit && (
          <button
            onClick={() => setLimit((value) => value + 24)}
            className="mt-4 min-h-11 w-full rounded-xl bg-cream-50 p-3 font-bold text-ink-700"
          >
            {t('overview.more')}
          </button>
        )}
      </section>
      {selectedWord && (
        <WordLearningDialog
          key={selectedWord.key}
          word={selectedWord}
          books={storybooks}
          capped={capped}
          completed={completed}
          onClose={() => setSelected(null)}
          locale={i18n.language}
        />
      )}
    </div>
  );
}

function WordLearningDialog({
  word,
  books,
  capped,
  completed,
  onClose,
  locale,
}: {
  word: WordLearning;
  books: StorybookSummary[];
  capped: boolean;
  completed: Set<string>;
  onClose: () => void;
  locale: string;
}) {
  const { t } = useTranslation('learning');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, []);
  const targets = phonicsTargets(word.word, word.lang);
  const date = (value: string) =>
    new Date(value).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="word-detail-heading"
      className="m-auto mb-0 max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-cream-50 p-5 text-ink-900 shadow-xl backdrop:bg-ink-900/40 sm:mb-auto sm:rounded-3xl sm:p-7"
      style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-coral-600">{t('overview.wordDetail')}</p>
          <h2 id="word-detail-heading" className="mt-1 break-words text-3xl font-black">
            {word.word}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label={t('overview.close')}
          className="min-h-11 min-w-11 rounded-full bg-white text-xl"
        >
          ×
        </button>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-600">{t('overview.evidenceNote')}</p>
      {capped && <p className="mt-3 text-sm text-amber-700">{t('overview.partial')}</p>}
      <dl className="mt-4 grid grid-cols-2 gap-3">
        {[
          { label: 'exposures', count: word.exposures },
          { label: 'practices', count: word.practices },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white p-4">
            <dt className="text-sm text-ink-600">{t(`overview.${stat.label}`)}</dt>
            <dd className="mt-1 text-2xl font-black">{stat.count}</dd>
          </div>
        ))}
      </dl>
      <section className="mt-5">
        <h3 className="font-black">{t('overview.skills')}</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-500">{t('overview.skillNote')}</p>
        <div className="mt-3 space-y-2">
          {Object.entries(word.skills).map(([skill, score]) => (
            <div key={skill} className="rounded-xl bg-white p-3">
              <p className="font-bold">{t(`overview.skill.${skill}`)}</p>
              <p className="mt-1 text-sm text-ink-600">
                {t(skill === 'legacy' ? 'overview.legacyResult' : 'overview.skillResult', {
                  attempts: score.attempts,
                  correct: score.correct,
                  wrong: score.wrong,
                })}
              </p>
            </div>
          ))}
          {!word.practices && (
            <p className="rounded-xl bg-white p-3 text-sm text-ink-600">
              {t('overview.noPractice')}
            </p>
          )}
        </div>
      </section>
      {targets.length > 0 && (
        <section className="mt-5 rounded-2xl bg-mint-50 p-4">
          <h3 className="font-black">{t('overview.phonicsHistory')}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {t(word.phonicsPractices ? 'overview.phonicsPracticed' : 'overview.phonicsUnrecorded', {
              count: word.phonicsPractices,
            })}
          </p>
          {targets.map((target) => (
            <div key={target.id} className="mt-3">
              <p className="text-sm">
                {target.title} ·{' '}
                {t(completed.has(target.id) ? 'overview.unitComplete' : 'overview.unitIncomplete')}
              </p>
              <Link
                onClick={onClose}
                to={`/library/phonics/${target.lang === 'ko' ? 'korean' : 'english'}/${target.id}`}
                className="mt-1 inline-flex min-h-11 items-center font-bold text-mint-700"
              >
                {t('overview.phonicsLink')} →
              </Link>
            </div>
          ))}
        </section>
      )}
      <section className="mt-5">
        <h3 className="font-black">{t('overview.history')}</h3>
        <p className="mt-1 text-xs text-ink-500">
          {t('overview.historyNote', { count: word.days.size, first: date(word.firstAt) })}
        </p>
        <ol className="mt-3 space-y-2">
          {[...word.events]
            .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
            .slice(0, 8)
            .map((event) => {
              const book = books.find((item) => item.id === event.storybook_id);
              return (
                <li key={event.id} className="rounded-xl bg-white p-3">
                  <p className="text-sm font-bold">
                    {book?.title ?? t(`overview.source.${event.metadata?.source ?? 'unknown'}`)}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    {date(event.created_at)} ·{' '}
                    {t(
                      event.event_type === 'word_exposed'
                        ? 'overview.exposureEvent'
                        : event.event_type === 'word_spoken'
                          ? 'overview.audioEvent'
                          : 'overview.practiceEvent'
                    )}
                  </p>
                </li>
              );
            })}
        </ol>
      </section>
    </dialog>
  );
}
