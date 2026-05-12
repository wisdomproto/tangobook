import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mascot } from '@/design-system';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { useTutorialControls } from './WordWritingTutorial.context';
import { TUTORIAL_LINES, TUTORIAL_TIMING } from './WordWritingTutorial.constants';

interface WordWritingTutorialProps {
  active: boolean;
  onEnd: () => void;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'intro' }
  | { kind: 'wait' }
  | { kind: 'end' }
  | { kind: 'fade-out' };

export function WordWritingTutorial({ active, onEnd }: WordWritingTutorialProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const { setPulseCanvas, setIsPlaying, setWaitingForDraw, onCorrectRef } = useTutorialControls();
  const { playAudio } = useGameAudio();
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (active && !startedRef.current) {
      startedRef.current = true;
      setIsPlaying(true);
      setPhase({ kind: 'intro' });
    } else if (!active && startedRef.current) {
      startedRef.current = false;
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      onCorrectRef.current = null;
      setPulseCanvas(false);
      setWaitingForDraw(false);
      setIsPlaying(false);
      setPhase({ kind: 'idle' });
    }
  }, [active, setPulseCanvas, setWaitingForDraw, setIsPlaying, onCorrectRef]);

  useEffect(() => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    if (phase.kind === 'idle') return;
    const advance = (next: Phase, delayMs: number) => {
      phaseTimerRef.current = setTimeout(() => setPhase(next), delayMs);
    };

    if (phase.kind === 'intro') {
      playAudio(TUTORIAL_LINES.intro.audio);
      setPulseCanvas(false);
      setWaitingForDraw(false);
      setIsPlaying(true);
      advance({ kind: 'wait' }, TUTORIAL_TIMING.intro);
      return;
    }

    if (phase.kind === 'wait') {
      playAudio(TUTORIAL_LINES.pop.audio);
      setPulseCanvas(true);
      setWaitingForDraw(true);
      setIsPlaying(false);
      onCorrectRef.current = () => {
        setPulseCanvas(false);
        setWaitingForDraw(false);
        setPhase({ kind: 'end' });
      };
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
  }, [phase, playAudio, setPulseCanvas, setWaitingForDraw, setIsPlaying, onCorrectRef, onEnd]);

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      onCorrectRef.current = null;
    };
  }, [onCorrectRef]);

  const bubbleText = (() => {
    if (phase.kind === 'intro') return TUTORIAL_LINES.intro.text;
    if (phase.kind === 'wait') return TUTORIAL_LINES.pop.text;
    if (phase.kind === 'end') return TUTORIAL_LINES.end.text;
    return null;
  })();

  const visible = phase.kind !== 'idle';
  const mascotState = phase.kind === 'intro' ? 'waving' : 'pointing';

  return (
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
              className="relative bg-white/95 rounded-3xl shadow-pop px-5 py-3 max-w-[260px]"
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
  );
}
