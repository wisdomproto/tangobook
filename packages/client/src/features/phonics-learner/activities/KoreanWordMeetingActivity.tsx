import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { decomposeWord } from '@tangobook/shared';
import { ArrowRight, Pointer, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WordMeetingHeader } from '../components/WordMeetingHeader';
import { SceneReveal } from '@/features/games/components/SceneReveal';
import type { WordScene } from '@/features/games/lib/resolve-scene';
import { preloadWordScenes } from '@/features/games/lib/phonics-word-scene';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { getKoreanSyllableUrl } from '@/features/games/hooks/usePhonicsMap';
import { resolveTtsUrl } from '@/features/tts';
import { ActivityShell } from '../components/ActivityShell';
import { ToyHangul } from '../components/ToyHangul';
import { wordMeetingScene } from '../lib/word-meeting-scene';
import type { WordMeetingProps } from './WordMeetingActivity';
import './korean-word-meeting.css';

type Phase = 'ready' | 'join' | 'sound' | 'gather' | 'word' | 'done';

/** One row, one assembly per position. Only the first syllable is demonstrated automatically. */
export function KoreanWordMeetingActivity({
  word,
  imageUrl,
  ttsUrl,
  book,
  unitId,
  onBack,
  onComplete,
  onRestart,
}: WordMeetingProps) {
  const { t } = useTranslation('phonics');
  const syllables = useMemo(
    () =>
      decomposeWord(word).map((s, i) => ({
        result: [...word][i],
        parts: [s.cho, s.jung, ...(s.jong ? [s.jong] : [])],
      })),
    [word]
  );
  const { playAudio, scheduleTimer, stopAll } = useGameAudio();
  const [index, setIndex] = useState(0);
  const [formed, setFormed] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [scene, setScene] = useState<WordScene | null>(null);
  const alive = useRef(false);
  const locked = useRef(false);
  const sounds = useRef(new Map<string, string>());
  const whole = useRef<Promise<string | undefined>>();
  const resolveWhole = useCallback(
    () =>
      resolveTtsUrl({
        text: word,
        language: 'korean',
        storybookId: book.id,
        directUrl: ttsUrl,
        identifierPrefix: 'word-meet',
      }).catch(() => undefined),
    [word, book.id, ttsUrl]
  );
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const unlockError = useCallback(() => {
    if (!alive.current) return;
    setFailed(true);
    locked.current = false;
  }, []);

  const readWhole = useCallback(async () => {
    locked.current = true;
    setFailed(false);
    setPhase('word');
    const url = (await whole.current) ?? (await resolveWhole());
    if (!alive.current) return;
    if (!url) {
      unlockError();
      return;
    }
    playAudio(
      url,
      () => {
        if (!alive.current) return;
        setPhase('done');
        locked.current = false;
      },
      unlockError
    );
  }, [playAudio, unlockError, resolveWhole]);

  const blend = useCallback(
    async (position: number, replay = false) => {
      if (locked.current || !alive.current) return;
      locked.current = true;
      setFailed(false);
      const syllable = syllables[position];
      // No consonant-name concatenation: pronounce only the real completed syllable.
      let url: string | undefined;
      try {
        url =
          syllables.length === 1
            ? ((await whole.current) ?? (await resolveWhole()))
            : (sounds.current.get(syllable.result) ??
              (await getKoreanSyllableUrl(syllable.result)));
      } catch {
        /* Same position remains retryable. */
      }
      if (!alive.current) return;
      if (!url) {
        unlockError();
        return;
      }
      const speak = () => {
        if (!alive.current) return;
        setFormed(position + 1);
        setPhase('sound');
        playAudio(
          url,
          () => {
            if (!alive.current) return;
            if (position < syllables.length - 1) {
              setIndex(position + 1);
              setPhase('ready');
              locked.current = false;
            } else if (syllables.length === 1) {
              setPhase('done');
              locked.current = false;
            } else {
              setPhase('gather');
              scheduleTimer(
                () => {
                  if (alive.current) void readWhole();
                },
                reduced() ? 30 : 700
              );
            }
          },
          unlockError
        );
      };
      if (replay) speak();
      else {
        setPhase('join');
        scheduleTimer(speak, reduced() ? 30 : 950);
      }
    },
    [syllables, playAudio, scheduleTimer, readWhole, unlockError, resolveWhole]
  );

  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    whole.current = resolveWhole();
    void preloadWordScenes([word]);
    // The first syllable is enough to begin. Later sounds prepare in the background.
    for (const syllable of syllables) {
      void getKoreanSyllableUrl(syllable.result)
        .then((url) => {
          if (!cancelled && url) sounds.current.set(syllable.result, url);
        })
        .catch(() => {});
    }
    setReady(true);
    scheduleTimer(() => {
      if (!cancelled) void blend(0);
    }, 180);
    return () => {
      cancelled = true;
      alive.current = false;
      stopAll();
    };
  }, [word, syllables, blend, scheduleTimer, stopAll, resolveWhole]);

  const finish = () => {
    if (phase !== 'done' || locked.current) return;
    const found = wordMeetingScene(book, word, 'korean');
    if (found) setScene(found);
    else onComplete();
  };
  const assembled = phase === 'gather' || phase === 'word' || phase === 'done';
  return (
    <ActivityShell
      unitId={unitId}
      kind="blend"
      onBack={onBack}
      header={<WordMeetingHeader onBack={onBack} onRestart={onRestart} />}
    >
      <main
        className="ko-word-meeting"
        data-phase={phase}
        style={{ '--syllables': syllables.length } as CSSProperties}
      >
        <div className="ko-word-picture">
          {imageUrl && <img src={imageUrl} alt={word} draggable={false} />}
        </div>
        <div
          className="ko-word-row"
          role="group"
          aria-label={t('wordJourney.meet')}
          data-assembled={assembled}
        >
          {syllables.map((syllable, i) => {
            const made = i < formed;
            const active = !assembled && i === index;
            const enabled = active && ready && (phase === 'ready' || failed);
            return (
              <button
                key={i}
                type="button"
                className="ko-word-cell"
                disabled={!enabled}
                data-active={active}
                data-made={made}
                data-joining={active && phase === 'join'}
                aria-label={
                  made
                    ? `${syllable.result} ${t('wordJourney.listenWord')}`
                    : `${syllable.parts.join(' + ')} ${t('wordJourney.makeTogether')}`
                }
                aria-current={active ? 'step' : undefined}
                onClick={() => void blend(i, made)}
              >
                <span className="ko-word-parts" aria-hidden="true">
                  {syllable.parts.map((part, j) => (
                    <span
                      key={j}
                      className="ko-word-part"
                      style={
                        {
                          '--travel': `${(j - (syllable.parts.length - 1) / 2) * -110}%`,
                        } as CSSProperties
                      }
                    >
                      <ToyHangul text={part} decorative />
                    </span>
                  ))}
                </span>
                <span className="ko-word-result font-display" aria-hidden="true">
                  {syllable.result}
                </span>
                <span className="ko-word-glow" aria-hidden="true" />
                {enabled && (
                  <span className="ko-word-finger" aria-hidden="true">
                    <Pointer size={42} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="ko-word-actions">
          {assembled && (
            <>
              <button
                type="button"
                className="ko-word-listen"
                aria-label={t('wordJourney.listenWord')}
                disabled={phase !== 'done' && !failed}
                onClick={() => void readWhole()}
              >
                <Volume2 size={26} />
              </button>
              <button
                type="button"
                className="word-meet-button"
                disabled={phase !== 'done'}
                onClick={finish}
              >
                {t('wordJourney.storyThenBuild')} <ArrowRight size={25} />
              </button>
            </>
          )}
          {failed && (
            <p className="word-meet-error" role="alert">
              {t('wordJourney.audioRetry')}
            </p>
          )}
        </div>
      </main>
      {scene && (
        <SceneReveal
          illustrationUrl={scene.illustrationUrl}
          text={scene.pageText}
          ttsUrl={scene.pageTtsUrl}
          highlight={word}
          onDone={onComplete}
        />
      )}
    </ActivityShell>
  );
}
