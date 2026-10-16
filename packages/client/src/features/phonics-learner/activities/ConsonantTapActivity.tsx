import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { emitLearningEffect } from '@/features/games/effects/learning-effects';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { useEntryGuide, ENTRY_GUIDE, praiseLang } from '../hooks/useEntryGuide';
import { ActivityShell } from '../components/ActivityShell';
import { LetterTapCharge, LETTER_TAP_COUNT } from '../components/LetterTapCharge';
import { HangulPopitActivity } from './HangulPopitActivity';

interface Props {
  unitId: string;
  consonant: string;
  soundText?: string;
  /** Legacy callers may provide chapter words; words are now introduced in word meeting. */
  words?: ReadonlyArray<{ word: string; imageUrl: string; ttsUrl?: string }>;
  onComplete: () => void;
  onBack: () => void;
}

/** The three pop-it samples share the existing activity route and completion contract. */
export function ConsonantTapActivity(props: Props) {
  if (props.consonant === 'ㄱ' || props.consonant === 'ㅇ') {
    return (
      <HangulPopitActivity
        key={`${props.unitId}-${props.consonant}`}
        unitId={props.unitId}
        letter={props.consonant}
        sound={props.soundText ?? props.consonant}
        prefix="consonant-tap"
        onComplete={props.onComplete}
        onBack={props.onBack}
      />
    );
  }
  return <ConsonantChargeActivity {...props} />;
}

/** Other consonants retain five successful listens. */
function ConsonantChargeActivity({ unitId, consonant, soundText, onComplete, onBack }: Props) {
  const { t } = useTranslation('phonics');
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const [count, setCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const target = useRef<HTMLDivElement>(null);
  const countRef = useRef(0),
    busy = useRef(false),
    marked = useRef(false),
    alive = useRef(true);
  const sequence = useRef(0);
  const sound = soundText ?? consonant;
  useEntryGuide(ENTRY_GUIDE.listenExplore, playAudio);
  usePhonicsTtsWarm(unitId, [sound], 'consonant-tap');
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      sequence.current++;
    };
  }, []);
  const tap = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setPlaying(true);
    setFailed(false);
    const token = ++sequence.current;
    const fail = () => {
      if (!alive.current || token !== sequence.current) return;
      busy.current = false;
      setPlaying(false);
      setFailed(true);
    };
    try {
      const url = await resolveTtsUrl({
        text: sound,
        language: 'korean',
        storybookId: unitId,
        identifierPrefix: 'consonant-tap',
      });
      if (!alive.current || token !== sequence.current) return;
      if (!url) {
        fail();
        return;
      }
      playAudio(
        url,
        () => {
          if (!alive.current || token !== sequence.current || !busy.current) return;
          busy.current = false;
          setPlaying(false);
          if (marked.current) return;
          const next = ++countRef.current;
          setCount(next);
          if (next === LETTER_TAP_COUNT) {
            marked.current = true;
            emitLearningEffect('letter', target.current);
            playCorrectSequence({
              language: praiseLang(),
              onDone: () => {
                if (alive.current) onComplete();
              },
            });
          }
        },
        fail
      );
    } catch {
      fail();
    }
  }, [sound, unitId, playAudio, playCorrectSequence, onComplete]);
  return (
    <ActivityShell unitId={unitId} kind="explore" onBack={onBack} scroll>
      <div ref={target} className="vowel-explore-stage consonant-charge-stage">
        <h2 className="text-3xl sm:text-5xl font-black text-center">
          {t(count === LETTER_TAP_COUNT ? 'vowelListen.singleDone' : 'vowelListen.chargePrompt')}
        </h2>
        <LetterTapCharge
          letter={consonant}
          count={count}
          busy={playing}
          complete={count === LETTER_TAP_COUNT}
          tone="coral"
          onTap={() => void tap()}
          label={t('vowelListen.chargeLabel', { letter: consonant })}
          progressLabel={t('consonantTap.chargeProgress')}
        />
        {failed && (
          <p role="status" className="text-base font-bold text-ink-700">
            {t('vowelListen.audioRetry')}
          </p>
        )}
      </div>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}
