import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { courseThemes } from '@/design-system';
import { activityTitle } from '../lib/activity-title';
import { courseActivityMode, courseActivityPreview } from '../lib/course-presentation';
import { type JourneyLanguage, type journeyProgress } from '../lib/learning-journey';
import { CourseActivityVisual } from './CourseActivityVisual';
import { PhonicsGameSprite, type PathIconName } from './PhonicsGameSprite';
import '@/design-system/learning-layouts.css';
import './phonics-activity-finish.css';

type Step = ReturnType<typeof journeyProgress>['steps'][number];

export function PhonicsActivityFinish({
  lang,
  next,
  chapterDone,
  onNext,
  onExit,
}: {
  lang: JourneyLanguage;
  next?: Step;
  chapterDone: boolean;
  onNext: () => void;
  onExit: () => void;
}) {
  const { t } = useTranslation('phonics');
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const theme = courseThemes[lang];
  useEffect(() => {
    button.current?.focus();
  }, []);
  const activity = !chapterDone ? next?.activity : undefined;
  const mode = activity ? courseActivityMode(activity.kind) : undefined;
  const icon: PathIconName =
    mode === 'write' || mode === 'draw'
      ? 'write'
      : mode === 'listen'
        ? 'listen'
        : mode === 'find'
          ? 'compass'
          : mode === 'match' || mode === 'build'
            ? 'combine'
            : 'play';
  return (
    <div className="phonics-finish" style={theme.style}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="phonics-finish-title"
        className="phonics-finish-panel"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onExit();
          }
          if (event.key !== 'Tab') return;
          const buttons = panel.current?.querySelectorAll<HTMLButtonElement>('button');
          if (!buttons?.length) return;
          const first = buttons[0],
            last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <span className="phonics-finish-check" aria-hidden="true">
          <PhonicsGameSprite name="check" size={48} />
        </span>
        <h1 id="phonics-finish-title">
          {t(chapterDone ? 'journey.unitDone' : 'journey.congratulations')}
        </h1>
        <div className="phonics-finish-preview">
          {activity && mode ? (
            <CourseActivityVisual
              mode={mode}
              preview={courseActivityPreview(activity)}
              illustrated={lang === 'korean' && mode !== 'write'}
              toolVisual={<PhonicsGameSprite name={icon} size={32} />}
              fallbackVisual={<PhonicsGameSprite name={icon} size={80} />}
            />
          ) : (
            <span className="phonics-finish-route" aria-hidden="true">
              <PhonicsGameSprite name={lang === 'korean' ? 'book-coral' : 'book-mint'} size={100} />
            </span>
          )}
        </div>
        <p className="phonics-finish-caption">
          {activity ? activityTitle(t, activity) : t('journey.viewJourney')}
        </p>
        <button
          ref={button}
          type="button"
          onClick={onNext}
          className={`phonics-finish-next path-game-action ${theme.action} ${theme.focus}`}
        >
          <PhonicsGameSprite
            name={lang === 'korean' ? 'cta-coral' : 'cta-mint'}
            className="path-action-plate"
          />
          <span className="path-action-label">
            {t(chapterDone ? 'journey.viewJourney' : 'journey.nextActivity')}
            <PhonicsGameSprite name="next" size={27} />
          </span>
        </button>
        {!chapterDone && (
          <button type="button" onClick={onExit} className="phonics-finish-rest">
            {t('flow.rest')}
          </button>
        )}
      </div>
    </div>
  );
}
