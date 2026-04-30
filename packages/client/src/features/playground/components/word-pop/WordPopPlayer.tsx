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
const BALLOON_COLORS = ['coral-400', 'mint', 'blue', 'purple', 'fun'] as const;
const BALLOON_BG: Record<string, string> = {
  'coral-400': 'from-coral-400 to-coral-500',
  mint: 'from-emerald-400 to-emerald-500',
  blue: 'from-sky-400 to-sky-500',
  purple: 'from-purple-400 to-purple-500',
  fun: 'from-pink-400 to-pink-500',
};

interface Round {
  target: SrPoolItem;
  options: SrPoolItem[]; // OPTIONS_PER_ROUND 개 (target 포함, 셔플)
}

export function WordPopPlayer() {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  const { refetch: refetchBalance } = useStarBalance();
  const logBatch = useLogEventsBatch();

  const [lang] = useState<Lang>('ko');
  const { data: pool, isLoading } = useSrWordPool({
    language: lang,
    count: ROUND_COUNT * OPTIONS_PER_ROUND + 4, // 충분한 풀
  });

  const rounds = useMemo<Round[]>(() => {
    if (!pool) return [];
    // 단어가 충분한 풀 (OPTIONS_PER_ROUND 이상) — 한국어 라벨 있는 것만
    const eligible = pool.filter((p) => p.korean || p.word);
    if (eligible.length < OPTIONS_PER_ROUND) return [];

    const list: Round[] = [];
    const used = new Set<string>();
    for (let i = 0; i < ROUND_COUNT; i++) {
      // target: 미사용 우선, 없으면 무작위
      const target = eligible.find((p) => !used.has(p.word)) ?? eligible[i % eligible.length];
      used.add(target.word);

      // distractor 3개 — target 제외, language 같은 풀에서
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
  const [poppedIds, setPoppedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentRound: Round | undefined = rounds[roundIdx];

  const playTts = (item: SrPoolItem) => {
    // ttsUrl 있으면 audio, 없으면 Web Speech API
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
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === 'ko' ? 'ko-KR' : 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    }
  };

  // 라운드 시작 시 자동 TTS
  useEffect(() => {
    if (!currentRound) return;
    const t = setTimeout(() => playTts(currentRound.target), 400);
    return () => clearTimeout(t);
    // 라운드 진입 시 1회만 — currentRound 객체 referential 변동 무시
  }, [roundIdx, currentRound?.target.word]);

  // 마운트/언마운트 시 audio cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const handlePop = (option: SrPoolItem) => {
    if (busy || !currentRound) return;
    if (poppedIds.has(option.word)) return;
    const isCorrect = option.word === currentRound.target.word;

    setBusy(true);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setPoppedIds((prev) => new Set(prev).add(option.word));

    // 학습 이벤트 emit
    if (activeProfile?.id) {
      logBatch([
        {
          event_type: isCorrect ? 'word_correct' : 'word_wrong',
          game_type: 'word-pop',
          word: currentRound.target.word,
          metadata: { lang, source: 'storybook' },
        },
      ]);
    }

    if (isCorrect) {
      setScore((s) => s + 1);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
    }

    setTimeout(() => {
      setFeedback(null);
      setPoppedIds(new Set());
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
    setPoppedIds(new Set());
    setFinished(false);
    setBusy(false);
  };

  if (isLoading) return <LoadingScreen />;
  if (rounds.length === 0) return <NotEnoughWords onBack={() => navigate('/playground')} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-cream-50 dark:from-slate-900 dark:to-slate-800">
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

      <main className="px-6 pb-12 mt-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-black font-display text-ink-900 mb-1 text-center">
          🎈 풍선 터트리기
        </h1>
        <p className="text-center text-ink-700 font-bold mb-6">들리는 단어 풍선을 터트려봐!</p>

        {/* TTS 듣기 버튼 */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => currentRound && playTts(currentRound.target)}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-coral-400 to-coral-500 text-white font-black shadow-pop hover:brightness-110 active:scale-95 transition text-lg"
          >
            <span className="text-2xl">🔊</span>
            <span>다시 들어보기</span>
          </button>
        </div>

        {/* 풍선 4개 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <AnimatePresence mode="popLayout">
            {currentRound?.options.map((opt, idx) => {
              const popped = poppedIds.has(opt.word);
              const isTarget = opt.word === currentRound.target.word;
              const showWrong = popped && !isTarget;
              const color = BALLOON_COLORS[idx % BALLOON_COLORS.length];
              return (
                <motion.button
                  key={`${roundIdx}-${opt.word}`}
                  layout
                  initial={{ scale: 0, y: 80 }}
                  animate={{
                    scale: popped ? (isTarget ? 1.4 : 0.9) : 1,
                    y: popped ? -40 : 0,
                    opacity: popped ? 0 : 1,
                  }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 14,
                    delay: idx * 0.1,
                  }}
                  onClick={() => handlePop(opt)}
                  disabled={busy}
                  className={`relative aspect-[3/4] rounded-[50%_50%_50%_50%/55%_55%_45%_45%] bg-gradient-to-b ${BALLOON_BG[color]} text-white shadow-pop overflow-visible ${
                    showWrong ? 'animate-shake' : ''
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center px-2">
                    <span className="text-xl md:text-2xl font-black drop-shadow-md text-center break-words line-clamp-3">
                      {lang === 'ko' ? opt.korean || opt.word : opt.word}
                    </span>
                  </div>
                  {/* 풍선 끈 */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-px h-6 bg-ink-300" />
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
        <p className="mt-4 text-ink-700 font-bold">풍선을 띄우는 중...</p>
        <div className="mt-6 grid grid-cols-2 gap-3 max-w-xs mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-[50%]" />
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
      <p className="mt-2 text-ink-700">동화책을 좀 읽고 오면 풍선이 떠올라요</p>
      <button
        onClick={onBack}
        className="mt-6 px-5 py-3 rounded-full bg-coral-500 text-white font-black shadow-pop"
      >
        놀이터로
      </button>
    </div>
  );
}
