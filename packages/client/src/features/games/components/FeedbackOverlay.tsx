import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { emitLearningEffect } from '../effects/learning-effects';
import { cn } from '@/lib/cn';

interface FeedbackOverlayProps {
  kind: 'correct' | 'incorrect';
  visible: boolean;
  onDismiss?: () => void;
  durationMs?: number;
  positionHint?: 'center' | 'top';
}

// 문구 풀은 games ns feedback.* 키 (마운트 시 랜덤 선택).
const CORRECT_KEYS = [
  'feedback.correct1',
  'feedback.correct2',
  'feedback.correct3',
  'feedback.correct4',
];
const INCORRECT_KEYS = ['feedback.incorrect1', 'feedback.incorrect2', 'feedback.incorrect3'];

/** 정답은 학습 대상에서 반응하고, 문구는 내용을 가리지 않는 하단 상태로 표시한다. */
export function FeedbackOverlay({
  kind,
  visible,
  onDismiss,
  durationMs,
  positionHint = 'center',
}: FeedbackOverlayProps) {
  const { t } = useTranslation('games');
  const effectiveDuration = durationMs ?? (kind === 'correct' ? 1200 : 800);

  // 마운트 시 랜덤 문구 고정 (리렌더마다 바뀌지 않게, visible true 전환 시 재선택)
  const textKey = useMemo(() => {
    const pool = kind === 'correct' ? CORRECT_KEYS : INCORRECT_KEYS;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [kind, visible]);
  const text = t(textKey);

  useEffect(() => {
    if (visible) emitLearningEffect(kind === 'correct' ? 'correct' : 'retry');
  }, [visible, kind]);

  // 자동 dismiss
  useEffect(() => {
    if (!visible) return;
    if (!onDismiss) return;
    const t = setTimeout(onDismiss, effectiveDuration);
    return () => clearTimeout(t);
  }, [visible, onDismiss, effectiveDuration]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'learning-feedback',
        positionHint === 'top' && 'learning-feedback--top',
        kind === 'incorrect' && 'learning-feedback--retry'
      )}
      role="status"
      aria-live="polite"
    >
      <div className="learning-feedback-pill">
        <span className="learning-feedback-icon" aria-hidden="true">
          <svg viewBox="0 0 32 32">
            <path
              d={kind === 'correct' ? 'M6 16 L13 23 L26 9' : 'M9 11 A10 10 0 1 1 7 22 M9 4 V11 H2'}
            />
          </svg>
        </span>
        <span data-testid="feedback-text">{text}</span>
      </div>
    </div>
  );
}
