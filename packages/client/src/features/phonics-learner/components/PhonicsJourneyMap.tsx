import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, BookOpen, Check, Flag, LockKeyhole, Play } from 'lucide-react';
import { courseThemes } from '@/design-system';
import { activityTitle, levelName, unitTitle } from '../lib/activity-title';
import { getKoreanUnit, getActivityPlan } from '../lib/korean-phonics-units';
import { getEnglishUnit, getEnglishActivityPlan } from '../lib/english-phonics-units';
import {
  journeyActivityUrl,
  journeyProgress,
  journeyUnits,
  type JourneyLanguage,
} from '../lib/learning-journey';
import { readGameObservations } from '../lib/journey-assessment';
import { ToyHangul } from './ToyHangul';
import { JourneyWorldIcon } from './JourneyWorldIcon';
import './phonics-journey-map.css';

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
    <span className="journey-letter-english">{stageGlyph(unit)}</span>
  );
}

export function PhonicsJourneyMap({
  lang,
  progress,
  started,
  finishedUnitDone,
}: {
  lang: JourneyLanguage;
  progress: Progress;
  started: boolean;
  finishedUnitDone: boolean;
}) {
  const { t } = useTranslation('phonics');
  const theme = courseThemes[lang];
  const units = journeyUnits(lang);
  const levels = [...new Set(units.map((unit) => unit.levelKey))];
  const currentLevel = progress.current?.unit.levelKey ?? levels[levels.length - 1];
  const [selectedLevel, setSelectedLevel] = useState(currentLevel);
  const mapViewport = useRef<HTMLDivElement>(null);
  const selectedUnits = units.filter((unit) => unit.levelKey === selectedLevel);
  const worldIndex = levels.indexOf(selectedLevel);
  const worldName = t(`world.${lang}.${worldIndex + 1}`);
  const sceneryKind = ICONS[lang][worldIndex] ?? 'garden';
  const scenery = `/images/phonics/story-world-v1/story-${sceneryKind === 'garden' || sceneryKind === 'village' ? 'meadow' : sceneryKind}.webp`;
  const observations = Object.entries(readGameObservations(lang));
  // Each unit uses actual required completion. Map flowers never imply a game score or mastery.
  const stages = selectedUnits.map((unit, index) => {
    const steps = progress.steps.flatMap((step, i) =>
      step.unit.id === unit.id ? [{ ...step, done: progress.done[i] }] : []
    );
    const complete = steps.length > 0 && steps.every((step) => step.done);
    const current = progress.current?.unit.id === unit.id;
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
      y: 110 + row * 220 + (col === 1 ? 65 : 0),
    };
  });
  const height = Math.ceil(stages.length / 3) * 220 + 140;
  const currentY = stages.find((stage) => stage.current)?.y ?? 110;
  useEffect(() => {
    // Keep the actual next stage visible even late in a long book, without moving the whole page.
    if (mapViewport.current) mapViewport.current.scrollTop = Math.max(0, currentY - 110);
  }, [selectedLevel, currentY]);
  const path = stages
    .map((stage, i) => {
      if (i === 0) return `M${stage.x * 10} ${stage.y}`;
      const prev = stages[i - 1];
      const bendX =
        prev.x === stage.x ? prev.x * 10 + (prev.x > 50 ? 100 : -100) : (prev.x + stage.x) * 5;
      return ` C${bendX} ${prev.y} ${bendX} ${stage.y} ${stage.x * 10} ${stage.y}`;
    })
    .join('');
  const completedUnits = units.filter((unit) => {
    const steps = progress.steps.flatMap((step, i) =>
      step.unit.id === unit.id ? [progress.done[i]] : []
    );
    return steps.length > 0 && steps.every(Boolean);
  }).length;
  const startUrl =
    progress.current &&
    journeyActivityUrl(lang, progress.current.unit.id, progress.current.activity.key);
  const freeUnit = progress.current?.unit ?? units[0];
  return (
    <section className={`journey-world journey-world--${lang}`} style={theme.style}>
      <div className="journey-world-wrap">
        <nav className="journey-world-nav" aria-label={t('world.navigation')}>
          <Link to={`/library/phonics/${lang}`} className="journey-small-button">
            <ArrowLeft size={18} /> {t('journey.chooseMode')}
          </Link>
          <span className="journey-language-badge">{t(`journey.${lang}`)}</span>
          <Link to={`/library/phonics/${lang}/${freeUnit.id}`} className="journey-small-button">
            <BookOpen size={18} /> {t('journey.free')}
          </Link>
        </nav>
        <header className="journey-world-heading">
          <div>
            <p className="journey-eyebrow">TANGOBOOK · {t('world.adventure')}</p>
            <h1>{t('world.title')}</h1>
            <p>{t('world.description')}</p>
          </div>
          <div className="journey-garden-count">
            <JourneyWorldIcon kind="flower" />
            <span>
              <strong>{completedUnits}</strong> / {units.length}
              <small>{t('world.bloomed')}</small>
            </span>
          </div>
        </header>
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
                onClick={() => setSelectedLevel(level)}
                className={`journey-region ${selectedLevel === level ? 'is-selected' : ''} ${reached ? 'is-reached' : ''}`}
              >
                <JourneyWorldIcon kind={ICONS[lang][index] ?? 'village'} />
                <span>
                  <small>{t('world.regionNumber', { number: index + 1 })}</small>
                  <strong>{t(`world.${lang}.${index + 1}`)}</strong>
                </span>
              </button>
            );
          })}
        </div>
        <div className="journey-adventure-layout">
          <aside className="journey-mission" aria-live="polite">
            <img
              className="journey-cottage"
              src="/images/phonics/story-world-v1/story-cottage.webp"
              width="360"
              height="360"
              alt=""
              draggable={false}
            />
            <div className="journey-mission-content">
              <p className="journey-eyebrow">
                {t(
                  progress.finished
                    ? 'journey.allDone'
                    : finishedUnitDone
                      ? 'world.pathOpened'
                      : 'world.today'
                )}
              </p>
              <h2>
                {progress.current
                  ? unitTitle(t, progress.current.unit)
                  : t('world.villageComplete')}
              </h2>
              <p className="journey-mission-activity">
                {progress.current
                  ? activityTitle(t, progress.current.activity)
                  : t('journey.repeatDescription')}
              </p>
              {startUrl && (
                <Link to={startUrl} className="journey-play-button">
                  <Play size={20} fill="currentColor" />
                  {t(started ? 'journey.continue' : 'journey.start')}
                  <ArrowRight size={20} />
                </Link>
              )}
              <p className="journey-mission-tip">{t('world.tip')}</p>
            </div>
            <div className="journey-whole-progress">
              <div>
                <span>{t('world.wholeJourney')}</span>
                <strong>
                  {Math.round((progress.completed / Math.max(progress.steps.length, 1)) * 100)}%
                </strong>
              </div>
              <progress
                value={progress.completed}
                max={Math.max(progress.steps.length, 1)}
                aria-label={t('world.wholeJourney')}
              />
              <small>
                {t('journey.progress', { done: progress.completed, total: progress.steps.length })}
              </small>
            </div>
          </aside>
          <section className="journey-map-panel" aria-label={worldName}>
            <header className="journey-map-heading">
              <div>
                <p>{t('world.regionNumber', { number: worldIndex + 1 })}</p>
                <h2>{worldName}</h2>
                <span>{levelName(t, selectedUnits[0])}</span>
              </div>
              <JourneyWorldIcon kind={ICONS[lang][worldIndex] ?? 'village'} />
            </header>
            {selectedLevel !== currentLevel && startUrl && (
              <button
                type="button"
                className="journey-return-current"
                onClick={() => setSelectedLevel(currentLevel)}
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
                    const accessibleName = `${t('world.stageNumber', { number: index + 1 })} · ${unitTitle(t, stage.unit)} · ${t(stage.complete ? 'journey.completed' : stage.current ? 'journey.current' : 'journey.locked')}`;
                    const body = (
                      <>
                        {stage.current && <span className="journey-here">{t('world.here')}</span>}
                        <span className="journey-node">
                          <span className="journey-node-top">
                            {stage.complete ? (
                              <JourneyWorldIcon kind="flower" />
                            ) : stage.unit.isReview ? (
                              <JourneyWorldIcon kind="village" />
                            ) : (
                              <StageLetter lang={lang} unit={stage.unit} />
                            )}
                          </span>
                          <span className="journey-node-state">
                            {stage.complete ? (
                              <Check size={16} />
                            ) : stage.current ? (
                              <Play size={14} fill="currentColor" />
                            ) : (
                              <LockKeyhole size={13} />
                            )}
                          </span>
                        </span>
                        <span className="journey-stage-label">
                          <strong>
                            {stage.unit.isReview ? t('world.review') : unitTitle(t, stage.unit)}
                          </strong>
                          <small>
                            {stage.complete
                              ? t('world.finished')
                              : stage.current
                                ? t('world.stageProgress', { done: stage.done, total: stage.total })
                                : t('world.stageNumber', { number: index + 1 })}
                          </small>
                        </span>
                      </>
                    );
                    return (
                      <li
                        key={stage.unit.id}
                        className={`journey-stage ${stage.current ? 'is-current' : stage.complete ? 'is-complete' : 'is-locked'}`}
                        style={{ left: `${stage.x}%`, top: `${stage.y}px` }}
                      >
                        {(stage.current || stage.complete) && stage.first ? (
                          <Link
                            aria-label={accessibleName}
                            aria-current={stage.current ? 'step' : undefined}
                            className="journey-stage-target"
                            to={journeyActivityUrl(lang, stage.unit.id, stage.first.activity.key)}
                          >
                            {body}
                          </Link>
                        ) : (
                          <div
                            className="journey-stage-target"
                            role="img"
                            aria-label={accessibleName}
                            aria-disabled="true"
                          >
                            {body}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
                <span className="journey-map-end" aria-hidden="true">
                  <Flag size={18} />
                  {t(worldIndex === levels.length - 1 ? 'world.finishVillage' : 'world.nextPlace')}
                </span>
              </div>
            </div>
            <footer className="journey-map-legend">
              <span>
                <span className="journey-dot is-current" />
                {t('world.here')}
              </span>
              <span>
                <Check size={15} />
                {t('world.finished')}
              </span>
              <span>
                <LockKeyhole size={14} />
                {t('world.later')}
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
