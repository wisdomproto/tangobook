import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mascot } from '@/design-system';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { useTutorialControls } from './KoreanBlockTutorial.context';
import { planTutorialLayout, type TutorialSyllable } from './KoreanBlockTutorial.layout';
import { TUTORIAL_LINES, TUTORIAL_TIMING } from './KoreanBlockTutorial.constants';

interface KoreanBlockTutorialProps {
  /** 시연할 단어 (currentItem.word) */
  word: string;
  /** 활성화 여부 — false→true 전이 시 intro 시작 */
  active: boolean;
  /** 시퀀스 끝 콜백 (사용자가 모든 글자 맞춰서 완성 후, 또는 강제 종료) */
  onEnd: () => void;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'intro' }
  /** 시연 — pop + arrow + glow 자동 연출 (1.5s). 사용자 액션 X. */
  | { kind: 'demo'; charIdx: number }
  /** 대기 — 사용자가 expected jamo → expected cell 드래그해야 advance. timer 없음. */
  | { kind: 'wait'; charIdx: number }
  | { kind: 'syllable-done' }
  | { kind: 'end' }
  | { kind: 'fade-out' };

interface CharStep {
  jamo: string;
  cell: [number, number];
}

function flattenLayout(plan: TutorialSyllable[]): CharStep[] {
  const steps: CharStep[] = [];
  for (const syl of plan) {
    steps.push({ jamo: syl.cho, cell: syl.choCell });
    steps.push({ jamo: syl.jung, cell: syl.jungCell });
  }
  return steps;
}

export function KoreanBlockTutorial({ word, active, onEnd }: KoreanBlockTutorialProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const { highlight, setHighlight, setIsPlaying, setExpected, onCorrectRef } =
    useTutorialControls();
  const { playAudio } = useGameAudio();
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepsRef = useRef<CharStep[]>([]);
  const startedRef = useRef(false);

  // active 전이 — 시작/강제 종료
  useEffect(() => {
    if (active && !startedRef.current) {
      startedRef.current = true;
      stepsRef.current = flattenLayout(planTutorialLayout(word));
      setIsPlaying(true);
      setPhase({ kind: 'intro' });
    } else if (!active && startedRef.current) {
      startedRef.current = false;
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      onCorrectRef.current = null;
      setHighlight({ popJamo: null, glowCell: null, arrowFromJamo: null, arrowToCell: null });
      setExpected(null);
      setIsPlaying(false);
      setPhase({ kind: 'idle' });
    }
  }, [active, word, setHighlight, setExpected, setIsPlaying, onCorrectRef]);

  // phase 전환
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
      setHighlight({ popJamo: null, glowCell: null, arrowFromJamo: null, arrowToCell: null });
      setExpected(null);
      setIsPlaying(true);
      if (steps.length === 0) {
        advance({ kind: 'end' }, TUTORIAL_TIMING.intro);
      } else {
        advance({ kind: 'demo', charIdx: 0 }, TUTORIAL_TIMING.intro);
      }
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
      // pop + arrow + glow 동시에
      setHighlight({
        popJamo: step.jamo,
        glowCell: step.cell,
        arrowFromJamo: step.jamo,
        arrowToCell: step.cell,
      });
      // 1.5s 후 wait 진입 — pop/arrow/glow 유지 + isPlaying=false 로 사용자 차례
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
      // 시각 highlight 유지, 사용자 차례
      setHighlight({
        popJamo: step.jamo,
        glowCell: step.cell,
        arrowFromJamo: step.jamo,
        arrowToCell: step.cell,
      });
      setExpected({ jamo: step.jamo, cell: step.cell });
      setIsPlaying(false);
      // 사용자가 정답 드롭 시 onCorrectRef 가 advance.
      onCorrectRef.current = () => {
        const isLast = phase.charIdx === steps.length - 1;
        setExpected(null);
        setHighlight({ popJamo: null, glowCell: null, arrowFromJamo: null, arrowToCell: null });
        setPhase(isLast ? { kind: 'syllable-done' } : { kind: 'demo', charIdx: phase.charIdx + 1 });
      };
      return;
    }

    if (phase.kind === 'syllable-done') {
      playAudio(TUTORIAL_LINES.syllableDone.audio);
      setHighlight({ popJamo: null, glowCell: null, arrowFromJamo: null, arrowToCell: null });
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

  // unmount cleanup
  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      onCorrectRef.current = null;
    };
  }, [onCorrectRef]);

  // 말풍선 텍스트
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
      <TutorialArrow fromJamo={highlight.arrowFromJamo} toCell={highlight.arrowToCell} />
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

// ─────────────────────────────────────────────────────────────────
// TutorialArrow — 자모 panel 타일 → grid cell 곡선 화살표
// `data-jamo-tile` / `data-grid-cell` querySelector 로 좌표 측정
// ─────────────────────────────────────────────────────────────────

function TutorialArrow({
  fromJamo,
  toCell,
}: {
  fromJamo: string | null;
  toCell: [number, number] | null;
}) {
  const [coords, setCoords] = useState<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  } | null>(null);

  useEffect(() => {
    if (!fromJamo || !toCell) {
      setCoords(null);
      return;
    }
    const tile = document.querySelector(`[data-jamo-tile="${fromJamo}"]`);
    const cell = document.querySelector(`[data-grid-cell="${toCell[0]}-${toCell[1]}"]`);
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
  }, [fromJamo, toCell]);

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
          id="tutorial-arrowhead"
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
        markerEnd="url(#tutorial-arrowhead)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </svg>
  );
}
