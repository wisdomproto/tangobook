import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { BlendingExercise, WordFamily } from '@tangobook/shared';

interface QuizWord {
  word: string;
  imageUrl: string;
  ttsUrl: string;
  letterIdx: number;
}

interface QuizRound {
  target: QuizWord;
  distractor: QuizWord;
  /** true = target이 왼쪽 */
  targetLeft: boolean;
}

interface ListeningQuizGameProps {
  letters: BlendingExercise[];
  wordFamilies: WordFamily[];
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuizWords(letters: BlendingExercise[], wordFamilies: WordFamily[]): QuizWord[] {
  const words: QuizWord[] = [];

  letters.forEach((item, idx) => {
    // exampleWord
    if (item.exampleWordImageUrl && item.exampleWordTtsUrl) {
      words.push({
        word: item.exampleWord,
        imageUrl: item.exampleWordImageUrl,
        ttsUrl: item.exampleWordTtsUrl,
        letterIdx: idx,
      });
    }
    // wordFamily words
    const wf = wordFamilies[idx];
    if (wf) {
      for (const w of wf.words) {
        if (w.imageUrl && w.ttsUrl) {
          // exampleWord와 중복 방지
          if (w.word === item.exampleWord) continue;
          words.push({
            word: w.word,
            imageUrl: w.imageUrl,
            ttsUrl: w.ttsUrl,
            letterIdx: idx,
          });
        }
      }
    }
  });

  return words;
}

function buildRounds(allWords: QuizWord[]): QuizRound[] {
  if (allWords.length < 2) return [];

  const shuffled = shuffle(allWords);
  return shuffled.map((target) => {
    // 다른 letterIdx에서 distractor 선택 (가능하면)
    let candidates = allWords.filter(
      (w) => w.letterIdx !== target.letterIdx && w.word !== target.word
    );
    if (candidates.length === 0) {
      candidates = allWords.filter((w) => w.word !== target.word);
    }
    const distractor = candidates[Math.floor(Math.random() * candidates.length)];
    return {
      target,
      distractor,
      targetLeft: Math.random() < 0.5,
    };
  });
}

export function ListeningQuizGame({ letters, wordFamilies, systemSounds }: ListeningQuizGameProps) {
  const allWords = useMemo(() => buildQuizWords(letters, wordFamilies), [letters, wordFamilies]);
  const [rounds, setRounds] = useState<QuizRound[]>(() => buildRounds(allWords));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<'left' | 'right' | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = rounds[currentIdx] as QuizRound | undefined;

  const playAudio = useCallback((url?: string) => {
    if (!url) return;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const playDefaultSound = useCallback((correct: boolean) => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      if (correct) {
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.setValueAtTime(262, ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const playFeedback = useCallback(
    (correct: boolean) => {
      const url = correct ? systemSounds?.correctUrl : systemSounds?.incorrectUrl;
      if (url) {
        playAudio(url);
      } else {
        playDefaultSound(correct);
      }
    },
    [systemSounds, playAudio, playDefaultSound]
  );

  // 라운드 시작 시 TTS 자동 재생
  useEffect(() => {
    if (current && !finished) {
      const timer = setTimeout(() => playAudio(current.target.ttsUrl), 400);
      return () => clearTimeout(timer);
    }
  }, [currentIdx, finished]);

  const handleSelect = useCallback(
    (side: 'left' | 'right') => {
      if (selected !== null || !current) return;
      const isTargetSide = current.targetLeft ? side === 'left' : side === 'right';
      setSelected(side);
      setIsCorrect(isTargetSide);
      playFeedback(isTargetSide);

      if (isTargetSide) {
        setScore((s) => s + 1);
        setTimeout(() => {
          if (currentIdx + 1 >= rounds.length) {
            setFinished(true);
          } else {
            setCurrentIdx((i) => i + 1);
            setSelected(null);
            setIsCorrect(null);
          }
        }, 1000);
      } else {
        // 오답: 잠시 후 선택 초기화 (재시도)
        setTimeout(() => {
          setSelected(null);
          setIsCorrect(null);
        }, 800);
      }
    },
    [selected, current, currentIdx, rounds.length, playFeedback]
  );

  const handleRestart = () => {
    setRounds(buildRounds(allWords));
    setCurrentIdx(0);
    setScore(0);
    setSelected(null);
    setIsCorrect(null);
    setFinished(false);
  };

  if (allWords.length < 2) {
    return (
      <div className="text-center py-20 text-slate-400 dark:text-slate-500">
        <p className="text-lg mb-2">듣기 퀴즈를 진행할 수 없습니다</p>
        <p className="text-sm">이미지와 TTS가 있는 단어가 2개 이상 필요합니다.</p>
      </div>
    );
  }

  if (finished) {
    const perfect = score === rounds.length;
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">{perfect ? '🎉' : '👏'}</div>
        <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">
          {score} / {rounds.length}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {perfect ? '완벽해요!' : '잘했어요!'}
        </p>
        <button
          onClick={handleRestart}
          className="px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors"
        >
          다시 하기
        </button>
      </div>
    );
  }

  if (!current) return null;

  const leftWord = current.targetLeft ? current.target : current.distractor;
  const rightWord = current.targetLeft ? current.distractor : current.target;

  const getCardClass = (side: 'left' | 'right') => {
    const base = 'relative rounded-2xl overflow-hidden border-4 transition-all cursor-pointer';
    if (selected === side) {
      if (isCorrect) return `${base} border-emerald-400 scale-105 shadow-lg shadow-emerald-200/50`;
      return `${base} border-red-400 animate-shake`;
    }
    return `${base} border-slate-200 dark:border-slate-600 hover:border-violet-300 hover:shadow-md`;
  };

  return (
    <div className="space-y-6">
      {/* 진행률 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
          Q{currentIdx + 1} / {rounds.length}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: rounds.length }, (_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i < currentIdx
                  ? 'bg-emerald-400'
                  : i === currentIdx
                    ? 'bg-violet-500'
                    : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 듣기 버튼 */}
      <div className="text-center">
        <button
          onClick={() => playAudio(current.target.ttsUrl)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
        >
          <span className="text-xl">🔊</span>
          다시 듣기
        </button>
      </div>

      {/* 이미지 2개 */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleSelect('left')}
          disabled={selected !== null && isCorrect === true}
          className={getCardClass('left')}
        >
          <img src={leftWord.imageUrl} alt="" className="w-full aspect-square object-cover" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <p className="text-white font-bold text-center text-lg drop-shadow">{leftWord.word}</p>
          </div>
        </button>
        <button
          onClick={() => handleSelect('right')}
          disabled={selected !== null && isCorrect === true}
          className={getCardClass('right')}
        >
          <img src={rightWord.imageUrl} alt="" className="w-full aspect-square object-cover" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <p className="text-white font-bold text-center text-lg drop-shadow">{rightWord.word}</p>
          </div>
        </button>
      </div>

      {/* shake 애니메이션 */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
