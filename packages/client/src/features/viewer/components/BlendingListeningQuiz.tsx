import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { BlendingExercise, WordFamily } from '@tangobook/shared';

// --- 타입 ---

interface QuizWord {
  word: string;
  imageUrl: string;
  ttsUrl: string;
}

interface QuizRound {
  target: QuizWord;
  distractor: QuizWord;
  blend: string;
  targetLeft: boolean;
}

interface BlendingListeningQuizProps {
  letters: BlendingExercise[];
  wordFamilies: WordFamily[];
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
}

// --- 유틸 ---

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRounds(letters: BlendingExercise[], wordFamilies: WordFamily[]): QuizRound[] {
  const rounds: QuizRound[] = [];

  for (let i = 0; i < letters.length; i++) {
    const ex = letters[i];
    const w1Ok = ex.exampleWordImageUrl && ex.exampleWordTtsUrl;
    const w2Ok = ex.exampleWord2 && ex.exampleWord2ImageUrl && ex.exampleWord2TtsUrl;

    // 같은 블렌딩 내에서 2개 단어가 모두 있으면 라운드 생성
    if (w1Ok && w2Ok) {
      const word1: QuizWord = {
        word: ex.exampleWord,
        imageUrl: ex.exampleWordImageUrl!,
        ttsUrl: ex.exampleWordTtsUrl!,
      };
      const word2: QuizWord = {
        word: ex.exampleWord2!,
        imageUrl: ex.exampleWord2ImageUrl!,
        ttsUrl: ex.exampleWord2TtsUrl!,
      };

      // 라운드 1: word1이 정답
      rounds.push({
        target: word1,
        distractor: word2,
        blend: ex.blend,
        targetLeft: Math.random() > 0.5,
      });
      // 라운드 2: word2가 정답
      rounds.push({
        target: word2,
        distractor: word1,
        blend: ex.blend,
        targetLeft: Math.random() > 0.5,
      });
      continue;
    }

    // wordFamily에서 보충 시도
    const wf = wordFamilies[i];
    if (!wf) continue;

    const candidates: QuizWord[] = [];
    if (w1Ok)
      candidates.push({
        word: ex.exampleWord,
        imageUrl: ex.exampleWordImageUrl!,
        ttsUrl: ex.exampleWordTtsUrl!,
      });
    if (w2Ok)
      candidates.push({
        word: ex.exampleWord2!,
        imageUrl: ex.exampleWord2ImageUrl!,
        ttsUrl: ex.exampleWord2TtsUrl!,
      });

    for (const w of wf.words) {
      if (w.imageUrl && w.ttsUrl && !candidates.some((c) => c.word === w.word)) {
        candidates.push({ word: w.word, imageUrl: w.imageUrl, ttsUrl: w.ttsUrl });
      }
      if (candidates.length >= 2) break;
    }

    if (candidates.length >= 2) {
      rounds.push({
        target: candidates[0],
        distractor: candidates[1],
        blend: ex.blend,
        targetLeft: Math.random() > 0.5,
      });
      rounds.push({
        target: candidates[1],
        distractor: candidates[0],
        blend: ex.blend,
        targetLeft: Math.random() > 0.5,
      });
    }
  }

  return shuffle(rounds);
}

// --- 컴포넌트 ---

