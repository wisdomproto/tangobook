import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * /library 메인 페이지 상단 슬림 배너 (aspect-[6/1]).
 *
 * 레이아웃 (2026-05-19 v3):
 *   [좌측 로고 zone (고정, w=1/4, peach 그라데이션)] [우측 슬라이드 zone (w=3/4, 슬라이드별 이미지+텍스트)]
 *
 * 슬라이드 3종 — 그림체 / 어휘 게임 / 자연관찰. 5초 auto-advance + dot + 화살표 + hover pause.
 * 각 슬라이드: imageUrl (없으면 gradient fallback) + title + sub.
 */

interface Slide {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  /** 우측 zone 배경 이미지 (없으면 gradient fallback). 권장 사이즈 2400×500 (4.8:1). */
  imageUrl?: string;
  /** imageUrl 없을 때 fallback gradient. text 색에 영향. */
  bg: string;
  textColor: string;
}

const SLIDES: Slide[] = [
  {
    id: 'styles',
    emoji: '🎨',
    title: '한 동화를 여러 그림체로!',
    sub: '종이공예 · 수채화 · 픽사 · 실사 — 같은 이야기 다른 분위기',
    // imageUrl: '/images/library-banner/styles.webp',
    bg: 'bg-gradient-to-br from-coral-300 via-coral-400 to-coral-500',
    textColor: 'text-white',
  },
  {
    id: 'games',
    emoji: '🎮',
    title: '동화 속 단어로 게임 4가지',
    sub: '한글 블록 · 영어 블록 · 점잇기 · 낱말쓰기로 즐겁게 익혀요',
    // imageUrl: '/images/library-banner/games.webp',
    bg: 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500',
    textColor: 'text-ink-900',
  },
  {
    id: 'nature',
    emoji: '🐯',
    title: '동물·식물 자연관찰',
    sub: '공룡·곤충·바다·하늘 친구들과 떠나는 자연 모험',
    // imageUrl: '/images/library-banner/nature.webp',
    bg: 'bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-500',
    textColor: 'text-white',
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
      className="relative w-full aspect-[6/1] rounded-2xl overflow-hidden shadow-soft mb-5 flex"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-label="라이브러리 안내 배너"
    >
      {/* 좌측 — 로고 zone (고정, 모든 슬라이드 공통) */}
      <div className="relative w-1/4 sm:w-1/5 shrink-0 bg-gradient-to-br from-peach-100 via-peach-200 to-amber-200 flex items-center justify-center px-3">
        {/* sparkle 데코 */}
        <span aria-hidden className="absolute top-2 right-3 text-lg opacity-60 animate-pulse">
          ✨
        </span>
        <span
          aria-hidden
          className="absolute bottom-3 left-3 text-sm opacity-50 animate-pulse"
          style={{ animationDelay: '0.8s' }}
        >
          ⭐
        </span>
        <img
          src="/logo/logo-kr.webp"
          alt="탱고북"
          className="h-16 sm:h-20 md:h-28 w-auto object-contain drop-shadow-md relative z-10"
        />
      </div>

      {/* 우측 — 슬라이드 zone (이미지 + 텍스트) */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`absolute inset-0 ${slide.imageUrl ? '' : slide.bg} flex items-center px-5 sm:px-8`}
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
            {/* imageUrl 없을 때만 emoji fallback (이미지 만들기 전 임시) */}
            {!slide.imageUrl && (
              <div
                className="text-5xl sm:text-6xl md:text-7xl shrink-0 mr-4 sm:mr-6 drop-shadow-md"
                aria-hidden
              >
                {slide.emoji}
              </div>
            )}
            <div className={`flex-1 min-w-0 ${slide.textColor} relative z-10`}>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display leading-tight">
                {slide.title}
              </h2>
              <p className="text-sm sm:text-base font-bold opacity-90 mt-1 truncate">{slide.sub}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* 좌/우 화살표 — 우측 zone 안에 */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/70 hover:bg-white text-ink-900 font-black shadow-soft flex items-center justify-center transition z-20"
          aria-label="이전 배너"
        >
          ←
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/70 hover:bg-white text-ink-900 font-black shadow-soft flex items-center justify-center transition z-20"
          aria-label="다음 배너"
        >
          →
        </button>

        {/* dot indicator — 우측 zone 하단 */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
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
    </div>
  );
}
