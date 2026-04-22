import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mascot } from '@/components/Mascot';
import { Button } from '@/components/Button';
import { cn } from '@/lib/cn';

interface GameResultScreenProps {
  score: number;
  total: number;
  onRestart: () => void;
  onBack: () => void;
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
      <p className="mt-3 text-2xl font-bold text-ink-700">
        <span className="text-coral-500">{displayCount}</span>
        <span className="text-ink-500"> / {total}</span>
      </p>

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
