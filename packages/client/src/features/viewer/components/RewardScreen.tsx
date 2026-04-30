import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mascot } from '@/design-system';
import { cn } from '@/lib/cn';
import { YouTubeModal } from './YouTubeModal';

interface RewardScreenProps {
  title: string;
  /** YouTube 영상 ID (있으면 모달로 재생, 없으면 영상 버튼 숨김) */
  videoId?: string;
  /** R2 직접 영상 URL (videoId 없을 때 fallback, 새 탭으로 열기) */
  directVideoUrl?: string;
  /** 게임 가용 여부 */
  hasGames: boolean;
  open: boolean;
  autoOpenVideo?: boolean; // `/viewer/:id?mode=video` 진입 시 true → 마운트 즉시 영상 모달 열기
  onClose: () => void;
  onGoHome: () => void;
  onRereadFromStart: () => void;
  onPlayGame: () => void;
}

export function RewardScreen({
  title,
  videoId,
  directVideoUrl,
  hasGames,
  open,
  autoOpenVideo,
  onGoHome,
  onRereadFromStart,
  onPlayGame,
}: RewardScreenProps) {
  const reduce = useReducedMotion();

  const videoAvailable = !!videoId || !!directVideoUrl;
  const gameAvailable = hasGames;
  const [videoOpen, setVideoOpen] = useState(false);

  // 등장 시 confetti (prefers-reduced-motion 존중)
  useEffect(() => {
    if (!open) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#FF5E3A', '#FFC857', '#5CC99F', '#A78BFA'],
    });
  }, [open]);

  // autoOpenVideo true + videoId 있으면 YouTube 모달 자동 오픈 (1회)
  // directVideoUrl만 있을 땐 새 탭으로 열기
  useEffect(() => {
    if (!open || !autoOpenVideo) return;
    if (videoId) {
      setVideoOpen(true);
    } else if (directVideoUrl) {
      window.open(directVideoUrl, '_blank', 'noopener,noreferrer');
    }
  }, [open, autoOpenVideo, videoId, directVideoUrl]);

  if (!open) return null;

  // Case 분기
  // A: 영상 O + 게임 O → 둘 다 Primary
  // B: 영상 O + 게임 X → 영상 Primary 크게
  // C: 영상 X + 게임 O → 게임 Primary 크게
  // D: 영상 X + 게임 X → 홈 Primary 크게
  const caseType =
    videoAvailable && gameAvailable ? 'A' : videoAvailable ? 'B' : gameAvailable ? 'C' : 'D';

  const motionItem = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
    : undefined;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center text-center p-10 bg-gradient-to-b from-cream-50 via-coral-100 to-peach-200"
        >
          <motion.div
            initial={reduce ? { opacity: 0 } : { scale: 0.5, y: 40 }}
            animate={reduce ? { opacity: 1 } : { scale: 1, y: 0 }}
            transition={
              reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 180, damping: 14 }
            }
          >
            <Mascot state="celebrating" size="xl" />
          </motion.div>

          <motion.div
            initial={reduce ? { opacity: 0 } : { y: 20, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
            transition={reduce ? { duration: 0.2 } : { delay: 0.15 }}
            className="inline-block bg-ink-900 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-md mt-4"
          >
            📖 완독 축하
          </motion.div>

          <motion.h1
            initial={reduce ? { opacity: 0 } : { y: 20, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
            transition={reduce ? { duration: 0.2 } : { delay: 0.25 }}
            className="text-4xl font-black text-ink-900 mt-3 font-display"
          >
            {caseType === 'D' ? '이야기 끝! 🎉' : '끝까지 다 읽었어! 🎉'}
          </motion.h1>

          <motion.p
            initial={reduce ? { opacity: 0 } : { y: 20, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
            transition={reduce ? { duration: 0.2 } : { delay: 0.35 }}
            className="text-ink-700 text-base font-semibold mt-2"
          >
            {caseType === 'A'
              ? '이제 어떻게 더 놀까?'
              : caseType === 'B'
                ? '애니메이션으로 한번 더 볼래?'
                : caseType === 'C'
                  ? '이야기로 게임하러 가볼까?'
                  : '다음엔 어떤 책 읽을까?'}
          </motion.p>

          {/* Primary (상단, 크게) */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { y: 20, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
            transition={reduce ? { duration: 0.2 } : { delay: 0.45 }}
            className="flex gap-4 flex-wrap justify-center mt-7"
          >
            {videoAvailable && (
              <button
                onClick={() => {
                  if (videoId) setVideoOpen(true);
                  else if (directVideoUrl)
                    window.open(directVideoUrl, '_blank', 'noopener,noreferrer');
                }}
                className={cn(
                  'flex items-center gap-2.5 px-8 py-4 rounded-xl font-black text-white shadow-pop',
                  'bg-gradient-to-br from-coral-400 to-coral-500 hover:brightness-105 active:brightness-95',
                  caseType === 'B' && 'text-lg px-10 py-5'
                )}
              >
                🎬 애니메이션 보기 ↗
              </button>
            )}
            {gameAvailable && (
              <button
                onClick={onPlayGame}
                className={cn(
                  'flex items-center gap-2.5 px-8 py-4 rounded-xl font-black text-white',
                  'bg-gradient-to-br from-fun to-[#7C3AED] shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:brightness-105',
                  caseType === 'C' && 'text-lg px-10 py-5'
                )}
              >
                🎮 게임 하러 가기
              </button>
            )}
            {caseType === 'D' && (
              <button
                onClick={onGoHome}
                className="flex items-center gap-2.5 px-10 py-5 rounded-xl font-black text-white shadow-pop bg-gradient-to-br from-coral-400 to-coral-500 hover:brightness-105 text-lg"
              >
                🏠 다른 책 보러 가기
              </button>
            )}
          </motion.div>

          {/* Secondary (하단, 작게) */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { y: 20, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
            transition={reduce ? { duration: 0.2 } : { delay: 0.55 }}
            className="flex gap-3 mt-5"
            {...motionItem}
          >
            {caseType !== 'D' && (
              <button
                onClick={onGoHome}
                className="px-5 py-2.5 bg-white rounded-lg shadow-soft font-bold text-sm text-ink-900 flex items-center gap-1.5"
              >
                🏠 다른 책
              </button>
            )}
            <button
              onClick={onRereadFromStart}
              className="px-5 py-2.5 bg-white rounded-lg shadow-soft font-bold text-sm text-ink-900 flex items-center gap-1.5"
            >
              ↻ 다시 읽기
            </button>
          </motion.div>
        </motion.div>
      )}
      {videoId && (
        <YouTubeModal
          videoId={videoId}
          open={videoOpen}
          onClose={() => setVideoOpen(false)}
          title={title}
        />
      )}
    </AnimatePresence>
  );
}
