import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mascot } from '@/design-system';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { useTutorialControls } from './StoryImageTutorial.context';
import { TUTORIAL_LINES, TUTORIAL_TIMING } from './StoryImageTutorial.constants';

interface StoryImageTutorialProps {
  correctUrl: string | null;
  active: boolean;
  onEnd: () => void;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'intro' }
  | { kind: 'wait' }
  | { kind: 'end' }
  | { kind: 'fade-out' };

export function StoryImageTutorial({ correctUrl, active, onEnd }: StoryImageTutorialProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const { setHighlight, setIsPlaying, setExpected, onCorrectRef } = useTutorialControls();
  const { playAudio } = useGameAudio();
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetRef = useRef<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (active && !startedRef.current && correctUrl) {
      startedRef.current = true;
      targetRef.current = correctUrl;
      setIsPlaying(true);
      setPhase({ kind: 'intro' });
    } else if (!active && startedRef.current) {
      startedRef.current = false;
      targetRef.current = null;
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      onCorrectRef.current = null;
      setHighlight({ pulseUrl: null });
      setExpected(null);
      setIsPlaying(false);
      setPhase({ kind: 'idle' });
    }
  }, [active, correctUrl, setHighlight, setExpected, setIsPlaying, onCorrectRef]);

  useEffect(() => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    if (phase.kind === 'idle') return;
    const advance = (next: Phase, delayMs: number) => {
      phaseTimerRef.current = setTimeout(() => setPhase(next), delayMs);
    };
    const target = targetRef.current;

    if (phase.kind === 'intro') {
      playAudio(TUTORIAL_LINES.intro.audio);
      setHighlight({ pulseUrl: null });
      setExpected(null);
      setIsPlaying(true);
      if (!target) advance({ kind: 'end' }, TUTORIAL_TIMING.intro);
      else advance({ kind: 'wait' }, TUTORIAL_TIMING.intro);
      return;
    }

    if (phase.kind === 'wait') {
      if (!target) {
        setPhase({ kind: 'end' });
        return;
      }
      playAudio(TUTORIAL_LINES.pop.audio);
      setHighlight({ pulseUrl: target });
      setExpected({ url: target });
      setIsPlaying(false);
      onCorrectRef.current = () => {
        setHighlight({ pulseUrl: null });
        setExpected(null);
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
  }, [phase, playAudio, setHighlight, setExpected, setIsPlaying, onCorrectRef, onEnd]);

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
  );
}
