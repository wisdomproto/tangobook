import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { BlendingExercise, WordFamily } from '@tangobook/shared';
import { V_FONT } from './Viewer3DKit';

// --- 공통 ---

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

function useAudioHelper() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playAudio = useCallback((url?: string) => {
    if (!url) return;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);
  return { playAudio };
}

function playDefaultSound(correct: boolean) {
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
}

// --- 한글 모드: 블렌딩 음절 4지선다 ---

interface KoreanBlendItem {
  blend: string;
  ttsUrl: string;
}

interface KoreanRound {
  target: KoreanBlendItem;
  options: string[]; // 4지선다
}

function buildKoreanItems(letters: BlendingExercise[]): KoreanBlendItem[] {
  const items: KoreanBlendItem[] = [];
  const seen = new Set<string>();
  for (const item of letters) {
    if (item.blend && item.blendTtsUrl && !seen.has(item.blend)) {
      items.push({ blend: item.blend, ttsUrl: item.blendTtsUrl });
      seen.add(item.blend);
    }
  }
  return items;
}

function buildKoreanRounds(items: KoreanBlendItem[]): KoreanRound[] {
  if (items.length < 2) return [];
  const shuffled = shuffle(items);
  return shuffled.map((target) => {
    const others = items.filter((i) => i.blend !== target.blend);
    const distractorCount = Math.min(3, others.length);
    const distractors = shuffle(others)
      .slice(0, distractorCount)
      .map((i) => i.blend);
    const options = shuffle([target.blend, ...distractors]);
    return { target, options };
  });
}

