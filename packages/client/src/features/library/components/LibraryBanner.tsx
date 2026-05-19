import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * /library 메인 페이지 상단 슬림 배너 (aspect-[6/1]).
 * 5초마다 자동 슬라이드 + dot indicator + 좌우 화살표. hover 시 일시정지.
 *
 * 슬라이드 3종 (2026-05-19):
 *  1. 다양한 그림체 — 한 동화를 여러 그림체로 만나기
 *  2. 어휘 게임 — 동화 속 단어로 4가지 게임
 *  3. 자연관찰 — 동물·식물 모험
 */

interface Slide {
  id: string;
  /** logo 슬라이드면 logoSrc, 그 외는 emoji */
  logoSrc?: string;
  emoji?: string;
  title: string;
  sub: string;
  bg: string; // tailwind bg gradient
  textColor: string;
}

const SLIDES: Slide[] = [
  {
    id: 'brand',
    logoSrc: '/logo/logo-kr.webp',
    title: '그림책이 친구가 되는 시간',
    sub: '호리와 함께 떠나는 동화 모험',
    bg: 'bg-gradient-to-br from-cream-50 via-peach-50 to-peach-100',
    textColor: 'text-ink-900',
  },
  {
    id: 'styles',
    emoji: '🎨',
    title: '한 동화를 여러 그림체로!',
    sub: '종이공예 · 수채화 · 픽사 · 실사 — 같은 이야기 다른 분위기',
    bg: 'bg-gradient-to-br from-coral-300 via-coral-400 to-coral-500',
    textColor: 'text-white',
  },
  {
    id: 'games',
    emoji: '🎮',
    title: '동화 속 단어로 게임 4가지',
    sub: '한글 블록 · 영어 블록 · 점잇기 · 낱말쓰기로 즐겁게 익혀요',
    bg: 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500',
    textColor: 'text-ink-900',
  },
  {
    id: 'nature',
    emoji: '🐯',
    title: '동물·식물 자연관찰',
    sub: '공룡·곤충·바다·하늘 친구들과 떠나는 자연 모험',
    bg: 'bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-500',
    textColor: 'text-white',
  },
];

const AUTO_ADVANCE_MS = 5000;

export function LibraryBanner() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // 자동 advance — hover 시 일시정지
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % SLIDES.length), AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [idx, paused]);

  const goTo = (i: number) => setIdx(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);
  const prev = () => goTo(idx - 1);
  const next = () => goTo(idx + 1);

  const slide = SLIDES[idx];

  return (
    <div
      className="relative w-full aspect-[6/1] rounded-2xl overflow-hidden shadow-soft mb-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-label="라이브러리 안내 배너"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className={`absolute inset-0 ${slide.bg} flex items-center px-6 sm:px-10`}
        >
          {/* 좌측 — 로고 또는 이모지 일러스트 */}
          {slide.logoSrc ? (
            <img
              src={slide.logoSrc}
              alt="탱고북"
              className="h-16 sm:h-20 md:h-28 w-auto shrink-0 mr-5 sm:mr-7 drop-shadow-md object-contain"
            />
          ) : (
            <div
              className="text-6xl sm:text-7xl md:text-8xl shrink-0 mr-5 sm:mr-7 drop-shadow-md"
              aria-hidden
            >
              {slide.emoji}
            </div>
          )}
          {/* 텍스트 */}
          <div className={`flex-1 min-w-0 ${slide.textColor}`}>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display leading-tight">
              {slide.title}
            </h2>
            <p className="text-sm sm:text-base font-bold opacity-90 mt-1 truncate">{slide.sub}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 좌/우 화살표 */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/70 hover:bg-white text-ink-900 font-black shadow-soft flex items-center justify-center transition"
        aria-label="이전 배너"
      >
        ←
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/70 hover:bg-white text-ink-900 font-black shadow-soft flex items-center justify-center transition"
        aria-label="다음 배너"
      >
        →
      </button>

      {/* dot indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === idx ? 'bg-white scale-125 shadow-soft' : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`배너 ${i + 1}`}
            aria-current={i === idx ? 'true' : 'false'}
          />
        ))}
      </div>
    </div>
  );
}
