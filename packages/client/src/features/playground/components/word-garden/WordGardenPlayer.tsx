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
const STAGES = ['🌱', '🌿', '🌷', '🌸'] as const; // seed → sprout → bud → bloom (4단계)
const STAGE_NAMES = ['씨앗', '새싹', '꽃봉오리', '활짝!'];

/** localStorage 정원 상태 — per-profile */
interface GardenState {
  currentStage: number; // 0..3 (이번 꽃의 진행 단계)
  bloomedFlowers: string[]; // 만개한 꽃 (이모지) 배열, 영구 보존
  lastGrownDate: string | null; // YYYY-MM-DD
}

const DEFAULT: GardenState = { currentStage: 0, bloomedFlowers: [], lastGrownDate: null };
const KEY = (profileId: string | null) => `garden:${profileId ?? 'guest'}`;

function readGarden(profileId: string | null): GardenState {
  try {
    const raw = localStorage.getItem(KEY(profileId));
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as GardenState;
    return { ...DEFAULT, ...parsed };
  } catch {
    return DEFAULT;
  }
}
function writeGarden(profileId: string | null, state: GardenState) {
  try {
    localStorage.setItem(KEY(profileId), JSON.stringify(state));
  } catch {
    // ignore
  }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Round {
  target: SrPoolItem;
  options: SrPoolItem[];
}

export function WordGardenPlayer() {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  const { refetch: refetchBalance } = useStarBalance();
  const logBatch = useLogEventsBatch();

  const [lang] = useState<Lang>('ko');
  const profileId = activeProfile?.id ?? null;
  const [garden, setGarden] = useState<GardenState>(() => readGarden(profileId));

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
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const [grewToday, setGrewToday] = useState(false);

  const currentRound: Round | undefined = rounds[roundIdx];

  const handlePick = (option: SrPoolItem) => {
    if (busy || !currentRound) return;
    const isCorrect = option.word === currentRound.target.word;
    setBusy(true);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (activeProfile?.id) {
      logBatch([
        {
          event_type: isCorrect ? 'word_correct' : 'word_wrong',
          game_type: 'word-garden',
          word: currentRound.target.word,
          metadata: { lang, source: 'storybook' },
        },
      ]);
    }
    if (isCorrect) {
      setScore((s) => s + 1);
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.5 } });
    }

    setTimeout(() => {
      setFeedback(null);
      if (roundIdx + 1 >= rounds.length) {
        // 게임 완료 — 4문제 이상 정답이고 오늘 아직 안 자랐으면 단계 +1
        const finalScore = score + (isCorrect ? 1 : 0);
        const passing = finalScore >= 4;
        const today = todayStr();
        if (passing && garden.lastGrownDate !== today) {
          const newStage = Math.min(3, garden.currentStage + 1);
          let bloomed = garden.bloomedFlowers;
          let resetStage = newStage;
          if (newStage === 3) {
            // 만개! 정원에 영구 추가 + 새 씨앗
            const flower = STAGES[3];
            bloomed = [...garden.bloomedFlowers, flower];
            resetStage = 0;
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
          }
          const next: GardenState = {
            currentStage: resetStage,
            bloomedFlowers: bloomed,
            lastGrownDate: today,
          };
          writeGarden(profileId, next);
          setGarden(next);
          setGrewToday(true);
        }
        setFinished(true);
        void refetchBalance();
      } else {
        setRoundIdx(roundIdx + 1);
      }
      setBusy(false);
    }, 900);
  };

  const handleRestart = () => {
    setRoundIdx(0);
    setScore(0);
    setFinished(false);
    setBusy(false);
    setGrewToday(false);
  };

  if (isLoading) return <LoadingScreen />;
  if (rounds.length === 0) return <NotEnoughWords onBack={() => navigate('/playground')} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 via-emerald-50 to-cream-50 dark:from-slate-900 dark:to-slate-800">
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
          🌷 정원 가꾸기
        </h1>
        <p className="text-center text-ink-700 font-bold mb-2">맞히면 꽃이 자라요! 매일 한 단계</p>

        {/* 정원 — 만개한 꽃들 + 현재 진행 */}
        <GardenView garden={garden} />

        {/* 문제 — 그림 1장 + 단어 옵션 4개 */}
        <div className="mt-6">
          <div className="flex justify-center mb-4">
            <AnimatePresence mode="wait">
              {currentRound && (
                <motion.div
                  key={`img-${roundIdx}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-44 h-44 rounded-3xl overflow-hidden shadow-pop bg-white border-4 border-emerald-300"
                >
                  <img
                    src={currentRound.target.imageUrl}
                    alt=""
                    aria-hidden
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {currentRound?.options.map((opt) => (
              <button
                key={`${roundIdx}-${opt.word}`}
                onClick={() => handlePick(opt)}
                disabled={busy}
                className="px-4 py-3 rounded-2xl bg-white shadow-soft border-2 border-emerald-200 font-black text-ink-900 text-lg md:text-xl hover:shadow-pop hover:border-emerald-400 active:scale-95 transition"
              >
                {lang === 'ko' ? opt.korean || opt.word : opt.word}
              </button>
            ))}
          </div>
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
            grewToday={grewToday}
            currentStage={garden.currentStage}
            onRestart={handleRestart}
            onBack={() => navigate('/playground')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function GardenView({ garden }: { garden: GardenState }) {
  return (
    <div className="bg-white rounded-3xl shadow-soft p-5 border-2 border-emerald-200">
      {/* 만개한 꽃들 */}
      <div className="text-sm font-bold text-ink-500 mb-2">내 정원</div>
      <div className="min-h-[60px] flex flex-wrap gap-2 items-center mb-3 px-3 py-2 bg-gradient-to-r from-emerald-50 to-yellow-50 rounded-2xl">
        {garden.bloomedFlowers.length === 0 ? (
          <span className="text-ink-500 text-sm font-bold">아직 꽃이 없어요!</span>
        ) : (
          garden.bloomedFlowers.map((f, i) => (
            <span key={i} className="text-3xl">
              {f}
            </span>
          ))
        )}
      </div>
      {/* 현재 진행 단계 */}
      <div className="flex items-center gap-3">
        <span className="text-5xl">{STAGES[garden.currentStage]}</span>
        <div className="flex-1">
          <div className="text-sm font-bold text-ink-700">{STAGE_NAMES[garden.currentStage]}</div>
          <div className="mt-1 flex gap-1">
            {STAGES.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full ${
                  i < garden.currentStage
                    ? 'bg-emerald-500'
                    : i === garden.currentStage
                      ? 'bg-emerald-300'
                      : 'bg-ink-100'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      {garden.lastGrownDate === todayStr() && (
        <div className="mt-2 text-xs text-emerald-600 font-bold text-center">
          오늘 자란 단계! 내일 또 와요 🌱
        </div>
      )}
    </div>
  );
}

function ResultOverlay({
  score,
  total,
  grewToday,
  currentStage,
  onRestart,
  onBack,
}: {
  score: number;
  total: number;
  grewToday: boolean;
  currentStage: number;
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
        {grewToday ? (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 font-black">
            <div className="text-3xl mb-1">{STAGES[currentStage]}</div>
            <div>꽃이 한 단계 자랐어요!</div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-ink-500">(4문제 이상 맞히면 꽃이 자라요)</div>
        )}
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
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="text-center">
        <Mascot state="thinking" size="lg" />
        <p className="mt-4 text-ink-700 font-bold">정원에 물을 주는 중...</p>
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
      <p className="mt-2 text-ink-700">동화책을 좀 읽고 오면 정원이 준비돼요</p>
      <button
        onClick={onBack}
        className="mt-6 px-5 py-3 rounded-full bg-coral-500 text-white font-black shadow-pop"
      >
        놀이터로
      </button>
    </div>
  );
}
