import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  type Lang,
  type SrPoolItemWithCategory,
  type WordCategoryId,
  WORD_CATEGORY_META,
  WORD_CATEGORY_PAIRS,
} from '@tangobook/shared';
import { Mascot, Skeleton } from '@/design-system';
import { StarCounter, useStarBalance } from '@/features/rewards';
import { useLogEventsBatch } from '@/features/learning';
import { useAuth } from '@/features/auth/context/AuthContext';
import { playgroundApi } from '../../api/playground.api';

const ROUND_COUNT = 6;
const FALL_DURATION_MS = 5000;

interface RoundItem {
  word: SrPoolItemWithCategory;
  correctCat: WordCategoryId;
}

const COLOR_BG: Record<string, string> = {
  coral: 'from-coral-300 to-coral-500',
  mint: 'from-emerald-300 to-emerald-500',
  yellow: 'from-yellow-300 to-amber-500',
  blue: 'from-sky-300 to-sky-500',
  fun: 'from-pink-300 to-pink-500',
  purple: 'from-purple-300 to-purple-500',
};

export function WordSortCartPlayer() {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  const { refetch: refetchBalance } = useStarBalance();
  const logBatch = useLogEventsBatch();

  const [lang] = useState<Lang>('ko');
  // 게임 시작 시 1번 결정되는 카테고리 쌍
  const [pair] = useState(
    () => WORD_CATEGORY_PAIRS[Math.floor(Math.random() * WORD_CATEGORY_PAIRS.length)]
  );
  const [cat1, cat2] = pair;
  const cat1Meta = WORD_CATEGORY_META[cat1];
  const cat2Meta = WORD_CATEGORY_META[cat2];

  const { data, isLoading } = useQuery({
    queryKey: ['playground', 'sort-cart', lang, cat1, cat2],
    queryFn: () =>
      playgroundApi.getCategoryPool({ language: lang, cat1, cat2, countPerCat: ROUND_COUNT }),
    staleTime: 60_000,
  });

  const rounds = useMemo<RoundItem[]>(() => {
    if (!data) return [];
    const list: RoundItem[] = [];
    const c1 = data.cat1Items.slice(0, ROUND_COUNT);
    const c2 = data.cat2Items.slice(0, ROUND_COUNT);
    const max = Math.min(c1.length, c2.length, Math.ceil(ROUND_COUNT / 2));
    for (let i = 0; i < max; i++) {
      list.push({ word: c1[i], correctCat: cat1 });
      list.push({ word: c2[i], correctCat: cat2 });
    }
    return list.sort(() => Math.random() - 0.5).slice(0, ROUND_COUNT);
  }, [data, cat1, cat2]);

  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);

  const currentItem: RoundItem | undefined = rounds[roundIdx];

  // 라운드 타임아웃
  useEffect(() => {
    if (!currentItem || busy || finished) return;
    const timer = setTimeout(() => {
      handleTimeout();
    }, FALL_DURATION_MS);
    return () => clearTimeout(timer);
    // 라운드 진입 1회만
  }, [roundIdx, currentItem]);

  const advance = () => {
    setFeedback(null);
    if (roundIdx + 1 >= rounds.length) {
      setFinished(true);
      void refetchBalance();
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
    } else {
      setRoundIdx(roundIdx + 1);
    }
    setBusy(false);
  };

  const handleTimeout = () => {
    if (busy) return;
    setBusy(true);
    setFeedback('timeout');
    setTimeout(advance, 800);
  };

  const handleSort = (chosenCat: WordCategoryId) => {
    if (busy || !currentItem) return;
    const isCorrect = chosenCat === currentItem.correctCat;
    setBusy(true);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (activeProfile?.id) {
      logBatch([
        {
          event_type: isCorrect ? 'word_correct' : 'word_wrong',
          game_type: 'word-sort-cart',
          word: currentItem.word.word,
          metadata: { lang, source: 'storybook' },
        },
      ]);
    }
    if (isCorrect) {
      setScore((s) => s + 1);
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    }
    setTimeout(advance, 800);
  };

  const handleRestart = () => {
    setRoundIdx(0);
    setScore(0);
    setFinished(false);
    setBusy(false);
  };

  if (isLoading) return <LoadingScreen />;
  if (rounds.length < 2) return <NotEnoughWords onBack={() => navigate('/playground')} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-pink-50 to-cream-50 dark:from-slate-900 dark:to-slate-800">
      <header className="px-6 pt-6 max-w-5xl mx-auto flex items-center justify-between relative z-10">
        <button
          onClick={() => navigate('/playground')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
        >
          ← 놀이터
        </button>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-white shadow-soft text-coral-600 font-black">
            {roundIdx + 1} / {rounds.length}
          </div>
          <StarCounter />
        </div>
      </header>

      <main className="px-6 mt-2 max-w-5xl mx-auto">
        <h1 className="text-2xl font-black font-display text-ink-900 mb-1 text-center">
          🛒 분류 카트
        </h1>
        <p className="text-center text-ink-700 font-bold mb-2">단어가 어디 카트에 들어가야 할까?</p>
      </main>

      {/* 분류 영역 */}
      <div className="relative mx-6 mt-2 max-w-6xl mx-auto h-[55vh] min-h-[420px] overflow-hidden rounded-3xl bg-white shadow-card">
        {/* 시간 진행 바 */}
        <div className="absolute top-3 left-3 right-3 h-2 bg-ink-100 rounded-full overflow-hidden z-10">
          <motion.div
            key={`bar-${roundIdx}`}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: FALL_DURATION_MS / 1000, ease: 'linear' }}
            className="h-full bg-gradient-to-r from-coral-400 to-coral-500"
          />
        </div>

        {/* 떨어지는 단어 카드 */}
        <AnimatePresence mode="popLayout">
          {currentItem && (
            <motion.div
              key={`word-${roundIdx}`}
              initial={{ y: '-30%', opacity: 0, scale: 0.8 }}
              animate={{ y: '60%', opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{
                y: { duration: FALL_DURATION_MS / 1000, ease: 'linear' },
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
              }}
              className="absolute left-1/2 -translate-x-1/2 top-12 px-8 py-4 rounded-2xl bg-gradient-to-br from-coral-100 to-peach-200 border-4 border-coral-300 shadow-pop"
            >
              <div className="text-3xl md:text-4xl font-black font-display text-ink-900 text-center min-w-[180px]">
                {lang === 'ko'
                  ? currentItem.word.korean || currentItem.word.word
                  : currentItem.word.word}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 두 카트 — 하단 좌우 */}
        <div className="absolute bottom-0 inset-x-0 grid grid-cols-2 gap-4 p-4">
          <CartButton meta={cat1Meta} onClick={() => handleSort(cat1)} disabled={busy} />
          <CartButton meta={cat2Meta} onClick={() => handleSort(cat2)} disabled={busy} />
        </div>

        {/* 피드백 */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
            >
              <div
                className={`text-9xl drop-shadow-2xl ${
                  feedback === 'correct'
                    ? 'text-success'
                    : feedback === 'wrong'
                      ? 'text-danger'
                      : 'text-ink-500'
                }`}
              >
                {feedback === 'correct' ? '🎉' : feedback === 'wrong' ? '😅' : '⌛'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {finished && (
          <ResultOverlay
            score={score}
            total={rounds.length}
            onRestart={handleRestart}
            onBack={() => navigate('/playground')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CartButton({
  meta,
  onClick,
  disabled,
}: {
  meta: { nameKo: string; emoji: string; color: string };
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <motion.button
      whileHover={!disabled ? { y: -4 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className={`relative aspect-[5/3] rounded-3xl bg-gradient-to-br ${COLOR_BG[meta.color] ?? COLOR_BG.coral} text-white shadow-pop flex flex-col items-center justify-center gap-2 border-4 border-white`}
    >
      <span className="text-5xl drop-shadow-md">🛒</span>
      <div className="text-2xl font-black font-display drop-shadow-md flex items-center gap-2">
        <span>{meta.emoji}</span>
        <span>{meta.nameKo}</span>
      </div>
    </motion.button>
  );
}

function ResultOverlay({
  score,
  total,
  onRestart,
  onBack,
}: {
  score: number;
  total: number;
  onRestart: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.7, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        className="bg-white rounded-3xl shadow-pop p-8 max-w-sm w-full text-center"
      >
        <Mascot state="celebrating" size="lg" />
        <h2 className="mt-4 text-3xl font-black font-display text-ink-900">완성!</h2>
        <p className="mt-2 text-lg font-bold text-ink-700">
          <span className="text-coral-500">{score}</span>
          <span> / {total}</span>
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={onRestart}
            className="px-5 py-3 rounded-full bg-gradient-to-r from-coral-400 to-coral-500 text-white font-black shadow-pop"
          >
            🔄 다시
          </button>
          <button
            onClick={onBack}
            className="px-5 py-3 rounded-full bg-white border-2 border-ink-100 text-ink-700 font-black"
          >
            🏠 놀이터
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-100">
      <div className="text-center">
        <Mascot state="thinking" size="lg" />
        <p className="mt-4 text-ink-700 font-bold">카트를 준비하는 중...</p>
        <Skeleton className="mt-6 w-64 h-32 mx-auto rounded-2xl" />
      </div>
    </div>
  );
}

function NotEnoughWords({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream-50 text-center">
      <Mascot state="thinking" size="lg" />
      <h2 className="mt-4 text-2xl font-black text-ink-900 font-display">단어가 더 필요해요!</h2>
      <p className="mt-2 text-ink-700">두 카테고리에 분류할 단어가 부족해요</p>
      <button
        onClick={onBack}
        className="mt-6 px-5 py-3 rounded-full bg-coral-500 text-white font-black shadow-pop"
      >
        놀이터로
      </button>
    </div>
  );
}
