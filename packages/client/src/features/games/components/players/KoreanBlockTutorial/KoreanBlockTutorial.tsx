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
  /** 활성화 여부 — false 면 idle 만, true 면 시퀀스 진행 */
  active: boolean;
  /** 시퀀스 끝 콜백 — KoreanBlockPlayer 에서 hintActive 해제 */
  onEnd: () => void;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'intro' }
  | { kind: 'pop'; charIdx: number }
  | { kind: 'arrow'; charIdx: number }
  | { kind: 'place'; charIdx: number }
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
  const { highlight, setHighlight, setIsPlaying } = useTutorialControls();
  const { playAudio } = useGameAudio();
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepsRef = useRef<CharStep[]>([]);
  const startedRef = useRef(false);

  // active=true 로 전이 시 intro 시작 — 시퀀스가 끝나면 onEnd 가 active 를 false 로 만들 때까지
  // startedRef 가 true 라 재진입 안 됨 (fade-out → idle 직후 active=true 잔존 시 무한루프 방지).
  useEffect(() => {
    if (active && !startedRef.current) {
      startedRef.current = true;
      stepsRef.current = flattenLayout(planTutorialLayout(word));
      setIsPlaying(true);
      setPhase({ kind: 'intro' });
    } else if (!active && startedRef.current) {
      startedRef.current = false;
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      setHighlight({ popJamo: null, glowCell: null, arrowFromJamo: null, arrowToCell: null });
      setIsPlaying(false);
      setPhase({ kind: 'idle' });
    }
  }, [active, word, setHighlight, setIsPlaying]);

  // phase 전환 — 각 phase 마다 audio 재생 + highlight 갱신 + 다음 phase 예약
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
      if (steps.length === 0) {
        advance({ kind: 'end' }, TUTORIAL_TIMING.intro);
      } else {
        advance({ kind: 'pop', charIdx: 0 }, TUTORIAL_TIMING.intro);
      }
      return;
    }
    if (phase.kind === 'pop') {
      const step = steps[phase.charIdx];
      if (!step) {
        setPhase({ kind: 'end' });
        return;
      }
      playAudio(TUTORIAL_LINES.pop.audio);
      setHighlight({
        popJamo: step.jamo,
        glowCell: null,
        arrowFromJamo: null,
        arrowToCell: null,
      });
      advance({ kind: 'arrow', charIdx: phase.charIdx }, TUTORIAL_TIMING.pop);
      return;
    }
    if (phase.kind === 'arrow') {
      const step = steps[phase.charIdx];
      setHighlight({
        popJamo: step.jamo,
        glowCell: null,
        arrowFromJamo: step.jamo,
        arrowToCell: step.cell,
      });
      advance({ kind: 'place', charIdx: phase.charIdx }, TUTORIAL_TIMING.arrow);
      return;
    }
    if (phase.kind === 'place') {
      const step = steps[phase.charIdx];
      playAudio(TUTORIAL_LINES.place.audio);
      setHighlight({
        popJamo: null,
        glowCell: step.cell,
        arrowFromJamo: null,
        arrowToCell: null,
      });
      const isLast = phase.charIdx === steps.length - 1;
      const next: Phase = isLast
        ? { kind: 'syllable-done' }
        : { kind: 'pop', charIdx: phase.charIdx + 1 };
      advance(next, TUTORIAL_TIMING.place);
      return;
    }
    if (phase.kind === 'syllable-done') {
      playAudio(TUTORIAL_LINES.syllableDone.audio);
      setHighlight({ popJamo: null, glowCell: null, arrowFromJamo: null, arrowToCell: null });
      advance({ kind: 'end' }, TUTORIAL_TIMING.syllableDone);
      return;
    }
    if (phase.kind === 'end') {
      playAudio(TUTORIAL_LINES.end.audio);
      advance({ kind: 'fade-out' }, TUTORIAL_TIMING.end);
      return;
    }
    if (phase.kind === 'fade-out') {
      // fade-out 끝 시 idle 로 → useEffect 가 active=true 인 동안 다시 intro 로 가지 않게
      // 부모가 onEnd 콜백에서 hintActive 해제 → active=false 가 되어야 함
      const fadeTimer = setTimeout(() => {
        setIsPlaying(false);
        setPhase({ kind: 'idle' });
        onEnd();
      }, TUTORIAL_TIMING.fadeOut);
      phaseTimerRef.current = fadeTimer;
      return;
    }
  }, [phase, playAudio, setHighlight, setIsPlaying, onEnd]);

  // unmount cleanup
  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, []);

  // 말풍선 텍스트
  const bubbleText = (() => {
    if (phase.kind === 'intro') return TUTORIAL_LINES.intro.text;
    if (phase.kind === 'pop') return TUTORIAL_LINES.pop.text;
    if (phase.kind === 'place') return TUTORIAL_LINES.place.text;
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
            {/* 말풍선 (호리 왼쪽) */}
            <AnimatePresence mode="wait">
              {bubbleText && (
                <motion.div
                  key={`bubble-${phase.kind}-${'charIdx' in phase ? phase.charIdx : ''}`}
                  className="relative bg-white/95 rounded-3xl shadow-pop px-5 py-3 max-w-[220px]"
                  initial={{ opacity: 0, scale: 0.8, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xl font-display font-black text-ink-900 whitespace-nowrap">
                    {bubbleText}
                  </p>
                  {/* 꼬리 — 우측을 가리킴 (호리 방향) */}
                  <div className="absolute right-[-8px] bottom-6 w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-white/95" />
                </motion.div>
              )}
            </AnimatePresence>
            {/* 호리 */}
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

  // Quadratic Bézier control point — 두 점 중간보다 위쪽 (살짝 곡선)
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
