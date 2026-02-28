import { useState, useRef, useCallback, useMemo } from 'react';
import type { BlendingExercise, WordFamily } from '@tangobook/shared';

interface ImageItem {
  letter: string;
  word: string;
  imageUrl: string;
  wordTtsUrl?: string;
}

interface InitialRound {
  target: ImageItem;
  options: string[];
}

interface InitialSoundGameProps {
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

function buildImageItems(letters: BlendingExercise[], wordFamilies: WordFamily[]): ImageItem[] {
  const items: ImageItem[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < letters.length; i++) {
    const item = letters[i];
    if (item.vowel.length !== 1 || !/^[A-Za-z]$/.test(item.vowel)) continue;

    const upper = item.vowel.toUpperCase();

    // exampleWordImageUrl 우선
    if (item.exampleWordImageUrl) {
      const key = `${upper}-${item.exampleWord}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push({
          letter: upper,
          word: item.exampleWord,
          imageUrl: item.exampleWordImageUrl,
          wordTtsUrl: item.exampleWordTtsUrl,
        });
      }
    }

    // wordFamilies에서 보충
    const wf = wordFamilies[i];
    if (wf) {
      for (const w of wf.words) {
        if (!w.imageUrl) continue;
        if (w.word === item.exampleWord) continue;
        const key = `${upper}-${w.word}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({
          letter: upper,
          word: w.word,
          imageUrl: w.imageUrl,
          wordTtsUrl: w.ttsUrl,
        });
      }
    }

    // Level 1 fallback: illustrationUrl (전체 삽화)
    if (!items.some((it) => it.letter === upper) && item.illustrationUrl) {
      const word = item.exampleWord || upper;
      const key = `${upper}-${word}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push({
          letter: upper,
          word,
          imageUrl: item.illustrationUrl,
          wordTtsUrl: item.exampleWordTtsUrl,
        });
      }
    }
  }

  return items;
}

function buildRounds(items: ImageItem[], allLetters: string[]): InitialRound[] {
  if (items.length < 2 || allLetters.length < 2) return [];

  const shuffled = shuffle(items);
  return shuffled.map((target) => {
    const others = allLetters.filter((l) => l !== target.letter);
    const distractors = shuffle(others).slice(0, 3);
    const options = shuffle([target.letter, ...distractors]);
    return { target, options };
  });
}

export function InitialSoundGame({ letters, wordFamilies, systemSounds }: InitialSoundGameProps) {
  const imageItems = useMemo(() => buildImageItems(letters, wordFamilies), [letters, wordFamilies]);
  const allLetters = useMemo(() => {
    const set = new Set(imageItems.map((i) => i.letter));
    return Array.from(set);
  }, [imageItems]);

  const [rounds, setRounds] = useState<InitialRound[]>(() => buildRounds(imageItems, allLetters));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = rounds[currentIdx] as InitialRound | undefined;

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

  const handleSelect = useCallback(
    (letter: string) => {
      if (feedback || !current) return;

      const isCorrect = letter === current.target.letter;
      setSelected(letter);
      setFeedback(isCorrect ? 'correct' : 'wrong');
      playFeedback(isCorrect);

      if (isCorrect) {
        if (current.target.wordTtsUrl) {
          setTimeout(() => playAudio(current.target.wordTtsUrl), 300);
        }
        setScore((s) => s + 1);
        setTimeout(() => {
          if (currentIdx + 1 >= rounds.length) {
            setFinished(true);
          } else {
            setCurrentIdx((i) => i + 1);
            setSelected(null);
            setFeedback(null);
          }
        }, 1200);
      } else {
        setTimeout(() => {
          setSelected(null);
          setFeedback(null);
        }, 800);
      }
    },
    [feedback, current, currentIdx, rounds.length, playFeedback, playAudio]
  );

  const handleRestart = () => {
    setRounds(buildRounds(imageItems, allLetters));
    setCurrentIdx(0);
    setScore(0);
    setSelected(null);
    setFeedback(null);
    setFinished(false);
  };

  if (imageItems.length < 2 || allLetters.length < 2) {
    return (
      <div className="text-center py-20 text-slate-400 dark:text-slate-500">
        <p className="text-lg mb-2">첫소리 찾기 게임을 진행할 수 없습니다</p>
        <p className="text-sm">이미지가 있는 알파벳이 2개 이상 필요합니다.</p>
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

  const getOptionClass = (letter: string) => {
    const base =
      'w-24 h-24 sm:w-28 sm:h-28 rounded-2xl text-3xl sm:text-4xl font-black border-3 transition-all';
    if (selected === letter) {
      if (feedback === 'correct')
        return `${base} border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 scale-110 shadow-lg shadow-emerald-200/50`;
      if (feedback === 'wrong')
        return `${base} border-red-400 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 animate-shake`;
    }
    if (feedback === 'correct' && letter === current.target.letter) {
      return `${base} border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 scale-110 shadow-lg shadow-emerald-200/50`;
    }
    return `${base} border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 hover:border-violet-300 hover:shadow-md cursor-pointer`;
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

      {/* 이미지 카드 */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => playAudio(current.target.wordTtsUrl)}
          className={`w-56 h-56 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border-4 transition-all ${
            current.target.wordTtsUrl ? 'cursor-pointer active:scale-95' : ''
          } ${
            feedback === 'correct'
              ? 'border-emerald-400 shadow-lg shadow-emerald-200/50'
              : feedback === 'wrong'
                ? 'border-red-400'
                : 'border-slate-200 dark:border-slate-600'
          }`}
        >
          <img src={current.target.imageUrl} alt="" className="w-full h-full object-cover" />
        </button>

        {/* 정답 후 단어 표시 */}
        {feedback === 'correct' ? (
          <div className="flex items-center gap-2">
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {current.target.word}
            </p>
            {current.target.wordTtsUrl && (
              <button onClick={() => playAudio(current.target.wordTtsUrl)} className="text-lg">
                🔊
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">이 그림의 첫소리는?</p>
        )}
      </div>

      {/* 2×2 글자 선택 그리드 */}
      <div className="flex justify-center">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {current.options.map((letter) => (
            <button
              key={letter}
              onClick={() => handleSelect(letter)}
              disabled={!!feedback}
              className={getOptionClass(letter)}
            >
              {letter}
            </button>
          ))}
        </div>
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
