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

// 완성도별 헤드라인/응원 문구 (4-5세 톤 — 항상 긍정).
function praiseFor(score: number, total: number): { title: string; sub: string } {
  if (total > 0 && score >= total)
    return { title: '완벽해요!', sub: '전부 다 맞혔어요! 최고예요 🌟' };
  if (total > 0 && score >= Math.ceil(total * 0.6))
    return { title: '참 잘했어요!', sub: '정말 열심히 했어요 👏' };
  return { title: '잘했어요!', sub: '다음엔 더 잘할 수 있어요 💪' };
}

// 히어로 이미지 슬롯 — 사용자가 넣어줄 축하 일러스트. 없으면(로드 실패) 마스코트로 폴백.
const HERO_IMAGE_URL = '/images/games/result-celebrate.png';

/**
 * mvp-simplification 정책: 학습자 화면에서 별 UI 전부 hide.
 * 별 3개 평점 + "저장됨" 토스트 제거. 백엔드 별 적립은 trigger 로 자동 (부모 리포트 source).
 */
export function GameResultScreen({ score, total, onRestart, onBack, lang }: GameResultScreenProps) {
  const reduce = useReducedMotion();
  const [heroFailed, setHeroFailed] = useState(false);
  const perfect = total > 0 && score >= total;
  const { title, sub } = praiseFor(score, total);

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

  // 마운트 시 confetti (prefers-reduced-motion 존중). 만점이면 양쪽에서 한 번 더 터뜨림.
  useEffect(() => {
    if (reduce) return;
    const colors = ['#FF5E3A', '#FFC857', '#5CC99F', '#A78BFA'];
    confetti({ particleCount: 130, spread: 85, origin: { y: 0.5 }, colors });
    if (perfect) {
      const t = window.setTimeout(() => {
        confetti({ particleCount: 70, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
        confetti({ particleCount: 70, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
      }, 350);
      return () => window.clearTimeout(t);
    }
  }, [reduce, perfect]);

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

  // 배경에 둥둥 떠다니는 장식 (풍선·별·반짝이). reduced-motion 이면 정적.
  const floaties = [
    { emoji: '🎈', className: 'left-[8%] top-[18%] text-5xl sm:text-6xl', delay: 0 },
    { emoji: '⭐', className: 'right-[10%] top-[14%] text-4xl sm:text-5xl', delay: 0.4 },
    { emoji: '🎈', className: 'right-[7%] top-[42%] text-5xl sm:text-6xl', delay: 0.8 },
    { emoji: '✨', className: 'left-[12%] top-[44%] text-3xl sm:text-4xl', delay: 0.6 },
    { emoji: '🎉', className: 'left-[16%] bottom-[12%] text-4xl sm:text-5xl', delay: 0.2 },
    { emoji: '⭐', className: 'right-[14%] bottom-[14%] text-3xl sm:text-4xl', delay: 1 },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden p-6 text-center bg-gradient-to-b from-cream-50 via-coral-100 to-peach-200">
      {/* 배경 장식 */}
      {floaties.map((f, i) => (
        <motion.span
          key={i}
          aria-hidden
          className={`pointer-events-none absolute select-none opacity-80 ${f.className}`}
          initial={reduce ? { opacity: 0.8 } : { y: 0, opacity: 0.8 }}
          animate={reduce ? { opacity: 0.8 } : { y: [-10, 10, -10] }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: f.delay }
          }
        >
          {f.emoji}
        </motion.span>
      ))}

      {/* 결과 카드 */}
      <motion.div
        initial={reduce ? { opacity: 0 } : { scale: 0.6, y: 40, opacity: 0 }}
        animate={reduce ? { opacity: 1 } : { scale: 1, y: 0, opacity: 1 }}
        transition={reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 170, damping: 15 }}
        className="relative z-10 w-full max-w-sm rounded-[2.5rem] border-4 border-white bg-white/70 px-8 py-10 shadow-pop backdrop-blur-sm sm:px-12 sm:py-12"
      >
        {/* 히어로 (선버스트 + 마스코트/이미지) */}
        <div className="relative mx-auto mb-2 flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full bg-gradient-to-br from-coral-200 via-peach-200 to-mint-200 blur-xl"
            initial={reduce ? { opacity: 0.7 } : { scale: 0.9, opacity: 0.7 }}
            animate={reduce ? { opacity: 0.7 } : { scale: [0.95, 1.05, 0.95] }}
            transition={reduce ? { duration: 0 } : { duration: 2.6, repeat: Infinity }}
          />
          {!heroFailed ? (
            <img
              src={HERO_IMAGE_URL}
              alt=""
              className="relative h-full w-full object-contain drop-shadow-lg"
              onError={() => setHeroFailed(true)}
            />
          ) : (
            <div className="relative">
              <Mascot state="celebrating" size="xl" />
            </div>
          )}
        </div>

        <motion.h1
          initial={reduce ? {} : { scale: 0.8 }}
          animate={reduce ? {} : { scale: 1 }}
          transition={reduce ? {} : { delay: 0.15, type: 'spring', stiffness: 240, damping: 12 }}
          className="font-display text-4xl font-black text-ink-900 sm:text-5xl"
        >
          {title}
        </motion.h1>
        <p className="mt-2 text-base font-bold text-ink-500 sm:text-lg">{sub}</p>

        {/* 점수 배지 */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 shadow-md ring-4 ring-coral-100">
          <span className="text-2xl sm:text-3xl">{perfect ? '🏆' : '⭐'}</span>
          <span className="text-3xl font-black tabular-nums text-coral-500 sm:text-4xl">
            {displayCount}
          </span>
          <span className="text-2xl font-black text-ink-300 sm:text-3xl">/ {total}</span>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="primary" size="lg" onClick={onRestart}>
            🔄 다시 하기
          </Button>
          <Button variant="secondary" size="lg" onClick={onBack}>
            확인
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
