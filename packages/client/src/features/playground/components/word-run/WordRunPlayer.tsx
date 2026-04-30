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
const ROUND_DURATION_MS = 6000;
const LANE_OFFSETS = [10, 30, 55, 75]; // % from top

interface Round {
  target: SrPoolItem;
  options: SrPoolItem[];
}

export function WordRunPlayer() {
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
    const eligible = pool.filter((p) => p.korean || p.word);
    if (eligible.length < OPTIONS_PER_ROUND) return [];
    const list: Round[] = [];
    const used = new Set<string>();
    for (let i = 0; i < ROUND_COUNT; i++) {
      const target = eligible.find((p) => !used.has(p.word)) ?? eligible[i % eligible.length];
      used.add(target.word);
      const distractors: SrPoolItem[] = [];
      const cands = eligible.filter((p) => p.word !== target.word).sort(() => Math.random() - 0.5);
      for (const c of cands) {
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
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);

  const currentRound: Round | undefined = rounds[roundIdx];

  // 라운드 타임아웃
  useEffect(() => {
    if (!currentRound || busy || finished) return;
    const timer = setTimeout(() => {
      handleTimeout();
    }, ROUND_DURATION_MS);
    return () => clearTimeout(timer);
    // 라운드 진입 1회만 (handleTimeout 의존성 제외)
  }, [roundIdx, currentRound]);

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
    setTimeout(advance, 900);
  };

  const handleCatch = (option: SrPoolItem) => {
    if (busy || !currentRound) return;
    const isCorrect = option.word === currentRound.target.word;
    setBusy(true);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (activeProfile?.id) {
      logBatch([
        {
          event_type: isCorrect ? 'word_correct' : 'word_wrong',
          game_type: 'word-run',
          word: currentRound.target.word,
          metadata: { lang, source: 'storybook' },
        },
      ]);
    }
    if (isCorrect) {
      setScore((s) => s + 1);
      confetti({ particleCount: 40, spread: 60, origin: { x: 0.2, y: 0.6 } });
    }
    setTimeout(advance, 900);
  };

  const handleRestart = () => {
    setRoundIdx(0);
    setScore(0);
    setFinished(false);
    setBusy(false);
  };

  if (isLoading) return <LoadingScreen />;
  if (rounds.length === 0) return <NotEnoughWords onBack={() => navigate('/playground')} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-200 via-emerald-100 to-amber-100 dark:from-slate-900 dark:to-slate-800">
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

      <main className="px-6 mt-4 max-w-5xl mx-auto">
        <h1 className="text-2xl font-black font-display text-ink-900 mb-1 text-center">
          🏃 단어 러닝
        </h1>
        <p className="text-center text-ink-700 font-bold mb-2">
          호리에게{' '}
          <span className="text-coral-500">
            "
            {currentRound &&
              (lang === 'ko'
                ? currentRound.target.korean || currentRound.target.word
                : currentRound.target.word)}
            "
          </span>{' '}
          줘!
        </p>
      </main>

      {/* 러닝 트랙 */}
      <div className="relative mt-2 mx-auto max-w-6xl h-[60vh] min-h-[400px] overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 to-emerald-50 mx-6 shadow-card">
        {/* 땅 */}
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-b from-amber-200 to-amber-300" />

        {/* 트랙 라인 (지나가는 표시) */}
        <motion.div
          className="absolute inset-x-0 bottom-[20%] flex gap-12"
          animate={{ x: [-200, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="w-12 h-1 bg-amber-400/60 rounded-full shrink-0" />
          ))}
        </motion.div>

        {/* 호리 (왼쪽 고정, idle bounce) */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-6 md:left-12 bottom-[18%] z-10"
        >
          <Mascot state="cheering" size="xl" />
        </motion.div>

        {/* 시간 진행 바 */}
        <div className="absolute top-3 left-3 right-3 h-2 bg-white/40 rounded-full overflow-hidden z-10">
          <motion.div
            key={`bar-${roundIdx}`}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: ROUND_DURATION_MS / 1000, ease: 'linear' }}
            className="h-full bg-gradient-to-r from-coral-400 to-coral-500"
          />
        </div>

        {/* 단어 카드 — 오른쪽에서 왼쪽으로 흐름 */}
        <AnimatePresence mode="popLayout">
          {currentRound?.options.map((opt, idx) => (
            <motion.button
              key={`${roundIdx}-${opt.word}`}
              initial={{ x: '110%', opacity: 1 }}
              animate={{ x: '-130%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: ROUND_DURATION_MS / 1000, ease: 'linear' }}
              onClick={() => handleCatch(opt)}
              disabled={busy}
              style={{ top: `${LANE_OFFSETS[idx]}%` }}
              className="absolute right-0 -translate-y-1/2 px-5 py-3 rounded-2xl bg-white shadow-pop border-2 border-coral-300 font-black text-ink-900 text-lg md:text-xl hover:scale-110 active:scale-95 transition"
            >
              {lang === 'ko' ? opt.korean || opt.word : opt.word}
            </motion.button>
          ))}
        </AnimatePresence>

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
    <div className="min-h-screen flex items-center justify-center bg-emerald-100">
      <div className="text-center">
        <Mascot state="thinking" size="lg" />
        <p className="mt-4 text-ink-700 font-bold">트랙을 준비하는 중...</p>
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
      <p className="mt-2 text-ink-700">동화책을 좀 읽고 오면 트랙이 준비돼요</p>
      <button
        onClick={onBack}
        className="mt-6 px-5 py-3 rounded-full bg-coral-500 text-white font-black shadow-pop"
      >
        놀이터로
      </button>
    </div>
  );
}
