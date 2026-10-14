import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpen, Check, Flag, LockKeyhole, Play } from 'lucide-react';
import { courseThemes } from '@/design-system';
import { koreanLearningUnitId } from '@tangobook/shared';
import { activityTitle, levelName, unitTitle } from '../lib/activity-title';
import { freeActivityGroups } from '../lib/free-activity-groups';
import { composeHangul } from '@tangobook/shared';
import { getAllKoreanUnits, getKoreanUnit, getActivityPlan } from '../lib/korean-phonics-units';
import {
  getAllEnglishUnits,
  getEnglishUnit,
  getEnglishActivityPlan,
} from '../lib/english-phonics-units';
import { getRecentUnit, getUnitProgress } from '../lib/progress-store';
import {
  journeyActivityUrl,
  journeyProgress,
  journeyUnits,
  type JourneyLanguage,
} from '../lib/learning-journey';
import { readGameObservations } from '../lib/journey-assessment';
import { ToyHangul } from './ToyHangul';
import { JourneyWorldIcon } from './JourneyWorldIcon';
import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';
import { courseActivityMode, courseUnitPreview } from '../lib/course-presentation';
import './phonics-journey-map.css';
import './phonics-curriculum-board.css';

type Progress = ReturnType<typeof journeyProgress>;
type Unit = ReturnType<typeof journeyUnits>[number];
const ICONS = {
  korean: ['garden', 'forest', 'bridge', 'hills', 'rainbow'],
  english: ['garden', 'forest', 'village', 'bridge', 'hills'],
} as const;

function stageGlyph(unit: Unit) {
  return unit.phonemes[0]?.replace('받침', '') ?? '';
}

function StageLetter({ lang, unit }: { lang: JourneyLanguage; unit: Unit }) {
  return lang === 'korean' ? (
    <ToyHangul text={stageGlyph(unit)} decorative className="journey-letter-toy" />
  ) : (
    <span className="journey-letter-english">{courseUnitPreview(unit).slice(0, 2).join(' ')}</span>
  );
}

