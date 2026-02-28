import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { BlendingExercise, WordFamily } from '@tangobook/shared';

interface SoundRound {
  targetLetter: string;
  ttsUrl: string;
  options: string[];
}

interface LetterSoundGameProps {
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

function buildAlphaItems(letters: BlendingExercise[], wordFamilies: WordFamily[]) {
  const items: { letter: string; ttsUrl: string }[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < letters.length; i++) {
    const item = letters[i];
    if (item.vowel.length !== 1 || !/^[A-Za-z]$/.test(item.vowel)) continue;
    const upper = item.vowel.toUpperCase();
    if (seen.has(upper)) continue;

    // Level 1: TTS는 wordFamilies[i].words[j].ttsUrl에 저장됨
    let ttsUrl: string | undefined =
      item.vowelTtsUrl ||
      item.consonantTtsUrl ||
      item.blendTtsUrl ||
      item.blendingSequenceTtsUrl ||
      item.exampleWordTtsUrl;

    if (!ttsUrl) {
      const wf = wordFamilies[i];
      if (wf) {
        const wordWithTts = wf.words.find((w) => w.ttsUrl);
        if (wordWithTts) ttsUrl = wordWithTts.ttsUrl;
      }
    }
    if (!ttsUrl) continue;

    seen.add(upper);
    items.push({ letter: upper, ttsUrl });
  }

  return items;
}

function buildRounds(items: { letter: string; ttsUrl: string }[]): SoundRound[] {
  if (items.length < 2) return [];

  const shuffled = shuffle(items);
  return shuffled.map((target) => {
    const others = items.filter((i) => i.letter !== target.letter);
    const distractors = shuffle(others)
      .slice(0, 3)
      .map((i) => i.letter);
    const options = shuffle([target.letter, ...distractors]);
    return { targetLetter: target.letter, ttsUrl: target.ttsUrl, options };
  });
}

export function LetterSoundGame({ letters, wordFamilies, systemSounds }: LetterSoundGameProps) {
  const alphaItems = useMemo(() => buildAlphaItems(letters, wordFamilies), [letters, wordFamilies]);
  const [rounds, setRounds] = useState<SoundRound[]>(() => buildRounds(alphaItems));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = rounds[currentIdx] as SoundRound | undefined;

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

  // 라운드 시작 시 음가 TTS 자동 재생
  useEffect(() => {
    if (current && !finished) {
      const timer = setTimeout(() => playAudio(current.ttsUrl), 400);
      return () => clearTimeout(timer);
    }
  }, [currentIdx, finished]);

  const handleSelect = useCallback(
    (letter: string) => {
      if (feedback || !current) return;

      const isCorrect = letter === current.targetLetter;
      setSelected(letter);
      setFeedback(isCorrect ? 'correct' : 'wrong');
      playFeedback(isCorrect);

      if (isCorrect) {
        setScore((s) => s + 1);
        setTimeout(() => {
          if (currentIdx + 1 >= rounds.length) {
            setFinished(true);
          } else {
            setCurrentIdx((i) => i + 1);
            setSelected(null);
            setFeedback(null);
          }
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

  const handleRestart = () => {
    setRounds(buildRounds(alphaItems));
    setCurrentIdx(0);
    setScore(0);
    setSelected(null);
    setFeedback(null);
    setFinished(false);
  };

  if (alphaItems.length < 2) {
    return (
      <div className="text-center py-20 text-slate-400 dark:text-slate-500">
        <p className="text-lg mb-2">음가 듣기 게임을 진행할 수 없습니다</p>
        <p className="text-sm">음가 TTS가 있는 알파벳이 2개 이상 필요합니다.</p>
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
    if (feedback === 'correct' && letter === current.targetLetter) {
      return `${base} border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 scale-110 shadow-lg shadow-emerald-200/50`;
    }
    return `${base} border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 hover:border-violet-300 hover:shadow-md cursor-pointer`;
  };

  return (
    <div className="space-y-8">
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
      <div className="text-center space-y-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">어떤 알파벳의 소리일까요?</p>
        <button
          onClick={() => playAudio(current.ttsUrl)}
          className="inline-flex items-center gap-3 px-8 py-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all hover:scale-105"
        >
          <span className="text-3xl">🔊</span>
          <span className="text-lg">다시 듣기</span>
        </button>
      </div>

      {/* 글자 선택 (한 줄) */}
      <div className="flex justify-center gap-3 sm:gap-4">
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
