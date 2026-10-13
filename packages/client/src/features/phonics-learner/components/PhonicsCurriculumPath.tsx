import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { courseThemes } from '@/design-system';
import { MobileLandscapeGate } from '@/features/games/components/MobileLandscapeGate';
import { unitTitle } from '../lib/activity-title';
import { courseUnitPreview } from '../lib/course-presentation';
import {
  journeyActivities,
  journeyActivityUrl,
  journeyProgress,
  journeyUnits,
  type JourneyLanguage,
} from '../lib/learning-journey';
import { ToyHangul } from './ToyHangul';
import { PhonicsGameSprite } from './PhonicsGameSprite';
import { PhonicsJourneyMap } from './PhonicsJourneyMap';
import { usePathCamera } from './usePathCamera';
import './phonics-curriculum-path.css';

type Props = {
  lang: JourneyLanguage;
  progress: ReturnType<typeof journeyProgress>;
  started: boolean;
  finishedUnitDone: boolean;
};

export function PhonicsCurriculumPath({ lang, progress, started, finishedUnitDone }: Props) {
  const { t } = useTranslation('phonics');
  const [search, setSearch] = useSearchParams();
  const [parentOpen, setParentOpen] = useState(false);
  const { viewport, position, pan, handlers } = usePathCamera();
  const [mapSize, setMapSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const { width: mapWidth, height: mapHeight } = mapSize;
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const measure = () =>
      setMapSize((previous) => {
        const width = el.clientWidth || window.innerWidth;
        const height = el.clientHeight || window.innerHeight;
        return previous.width === width && previous.height === height
          ? previous
          : { width, height };
      });
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [parentOpen, viewport]);
  // One screen spans three chapters; the height also limits targets on landscape phones.
  const stageGap = Math.max(160, (mapWidth - 96) / 3);
  const firstX = mapWidth / 2 - stageGap;
  const nodeSize = Math.max(96, Math.min(224, mapWidth * 0.22, (mapHeight - 165) * 0.82));
  const bend = Math.min(32, mapHeight * 0.025);
  const units = journeyUnits(lang);
  let bookIndex = -1;
  const stages = units.map((unit, index) => {
    const bookStart = index === 0 || units[index - 1].levelKey !== unit.levelKey;
    if (bookStart) bookIndex++;
    const steps = progress.steps.flatMap((s, i) =>
      s.unit.id === unit.id ? [{ ...s, done: progress.done[i] }] : []
    );
    const complete = steps.length > 0 && steps.every((s) => s.done);
    const current = progress.current?.unit.id === unit.id;
    const first = complete ? steps[0] : steps.find((s) => !s.done);
    return {
      unit,
      complete,
      current,
      first,
      index,
      bookStart,
      x: index * stageGap + bookIndex * 160 + firstX,
      y: mapHeight * 0.5 + [0, -bend, 0, bend][index % 4],
    };
  });
  const currentIndex = stages.findIndex((s) => s.current);
  const focusIndex = currentIndex >= 0 ? currentIndex : stages.length - 1;
  const focusX = stages[focusIndex].x;
  const activeBook = stages[focusIndex].unit;
  const pathWidth = stages[stages.length - 1].x + mapWidth / 2;
  const books = stages.filter((s) => s.bookStart);
  const viewedBook =
    position === null
      ? stages[focusIndex]
      : ([...books].reverse().find((s) => s.x <= position + mapWidth / 2 + 1) ?? books[0]);
  const finishedIndex = units.findIndex((u) => u.id === search.get('finished'));
  const [unlocking, setUnlocking] = useState(
    () =>
      finishedUnitDone &&
      search.get('replay') !== '1' &&
      finishedIndex >= 0 &&
      currentIndex === finishedIndex + 1
  );
  const centerCurrent = useCallback(() => {
    if (!viewport.current) return;
    viewport.current.scrollLeft = Math.max(0, focusX - mapWidth / 2);
  }, [focusX, mapWidth]);
  useEffect(() => {
    if (!parentOpen) centerCurrent();
    // Opening the path or changing the current chapter centers once; manual exploration is preserved.
  }, [lang, centerCurrent, parentOpen]);
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
  const d = stages
    .map((s, i) =>
      i === 0
        ? `M ${s.x} ${s.y}`
        : `C ${s.x - stageGap / 2} ${stages[i - 1].y} ${s.x - stageGap / 2} ${s.y} ${s.x} ${s.y}`
    )
    .join(' ');
  const theme = courseThemes[lang];
  if (parentOpen)
    return (
      <div className="chapter-parent-view">
        <div className="chapter-parent-bar">
          <button
            type="button"
            className="journey-small-button"
            onClick={() => setParentOpen(false)}
          >
            <PhonicsGameSprite name="back" size={22} />
            {t('chapter.backToChild')}
          </button>
        </div>
        <PhonicsJourneyMap {...{ lang, progress, started, finishedUnitDone }} />
      </div>
    );
  return (
    <MobileLandscapeGate>
      <section
        className="curriculum-path"
        style={{ ...theme.style, '--path-node-size': `${nodeSize}px` } as CSSProperties}
      >
        <div className="curriculum-path-shell">
          <nav className="curriculum-path-nav" aria-label={t('world.navigation')}>
            <Link
              to={`/library/phonics/${lang}`}
              className="curriculum-path-back"
              aria-label={t('journey.chooseMode')}
            >
              <PhonicsGameSprite name="back" size={26} />
            </Link>
            <div className="curriculum-book-current" aria-label={t('flow.viewedBook')}>
              <h1 className="sr-only">
                {t(`chapter.${lang}`)} · {t('flow.pathTitle')}
              </h1>
              <PhonicsGameSprite name={lang === 'korean' ? 'book-coral' : 'book-mint'} size={46} />
              <div>
                <strong>Book {viewedBook.unit.levelIndex}</strong>
                <span>{t(`world.${lang}.${viewedBook.unit.levelIndex}`)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setParentOpen(true)}
              className="curriculum-path-info"
              aria-label={t('chapter.info')}
              title={t('chapter.info')}
            >
              <PhonicsGameSprite name="book" size={30} />
              <span>{t('chapter.info')}</span>
            </button>
          </nav>
          <div className="curriculum-path-controls">
            <button type="button" onClick={() => pan(-1)} aria-label={t('flow.mapUp')}>
              <PhonicsGameSprite name="back" size={28} className="path-arrow-up" />
            </button>
            <button type="button" onClick={centerCurrent} aria-label={t('world.backToCurrent')}>
              <PhonicsGameSprite name="compass" size={38} />
            </button>
            <button type="button" onClick={() => pan(1)} aria-label={t('flow.mapDown')}>
              <PhonicsGameSprite name="back" size={28} className="path-arrow-down" />
            </button>
          </div>
          <nav className="curriculum-book-rail" aria-label={t('flow.bookMap')}>
            {books.map((book) => (
              <button
                key={book.unit.levelKey}
                type="button"
                aria-label={`Book ${book.unit.levelIndex} · ${t(`world.${lang}.${book.unit.levelIndex}`)}`}
                aria-current={
                  viewedBook.unit.levelKey === book.unit.levelKey ? 'location' : undefined
                }
                onClick={() => {
                  if (viewport.current)
                    viewport.current.scrollLeft = Math.max(0, book.x - mapWidth / 2);
                }}
              >
                <PhonicsGameSprite
                  name={
                    book.unit.levelIndex === activeBook.levelIndex
                      ? lang === 'korean'
                        ? 'stage-coral'
                        : 'stage-mint'
                      : 'stage-locked'
                  }
                  className="path-book-bead"
                />
                <span>{book.unit.levelIndex}</span>
              </button>
            ))}
          </nav>
          <div
            ref={viewport}
            className="curriculum-path-viewport"
            role="region"
            aria-label={t('flow.pathScroll')}
            tabIndex={0}
            {...handlers}
          >
            <div className="curriculum-path-track" style={{ width: pathWidth, height: mapHeight }}>
              {stages
                .filter((s) => s.index % 3 === 0)
                .map((s, i) => (
                  <div
                    key={`scenery-${s.index}`}
                    className="curriculum-path-scenery"
                    style={{ top: s.y + nodeSize / 2 + 18, left: s.x + stageGap / 2 - 55 }}
                    aria-hidden="true"
                  >
                    <PhonicsGameSprite
                      size={110}
                      preserveAspect
                      name={
                        (
                          [
                            'scenery-tree',
                            'scenery-flowers',
                            'scenery-bridge',
                            'scenery-cottage',
                            'scenery-picnic',
                            'scenery-garden',
                          ] as const
                        )[i % 6]
                      }
                    />
                  </div>
                ))}
              <svg
                preserveAspectRatio="none"
                className="curriculum-path-line"
                width={pathWidth}
                height={mapHeight}
                viewBox={`0 0 ${pathWidth} ${mapHeight}`}
                aria-hidden="true"
              >
                <defs>
                  <pattern id={`road-${lang}`} patternUnits="userSpaceOnUse" width="85" height="85">
                    <image
                      href="/images/phonics/path-premium-v1/road.webp"
                      width="85"
                      height="85"
                    />
                  </pattern>
                </defs>
                <path d={d} fill="none" stroke="#d9cdb7" strokeWidth="36" strokeLinecap="round" />
                <path
                  d={d}
                  fill="none"
                  stroke={`url(#road-${lang})`}
                  strokeWidth="30"
                  strokeLinecap="round"
                />
              </svg>
              {stages
                .filter((stage) => stage.bookStart && stage.index > 0)
                .map((stage) => (
                  <div
                    key={stage.unit.levelKey}
                    className="curriculum-book-door"
                    style={{
                      left: stage.x - stageGap / 2 - 80,
                      top: Math.max(90, stage.y - nodeSize / 2 - 100),
                    }}
                  >
                    <PhonicsGameSprite
                      name={lang === 'korean' ? 'book-coral' : 'book-mint'}
                      size={72}
                    />
                    <span>
                      <strong>Book {stage.unit.levelIndex}</strong>
                      <small>{t(`world.${lang}.${stage.unit.levelIndex}`)}</small>
                    </span>
                  </div>
                ))}
              <ol aria-label={t('world.stages')}>
                {stages.map((stage) => {
                  const preview = courseUnitPreview(stage.unit).slice(0, 3);
                  const label = `${t('world.stageNumber', { number: stage.index + 1 })} · ${unitTitle(t, stage.unit)} · ${t(stage.complete ? 'journey.completed' : stage.current ? 'journey.current' : 'journey.locked')}`;
                  const body = (
                    <>
                      <span className="curriculum-path-face">
                        <PhonicsGameSprite
                          name={
                            stage.complete
                              ? 'stage-done'
                              : stage.current
                                ? lang === 'korean'
                                  ? 'stage-coral'
                                  : 'stage-mint'
                                : 'stage-locked'
                          }
                          className="path-stage-plate"
                        />
                        {stage.unit.isReview ? (
                          <PhonicsGameSprite name="flag" size={42} />
                        ) : lang === 'korean' ? (
                          <ToyHangul text={preview[0] ?? ''} decorative />
                        ) : (
                          <span className={preview.join('').length > 5 ? 'is-long' : ''}>
                            {preview.join(' ')}
                          </span>
                        )}
                      </span>
                      {(stage.complete || !stage.current || unlocking) && (
                        <span className="curriculum-path-state" aria-hidden="true">
                          {stage.complete ? (
                            <PhonicsGameSprite name="check" size={34} />
                          ) : stage.current ? (
                            <>
                              <PhonicsGameSprite
                                name="lock"
                                className="path-lock-closed"
                                size={34}
                              />
                              <PhonicsGameSprite
                                name="unlock"
                                className="path-lock-open"
                                size={34}
                              />
                            </>
                          ) : (
                            <PhonicsGameSprite name="lock" size={34} />
                          )}
                        </span>
                      )}
                      {stage.current && (
                        <span className="curriculum-path-here">{t('flow.now')}</span>
                      )}
                    </>
                  );
                  return (
                    <li
                      key={stage.unit.id}
                      className={`curriculum-path-stage ${stage.complete ? 'is-done' : stage.current ? 'is-current' : 'is-locked'} ${stage.current && unlocking ? 'is-unlocking' : ''}`}
                      style={
                        {
                          left: stage.x,
                          top: stage.y - nodeSize / 2,
                        } as CSSProperties
                      }
                    >
                      {(stage.complete || stage.current) && stage.first ? (
                        <Link
                          aria-label={label}
                          aria-current={stage.current ? 'step' : undefined}
                          to={journeyActivityUrl(lang, stage.unit.id, stage.first.activity.key)}
                          onClick={(e) => {
                            if (unlocking) e.preventDefault();
                          }}
                        >
                          {body}
                        </Link>
                      ) : (
                        <button type="button" aria-label={label} disabled>
                          {body}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
          <div className="curriculum-path-footer">
            {unlocking ? (
              <p
                role="status"
                aria-label={t('chapter.unlocked')}
                className="curriculum-path-unlocked"
              >
                {t('chapter.unlocked')}
              </p>
            ) : progress.current ? (
              <Link
                className={`path-game-action ${theme.action} ${theme.focus}`}
                to={journeyActivityUrl(
                  lang,
                  progress.current.unit.id,
                  progress.current.activity.key
                )}
              >
                <PhonicsGameSprite
                  name={lang === 'korean' ? 'cta-coral' : 'cta-mint'}
                  className="path-action-plate"
                />
                <span className="path-action-label">
                  <PhonicsGameSprite name="play" size={25} />
                  {t(started ? 'journey.continue' : 'journey.start')}
                </span>
              </Link>
            ) : (
              <>
                <p>{t('chapter.allDone')}</p>
                <Link
                  className={`path-game-action ${theme.action} ${theme.focus}`}
                  to={journeyActivityUrl(
                    lang,
                    units[0].id,
                    journeyActivities(lang, units[0].id)[0].key
                  )}
                >
                  <PhonicsGameSprite
                    name={lang === 'korean' ? 'cta-coral' : 'cta-mint'}
                    className="path-action-plate"
                  />
                  <span className="path-action-label">{t('chapter.again')}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </MobileLandscapeGate>
  );
}
