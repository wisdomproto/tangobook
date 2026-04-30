import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { type Lang, type SrPoolItem } from '@tangobook/shared';
import { Mascot, Skeleton } from '@/design-system';
import { StarCounter, useStarBalance } from '@/features/rewards';
import { useLogEventsBatch } from '@/features/learning';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useSrWordPool } from '../../hooks/useSrWordPool';

const ROUND_COUNT = 5;
const OPTIONS_PER_ROUND = 4;
const FISH_COLORS = ['coral-400', 'mint', 'blue', 'purple'] as const;
const FISH_BG: Record<string, string> = {
  'coral-400': 'from-coral-300 to-coral-500',
  mint: 'from-emerald-300 to-emerald-500',
  blue: 'from-sky-300 to-sky-500',
  purple: 'from-purple-300 to-purple-500',
};

interface Round {
  target: SrPoolItem; // 이미지 (target)
  options: SrPoolItem[]; // 단어 옵션 4개
}

export function WordFishingPlayer() {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  const { refetch: refetchBalance } = useStarBalance();
  const logBatch = useLogEventsBatch();

  const [lang] = useState<Lang>('ko');
  const { data: pool, isLoading } = useSrWordPool({
    language: lang,
    count: ROUND_COUNT * OPTIONS_PER_ROUND + 4,
  });

  const rounds = useMemo<Round[]>(() => {
    if (!pool) return [];
    const eligible = pool.filter((p) => !!p.imageUrl && (p.korean || p.word));
    if (eligible.length < OPTIONS_PER_ROUND) return [];

    const list: Round[] = [];
    const used = new Set<string>();
    for (let i = 0; i < ROUND_COUNT; i++) {
      const target = eligible.find((p) => !used.has(p.word)) ?? eligible[i % eligible.length];
      used.add(target.word);

      const distractors: SrPoolItem[] = [];
      const candidates = eligible.filter((p) => p.word !== target.word);
      const shuffled = candidates.slice().sort(() => Math.random() - 0.5);
      for (const c of shuffled) {
        if (distractors.length >= OPTIONS_PER_ROUND - 1) break;
        if (!distractors.find((d) => d.word === c.word)) distractors.push(c);
      }
      const options = [target, ...distractors].sort(() => Math.random() - 0.5);
      list.push({ target, options });
    }
    return list;
  }, [pool]);

  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [caughtIds, setCaughtIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);

  const currentRound: Round | undefined = rounds[roundIdx];

  useEffect(() => {
    setCaughtIds(new Set());
    setFeedback(null);
  }, [roundIdx]);

  const handleCatch = (option: SrPoolItem) => {
    if (busy || !currentRound) return;
    if (caughtIds.has(option.word)) return;
    const isCorrect = option.word === currentRound.target.word;

    setBusy(true);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setCaughtIds((prev) => new Set(prev).add(option.word));

    if (activeProfile?.id) {
      logBatch([
        {
          event_type: isCorrect ? 'word_correct' : 'word_wrong',
          game_type: 'word-fishing',
          word: currentRound.target.word,
          metadata: { lang, source: 'storybook' },
        },
      ]);
    }

    if (isCorrect) {
      setScore((s) => s + 1);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    }

    setTimeout(() => {
      setFeedback(null);
      if (roundIdx + 1 >= rounds.length) {
        setFinished(true);
        void refetchBalance();
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
      } else {
        setRoundIdx(roundIdx + 1);
      }
      setBusy(false);
    }, 1100);
  };

  const handleRestart = () => {
    setRoundIdx(0);
    setScore(0);
    setCaughtIds(new Set());
    setFinished(false);
    setBusy(false);
  };

  if (isLoading) return <LoadingScreen />;
  if (rounds.length === 0) return <NotEnoughWords onBack={() => navigate('/playground')} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-emerald-50 to-cream-50 dark:from-slate-900 dark:to-slate-800">
      {/* 물 무늬 데코 */}
      <div className="absolute inset-x-0 top-32 h-1 bg-sky-300/40" />
      <div className="absolute inset-x-0 top-40 h-1 bg-sky-300/30" />

      <header className="relative px-6 pt-6 max-w-5xl mx-auto flex items-center justify-between">
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

      <main className="relative px-6 pb-12 mt-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-black font-display text-ink-900 mb-1 text-center">
          🎣 단어 낚시
        </h1>
        <p className="text-center text-ink-700 font-bold mb-6">그림에 맞는 단어 물고기를 낚아봐!</p>

        {/* 그림 */}
        <div className="flex justify-center mb-8">
          <AnimatePresence mode="wait">
            {currentRound && (
              <motion.div
                key={`img-${roundIdx}`}
                initial={{ scale: 0.8, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                className="relative w-48 h-48 md:w-56 md:h-56 rounded-3xl overflow-hidden shadow-pop bg-white border-4 border-coral-300"
              >
                <img
                  src={currentRound.target.imageUrl}
                  alt=""
                  aria-hidden
                  className="w-full h-full object-cover"
                />
                {/* 낚싯줄 데코 — 위쪽 */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-px h-6 bg-ink-700" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 단어 물고기 4개 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <AnimatePresence>
            {currentRound?.options.map((opt, idx) => {
              const caught = caughtIds.has(opt.word);
              const isTarget = opt.word === currentRound.target.word;
              const showWrong = caught && !isTarget;
              const color = FISH_COLORS[idx % FISH_COLORS.length];
              return (
                <motion.button
                  key={`${roundIdx}-${opt.word}`}
                  initial={{ x: idx % 2 ? 100 : -100, opacity: 0 }}
                  animate={{
                    x: caught ? (isTarget ? 0 : 0) : 0,
                    y: caught ? (isTarget ? -100 : 0) : 0,
                    rotate: caught && isTarget ? 0 : [0, 4, 0, -4, 0],
                    opacity: caught && !isTarget ? 0.4 : 1,
                  }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={
                    caught
                      ? { duration: 0.4 }
                      : { rotate: { duration: 2, repeat: Infinity }, x: { delay: idx * 0.1 } }
                  }
                  onClick={() => handleCatch(opt)}
                  disabled={busy}
                  className={`relative aspect-[5/3] rounded-[60%_30%_60%_30%/60%_60%_40%_40%] bg-gradient-to-r ${FISH_BG[color]} text-white shadow-pop overflow-visible
                    ${showWrong ? 'animate-shake' : ''}
                    ${caught && isTarget ? 'ring-4 ring-yellow-300' : ''}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center px-3">
                    <span className="text-xl md:text-2xl font-black drop-shadow-md text-center break-words line-clamp-2">
                      {lang === 'ko' ? opt.korean || opt.word : opt.word}
                    </span>
                  </div>
                  {/* 물고기 꼬리 */}
                  <div
                    className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-0 h-0 border-t-[20px] border-b-[20px] border-l-[20px] border-t-transparent border-b-transparent
                      ${color === 'coral-400' ? 'border-l-coral-500' : color === 'mint' ? 'border-l-emerald-500' : color === 'blue' ? 'border-l-sky-500' : 'border-l-purple-500'}`}
                  />
                  {/* 눈 */}
                  <div className="absolute left-3 top-3 w-3 h-3 rounded-full bg-white" />
                  <div className="absolute left-3.5 top-3.5 w-1.5 h-1.5 rounded-full bg-ink-900" />
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* 피드백 */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
            >
              <div
                className={`text-9xl drop-shadow-2xl ${
                  feedback === 'correct' ? 'text-success' : 'text-danger'
                }`}
              >
                {feedback === 'correct' ? '🎉' : '😅'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
    <div className="min-h-screen flex items-center justify-center bg-sky-100">
      <div className="text-center">
        <Mascot state="thinking" size="lg" />
        <p className="mt-4 text-ink-700 font-bold">물고기를 풀어놓는 중...</p>
        <Skeleton className="mt-6 w-48 h-48 mx-auto rounded-3xl" />
      </div>
    </div>
  );
}

function NotEnoughWords({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream-50 text-center">
      <Mascot state="thinking" size="lg" />
      <h2 className="mt-4 text-2xl font-black text-ink-900 font-display">단어가 더 필요해요!</h2>
      <p className="mt-2 text-ink-700">동화책을 좀 읽고 오면 물고기가 헤엄쳐와요</p>
      <button
        onClick={onBack}
        className="mt-6 px-5 py-3 rounded-full bg-coral-500 text-white font-black shadow-pop"
      >
        놀이터로
      </button>
    </div>
  );
}
