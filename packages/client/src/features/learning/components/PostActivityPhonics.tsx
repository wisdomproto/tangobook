import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PhonicsUnitGate } from '@/features/access/components/PhonicsUnitGate';
import {
  getActivityPlan,
  getRequiredActivities,
} from '@/features/phonics-learner/lib/korean-phonics-units';
import {
  getEnglishActivityPlan,
  getEnglishRequiredActivities,
} from '@/features/phonics-learner/lib/english-phonics-units';
import type { PhonicsTarget } from '../lib/word-learning';
const KoreanActivity = lazy(() =>
  import('@/features/phonics-learner/components/KoreanPhonicsActivityPage').then((module) => ({
    default: module.KoreanPhonicsActivity,
  }))
);
const EnglishActivity = lazy(() =>
  import('@/features/phonics-learner/components/EnglishPhonicsActivityPage').then((module) => ({
    default: module.EnglishPhonicsActivity,
  }))
);

/** The story activity stays mounted underneath: no reader navigation and no lost book context. */
export function PostActivityPhonics({
  word,
  target,
  onClose,
}: {
  word: string;
  target: PhonicsTarget;
  onClose: () => void;
}) {
  const { t } = useTranslation('learning');
  const [playing, setPlaying] = useState(false);
  const modal = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = modal.current;
    const focus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      focus?.focus();
    };
  }, []);
  const plan =
    target.lang === 'ko' ? getActivityPlan(target.id) : getEnglishActivityPlan(target.id);
  const required =
    target.lang === 'ko'
      ? getRequiredActivities(target.id)
      : getEnglishRequiredActivities(target.id);
  const activity =
    plan.activities.find(
      (item) => item.kind === (target.lang === 'ko' ? 'game-korean-block' : 'game-english-block')
    )?.key ?? required[0];
  return (
    <dialog
      ref={modal}
      aria-labelledby="related-phonics-title"
      onCancel={onClose}
      className={
        playing
          ? 'fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto border-0 bg-cream-50 p-0'
          : 'm-auto w-[calc(100%_-_32px)] max-w-md rounded-3xl bg-cream-50 p-6 backdrop:bg-ink-900/40'
      }
    >
      {playing ? (
        <>
          <h2 id="related-phonics-title" className="sr-only">
            {t('overview.phonicsLink')}
          </h2>
          <button
            onClick={onClose}
            className="fixed right-3 top-3 z-[100] min-h-11 rounded-full bg-white px-4 py-3 text-sm font-bold shadow-soft"
          >
            {t('overview.returnActivity')}
          </button>
          <PhonicsUnitGate unitId={target.id}>
            <Suspense
              fallback={<div aria-busy="true" className="h-48 animate-pulse bg-peach-100" />}
            >
              {target.lang === 'ko' ? (
                <KoreanActivity unitId={target.id} activityKey={activity} onExit={onClose} />
              ) : (
                <EnglishActivity unitId={target.id} activityKey={activity} onExit={onClose} />
              )}
            </Suspense>
          </PhonicsUnitGate>
        </>
      ) : (
        <>
          <p className="text-sm font-bold text-mint-700">{t('overview.nextPlay')}</p>
          <h2 id="related-phonics-title" className="mt-2 break-words text-xl font-black">
            {t('overview.targetTitle', { word })}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-600">{t('overview.targetNote')}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              disabled={!activity}
              onClick={() => setPlaying(true)}
              className="min-h-11 rounded-full bg-coral-500 px-5 py-3 font-bold text-white"
            >
              {t('overview.tryPhonics')}
            </button>
            <button
              onClick={onClose}
              className="min-h-11 rounded-full bg-white px-4 py-3 font-bold text-ink-600"
            >
              {t('overview.continueActivity')}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
