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
import {
  GuidedActivityTransition,
  GUIDED_COMPLETION_MS,
  type GuidedCompletion,
} from './GuidedActivityTransition';

/** Final audio/effects end before a brief completion notice and automatic continuation. */
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
  const [completion, setCompletion] = useState<GuidedCompletion | null>(null);
  const readyRef = useRef(false);
  const activityRoot = useRef<HTMLDivElement>(null);
  const [replaying] = useState(() => progress.done[index] === true);
  const stepDone = progress.done[index] === true;
  const stepUnlocked = progress.unlocked[index] === true;
  const stepLevel = progress.steps[index]?.unit.levelKey;
  useEffect(() => {
    if (stepUnlocked) markJourneyStarted(lang, stepDone ? undefined : stepLevel);
  }, [lang, stepUnlocked, stepLevel, stepDone]);
  const chapterUrl = `${journeyHomeUrl(lang)}&chapter=${encodeURIComponent(unitId)}${replaying ? `&activity=${encodeURIComponent(activityKey)}` : ''}`;
  const onExit = useCallback(() => navigate(chapterUrl), [navigate, chapterUrl]);
  const onNext = useCallback(() => {
    // Re-read after markActivityCompleted; render-time progress may still describe the previous step.
    const latest = journeyProgress(lang);
    if (replaying) {
      navigate(chapterUrl);
      return;
    }
    const next = latest.current;
    if (next?.unit.id === unitId && next.activity.key === activityKey) return;
    navigate(
      next && next.unit.id === unitId
        ? journeyActivityUrl(lang, next.unit.id, next.activity.key)
        : `${journeyHomeUrl(lang)}&finished=${encodeURIComponent(unitId)}`
    );
  }, [navigate, lang, unitId, activityKey, replaying, chapterUrl]);
  const onMarked = useCallback(() => {
    // Only recorded completion advances; duplicate callbacks must not navigate twice.
    if (readyRef.current) return;
    const latest = journeyProgress(lang);
    if (!latest.done[index]) return;
    readyRef.current = true;
    const next = latest.current;
    setCompletion(
      replaying
        ? { kind: 'review' }
        : next?.unit.id === unitId
          ? { kind: 'activity', nextActivity: next.activity }
          : { kind: 'chapter' }
    );
    setReady(true);
  }, [lang, index, replaying, unitId]);
  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(onNext, GUIDED_COMPLETION_MS);
    return () => window.clearTimeout(timer);
  }, [ready, onNext]);
  const childExit = useCallback(() => {
    // Some activities call Back immediately after marking; do not override the automatic next route.
    if (!readyRef.current) onExit();
  }, [onExit]);
  useEffect(() => {
    if (activityRoot.current) activityRoot.current.inert = ready;
  }, [ready]);
  if (index < 0 || !progress.unlocked[index]) {
    const book = progress.steps[index]?.unit.levelKey;
    const bookNext = progress.steps.find(
      (s, i) => s.unit.levelKey === book && !progress.done[i] && progress.unlocked[i]
    );
    const redirect = bookNext ?? progress.current;
    return (
      <Navigate
        replace
        to={
          redirect
            ? journeyActivityUrl(lang, redirect.unit.id, redirect.activity.key)
            : journeyHomeUrl(lang)
        }
      />
    );
  }
  const unitSteps = progress.steps.filter((s) => s.unit.id === unitId);
  const step = unitSteps.findIndex((s) => s.activity.key === activityKey) + 1;
  const tutorial =
    !replaying && unitId === progress.steps[0]?.unit.id
      ? activityKey.includes('write')
        ? 'write'
        : activityKey === 'word-listen-choose'
          ? 'choose'
          : 'press'
      : undefined;
  return (
    <JourneyActivityContext.Provider
      value={{ ready, onNext: onMarked, step, total: unitSteps.length, tutorial }}
    >
      <div className="guided-activity-content" ref={activityRoot} aria-hidden={ready || undefined}>
        {children({ onExit: childExit, onNext: onMarked, onMarked })}
      </div>
      {completion && <GuidedActivityTransition lang={lang} {...completion} />}
    </JourneyActivityContext.Provider>
  );
}
