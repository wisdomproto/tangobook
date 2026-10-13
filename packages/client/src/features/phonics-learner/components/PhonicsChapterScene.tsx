import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Headphones,
  LockKeyhole,
  Pencil,
  Play,
  Puzzle,
  Sparkles,
  UnlockKeyhole,
} from 'lucide-react';
import { courseThemes } from '@/design-system';
import { activityTitle } from '../lib/activity-title';
import type { ActivityDef } from '../lib/korean-phonics-units';
import {
  journeyActivityUrl,
  journeyProgress,
  journeyUnits,
  type JourneyLanguage,
} from '../lib/learning-journey';
import { PhonicsJourneyMap } from './PhonicsJourneyMap';
import { ToyHangul } from './ToyHangul';
import './phonics-chapter-scene.css';

type Progress = ReturnType<typeof journeyProgress>;
type Unit = ReturnType<typeof journeyUnits>[number];
type Props = {
  lang: JourneyLanguage;
  progress: Progress;
  started: boolean;
  finishedUnitDone: boolean;
};

function stepStyle(activity: ActivityDef) {
  if (activity.kind.includes('write') || activity.kind === 'game-word-writing')
    return { label: 'chapter.write', Icon: Pencil };
  if (
    activity.section === 'play' ||
    activity.kind === 'word-listen-choose' ||
    activity.kind.startsWith('review-')
  )
    return { label: 'chapter.play', Icon: Sparkles };
  if (activity.kind.includes('blend') || activity.kind.startsWith('cvc-'))
    return { label: 'chapter.combine', Icon: Puzzle };
  return { label: 'chapter.listen', Icon: Headphones };
}

function chapterLetters(lang: JourneyLanguage, unit: Unit, first?: ActivityDef) {
  const values =
    lang === 'english' && (first?.cvcPattern?.vc || first?.pattern)
      ? [first.cvcPattern?.vc ?? first.pattern!]
      : unit.phonemes.slice(0, 3).map((value) => value.replace('받침', ''));
  return values.map((value) =>
    lang === 'english' && /^[a-z]$/i.test(value)
      ? `${value.toUpperCase()}${value.toLowerCase()}`
      : value
  );
}

