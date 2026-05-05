import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mascot } from '@/design-system';
import { Button } from '@/design-system';
import { cn } from '@/lib/cn';
import { useStarBalance } from '@/features/rewards';

interface GameResultScreenProps {
  score: number;
  total: number;
  onRestart: () => void;
  onBack: () => void;
  /** 결과 화면이 어떤 동화에서 호출되었는지 메타 정보 (현재는 사용하지 않지만 시그니처 유지) */
  storybookId?: string;
}

function computeStars(ratio: number): number {
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

export function GameResultScreen({ score, total, onRestart, onBack }: GameResultScreenProps) {
  const reduce = useReducedMotion();
  const safeTotal = total || 1;
  const ratio = score / safeTotal;
  const starCount = computeStars(ratio);

  // 카운트업 애니 (0 → score, 800ms)
  const [displayCount, setDisplayCount] = useState(0);
  useEffect(() => {
    if (reduce) {
      setDisplayCount(score);
      return;
    }
    const start = performance.now();
    const dur = 800;
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(1, elapsed / dur);
      setDisplayCount(Math.round(score * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, reduce]);

  // 마운트 시 confetti (prefers-reduced-motion 존중)
  useEffect(() => {
    if (reduce) return;
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#FF5E3A', '#FFC857', '#5CC99F', '#A78BFA'],
    });
  }, [reduce]);

  // 별 적립 표시 — 게임 종료 후 1.2초 뒤 잔고 refetch → 증가분 표시
  const { data: balance, refetch: refetchBalance } = useStarBalance();
  const initialBalanceRef = useRef<number | null>(null);
  const [savedDelta, setSavedDelta] = useState<number | null>(null);
  useEffect(() => {
    initialBalanceRef.current = balance?.stars_total ?? null;
    const t = setTimeout(() => {
      void refetchBalance();
    }, 1200);
    return () => clearTimeout(t);
    // 마운트 1회만 — initial 잔고 캡처용 (balance 의존성 추가하면 매 갱신마다 캡처 리셋)
  }, []);
  useEffect(() => {
    if (balance == null || initialBalanceRef.current == null) return;
    const delta = balance.stars_total - initialBalanceRef.current;
    if (delta > 0) setSavedDelta(delta);
  }, [balance]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-gradient-to-b from-cream-50 via-coral-100 to-peach-200">
      <motion.div
        initial={reduce ? { opacity: 0 } : { scale: 0.5, y: 40 }}
        animate={reduce ? { opacity: 1 } : { scale: 1, y: 0 }}
        transition={reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 180, damping: 14 }}
      >
        <Mascot state="celebrating" size="xl" />
      </motion.div>

      <div className="mt-6 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.span
            key={i}
            initial={reduce ? { opacity: 0 } : { scale: 0 }}
            animate={{
              opacity: 1,
              scale: i < starCount ? 1 : 0.4,
            }}
            transition={{ delay: reduce ? 0 : 0.3 + i * 0.2, type: 'spring' }}
            className={cn('text-5xl', i < starCount ? 'opacity-100' : 'opacity-30 grayscale')}
            aria-label={i < starCount ? '별 획득' : '빈 별'}
          >
            ⭐
          </motion.span>
        ))}
      </div>

      <h1 className="mt-5 text-4xl font-black text-ink-900 font-display">게임 끝!</h1>
      <p className="mt-3 text-2xl font-bold text-ink-900">
        <span className="text-coral-500">{displayCount}</span>
        <span className="text-ink-900"> / {total}</span>
      </p>

      {savedDelta != null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/30 rounded-full text-success font-bold"
          role="status"
        >
          <span>⭐</span>
          <span>+{savedDelta} 저장됨!</span>
        </motion.div>
      )}

      <div className="mt-8 flex gap-3">
        <Button variant="primary" size="lg" onClick={onRestart}>
          🔄 다시 하기
        </Button>
        <Button variant="secondary" size="lg" onClick={onBack}>
          🏠 홈으로
        </Button>
      </div>
    </div>
  );
}
