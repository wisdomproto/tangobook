import { useState, useRef, useCallback, useMemo } from 'react';
import type { BlendingExercise, WordFamily } from '@tangobook/shared';

interface MatchItem {
  upper: string;
  lower: string;
  imageUrl: string;
  word: string;
  ttsUrl?: string;
}

interface LetterMatchingGameProps {
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

function buildMatchItems(letters: BlendingExercise[], wordFamilies: WordFamily[]): MatchItem[] {
  const items: MatchItem[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < letters.length; i++) {
    const item = letters[i];
    const isAlpha = item.vowel.length === 1 && /^[A-Za-z]$/.test(item.vowel);
    if (!isAlpha) continue;

    const upper = item.vowel.toUpperCase();
    if (seen.has(upper)) continue;
    seen.add(upper);

    // 이미지 소스: exampleWordImageUrl > wordFamily 첫 이미지 > illustrationUrl
    let imageUrl = item.exampleWordImageUrl;
    let word = item.exampleWord;
    let ttsUrl = item.exampleWordTtsUrl;

    if (!imageUrl) {
      const wf = wordFamilies[i];
      if (wf) {
        const ww = wf.words.find((w) => w.imageUrl);
        if (ww) {
          imageUrl = ww.imageUrl!;
          word = ww.word;
          ttsUrl = ww.ttsUrl;
        }
      }
    }
    if (!imageUrl) imageUrl = item.illustrationUrl;
    if (!imageUrl) continue;

    items.push({
      upper,
      lower: upper.toLowerCase(),
      imageUrl,
      word,
      ttsUrl,
    });
  }

  return items;
}

export function LetterMatchingGame({
  letters,
  wordFamilies,
  systemSounds,
}: LetterMatchingGameProps) {
  const allItems = useMemo(() => buildMatchItems(letters, wordFamilies), [letters, wordFamilies]);
  const [roundItems, setRoundItems] = useState<MatchItem[]>(() => shuffle(allItems));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedUpper, setSelectedUpper] = useState<string | null>(null);
  const [selectedLower, setSelectedLower] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const [solvedLetters, setSolvedLetters] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 현재 라운드에서 보여줄 선택지 (3~4개 씩)
  const windowSize = Math.min(allItems.length, 4);
  const visibleItems = useMemo(() => {
    if (roundItems.length === 0) return [];
    // 현재 정답 포함 + 나머지에서 distractor
    const current = roundItems[currentIdx];
    if (!current) return [];
    const others = allItems.filter((item) => item.upper !== current.upper);
    const distractors = shuffle(others).slice(0, windowSize - 1);
    return shuffle([current, ...distractors]);
  }, [roundItems, currentIdx, allItems, windowSize]);

  const shuffledUppers = useMemo(() => shuffle(visibleItems.map((i) => i.upper)), [visibleItems]);
  const shuffledLowers = useMemo(() => shuffle(visibleItems.map((i) => i.lower)), [visibleItems]);

  const current = roundItems[currentIdx] as MatchItem | undefined;

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

  // 대문자/소문자 둘 다 선택되면 검증
  const checkAnswer = useCallback(
    (upper: string, lower: string) => {
      if (!current) return;

      const isCorrect = upper === current.upper && lower === current.lower;
      setFeedback(isCorrect ? 'correct' : 'wrong');
      playFeedback(isCorrect);

      if (isCorrect) {
        setScore((s) => s + 1);
        setSolvedLetters((prev) => new Set(prev).add(current.upper));
        setTimeout(() => {
          if (currentIdx + 1 >= roundItems.length) {
            setFinished(true);
          } else {
            setCurrentIdx((i) => i + 1);
            setSelectedUpper(null);
            setSelectedLower(null);
            setFeedback(null);
          }
        }, 1000);
      } else {
        setTimeout(() => {
          setSelectedUpper(null);
          setSelectedLower(null);
          setFeedback(null);
        }, 800);
      }
    },
    [current, currentIdx, roundItems.length, playFeedback]
  );

  const handleUpperClick = useCallback(
    (letter: string) => {
      if (feedback) return;
      setSelectedUpper(letter);
      if (selectedLower) checkAnswer(letter, selectedLower);
    },
    [feedback, selectedLower, checkAnswer]
  );

  const handleLowerClick = useCallback(
    (letter: string) => {
      if (feedback) return;
      setSelectedLower(letter);
      if (selectedUpper) checkAnswer(selectedUpper, letter);
    },
    [feedback, selectedUpper, checkAnswer]
  );