export function PhonicsJourneyMap({
  lang,
  progress,
  started,
  finishedUnitDone,
  mode = 'curriculum',
  initialUnitId,
  readDone,
}: {
  lang: JourneyLanguage;
  progress: Progress;
  started: boolean;
  finishedUnitDone: boolean;
  mode?: 'curriculum' | 'free';
  initialUnitId?: string;
  readDone?: (id: string) => readonly string[];
}) {
  const { t } = useTranslation('phonics');
  const theme = courseThemes[lang];
  const free = mode === 'free';
  const units = free
    ? lang === 'korean'
      ? getAllKoreanUnits()
      : getAllEnglishUnits()
    : journeyUnits(lang);
  const requested =
    initialUnitId ?? getRecentUnit(lang) ?? progress.current?.unit.id ?? units[0].id;
  const freeInitial =
    units.find(
      (unit) => unit.id === (lang === 'korean' ? koreanLearningUnitId(requested) : requested)
    ) ?? units[0];
  const initial = free ? freeInitial : (progress.current?.unit ?? units.at(-1)!);
  const levels = [...new Set(units.map((unit) => unit.levelKey))];
  const currentLevel = progress.current?.unit.levelKey ?? levels[levels.length - 1];
  const [selectedLevel, setSelectedLevel] = useState(initial.levelKey);
  const [selectedUnitId, setSelectedUnitId] = useState(initial.id);
  const [search, setSearch] = useSearchParams();
  const finishedIndex = units.findIndex((unit) => unit.id === search.get('finished'));
  const currentIndex = units.findIndex((unit) => unit.id === progress.current?.unit.id);
  const [unlocking, setUnlocking] = useState(
    () =>
      !free &&
      finishedUnitDone &&
      search.get('replay') !== '1' &&
      finishedIndex >= 0 &&
      currentIndex === finishedIndex + 1
  );
  useEffect(() => {
    if (!unlocking) return;
    const timer = window.setTimeout(
      () => {
        setUnlocking(false);
        const params = new URLSearchParams(search);
        params.delete('finished');
        params.delete('replay');
        setSearch(params, { replace: true });
      },
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 450 : 1800
    );
    return () => window.clearTimeout(timer);
  }, [unlocking, search, setSearch]);
  const selectedUnit =
    units.find((unit) => unit.id === selectedUnitId) ?? progress.current?.unit ?? units[0];
  const freeSteps = (unit: Unit) => {
    const completed = readDone?.(unit.id) ?? getUnitProgress(lang, unit.id).completedActivities;
    const plan = lang === 'korean' ? getActivityPlan(unit.id) : getEnglishActivityPlan(unit.id);
    return freeActivityGroups(plan.activities).map(({ activity, keys }) => ({
      unit,
      activity,
      paired: keys.length > 1,
      done: keys.every((key) => completed.includes(key)),
    }));
  };
  const chapterSteps = free
    ? freeSteps(selectedUnit)
    : progress.steps.flatMap((step, index) =>
        step.unit.id === selectedUnit.id ? [{ ...step, done: progress.done[index] }] : []
      );
  const chapterComplete = chapterSteps.length > 0 && chapterSteps.every((step) => step.done);
  const chapterNext = chapterSteps.find((step) => !step.done) ?? chapterSteps[0];
  const mapViewport = useRef<HTMLDivElement>(null);
  const activityList = useRef<HTMLOListElement>(null);
  const [compact, setCompact] = useState(() => window.innerHeight <= 500);
  useEffect(() => {
    const resize = () => setCompact(window.innerHeight <= 500);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  useEffect(() => {
    const list = activityList.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="step"]');
    if (list)
      list.scrollTop = current
        ? Math.max(0, current.offsetTop - list.offsetTop - list.clientHeight / 2)
        : 0;
  }, [selectedUnitId, progress.current?.activity.key, compact]);
  const selectedUnits = units.filter((unit) => unit.levelKey === selectedLevel);
  const worldIndex = levels.indexOf(selectedLevel);
  const worldName = t(`world.${lang}.${worldIndex + 1}`);
  const sceneryKind = ICONS[lang][worldIndex] ?? 'garden';
  const scenery = `/images/phonics/story-world-v1/story-${sceneryKind === 'garden' || sceneryKind === 'village' ? 'meadow' : sceneryKind}.webp`;
  const observations = Object.entries(readGameObservations(lang));
  // Each unit uses actual required completion. Map flowers never imply a game score or mastery.
  const stages = selectedUnits.map((unit, index) => {
    const steps = free
      ? (lang === 'korean' ? getActivityPlan(unit.id) : getEnglishActivityPlan(unit.id)).activities
          .filter((activity) => activity.required)
          .map((activity) => ({
            activity,
            done: (
              readDone?.(unit.id) ?? getUnitProgress(lang, unit.id).completedActivities
            ).includes(activity.key),
          }))
      : progress.steps.flatMap((step, i) =>
          step.unit.id === unit.id ? [{ ...step, done: progress.done[i] }] : []
        );
    const complete = steps.length > 0 && steps.every((step) => step.done);
    const current = free ? selectedUnitId === unit.id : progress.current?.unit.id === unit.id;
    const first = steps.find((step) => !step.done) ?? steps[0];
    const row = Math.floor(index / 3);
    const col = row % 2 === 0 ? index % 3 : 2 - (index % 3);
    return {
      unit,
      complete,
      current,
      first,
      done: steps.filter((step) => step.done).length,
      total: steps.length,
      x: 18 + col * 32,
      y: compact ? 74 + row * 130 : 96 + row * 170 + (col === 1 ? 40 : 0),
    };
  });
  const height = Math.ceil(stages.length / 3) * (compact ? 130 : 170) + 110;
  const currentY = stages.find((stage) => stage.unit.id === selectedUnitId)?.y ?? 84;
  useEffect(() => {
    // Keep the actual next stage visible even late in a long book, without moving the whole page.
    if (mapViewport.current)
      mapViewport.current.scrollTop = Math.max(
        0,
        currentY - Math.max(compact ? 74 : 150, mapViewport.current.clientHeight * 0.35)
      );
  }, [selectedLevel, currentY, compact]);
  const path = stages
    .map((stage, i) => {
      if (i === 0) return `M${stage.x * 10} ${stage.y}`;
      const prev = stages[i - 1];
      const bendX =
        prev.x === stage.x ? prev.x * 10 + (prev.x > 50 ? 100 : -100) : (prev.x + stage.x) * 5;
      return ` C${bendX} ${prev.y} ${bendX} ${stage.y} ${stage.x * 10} ${stage.y}`;
    })
    .join('');
  const startUrl =
    chapterNext && journeyActivityUrl(lang, selectedUnit.id, chapterNext.activity.key);
  const renderActivity = (step: (typeof chapterSteps)[number], index: number) => {
    const current = !free && !chapterComplete && chapterNext?.activity.key === step.activity.key;
    const phoneme =
      free &&
      lang === 'korean' &&
      step.activity.kind === 'consonant-blend-listen' &&
      step.activity.consonant
        ? composeHangul(step.activity.consonant, 'ㅏ', null)
        : free &&
            lang === 'korean' &&
            (step.activity.kind === 'consonant-tap' || step.activity.kind === 'vowel-listen')
          ? (step.activity.consonant ?? step.activity.vowels?.map((v) => v.vowel).join(''))
          : undefined;
    const mode = courseActivityMode(step.activity.kind);
    const gameArt =
      free &&
      (step.activity.kind === 'game-connect-dots'
        ? 'drawing'
        : step.activity.kind === 'game-word-writing'
          ? 'writing'
          : step.activity.kind === 'game-line-matching'
            ? 'matching'
            : step.activity.kind === 'game-korean-block'
              ? 'blocks-ko'
              : step.activity.kind === 'game-english-block'
                ? 'blocks-en'
                : undefined);
    const icon =
      step.activity.kind === 'alphabet-letter-learn'
        ? 'english'
        : step.activity.kind.includes('blend')
          ? 'combine'
          : mode === 'write' || mode === 'draw'
            ? 'write'
            : mode === 'build' || mode === 'match'
              ? 'combine'
              : mode === 'find'
                ? 'compass'
                : 'listen';
    const content = (
      <>
        {!free && (
          <span className="journey-activity-number" aria-hidden="true">
            {step.done ? <Check size={15} /> : index + 1}
          </span>
        )}
        <span className="journey-activity-art" aria-hidden="true">
          {phoneme ? (
            <ToyHangul text={phoneme} decorative />
          ) : gameArt ? (
            <img
              src={`/images/learning/vocabulary-menu-v1/${gameArt}.webp`}
              alt=""
              width={48}
              height={40}
              decoding="async"
            />
          ) : (
            <StorybookSprite name={icon} size={free ? 38 : 32} />
          )}
        </span>
        <span className="journey-free-label">{activityTitle(t, step.activity)}</span>
        {free &&
          (step.done ? (
            <Check className="journey-free-arrow" size={18} aria-hidden="true" />
          ) : (
            <ArrowRight className="journey-free-arrow" size={18} aria-hidden="true" />
          ))}
        {!free && (
          <span className="sr-only">
            {t(step.done ? 'journey.completed' : current ? 'journey.current' : 'journey.locked')}
          </span>
        )}
      </>
    );
    return (
      <li
        key={step.activity.key}
        data-completed={step.done || undefined}
        aria-current={current ? 'step' : undefined}
      >
        {free ? (
          <Link
            to={`/library/phonics/${lang}/${selectedUnit.id}/${step.activity.key}`}
            className="journey-free-activity"
            data-section={step.activity.section}
          >
            {content}
          </Link>
        ) : (
          content
        )}
      </li>
    );
  };

  return (
    <section
      className={`journey-world curriculum-board journey-world--${lang}${free ? ' is-free-mode' : ''}`}
      style={theme.style}
    >
      <div className="journey-world-wrap">
        <nav className="journey-world-nav" aria-label={t('world.navigation')}>
          <Link
            to={`/library/phonics/${lang}`}
            className="journey-small-button"
            aria-label={t('journey.chooseMode')}
          >
            <StorybookSprite name="back" size={26} />
          </Link>
          <h1>
            {t(`chapter.${lang}`)} · {t(free ? 'journey.free' : 'flow.pathTitle')}
          </h1>
          <Link
            to={`/library/phonics/${lang}?mode=${free ? 'curriculum' : 'free'}`}
            className="journey-small-button"
            aria-label={t(free ? 'journey.curriculumMode' : 'journey.free')}
          >
            <StorybookSprite name="book" size={26} />
          </Link>
        </nav>
        <div className="journey-world-selector" role="group" aria-label={t('world.regions')}>
          {levels.map((level, index) => {
            const levelUnits = units.filter((unit) => unit.levelKey === level);
            const reached = levelUnits.some(
              (unit) =>
                unit.id === progress.current?.unit.id ||
                progress.steps.some((step, i) => step.unit.id === unit.id && progress.done[i])
            );
            return (
              <button
                key={level}
                type="button"
                aria-pressed={selectedLevel === level}
                onClick={() => {
                  setSelectedLevel(level);
                  setSelectedUnitId(
                    free ? levelUnits[0].id : (progress.current?.unit.id ?? units.at(-1)!.id)
                  );
                }}
                className={`journey-region ${selectedLevel === level ? 'is-selected' : ''} ${reached ? 'is-reached' : ''}`}
              >
                <JourneyWorldIcon kind={ICONS[lang][index] ?? 'village'} />
                <span>
                  <small>
                    {lang === 'korean'
                      ? t('flow.koreanBookNumber', { number: index + 1 })
                      : `Book ${index + 1}`}
                  </small>
                  <strong>{t(`world.${lang}.${index + 1}`)}</strong>
                </span>
              </button>
            );
          })}
        </div>
        <div className="journey-adventure-layout">
          <aside className="journey-mission" aria-live="polite">
            <div className="journey-mission-content">
              <div className="journey-chapter-heading">
                {free &&
                  (lang === 'korean' ? (
                    <StageLetter lang={lang} unit={selectedUnit} />
                  ) : (
                    <StorybookSprite name="english" size={compact ? 28 : 46} />
                  ))}
                <div>
                  <p className="journey-eyebrow">{levelName(t, selectedUnit)}</p>
                  <h2>{unitTitle(t, selectedUnit)}</h2>
                </div>
              </div>
              <ol
                ref={activityList}
                className="journey-chapter-activities"
                aria-label={t('chapter.activities')}
              >
                {free
                  ? (['learn', 'play'] as const).map((section) => {
                      const steps = chapterSteps.filter(
                        (step) => step.activity.section === section
                      );
                      if (!steps.length) return null;
                      const title = t(section === 'learn' ? 'section.learn' : 'section.games');
                      return (
                        <li key={`${selectedUnitId}:${section}`} className="journey-free-group">
                          <details
                            open
                            aria-label={title}
                            onToggle={(event) => {
                              // Closing the long learning branch on a phone should reveal the games.
                              if (!compact || section !== 'learn' || event.currentTarget.open)
                                return;
                              const gameGroup = event.currentTarget.parentElement
                                ?.nextElementSibling as HTMLElement | null;
                              if (activityList.current && gameGroup)
                                activityList.current.scrollTop = Math.max(
                                  0,
                                  gameGroup.offsetTop - activityList.current.offsetTop
                                );
                            }}
                          >
                            <summary className="journey-free-group-title" data-section={section}>
                              <span>{title}</span>
                              <span className="journey-free-chevron" aria-hidden="true">
                                ⌄
                              </span>
                            </summary>
                            <ol className="journey-free-branch" aria-label={title}>
                              {steps.map((step, index) => renderActivity(step, index))}
                            </ol>
                          </details>
                        </li>
                      );
                    })
                  : chapterSteps.map(renderActivity)}
              </ol>
              {!free && startUrl && (
                <Link to={startUrl} className="journey-play-button">
                  <Play size={20} fill="currentColor" />
                  {t(
                    chapterComplete
                      ? 'chapter.again'
                      : started
                        ? 'journey.continue'
                        : 'journey.start'
                  )}
                  <ArrowRight size={20} />
                </Link>
              )}
            </div>
          </aside>
          <section className="journey-map-panel" aria-label={worldName}>
            <header className="journey-map-heading">
              <div>
                <h2>{worldName}</h2>
              </div>
              <JourneyWorldIcon kind={ICONS[lang][worldIndex] ?? 'village'} />
            </header>
            {!free && selectedLevel !== currentLevel && startUrl && (
              <button
                type="button"
                className="journey-return-current"
                onClick={() => {
                  setSelectedLevel(currentLevel);
                  setSelectedUnitId(progress.current?.unit.id ?? units.at(-1)!.id);
                }}
              >
                <Flag size={16} />
                {t('world.backToCurrent')}
                <ArrowRight size={16} />
              </button>
            )}
            <div
              className="journey-map-viewport"
              ref={mapViewport}
              tabIndex={0}
              aria-label={t('world.scrollMap')}
            >
              <div
                className="journey-map-scene"
                style={{ '--journey-map-height': `${height}px` } as CSSProperties}
              >
                <div
                  className="journey-scenery"
                  style={{ backgroundImage: `url(${scenery})` }}
                  aria-hidden="true"
                />
                <svg
                  className="journey-path"
                  viewBox={`0 0 1000 ${height}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d={path}
                    stroke="#CFBA8F"
                    strokeWidth="32"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity=".38"
                  />
                  <path
                    d={path}
                    stroke="#FFF8DF"
                    strokeWidth="23"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d={path}
                    stroke="#C8AE81"
                    strokeWidth="3"
                    strokeDasharray="5 12"
                    strokeLinecap="round"
                    fill="none"
                    opacity=".65"
                  />
                </svg>
                <ol className="journey-stages" aria-label={t('world.stages')}>
                  {stages.map((stage, index) => {
                    const accessibleName = `${t('world.stageNumber', { number: index + 1 })} · ${unitTitle(t, stage.unit)} · ${t(stage.complete ? 'journey.completed' : free ? 'journey.free' : stage.current ? 'journey.current' : 'journey.locked')}`;
                    const body = (
                      <>
                        {stage.current && (
                          <span className="journey-here">
                            {t(free ? 'board.selected' : 'world.here')}
                          </span>
                        )}
                        <span className="journey-node">
                          <span className="journey-node-top">
                            {stage.unit.isReview ? (
                              <JourneyWorldIcon kind="village" />
                            ) : (
                              <StageLetter lang={lang} unit={stage.unit} />
                            )}
                          </span>
                          {stage.current && unlocking && (
                            <span className="journey-unlocking-lock" aria-hidden="true">
                              <StorybookSprite name="lock" size={42} />
                            </span>
                          )}
                          <span className="journey-node-state">
                            {stage.complete ? (
                              <Check size={16} />
                            ) : free ? (
                              <BookOpen size={14} />
                            ) : stage.current ? (
                              <Play size={14} fill="currentColor" />
                            ) : (
                              <LockKeyhole size={13} />
                            )}
                          </span>
                        </span>
                      </>
                    );
                    return (
                      <li
                        key={stage.unit.id}
                        className={`journey-stage ${stage.current ? 'is-current' : stage.complete ? 'is-complete' : free ? 'is-open' : 'is-locked'} ${stage.unit.id === selectedUnitId ? 'is-previewed' : ''} ${stage.current && unlocking ? 'is-unlocking' : ''}`}
                        style={{ left: `${stage.x}%`, top: `${stage.y}px` }}
                      >
                        {free || ((stage.current || stage.complete) && stage.first) ? (
                          <button
                            type="button"
                            aria-label={accessibleName}
                            aria-current={!free && stage.current ? 'step' : undefined}
                            aria-pressed={stage.unit.id === selectedUnitId}
                            className="journey-stage-target"
                            onClick={() => setSelectedUnitId(stage.unit.id)}
                          >
                            {body}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="journey-stage-target"
                            aria-label={accessibleName}
                            aria-disabled="true"
                          >
                            {body}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ol>
                {!free && (
                  <span className="journey-map-end" aria-hidden="true">
                    <Flag size={18} />
                    {t(
                      free
                        ? 'board.chooseChapter'
                        : worldIndex === levels.length - 1
                          ? 'world.finishVillage'
                          : 'world.nextPlace'
                    )}
                  </span>
                )}
              </div>
            </div>
            {unlocking && (
              <div
                className="journey-unlock-status"
                role="status"
                aria-label={t('chapter.unlocked')}
              >
                <StorybookSprite name="lock" size={28} />
                {t('chapter.unlocked')}
              </div>
            )}
            <footer className="journey-map-legend">
              <span>
                <span className="journey-dot is-current" />
                {t(free ? 'board.selected' : 'world.here')}
              </span>
              <span>
                <Check size={15} />
                {t('world.finished')}
              </span>
              <span>
                {free ? <BookOpen size={14} /> : <LockKeyhole size={14} />}
                {t(free ? 'board.chooseChapter' : 'world.later')}
              </span>
            </footer>
          </section>
        </div>
        {observations.length > 0 && (
          <details className="journey-parent-notes">
            <summary>{t('journey.observations')}</summary>
            <p>{t('journey.observationDescription')}</p>
            <ul>
              {observations.map(([id, run]) => {
                const [observedUnitId, observedActivityKey] = id.split('/');
                const observedUnit =
                  lang === 'korean'
                    ? getKoreanUnit(observedUnitId)
                    : getEnglishUnit(observedUnitId);
                const observedActivity = (
                  lang === 'korean'
                    ? getActivityPlan(observedUnitId)
                    : getEnglishActivityPlan(observedUnitId)
                ).activities.find((activity) => activity.key === observedActivityKey);
                const step =
                  observedUnit && observedActivity
                    ? { unit: observedUnit, activity: observedActivity }
                    : undefined;
                if (!step) return null;
                const choices = Object.values(run.firstChoices);
                return (
                  <li key={id}>
                    <strong>
                      {unitTitle(t, step.unit)} · {activityTitle(t, step.activity)}
                    </strong>
                    <p>
                      {t('journey.observationScore', {
                        correct: choices.filter((choice) => choice.correct).length,
                        total: choices.length,
                        retries: run.retries,
                      })}
                    </p>
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </div>
    </section>
  );
}
