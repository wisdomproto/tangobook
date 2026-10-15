import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, Check } from 'lucide-react';
import { ActivityShell } from '../components/ActivityShell';
import { ToyHangul } from '../components/ToyHangul';
import { useActivitySound } from '../hooks/useActivitySound';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { consonantFindingBoard } from '../lib/consonant-finding';
import { emitLearningEffect } from '@/features/games/effects/learning-effects';
import { playUi } from '@/lib/uiSound';
import './consonant-finding.css';

export function ConsonantFindingActivity({
  unitId,
  consonant,
  onBack,
  onComplete,
}: {
  unitId: string;
  consonant: string;
  onBack: () => void;
  onComplete: () => void;
}) {
  const { t } = useTranslation('phonics');
  const [board] = useState(() => consonantFindingBoard(unitId, consonant));
  const [found, setFound] = useState<number[]>([]);
  const foundRef = useRef(new Set<number>());
  const [retry, setRetry] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const alive = useRef(true);
  const { say, sayThenChime, scheduleTimer } = useActivitySound({
    unitId,
    prefix: 'consonant-finding',
  });
  usePhonicsTtsWarm(unitId, [consonant], 'consonant-finding');
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const total = board.filter((letter) => letter === consonant).length;
  const tap = (i: number, anchor: HTMLButtonElement) => {
    if (done || foundRef.current.has(i)) return;
    if (board[i] !== consonant) {
      setRetry(i);
      playUi('tap');
      scheduleTimer(() => {
        if (alive.current) setRetry(null);
      }, 480);
      return;
    }
    foundRef.current.add(i);
    setFound([...foundRef.current]);
    playUi('tap');
    emitLearningEffect('tap', anchor);
    if (foundRef.current.size === total) {
      setDone(true);
      // Let the final collected piece land, then acknowledge completion using the shared audio chain.
      scheduleTimer(() => {
        if (!alive.current) return;
        void sayThenChime(consonant, {
          praise: true,
          onDone: () => {
            if (alive.current) onComplete();
          },
        });
      }, 650);
    }
  };
  return (
    <ActivityShell
      unitId={unitId}
      kind="hunt"
      onBack={onBack}
      headerRight={
        <span
          className="consonant-find-count"
          aria-label={t('consonantFind.count', { found: found.length, total })}
        >
          {found.length} / {total}
        </span>
      }
    >
      <main className="consonant-find" data-intro={board.length === total || undefined}>
        <section className="consonant-find-goal">
          <h1>{t(done ? 'consonantFind.done' : 'consonantFind.prompt')}</h1>
          <button
            type="button"
            className="consonant-find-target"
            aria-label={t('hunt.letterSound', { letter: consonant })}
            onClick={() => say(consonant)}
          >
            <ToyHangul text={consonant} decorative />
            <Volume2 size={25} />
          </button>
          <div className="consonant-find-pocket" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} data-collected={i < found.length}>
                {i < found.length ? <Check size={21} /> : <i />}
              </span>
            ))}
          </div>
        </section>
        <div className="consonant-find-garden" role="group" aria-label={t('consonantFind.title')}>
          {board.map((letter, i) => (
            <div key={i} className="consonant-find-place">
              <button
                type="button"
                className="consonant-find-piece"
                style={
                  { '--tilt': `${((i % 3) - 1) * 5}deg`, '--delay': `${i * 70}ms` } as CSSProperties
                }
                aria-label={t('consonantFind.piece', { letter, number: i + 1 })}
                disabled={found.includes(i) || done}
                data-found={found.includes(i) || undefined}
                data-retry={retry === i || undefined}
                onClick={(event) => tap(i, event.currentTarget)}
              >
                <ToyHangul text={letter} decorative />
                <span className="consonant-find-shine" aria-hidden="true" />
              </button>
              {found.includes(i) && (
                <Check className="consonant-find-sprout" size={28} aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </main>
    </ActivityShell>
  );
}
