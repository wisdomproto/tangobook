import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  journeyActivityUrl,
  journeyHomeUrl,
  journeyProgress,
  markJourneyStarted,
  type JourneyLanguage,
} from '../lib/learning-journey';
import { usePhonicsProgress } from '../lib/progress-store';
import { JourneyActivityContext } from './journey-activity-context';
import { PhonicsActivityFinish } from './PhonicsActivityFinish';

/** Completion and navigation are separate so final audio/effects can finish before the child continues. */
export function GuidedPhonicsActivity({
  lang,
  unitId,
  activityKey,
  children,
}: {
  lang: JourneyLanguage;
  unitId: string;
  activityKey: string;
  children: (callbacks: {
    onExit: () => void;
    onNext: () => void;
    onMarked: () => void;
  }) => ReactNode;
}) {
  const { activeProfile } = useAuth();
  return (
    <GuidedRun
      key={`${activeProfile?.id ?? 'guest'}:${unitId}:${activityKey}`}
      lang={lang}
      unitId={unitId}
      activityKey={activityKey}
    >
      {children}
    </GuidedRun>
  );
}

function GuidedRun({
  lang,
  unitId,
  activityKey,
  children,
}: Parameters<typeof GuidedPhonicsActivity>[0]) {
  const navigate = useNavigate();
  const { unitCompletedActivities } = usePhonicsProgress(lang);
  const progress = journeyProgress(lang, unitCompletedActivities);
  const index = progress.steps.findIndex(
    (s) => s.unit.id === unitId && s.activity.key === activityKey
  );
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const activityRoot = useRef<HTMLDivElement>(null);
  const [replaying] = useState(() => progress.done[index] === true);
  const stepDone = progress.done[index] === true;
  useEffect(() => {
    if (index >= 0 && (stepDone || index === progress.currentIndex)) markJourneyStarted(lang);
  }, [lang, index, progress.currentIndex, stepDone]);
  const onExit = useCallback(() => navigate(journeyHomeUrl(lang)), [navigate, lang]);
  const onNext = useCallback(() => {
    // Re-read after markActivityCompleted; render-time progress may still describe the previous step.
    const latest = journeyProgress(lang);
    const next = replaying ? latest.steps[index + 1] : latest.current;
    if (next?.unit.id === unitId && next.activity.key === activityKey) return;
    navigate(
      next && next.unit.id === unitId
        ? journeyActivityUrl(lang, next.unit.id, next.activity.key)
        : `${journeyHomeUrl(lang)}&finished=${encodeURIComponent(unitId)}${replaying ? '&replay=1' : ''}`
    );
  }, [navigate, lang, unitId, activityKey, replaying, index]);
  const onMarked = useCallback(() => {
    // Ignore duplicate completion callbacks and never open a result from a navigation-only click.
    const latest = journeyProgress(lang);
    if (!latest.done[index]) return;
    readyRef.current = true;
    setReady(true);
  }, [lang, index]);
  const childExit = useCallback(() => {
    // Some activities historically mark then automatically go Back. The common result owns that exit.
    if (!readyRef.current) onExit();
  }, [onExit]);
  useEffect(() => {
    if (activityRoot.current) activityRoot.current.inert = ready;
  }, [ready]);
  if (index < 0 || (!progress.done[index] && index !== progress.currentIndex)) {
    return (
      <Navigate
        replace
        to={
          progress.current
            ? journeyActivityUrl(lang, progress.current.unit.id, progress.current.activity.key)
            : journeyHomeUrl(lang)
        }
      />
    );
  }
  const unitSteps = progress.steps.filter((s) => s.unit.id === unitId);
  const step = unitSteps.findIndex((s) => s.activity.key === activityKey) + 1;
  const next = replaying ? progress.steps[index + 1] : progress.current;
  const chapterDone = !next || next.unit.id !== unitId;
  return (
    <JourneyActivityContext.Provider value={{ ready, onNext, step, total: unitSteps.length }}>
      <div ref={activityRoot} aria-hidden={ready || undefined}>
        {children({ onExit: childExit, onNext: onMarked, onMarked })}
      </div>
      {ready && (
        <PhonicsActivityFinish
          lang={lang}
          next={next}
          chapterDone={chapterDone}
          onNext={onNext}
          onExit={chapterDone ? onNext : onExit}
        />
      )}
    </JourneyActivityContext.Provider>
  );
}
