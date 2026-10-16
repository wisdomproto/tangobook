import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { playUi } from '@/lib/uiSound';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { useEntryGuide, ENTRY_GUIDE, praiseLang } from '../hooks/useEntryGuide';
import { ActivityShell } from '../components/ActivityShell';
import { HangulPopit, POPIT_LETTERS, type PopitLetter } from '../components/HangulPopit';

interface Props {
  unitId: string;
  ttsUnitId?: string;
  letter: PopitLetter;
  sound?: string;
  prefix: string;
  syllable?: string;
  language?: 'korean' | 'english';
  ttsUrl?: string;
  guide?: boolean;
  caption?: string;
  onComplete: () => void;
  onBack: () => void;
  onNext?: () => void;
}
export function HangulPopitActivity(props: Props) {
  return (
    <ActivityShell unitId={props.unitId} kind="explore" onBack={props.onBack}>
      <LetterPopitExperience {...props} />
    </ActivityShell>
  );
}

/** Same live interaction inside the Korean shell, English letter lesson and DEV review. */
export function LetterPopitExperience({
  unitId,
  ttsUnitId = unitId,
  letter,
  sound = letter,
  prefix,
  syllable,
  language = 'korean',
  ttsUrl,
  guide = true,
  caption,
  onComplete,
  onNext,
}: Props) {
  const { t } = useTranslation('phonics');
  const { playAudio, playCorrectSequence } = useGameAudio();
  useEntryGuide(ENTRY_GUIDE.listenExplore, playAudio, { skip: !guide });
  usePhonicsTtsWarm(ttsUnitId, [sound], prefix, language);
  const [popped, setPopped] = useState<ReadonlySet<number>>(new Set());
  const pressed = useRef(new Set<number>());
  const [complete, setComplete] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reading, setReading] = useState(false);
  const alive = useRef(true);
  const finishing = useRef(false);
  const marked = useRef(false);
  const firstSound = useRef<Promise<boolean> | null>(null);
  const total = POPIT_LETTERS[letter].points.length;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  async function pronounce(): Promise<boolean> {
    try {
      const url =
        ttsUrl ||
        (await resolveTtsUrl({
          text: sound,
          language,
          storybookId: ttsUnitId,
          identifierPrefix: prefix,
        }));
      if (!alive.current || !url) return false;
      return await new Promise<boolean>((resolve) =>
        playAudio(
          url,
          () => resolve(true),
          () => resolve(false)
        )
      );
    } catch {
      return false;
    }
  }

  async function finish() {
    if (finishing.current) return;
    finishing.current = true;
    setFailed(false);
    setReading(true);
    // A quick child can finish popping during the first pronunciation. Never cut it off.
    await firstSound.current;
    if (!alive.current) return;
    const heard = await pronounce();
    if (!alive.current) return;
    setReading(false);
    if (!heard) {
      finishing.current = false;
      setFailed(true);
      return;
    }
    setComplete(true);
    playCorrectSequence({
      language: praiseLang(),
      onDone: () => {
        if (alive.current && !marked.current) {
          marked.current = true;
          setReady(true);
          onComplete();
        }
      },
    });
  }

  function pop(index: number) {
    if (pressed.current.has(index) || finishing.current) return;
    pressed.current.add(index);
    setPopped(new Set(pressed.current));
    playUi('popit');
    if (pressed.current.size === 1) firstSound.current = pronounce();
    if (pressed.current.size === total) void finish();
  }

  return (
    <section className="popit-stage" aria-label={t('popit.activity', { letter })}>
      <h2 className="popit-prompt">
        {caption && <small>{caption}</small>}
        {t(complete ? 'popit.done' : 'popit.prompt')}
      </h2>
      <div className="popit-play-space">
        <HangulPopit
          letter={letter}
          popped={popped}
          onPop={pop}
          complete={complete}
          locked={reading || complete}
        />
      </div>
      <div className="popit-footer">
        <div
          className="popit-progress"
          role="progressbar"
          aria-label={t('popit.progress')}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={popped.size}
        >
          {Array.from({ length: total }, (_, i) => (
            <span key={i} data-filled={i < popped.size || undefined}>
              {i < popped.size ? '✓' : ''}
            </span>
          ))}
        </div>
        {failed && (
          <button className="popit-audio-retry" onClick={() => void finish()}>
            {t('vowelListen.audioRetry')}
          </button>
        )}
        {complete && syllable && (
          <p className="popit-carrier">
            ㅇ + {letter} → {syllable}
            <small>{t('vowelListen.silentInitial')}</small>
          </p>
        )}
        {ready && onNext && (
          <button className="popit-audio-retry" onClick={onNext}>
            {t('vowelListen.writeNext')}
          </button>
        )}
      </div>
      <span className="sr-only" role="status">
        {complete ? t('popit.done') : failed ? t('vowelListen.audioRetry') : ''}
      </span>
    </section>
  );
}
