import { useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Mascot } from '@/components/Mascot';
import { cn } from '@/lib/cn';

interface FeedbackOverlayProps {
  kind: 'correct' | 'incorrect';
  visible: boolean;
  onDismiss?: () => void;
  durationMs?: number;
  positionHint?: 'center' | 'top';
}

const CORRECT_TEXTS = ['잘했어!', '정답!', '최고야!', '멋져!'];
const INCORRECT_TEXTS = ['다시 해볼까?', '괜찮아', '한 번 더!'];

/**
 * 게임 정답/오답 피드백 오버레이.
 * - correct: cheering 호리 + confetti + 무지개 배경
 * - incorrect: sad 호리 + shake 애니
 * - prefers-reduced-motion 존중 (confetti 스킵)
 */
export function FeedbackOverlay({
  kind,
  visible,
  onDismiss,
  durationMs,
  positionHint = 'center',
}: FeedbackOverlayProps) {
  const effectiveDuration = durationMs ?? (kind === 'correct' ? 1200 : 800);

  // 마운트 시 랜덤 문구 고정 (리렌더마다 바뀌지 않게, visible true 전환 시 재선택)
  const text = useMemo(() => {
    const pool = kind === 'correct' ? CORRECT_TEXTS : INCORRECT_TEXTS;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [kind, visible]);

  // 정답 시 confetti (prefers-reduced-motion 존중)
  useEffect(() => {
    if (!visible) return;
    if (kind !== 'correct') return;
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#FF5E3A', '#FFC857', '#5CC99F', '#A78BFA'],
    });
  }, [visible, kind]);

  // 자동 dismiss
  useEffect(() => {
    if (!visible) return;
    if (!onDismiss) return;
    const t = setTimeout(onDismiss, effectiveDuration);
    return () => clearTimeout(t);
  }, [visible, onDismiss, effectiveDuration]);

  if (!visible) return null;

  const mascotState = kind === 'correct' ? 'cheering' : 'sad';
  const bgTint = kind === 'correct' ? 'bg-success/10' : 'bg-coral-100/40';
  const shakeClass = kind === 'incorrect' ? 'animate-shake' : '';

  return (
    <div
      className={cn(
        'fixed inset-0 z-40 flex flex-col items-center gap-3 pointer-events-none',
        positionHint === 'top' ? 'justify-start pt-24' : 'justify-center',
        bgTint,
        shakeClass
      )}
    >
      <Mascot state={mascotState} size="lg" />
      <div
        data-testid="feedback-text"
        className="bg-white rounded-lg px-6 py-3 shadow-pop font-black text-2xl text-ink-900"
      >
        {text}
      </div>
    </div>
  );
}