export function BlendingListeningQuiz({
  letters,
  wordFamilies,
  systemSounds,
}: BlendingListeningQuizProps) {
  const allRounds = useMemo(() => buildRounds(letters, wordFamilies), [letters, wordFamilies]);

  const [rounds, setRounds] = useState<QuizRound[]>(() => allRounds);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<'left' | 'right' | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = rounds[currentIdx] as QuizRound | undefined;
  const leftWord = current ? (current.targetLeft ? current.target : current.distractor) : null;
  const rightWord = current ? (current.targetLeft ? current.distractor : current.target) : null;

  // --- 오디오 ---
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
      if (url) playAudio(url);
      else playDefaultSound(correct);
    },
    [systemSounds, playAudio, playDefaultSound]
  );

  // 라운드 시작 시 자동 TTS 재생
  useEffect(() => {
    if (!current || finished) return;
    const timer = setTimeout(() => playAudio(current.target.ttsUrl), 400);
    return () => clearTimeout(timer);
  }, [currentIdx, current, finished, playAudio]);

  // --- 선택 처리 ---
  const handleSelect = useCallback(
    (side: 'left' | 'right') => {
      if (feedback || !current) return;
      setSelected(side);

      const isTargetSide =
        (side === 'left' && current.targetLeft) || (side === 'right' && !current.targetLeft);
      setFeedback(isTargetSide ? 'correct' : 'wrong');
      playFeedback(isTargetSide);

      if (isTargetSide) {
        setScore((s) => s + 1);
        setTimeout(() => {
          if (currentIdx + 1 >= rounds.length) {
            setFinished(true);
          } else {
            setCurrentIdx((i) => i + 1);
          }
          setSelected(null);
          setFeedback(null);
        }, 1000);
      } else {
        setTimeout(() => {
          setSelected(null);
          setFeedback(null);
        }, 800);
      }
    },
    [feedback, current, currentIdx, rounds.length, playFeedback]
  );

  // --- 재시작 ---
  const handleRestart = useCallback(() => {
    const newRounds = shuffle(allRounds);
    setRounds(newRounds);
    setCurrentIdx(0);
    setScore(0);
    setSelected(null);
    setFeedback(null);
    setFinished(false);
  }, [allRounds]);

  // --- 데이터 부족 ---
  if (allRounds.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 dark:text-slate-500">
        <p className="text-lg mb-1">듣기 퀴즈를 진행할 수 없습니다</p>
        <p className="text-sm">이미지와 TTS가 있는 단어 쌍이 필요합니다.</p>
      </div>
    );
  }

  // --- 결과 ---
  if (finished) {
    const total = rounds.length;
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">{score === total ? '🎉' : '👏'}</div>
        <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">
          {score} / {total}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {score === total ? '완벽해요!' : '잘했어요!'}
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

  if (!current || !leftWord || !rightWord) return null;

  const progress = rounds.length > 0 ? (currentIdx / rounds.length) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* 진행 바 */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
          Q{currentIdx + 1}/{rounds.length}
        </span>
        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">{score}점</span>
      </div>

      {/* 블렌딩 표시 + 안내 */}
      <div className="text-center space-y-2">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-sm font-black text-amber-800 dark:text-amber-300">
          {current.blend}
        </span>
        <p className="text-base font-bold text-slate-700 dark:text-slate-200">
          듣고 맞는 그림을 골라요!
        </p>
      </div>

      {/* 다시 듣기 버튼 */}
      <div className="flex justify-center">
        <button
          onClick={() => playAudio(current.target.ttsUrl)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-bold hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
        >
          <span className="text-lg">🔊</span>
          다시 듣기
        </button>
      </div>

      {/* 이미지 카드 2개 */}
      <div className="grid grid-cols-2 gap-4">
        <ImageCard
          word={leftWord}
          side="left"
          isSelected={selected === 'left'}
          feedback={selected === 'left' ? feedback : null}
          isTarget={current.targetLeft}
          showAnswer={!!feedback}
          onClick={() => handleSelect('left')}
        />
        <ImageCard
          word={rightWord}
          side="right"
          isSelected={selected === 'right'}
          feedback={selected === 'right' ? feedback : null}
          isTarget={!current.targetLeft}
          showAnswer={!!feedback}
          onClick={() => handleSelect('right')}
        />
      </div>

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

// --- 이미지 카드 ---

function ImageCard({
  word,
  feedback,
  isTarget,
  showAnswer,
  onClick,
}: {
  word: QuizWord;
  side: 'left' | 'right';
  isSelected: boolean;
  feedback: 'correct' | 'wrong' | null;
  isTarget: boolean;
  showAnswer: boolean;
  onClick: () => void;
}) {
  let borderCls = 'border-slate-200 dark:border-slate-700';
  let extraCls = '';

  if (feedback === 'correct') {
    borderCls = 'border-emerald-400 dark:border-emerald-500';
    extraCls = 'scale-105';
  } else if (feedback === 'wrong') {
    borderCls = 'border-red-400 dark:border-red-500';
    extraCls = 'animate-shake';
  } else if (showAnswer && isTarget) {
    // 오답 선택 시 정답 카드 하이라이트
    borderCls = 'border-emerald-300 dark:border-emerald-600';
  }

  return (
    <button
      onClick={onClick}
      disabled={!!feedback}
      className={`relative rounded-2xl border-3 overflow-hidden bg-white dark:bg-slate-800 transition-all duration-200 ${borderCls} ${extraCls}`}
      style={{ borderWidth: '3px' }}
    >
      <div className="aspect-square overflow-hidden">
        <img src={word.imageUrl} alt={word.word} className="w-full h-full object-cover" />
      </div>
      <div className="px-3 py-2 text-center">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{word.word}</span>
      </div>
      {feedback === 'correct' && (
        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-lg shadow-md">
          ✓
        </div>
      )}
      {feedback === 'wrong' && (
        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-lg shadow-md">
          ✗
        </div>
      )}
    </button>
  );
}