function ChapterArt({
  lang,
  letters,
  writing = false,
}: {
  lang: JourneyLanguage;
  letters: string[];
  writing?: boolean;
}) {
  return (
    <span
      className={`chapter-glyph ${writing ? 'is-writing' : ''} ${letters.length > 1 ? 'is-multiple' : ''} ${letters.some((letter) => letter.length > 3) ? 'is-pattern' : ''}`}
      role="img"
      aria-label={letters.join(' · ')}
    >
      {letters.map((letter) => (
        <span key={letter} className="chapter-letter">
          {lang === 'korean' && !writing ? (
            <ToyHangul text={letter} decorative />
          ) : (
            <span className="chapter-font" aria-hidden="true">
              {letter}
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

export function PhonicsChapterScene({ lang, progress, started, finishedUnitDone }: Props) {
  const { t } = useTranslation('phonics');
  const [search, setSearch] = useSearchParams();
  const [parentOpen, setParentOpen] = useState(false);
  const units = journeyUnits(lang);
  const unit = progress.current?.unit ?? units[units.length - 1];
  const unitSteps = progress.steps.flatMap((step, i) =>
    step.unit.id === unit.id ? [{ ...step, done: progress.done[i] }] : []
  );
  const first = unitSteps[0]?.activity;
  const letters = chapterLetters(lang, unit, first);
  const currentActivity = progress.current?.activity;
  const style = currentActivity ? stepStyle(currentActivity) : undefined;
  const finishedId = search.get('finished');
  const finishedIndex = units.findIndex((item) => item.id === finishedId);
  const nextIndex = units.findIndex((item) => item.id === progress.current?.unit.id);
  const [unlocking, setUnlocking] = useState(
    () =>
      !!progress.current &&
      !!finishedUnitDone &&
      search.get('replay') !== '1' &&
      finishedIndex >= 0 &&
      nextIndex === finishedIndex + 1
  );

  useEffect(() => {
    if (!unlocking) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(
      () => {
        setUnlocking(false);
        const params = new URLSearchParams(search);
        params.delete('finished');
        params.delete('replay');
        setSearch(params, { replace: true });
      },
      reduced ? 450 : 1800
    );
    return () => window.clearTimeout(timer);
  }, [unlocking, search, setSearch]);

  const replay = progress.steps[0];
  const start = progress.current ?? replay;
  const startUrl = start && journeyActivityUrl(lang, start.unit.id, start.activity.key);
  if (parentOpen)
    return (
      <div className="chapter-parent-view">
        <div className="chapter-parent-bar">
          <button
            type="button"
            className="journey-small-button"
            onClick={() => setParentOpen(false)}
          >
            <ArrowLeft size={18} />
            {t('chapter.backToChild')}
          </button>
        </div>
        <PhonicsJourneyMap
          lang={lang}
          progress={progress}
          started={started}
          finishedUnitDone={finishedUnitDone}
        />
      </div>
    );

  return (
    <section
      className={`journey-world journey-world--${lang} chapter-page`}
      style={courseThemes[lang].style}
    >
      <div className="chapter-landscape" aria-hidden="true" />
      <div className="chapter-shell">
        <nav className="chapter-nav" aria-label={t('world.navigation')}>
          <Link
            to={`/library/phonics/${lang}`}
            className="chapter-back"
            aria-label={t('journey.chooseMode')}
          >
            <ArrowLeft size={23} />
          </Link>
          <span className="journey-language-badge">{t(`chapter.${lang}`)}</span>
          <button
            type="button"
            className="chapter-info"
            aria-expanded={false}
            onClick={() => setParentOpen(true)}
          >
            <BookOpen size={17} />
            {t('chapter.info')}
          </button>
        </nav>
        <div className="chapter-focus">
          <h1>
            {progress.finished
              ? t('chapter.allDone')
              : t('chapter.title', { letter: letters.join(' · ') })}
          </h1>
          {startUrl && (
            <Link
              to={startUrl}
              className="chapter-start"
              aria-label={
                progress.finished
                  ? t('chapter.again')
                  : `${t(started ? 'journey.continue' : 'journey.start')} · ${activityTitle(t, currentActivity!)}`
              }
            >
              {progress.finished ? (
                <img
                  className="chapter-done-house"
                  src="/images/phonics/story-world-v1/story-cottage.webp"
                  width="240"
                  height="240"
                  alt=""
                />
              ) : (
                <span className="chapter-art">
                  <ChapterArt
                    lang={lang}
                    letters={letters}
                    writing={style?.label === 'chapter.write'}
                  />
                  <span className="chapter-art-icon" aria-hidden="true">
                    {style && <style.Icon size={28} />}
                  </span>
                </span>
              )}
              <span className="journey-play-button chapter-cta">
                <Play size={21} fill="currentColor" />
                {t(
                  progress.finished
                    ? 'chapter.again'
                    : started
                      ? 'chapter.continue'
                      : 'chapter.start'
                )}
                <ArrowRight size={23} />
              </span>
            </Link>
          )}
          {!progress.finished && (
            <ol className="chapter-steps" aria-label={t('chapter.activities')}>
              {unitSteps.map((step) => {
                const { label, Icon } = stepStyle(step.activity);
                const current = step.activity.key === currentActivity?.key;
                const status = step.done
                  ? 'world.finished'
                  : current
                    ? 'journey.current'
                    : 'journey.locked';
                return (
                  <li
                    key={step.activity.key}
                    className={`chapter-step ${step.done ? 'is-done' : current ? 'is-current' : 'is-locked'}`}
                    aria-label={`${activityTitle(t, step.activity)} · ${t(status)}`}
                    aria-current={current ? 'step' : undefined}
                  >
                    <span className="chapter-step-icon" aria-hidden="true">
                      <Icon size={27} />
                      <span className="chapter-step-state">
                        {step.done ? (
                          <Check size={13} />
                        ) : current ? (
                          <Play size={12} fill="currentColor" />
                        ) : (
                          <LockKeyhole size={12} />
                        )}
                      </span>
                    </span>
                    <span>{t(label)}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
      {unlocking && (
        <div className="chapter-unlock" role="status" aria-label={t('chapter.unlocked')}>
          <div className="chapter-unlock-panel">
            <div className="chapter-unlock-art">
              <ChapterArt lang={lang} letters={letters} />
              <span className="chapter-opening-lock">
                <LockKeyhole className="chapter-lock-closed" size={42} />
                <UnlockKeyhole className="chapter-lock-open" size={42} />
              </span>
              <span className="chapter-unlock-ring" />
            </div>
            <h2>{t('chapter.unlocked')}</h2>
          </div>
        </div>
      )}
    </section>
  );
}
