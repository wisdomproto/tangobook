import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mascot } from '@/design-system';
import { Button } from '@/design-system';
import { settingsApi } from '@/features/settings/api/settings.api';
import { playUi } from '@/lib/uiSound';

interface GameResultScreenProps {
  score: number;
  total: number;
  onRestart: () => void;
  onBack: () => void;
  /** 결과 화면이 어떤 동화에서 호출되었는지 메타 정보 (현재는 사용하지 않지만 시그니처 유지) */
  storybookId?: string;
  /** 게임 언어 — 칭찬 음성 풀 선택 (미지정 시 한/영 합산 랜덤: 기존 동작) */
  lang?: 'ko' | 'en';
}

/**
 * mvp-simplification 정책: 학습자 화면에서 별 UI 전부 hide.
 * 별 3개 평점 + "저장됨" 토스트 제거. 백엔드 별 적립은 trigger 로 자동 (부모 리포트 source).
 */
export function GameResultScreen({ score, total, onRestart, onBack, lang }: GameResultScreenProps) {
  const reduce = useReducedMotion();

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

  // 마운트 시 축하 효과음 1회.
  useEffect(() => {
    playUi('reward');
  }, []);

  // 마운트 시 칭찬 음원 1회 (호리 + 칭찬).
  // lang 지정 시 해당 언어 풀 우선(비면 반대 언어 폴백) — 한글 게임 끝에 영어 칭찬 방지.
  // 미지정 시 기존처럼 한/영 합산 랜덤 (useGameAudio.playCorrectSequence 와 동일 정책).
  useEffect(() => {
    let cancelled = false;
    let audio: HTMLAudioElement | null = null;
    settingsApi
      .getSystemSounds()
      .then((data) => {
        if (cancelled) return;
        const koPool = data.korean.correct.map((s) => s.url);
        const enPool = data.english.correct.map((s) => s.url);
        let pool: string[];
        if (lang === 'ko') pool = koPool.length > 0 ? koPool : enPool;
        else if (lang === 'en') pool = enPool.length > 0 ? enPool : koPool;
        else pool = [...koPool, ...enPool];
        if (pool.length === 0) return;
        const url = pool[Math.floor(Math.random() * pool.length)];
        audio = new Audio(url);
        void audio.play().catch(() => {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [lang]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-gradient-to-b from-cream-50 via-coral-100 to-peach-200">
      <motion.div
        initial={reduce ? { opacity: 0 } : { scale: 0.5, y: 40 }}
        animate={reduce ? { opacity: 1 } : { scale: 1, y: 0 }}
        transition={reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 180, damping: 14 }}
      >
        <Mascot state="celebrating" size="xl" />
      </motion.div>

      <h1 className="mt-6 text-4xl font-black text-ink-900 font-display">게임 끝!</h1>
      <p className="mt-3 text-2xl font-bold text-ink-900">
        <span className="text-coral-500">{displayCount}</span>
        <span className="text-ink-900"> / {total}</span>
      </p>

      <div className="mt-8 flex gap-3">
        <Button variant="primary" size="lg" onClick={onRestart}>
          🔄 다시 하기
        </Button>
        <Button variant="secondary" size="lg" onClick={onBack}>
          확인
        </Button>
      </div>
    </div>
  );
}
