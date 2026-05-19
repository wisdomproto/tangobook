import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * /library 메인 페이지 상단 슬림 배너 (aspect-[6/1]).
 *
 * 레이아웃 (2026-05-19 v5):
 *   [좌측 50% — 탱고북 로고 (고정) + 슬라이드별 텍스트] [우측 50% — 슬라이드별 이미지]
 *
 * 좌측: cream/peach 톤 고정 배경 + 로고 + 슬라이드 title/sub.
 * 우측: 슬라이드 이미지 cover (없으면 emoji fallback). zone aspect 3:1 (배너 6:1 × 0.5).
 *
 * 5초 auto-advance + dot indicator + 좌우 화살표 + hover pause.
 */

interface Slide {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  /** 우측 zone 이미지 (없으면 emoji fallback). 권장 1500×500 (3:1). */
  imageUrl?: string;
  /** 우측 imageUrl 없을 때 우측 zone fallback gradient. */
  rightBg: string;
  /** 슬라이드별 우측 zone 톤. 좌측 텍스트 강조 색 (h2 underline 등 추후 활용용). */
  accent: string;
}

const SLIDES: Slide[] = [
  {
    id: 'styles',
    emoji: '🎨',
    title: '한 동화를 여러 그림체로!',
    sub: '종이공예 · 수채화 · 픽사 · 실사 — 같은 이야기 다른 분위기',
    // imageUrl: '/images/library-banner/styles.webp',
    rightBg: 'bg-gradient-to-r from-peach-200 to-coral-400',
    accent: 'text-coral-600',
  },
  {
    id: 'games',
    emoji: '🎮',
    title: '동화 속 단어로 게임 4가지',
    sub: '한글 블록 · 영어 블록 · 점잇기 · 낱말쓰기로 즐겁게 익혀요',
    // imageUrl: '/images/library-banner/games.webp',
    rightBg: 'bg-gradient-to-r from-cream-200 to-amber-400',
    accent: 'text-amber-600',
  },
  {
    id: 'nature',
    emoji: '🐯',
    title: '동물·식물 자연관찰',
    sub: '공룡·곤충·바다·하늘 친구들과 떠나는 자연 모험',
    // imageUrl: '/images/library-banner/nature.webp',
    rightBg: 'bg-gradient-to-r from-cream-200 to-emerald-400',
    accent: 'text-emerald-600',
  },
];

const AUTO_ADVANCE_MS = 5000;

export function LibraryBanner() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

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
      className="relative w-full aspect-[6/1] rounded-2xl overflow-hidden shadow-soft mb-5 flex bg-gradient-to-br from-cream-50 to-peach-100"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-label="라이브러리 안내 배너"
    >
      {/* 좌측 50% — 로고 + 슬라이드별 텍스트 */}
      <div className="relative w-1/2 shrink-0 flex items-center gap-4 sm:gap-5 px-4 sm:px-6 md:px-7">
        <img
          src="/logo/logo-kr.webp"
          alt="탱고북"
          className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto object-contain drop-shadow-md shrink-0"
        />
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black font-display text-ink-900 leading-tight">
                {slide.title}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-ink-600 mt-1 line-clamp-2">
                {slide.sub}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 우측 50% — 슬라이드 이미지 (없으면 emoji fallback) */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`absolute inset-0 ${slide.imageUrl ? '' : slide.rightBg} flex items-center justify-center`}
            style={
              slide.imageUrl
                ? {
                    backgroundImage: `url(${slide.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            {!slide.imageUrl && (
              <div className="text-6xl sm:text-7xl md:text-8xl drop-shadow-md" aria-hidden>
                {slide.emoji}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 좌/우 화살표 */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-ink-900 font-black shadow-soft flex items-center justify-center transition z-20"
        aria-label="이전 배너"
      >
        ←
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-ink-900 font-black shadow-soft flex items-center justify-center transition z-20"
        aria-label="다음 배너"
      >
        →
      </button>

      {/* dot indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === idx ? 'bg-coral-500 scale-125 shadow-soft' : 'bg-ink-300 hover:bg-ink-400'
            }`}
            aria-label={`배너 ${i + 1}`}
            aria-current={i === idx ? 'true' : 'false'}
          />
        ))}
      </div>
    </div>
  );
}