function KoreanListeningQuiz({
  letters,
  systemSounds,
}: {
  letters: BlendingExercise[];
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
}) {
  const items = useMemo(() => buildKoreanItems(letters), [letters]);
  const [rounds, setRounds] = useState<KoreanRound[]>(() => buildKoreanRounds(items));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const { playAudio } = useAudioHelper();

  const current = rounds[currentIdx] as KoreanRound | undefined;

  const playFeedback = useCallback(
    (correct: boolean) => {
      const url = correct ? systemSounds?.correctUrl : systemSounds?.incorrectUrl;
      if (url) playAudio(url);
      else playDefaultSound(correct);
    },
    [systemSounds, playAudio]
  );

  // 라운드 시작 시 TTS 자동 재생
  useEffect(() => {
    if (current && !finished) {
      const timer = setTimeout(() => playAudio(current.target.ttsUrl), 400);
      return () => clearTimeout(timer);
    }
  }, [currentIdx, finished]);

  const handleSelect = useCallback(
    (option: string) => {
      if (selected !== null || !current) return;
      const correct = option === current.target.blend;
      setSelected(option);
      setFeedback(correct ? 'correct' : 'wrong');
      playFeedback(correct);

      if (correct) {
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
    [selected, current, currentIdx, rounds.length, playFeedback]
  );

  const handleRestart = () => {
    setRounds(buildKoreanRounds(items));
    setCurrentIdx(0);
    setScore(0);
    setSelected(null);
    setFeedback(null);
    setFinished(false);
  };

  if (items.length < 2) {
    return (
      <div className="text-center py-20 text-emerald-700/60">
        <p className="text-lg mb-2">듣기 퀴즈를 진행할 수 없습니다</p>
        <p className="text-sm">TTS가 있는 블렌딩이 2개 이상 필요합니다.</p>
      </div>
    );
  }

  if (finished) {
    const perfect = score === rounds.length;
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">{perfect ? '🎉' : '👏'}</div>
        <p className="text-2xl font-black text-emerald-900 mb-1">
          {score} / {rounds.length}
        </p>
        <p className="text-sm text-emerald-700 mb-6">{perfect ? '완벽해요!' : '잘했어요!'}</p>
        <button
          onClick={handleRestart}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
        >
          다시 하기
        </button>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      {/* 진행률 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-emerald-700">
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
                    ? 'bg-amber-500'
                    : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 듣기 버튼 */}
      <div className="text-center">
        <button
          onClick={() => playAudio(current.target.ttsUrl)}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:-translate-y-0.5 active:translate-y-0.5"
          style={{
            background: 'linear-gradient(155deg, #fff8e8 0%, #ffe8b0 50%, #ffd880 100%)',
            color: '#5a3a00',
            boxShadow:
              '0 6px 0 #c08040, 0 8px 16px rgba(150,90,0,0.24), inset 0 1px 0 rgba(255,255,240,0.95)',
            fontFamily: V_FONT,
          }}
        >
          <span className="text-2xl">🔊</span>
          다시 듣기
        </button>
      </div>

      {/* 4지선다 버튼 */}
      <div className="grid grid-cols-2 gap-4">
        {current.options.map((option) => {
          const isSelected = selected === option;
          const isAnswer = option === current.target.blend;
          let btnStyle: React.CSSProperties;
          if (isSelected && feedback === 'correct') {
            btnStyle = {
              background: 'linear-gradient(155deg, #34d399 0%, #10b981 50%, #059669 100%)',
              color: '#ecfdf5',
              boxShadow:
                '0 6px 0 #047857, 0 8px 16px rgba(5,150,105,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
              transform: 'scale(1.06)',
            };
          } else if (isSelected && feedback === 'wrong') {
            btnStyle = {
              background: 'linear-gradient(155deg, #f87171 0%, #ef4444 50%, #dc2626 100%)',
              color: '#fef2f2',
              boxShadow:
                '0 6px 0 #b91c1c, 0 8px 16px rgba(220,38,38,0.35), inset 0 1px 0 rgba(255,255,255,0.3)',
            };
          } else if (feedback === 'correct' && isAnswer) {
            btnStyle = {
              background: 'linear-gradient(155deg, #34d399 0%, #10b981 50%, #059669 100%)',
              color: '#ecfdf5',
              boxShadow:
                '0 6px 0 #047857, 0 8px 16px rgba(5,150,105,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
            };
          } else {
            btnStyle = {
              background: 'linear-gradient(155deg, #ffffff 0%, #f0fdf4 100%)',
              color: '#14532d',
              boxShadow:
                '0 6px 0 #86efac, 0 8px 14px rgba(34,197,94,0.15), inset 0 1px 0 rgba(255,255,255,0.95)',
            };
          }

          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={selected !== null && feedback === 'correct'}
              className={`relative rounded-2xl py-6 text-center font-black select-none transition-all duration-150
                ${selected === null ? 'hover:-translate-y-1 active:translate-y-0.5 cursor-pointer' : ''}
                ${isSelected && feedback === 'wrong' ? 'animate-shake' : ''}`}
              style={{ ...btnStyle, fontFamily: V_FONT, fontSize: '2.5rem' }}
            >
              <div
                className="absolute top-[4px] left-[10px] w-[40%] h-[28%] rounded-full pointer-events-none"
                style={{ background: 'rgba(255,255,255,0.5)' }}
              />
              <span className="relative">{option}</span>
            </button>
          );
        })}
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

// --- 영어 모드: 이미지 2택 (기존) ---

interface QuizWord {
  word: string;
  imageUrl: string;
  ttsUrl: string;
  letterIdx: number;
}

interface QuizRound {
  target: QuizWord;
  distractor: QuizWord;
  targetLeft: boolean;
}

function buildQuizWords(letters: BlendingExercise[], wordFamilies: WordFamily[]): QuizWord[] {
  const words: QuizWord[] = [];
  const seen = new Set<string>();

  letters.forEach((item, idx) => {
    if (item.exampleWordImageUrl && item.exampleWordTtsUrl) {
      words.push({
        word: item.exampleWord,
        imageUrl: item.exampleWordImageUrl,
        ttsUrl: item.exampleWordTtsUrl,
        letterIdx: idx,
      });
      seen.add(item.exampleWord);
    }
    if (
      item.exampleWord2 &&
      item.exampleWord2ImageUrl &&
      item.exampleWord2TtsUrl &&
      !seen.has(item.exampleWord2)
    ) {
      words.push({
        word: item.exampleWord2,
        imageUrl: item.exampleWord2ImageUrl,
        ttsUrl: item.exampleWord2TtsUrl,
        letterIdx: idx,
      });
      seen.add(item.exampleWord2);
    }
    const wf = wordFamilies[idx];
    if (wf) {
      for (const w of wf.words) {
        if (w.imageUrl && w.ttsUrl && !seen.has(w.word)) {
          words.push({ word: w.word, imageUrl: w.imageUrl, ttsUrl: w.ttsUrl, letterIdx: idx });
          seen.add(w.word);
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
    let candidates = allWords.filter(
      (w) => w.letterIdx !== target.letterIdx && w.word !== target.word
    );
    if (candidates.length === 0) candidates = allWords.filter((w) => w.word !== target.word);
    const distractor = candidates[Math.floor(Math.random() * candidates.length)];
    return { target, distractor, targetLeft: Math.random() < 0.5 };
  });
}

function EnglishListeningQuiz({
  letters,
  wordFamilies,
  systemSounds,
}: {
  letters: BlendingExercise[];
  wordFamilies: WordFamily[];
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
}) {
  const allWords = useMemo(() => buildQuizWords(letters, wordFamilies), [letters, wordFamilies]);
  const [rounds, setRounds] = useState<QuizRound[]>(() => buildRounds(allWords));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<'left' | 'right' | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);
  const { playAudio } = useAudioHelper();

  const current = rounds[currentIdx] as QuizRound | undefined;

  const playFeedback = useCallback(
    (correct: boolean) => {
      const url = correct ? systemSounds?.correctUrl : systemSounds?.incorrectUrl;
      if (url) playAudio(url);
      else playDefaultSound(correct);
    },
    [systemSounds, playAudio]
  );

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
      <div className="text-center py-20 text-emerald-700/60">
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
        <p className="text-2xl font-black text-emerald-900 mb-1">
          {score} / {rounds.length}
        </p>
        <p className="text-sm text-emerald-700 mb-6">{perfect ? '완벽해요!' : '잘했어요!'}</p>
        <button
          onClick={handleRestart}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
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
    return `${base} border-white/60 hover:border-emerald-300 hover:shadow-md`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-emerald-700">
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
                    ? 'bg-amber-500'
                    : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={() => playAudio(current.target.ttsUrl)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/60 border border-amber-300 text-amber-700 font-bold hover:bg-white/80 transition-colors"
        >
          <span className="text-xl">🔊</span>
          다시 듣기
        </button>
      </div>

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

// --- 메인 컴포넌트: 한글/영어 자동 분기 ---

export function ListeningQuizGame({ letters, wordFamilies, systemSounds }: ListeningQuizGameProps) {
  const isKorean = letters.length > 0 && /^[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(letters[0].vowel);

  if (isKorean) {
    return <KoreanListeningQuiz letters={letters} systemSounds={systemSounds} />;
  }

  return (
    <EnglishListeningQuiz
      letters={letters}
      wordFamilies={wordFamilies}
      systemSounds={systemSounds}
    />
  );
}
