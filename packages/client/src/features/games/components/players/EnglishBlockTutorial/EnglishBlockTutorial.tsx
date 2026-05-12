import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mascot } from '@/design-system';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { useTutorialControls } from './EnglishBlockTutorial.context';
import { planEnglishTutorialLayout, type EnglishTutorialStep } from './EnglishBlockTutorial.layout';
import { TUTORIAL_LINES, TUTORIAL_TIMING } from './EnglishBlockTutorial.constants';

interface EnglishBlockTutorialProps {
  word: string;
  active: boolean;
  onEnd: () => void;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'intro' }
  | { kind: 'demo'; charIdx: number }
  | { kind: 'wait'; charIdx: number }
  | { kind: 'syllable-done' }
  | { kind: 'end' }
  | { kind: 'fade-out' };

export function EnglishBlockTutorial({ word, active, onEnd }: EnglishBlockTutorialProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const { highlight, setHighlight, setIsPlaying, setExpected, onCorrectRef } =
    useTutorialControls();
  const { playAudio } = useGameAudio();
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepsRef = useRef<EnglishTutorialStep[]>([]);
  const startedRef = useRef(false);

  useEffect(() => {
    if (active && !startedRef.current) {
      startedRef.current = true;
      stepsRef.current = planEnglishTutorialLayout(word);
      setIsPlaying(true);
      setPhase({ kind: 'intro' });
    } else if (!active && startedRef.current) {
      startedRef.current = false;
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      onCorrectRef.current = null;
      setHighlight({
        popLetter: null,
        glowSlot: null,
        arrowFromLetter: null,
        arrowToSlot: null,
      });
      setExpected(null);
      setIsPlaying(false);
      setPhase({ kind: 'idle' });
    }
  }, [active, word, setHighlight, setExpected, setIsPlaying, onCorrectRef]);

  useEffect(() => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    if (phase.kind === 'idle') return;

    const steps = stepsRef.current;
    const advance = (next: Phase, delayMs: number) => {
      phaseTimerRef.current = setTimeout(() => setPhase(next), delayMs);
    };

    if (phase.kind === 'intro') {
      playAudio(TUTORIAL_LINES.intro.audio);
      setHighlight({
        popLetter: null,
        glowSlot: null,
        arrowFromLetter: null,
        arrowToSlot: null,
      });
      setExpected(null);
      setIsPlaying(true);
      if (steps.length === 0) advance({ kind: 'end' }, TUTORIAL_TIMING.intro);
      else advance({ kind: 'demo', charIdx: 0 }, TUTORIAL_TIMING.intro);
      return;
    }

    if (phase.kind === 'demo') {
      const step = steps[phase.charIdx];
      if (!step) {
        setPhase({ kind: 'end' });
        return;
      }
      playAudio(TUTORIAL_LINES.pop.audio);
      setIsPlaying(true);
      setExpected(null);
      setHighlight({
        popLetter: step.letter,
        glowSlot: step.slot,
        arrowFromLetter: step.letter,
        arrowToSlot: step.slot,
      });
      const demoDuration = TUTORIAL_TIMING.pop + TUTORIAL_TIMING.arrow + TUTORIAL_TIMING.place;
      advance({ kind: 'wait', charIdx: phase.charIdx }, demoDuration);
      return;
    }

    if (phase.kind === 'wait') {
      const step = steps[phase.charIdx];
      if (!step) {
        setPhase({ kind: 'end' });
        return;
      }
      playAudio(TUTORIAL_LINES.place.audio);
      setHighlight({
        popLetter: step.letter,
        glowSlot: step.slot,
        arrowFromLetter: step.letter,
        arrowToSlot: step.slot,
      });
      setExpected({ letter: step.letter, slot: step.slot });
      setIsPlaying(false);
      onCorrectRef.current = () => {
        const isLast = phase.charIdx === steps.length - 1;
        setExpected(null);
        setHighlight({
          popLetter: null,
          glowSlot: null,
          arrowFromLetter: null,
          arrowToSlot: null,
        });
        setPhase(isLast ? { kind: 'syllable-done' } : { kind: 'demo', charIdx: phase.charIdx + 1 });
      };
      return;
    }

    if (phase.kind === 'syllable-done') {
      playAudio(TUTORIAL_LINES.syllableDone.audio);
      setHighlight({
        popLetter: null,
        glowSlot: null,
        arrowFromLetter: null,
        arrowToSlot: null,
      });
      setExpected(null);
      setIsPlaying(true);
      advance({ kind: 'end' }, TUTORIAL_TIMING.syllableDone);
      return;
    }

    if (phase.kind === 'end') {
      playAudio(TUTORIAL_LINES.end.audio);
      setIsPlaying(true);
      advance({ kind: 'fade-out' }, TUTORIAL_TIMING.end);
      return;
    }

    if (phase.kind === 'fade-out') {
      const fadeTimer = setTimeout(() => {
        setIsPlaying(false);
        setPhase({ kind: 'idle' });
        onEnd();
      }, TUTORIAL_TIMING.fadeOut);
      phaseTimerRef.current = fadeTimer;
      return;
    }
  }, [phase, playAudio, setHighlight, setExpected, setIsPlaying, onCorrectRef, onEnd]);

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      onCorrectRef.current = null;
    };
  }, [onCorrectRef]);

  const bubbleText = (() => {
    if (phase.kind === 'intro') return TUTORIAL_LINES.intro.text;
    if (phase.kind === 'demo') return TUTORIAL_LINES.pop.text;
    if (phase.kind === 'wait') return TUTORIAL_LINES.place.text;
    if (phase.kind === 'syllable-done') return TUTORIAL_LINES.syllableDone.text;
    if (phase.kind === 'end') return TUTORIAL_LINES.end.text;
    return null;
  })();

  const visible = phase.kind !== 'idle';
  const mascotState = phase.kind === 'intro' ? 'waving' : 'pointing';

  return (
    <>
      <TutorialArrow fromLetter={highlight.arrowFromLetter} toSlot={highlight.arrowToSlot} />
      <AnimatePresence>
        {visible && (
          <motion.div
            key="hori-tutorial"
            className="fixed bottom-4 right-4 z-[90] flex items-end gap-2 pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: phase.kind === 'fade-out' ? 0 : 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {bubbleText && (
              <motion.div
                key="bubble"
                className="relative bg-white/95 rounded-3xl shadow-pop px-5 py-3 max-w-[220px]"
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xl font-display font-black text-ink-900 whitespace-nowrap">
                  {bubbleText}
                </p>
                <div className="absolute right-[-8px] bottom-6 w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-white/95" />
              </motion.div>
            )}
            <Mascot character="hori" state={mascotState} size="md" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TutorialArrow({
  fromLetter,
  toSlot,
}: {
  fromLetter: string | null;
  toSlot: number | null;
}) {
  const [coords, setCoords] = useState<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  } | null>(null);

  useEffect(() => {
    if (!fromLetter || toSlot === null) {
      setCoords(null);
      return;
    }
    const tile = document.querySelector(`[data-letter-tile="${fromLetter}"]`);
    const cell = document.querySelector(`[data-slot="${toSlot}"]`);
    if (!tile || !cell) {
      setCoords(null);
      return;
    }
    const tileRect = tile.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    setCoords({
      fromX: tileRect.left + tileRect.width / 2,
      fromY: tileRect.top + tileRect.height / 2,
      toX: cellRect.left + cellRect.width / 2,
      toY: cellRect.top + cellRect.height / 2,
    });
  }, [fromLetter, toSlot]);

  if (!coords) return null;
  const midX = (coords.fromX + coords.toX) / 2;
  const midY = Math.min(coords.fromY, coords.toY) - 40;
  const pathD = `M ${coords.fromX} ${coords.fromY} Q ${midX} ${midY} ${coords.toX} ${coords.toY}`;

  return (
    <svg
      className="fixed inset-0 z-[85] pointer-events-none"
      width="100%"
      height="100%"
      viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
      preserveAspectRatio="none"
    >
      <defs>
        <marker
          id="english-tutorial-arrowhead"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF7A3C" />
        </marker>
      </defs>
      <motion.path
        d={pathD}
        stroke="#FF7A3C"
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
        markerEnd="url(#english-tutorial-arrowhead)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </svg>
  );
}
