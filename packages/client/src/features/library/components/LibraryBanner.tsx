import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * /library 메인 페이지 상단 슬림 배너 (aspect-[6/1]).
 *
 * 레이아웃 (2026-05-19 v4):
 *   슬라이드 배경 (이미지 또는 gradient) 이 *전체* 영역 cover. 좌측 30% 에 로고 absolute overlay
 *   (모든 슬라이드 공통). 우측 70% 에 텍스트 (title + sub). 배경 분리감 X.
 *
 * 슬라이드 3종 — 그림체 / 어휘 게임 / 자연관찰. 5초 auto-advance + dot + 화살표 + hover pause.
 */

interface Slide {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  /** 배너 전체 배경 이미지 (없으면 gradient fallback). 권장 2400×500 (4.8:1). */
  imageUrl?: string;
  /** imageUrl 없을 때 fallback gradient. */
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
    bg: 'bg-gradient-to-r from-peach-100 via-coral-300 to-coral-500',
    textColor: 'text-white',
  },
  {
    id: 'games',
    emoji: '🎮',
    title: '동화 속 단어로 게임 4가지',
    sub: '한글 블록 · 영어 블록 · 점잇기 · 낱말쓰기로 즐겁게 익혀요',
    // imageUrl: '/images/library-banner/games.webp',
    bg: 'bg-gradient-to-r from-cream-100 via-amber-300 to-amber-500',
    textColor: 'text-ink-900',
  },
  {
    id: 'nature',
    emoji: '🐯',
    title: '동물·식물 자연관찰',
    sub: '공룡·곤충·바다·하늘 친구들과 떠나는 자연 모험',
    // imageUrl: '/images/library-banner/nature.webp',
    bg: 'bg-gradient-to-r from-cream-100 via-emerald-300 to-emerald-500',
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
      className="relative w-full aspect-[6/1] rounded-2xl overflow-hidden shadow-soft mb-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-label="라이브러리 안내 배너"
    >
      {/* 슬라이드 배경 + 텍스트 — 전체 영역 cover. 슬라이드별 fade transition. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className={`absolute inset-0 ${slide.imageUrl ? '' : slide.bg}`}
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
          {/* 우측 70% 텍스트 영역 — 좌측 30% 는 로고 자리로 비워둠 (padding-left 30%) */}
          <div
            className={`absolute inset-y-0 right-0 left-[30%] flex items-center px-5 sm:px-8 ${slide.textColor}`}
          >
            <div className="flex-1 min-w-0 relative z-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display leading-tight">
                {slide.title}
              </h2>
              <p className="text-sm sm:text-base font-bold opacity-90 mt-1 truncate">{slide.sub}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 좌측 30% 로고 — absolute overlay, 슬라이드 전환과 무관하게 항상 보임.
          살짝 white wash (bg-white/35) + 우측으로 fade — 슬라이드 배경 통일감 유지하면서
          로고 가독성 한 번 더 보호. mask 로 우측 fade out. */}
      <div
        className="absolute inset-y-0 left-0 w-[30%] flex items-center justify-center z-10 px-3 pointer-events-none"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.35)',
          maskImage: 'linear-gradient(to right, black 60%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black 60%, transparent 100%)',
        }}
      >
        <img
          src="/logo/logo-kr.webp"
          alt="탱고북"
          className="h-16 sm:h-24 md:h-32 lg:h-36 w-auto object-contain drop-shadow-lg"
        />
      </div>

      {/* 좌/우 화살표 */}
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

      {/* dot indicator */}
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
  );
}