  const handleRestart = () => {
    setRoundItems(shuffle(allItems));
    setCurrentIdx(0);
    setScore(0);
    setSelectedUpper(null);
    setSelectedLower(null);
    setFeedback(null);
    setFinished(false);
    setSolvedLetters(new Set());
  };

  if (allItems.length < 2) {
    return (
      <div className="text-center py-20 text-slate-400 dark:text-slate-500">
        <p className="text-lg mb-2">글자 매칭 게임을 진행할 수 없습니다</p>
        <p className="text-sm">이미지가 있는 알파벳이 2개 이상 필요합니다.</p>
      </div>
    );
  }

  if (finished) {
    const perfect = score === roundItems.length;
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">{perfect ? '🎉' : '👏'}</div>
        <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">
          {score} / {roundItems.length}
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

  const getUpperClass = (letter: string) => {
    const base =
      'w-16 h-16 sm:w-20 sm:h-20 rounded-xl text-2xl sm:text-3xl font-black border-2 transition-all';
    if (solvedLetters.has(letter))
      return `${base} border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-700 cursor-default`;
    if (selectedUpper === letter) {
      if (feedback === 'correct')
        return `${base} border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 scale-110`;
      if (feedback === 'wrong')
        return `${base} border-red-400 bg-red-50 text-red-600 dark:bg-red-900/30 animate-shake`;
      return `${base} border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:border-amber-500 dark:text-amber-300 scale-105`;
    }
    return `${base} border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:border-amber-300 hover:shadow-md cursor-pointer`;
  };

  const getLowerClass = (letter: string) => {
    const base =
      'w-16 h-16 sm:w-20 sm:h-20 rounded-xl text-2xl sm:text-3xl font-black border-2 transition-all';
    const upper = letter.toUpperCase();
    if (solvedLetters.has(upper))
      return `${base} border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-700 cursor-default`;
    if (selectedLower === letter) {
      if (feedback === 'correct')
        return `${base} border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 scale-110`;
      if (feedback === 'wrong')
        return `${base} border-red-400 bg-red-50 text-red-600 dark:bg-red-900/30 animate-shake`;
      return `${base} border-sky-400 bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:border-sky-500 dark:text-sky-300 scale-105`;
    }
    return `${base} border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 hover:border-sky-300 hover:shadow-md cursor-pointer`;
  };

  return (
    <div className="space-y-6">
      {/* 진행률 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
          {currentIdx + 1} / {roundItems.length}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: roundItems.length }, (_, i) => (
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

      {/* 3열 레이아웃: 대문자 | 이미지 | 소문자 */}
      <div className="flex items-center gap-4 sm:gap-8 justify-center">
        {/* 왼쪽: 대문자 */}
        <div className="flex flex-col gap-2 items-center">
          {shuffledUppers.map((letter) => (
            <button
              key={letter}
              onClick={() => !solvedLetters.has(letter) && handleUpperClick(letter)}
              disabled={solvedLetters.has(letter) || !!feedback}
              className={getUpperClass(letter)}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* 가운데: 이미지 */}
        <div className="flex flex-col items-center">
          <div
            className={`w-48 h-48 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border-4 transition-all ${
              feedback === 'correct'
                ? 'border-emerald-400 shadow-lg shadow-emerald-200/50'
                : feedback === 'wrong'
                  ? 'border-red-400'
                  : 'border-slate-200 dark:border-slate-600'
            }`}
          >
            <img src={current.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            {current.word}
          </p>
          {current.ttsUrl && (
            <button
              onClick={() => playAudio(current.ttsUrl)}
              className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
            >
              <span>🔊</span> 듣기
            </button>
          )}
        </div>

        {/* 오른쪽: 소문자 */}
        <div className="flex flex-col gap-2 items-center">
          {shuffledLowers.map((letter) => (
            <button
              key={letter}
              onClick={() => !solvedLetters.has(letter.toUpperCase()) && handleLowerClick(letter)}
              disabled={solvedLetters.has(letter.toUpperCase()) || !!feedback}
              className={getLowerClass(letter)}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* 힌트 텍스트 */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        {!selectedUpper && !selectedLower
          ? '왼쪽 대문자와 오른쪽 소문자를 선택하세요'
          : selectedUpper && !selectedLower
            ? '오른쪽에서 소문자를 선택하세요'
            : !selectedUpper && selectedLower
              ? '왼쪽에서 대문자를 선택하세요'
              : ''}
      </p>

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
