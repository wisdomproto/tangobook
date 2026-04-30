import { useEffect, useMemo, useRef, useState } from 'react';
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

interface Round {
  target: SrPoolItem;
  options: SrPoolItem[];
}

export function WordShoppingPlayer() {
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
    const eligible = pool.filter((p) => !!p.imageUrl);
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
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentRound: Round | undefined = rounds[roundIdx];

  const playTts = (item: SrPoolItem) => {
    if (item.ttsUrl) {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        const audio = new Audio(item.ttsUrl);
        audioRef.current = audio;
        void audio.play().catch(() => {});
        return;
      } catch {
        // fallthrough
      }
    }
    if ('speechSynthesis' in window) {
      const text = lang === 'ko' ? item.korean || item.word : item.word;
      // "X 가져다 줘" 또는 "Bring me X" 형식
      const phrase = lang === 'ko' ? `${text} 가져다 줘` : `Bring me ${text}`;
      const utter = new SpeechSynthesisUtterance(phrase);
      utter.lang = lang === 'ko' ? 'ko-KR' : 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    }
  };

  useEffect(() => {
    if (!currentRound) return;
    const t = setTimeout(() => playTts(currentRound.target), 400);
    return () => clearTimeout(t);
    // 라운드 진입 시 1회만
  }, [roundIdx, currentRound?.target.word]);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const handlePick = (option: SrPoolItem) => {
    if (busy || !currentRound) return;
    if (pickedIds.has(option.word)) return;
    const isCorrect = option.word === currentRound.target.word;

    setBusy(true);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setPickedIds((prev) => new Set(prev).add(option.word));

    if (activeProfile?.id) {
      logBatch([
        {
          event_type: isCorrect ? 'word_correct' : 'word_wrong',
          game_type: 'word-shopping',
          word: currentRound.target.word,
          metadata: { lang, source: 'storybook' },
        },
      ]);
    }

    if (isCorrect) {
      setScore((s) => s + 1);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    }

    setTimeout(() => {
      setFeedback(null);
      setPickedIds(new Set());
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
    setPickedIds(new Set());
    setFinished(false);
    setBusy(false);
  };

  if (isLoading) return <LoadingScreen />;
  if (rounds.length === 0) return <NotEnoughWords onBack={() => navigate('/playground')} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 via-orange-50 to-cream-50 dark:from-slate-900 dark:to-slate-800">
      <header className="px-6 pt-6 max-w-5xl mx-auto flex items-center justify-between">
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

      <main className="px-6 pb-12 mt-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-black font-display text-ink-900 mb-1 text-center">
          🛍️ 호리 쇼핑
        </h1>
        <p className="text-center text-ink-700 font-bold mb-6">엄마 목소리 듣고 매장에서 찾아봐!</p>

        {/* 호리 + TTS 듣기 */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3 shadow-pop">
            <Mascot state="pointing" size="md" />
            <div className="text-ink-900 font-bold">
              <div className="text-sm text-ink-500">호리 엄마</div>
              <div className="text-base">"{lang === 'ko' ? '가져다 줘!' : 'Bring me one!'}"</div>
            </div>
          </div>
          <button
            onClick={() => currentRound && playTts(currentRound.target)}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-coral-400 to-coral-500 text-white font-black shadow-pop hover:brightness-110 active:scale-95 transition"
          >
            <span className="text-xl">🔊</span>
            <span>다시 들어보기</span>
          </button>
        </div>

        {/* 4 그림 매대 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <AnimatePresence>
            {currentRound?.options.map((opt, idx) => {
              const picked = pickedIds.has(opt.word);
              const isTarget = opt.word === currentRound.target.word;
              const showWrong = picked && !isTarget;
              return (
                <motion.button
                  key={`${roundIdx}-${opt.word}`}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: picked && !isTarget ? 0.5 : 1,
                    scale: picked && isTarget ? 1.1 : 1,
                  }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 18, delay: idx * 0.08 }}
                  onClick={() => handlePick(opt)}
                  disabled={busy}
                  className={`relative aspect-square rounded-2xl bg-white shadow-soft overflow-hidden border-4
                    ${
                      picked && isTarget
                        ? 'border-success ring-4 ring-success/30'
                        : showWrong
                          ? 'border-danger animate-shake'
                          : 'border-yellow-200 hover:border-coral-300 hover:shadow-pop'
                    }`}
                >
                  <img
                    src={opt.imageUrl}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* 가격표 데코 */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/90 text-coral-600 text-xs font-black shadow-sm">
                    🏷️
                  </div>
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
    <div className="min-h-screen flex items-center justify-center bg-yellow-100">
      <div className="text-center">
        <Mascot state="thinking" size="lg" />
        <p className="mt-4 text-ink-700 font-bold">매대를 차리는 중...</p>
        <div className="mt-6 grid grid-cols-2 gap-3 max-w-xs mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotEnoughWords({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream-50 text-center">
      <Mascot state="thinking" size="lg" />
      <h2 className="mt-4 text-2xl font-black text-ink-900 font-display">단어가 더 필요해요!</h2>
      <p className="mt-2 text-ink-700">동화책을 좀 읽고 오면 매장이 채워져요</p>
      <button
        onClick={onBack}
        className="mt-6 px-5 py-3 rounded-full bg-coral-500 text-white font-black shadow-pop"
      >
        놀이터로
      </button>
    </div>
  );
}
